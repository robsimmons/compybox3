import { atom } from "jotai";

import { challengeAtom, projectAtom, solutionAtom } from "./params";
import {
  zCheckVerifyResponse,
  zStartVerifyResponse,
  type CheckVerifyResponse,
} from "@sourdough/shared";

type VerifierJob = { project: string; challenge: string; solution: string };
const overrideVerifierJob = atom<VerifierJob | null>(null);
const defaultVerifierJob = atom<VerifierJob>((get) => ({
  project: get(projectAtom),
  challenge: get(challengeAtom),
  solution: get(solutionAtom),
}));
export const verifierJobAtom = atom(
  (get) => get(overrideVerifierJob) ?? get(defaultVerifierJob),
  (get, set) => {
    set(overrideVerifierJob, {
      project: get(projectAtom),
      challenge: get(challengeAtom),
      solution: get(solutionAtom),
    });
  },
);

export const isVerifierSyncedAtom = atom((get) => {
  const { project, challenge, solution } = get(verifierJobAtom);
  return (
    project === get(projectAtom) &&
    challenge === get(challengeAtom) &&
    solution === get(solutionAtom)
  );
});

type RequestIdResponse = { success: true; requestId: string } | { success: false; message: string };
export const requestIdAtom = atom<Promise<RequestIdResponse>>(async (get) => {
  const verifierJob = get(verifierJobAtom);

  const response = await fetch("/comparator/api/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(verifierJob),
  });

  if (response.status !== 200) {
    return {
      success: false,
      message: `unexpected HTTP response from /api/start: ${response.status}`,
    };
  }

  const body = zStartVerifyResponse.parse(await response.json());
  if (body.type === "project-not-supported") {
    throw new Error(`Current project type not supported`);
  }

  return { success: true, requestId: body.requestId };
});

export async function followVerificationJob(
  requestIdOrFail: RequestIdResponse,
  setStatus: (status: CheckVerifyResponse) => void,
  signal: AbortController,
) {
  if (!requestIdOrFail.success) {
    setStatus({ type: "verification-failed", output: requestIdOrFail.message });
    return;
  }

  const requestId = requestIdOrFail.requestId;

  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, 200 * Math.random() * 50));
    if (signal.signal.aborted) {
      setStatus({ type: "verification-failed", output: "aborted" });
      return;
    }

    const response = await fetch("/comparator/api/poll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    });

    if (response.status !== 200) {
      setStatus({ type: "verification-failed", output: `poll response ${response.status}` });
      return;
    }

    const body = zCheckVerifyResponse.parse(await response.json());
    setStatus(body);
    if (body.type !== "in-progress" && body.type !== "in-queue") {
      return;
    }
  }
}
