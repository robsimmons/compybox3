import {
  type CheckVerifyResponse,
  zCheckVerifyResponse,
  zStartVerifyResponse,
} from "@sourdough/shared";
import { atom } from "jotai";
import { atomEffect } from "jotai-effect";
import { atomWithQuery } from "jotai-tanstack-query";

import { challengeAtom, projectAtom, solutionAtom } from "./params";

interface ComparatorJobParams {
  internalId: number;
  project: string;
  challenge: string;
  solution: string;
}
let internalIdSequenceNumber = 0;
const overrideComparatorJob = atom<ComparatorJobParams | null>(null);
const defaultComparatorJob = atom<ComparatorJobParams>((get) => ({
  internalId: internalIdSequenceNumber,
  project: get(projectAtom),
  challenge: get(challengeAtom),
  solution: get(solutionAtom),
}));
export const comparatorJobParamsAtom = atom(
  (get) => get(overrideComparatorJob) ?? get(defaultComparatorJob),
  (get, set) => {
    set(overrideComparatorJob, {
      internalId: ++internalIdSequenceNumber,
      project: get(projectAtom),
      challenge: get(challengeAtom),
      solution: get(solutionAtom),
    });
  },
);

export const isComparatorSyncedAtom = atom((get) => {
  const { project, challenge, solution } = get(comparatorJobParamsAtom);
  return (
    project === get(projectAtom) &&
    challenge === get(challengeAtom) &&
    solution === get(solutionAtom)
  );
});

export const comparatorJobIdAtom = atomWithQuery((get) => {
  const { internalId, project, challenge, solution } = get(comparatorJobParamsAtom);
  return {
    queryKey: ["comparator-start", internalId],
    queryFn: async ({ signal }) => {
      const response = await fetch("/comparator/api/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project, challenge, solution }),
        signal,
      });
      if (response.status !== 200) throw new Error(`got ${response.status} response on start`);

      const body = zStartVerifyResponse.parse(await response.json());
      if (body.type === "project-not-supported") {
        throw new Error(`Current project type not supported`);
      }

      return body.requestId;
    },
  };
});

export const comparatorAtom = atom({ type: "in-progress" } as CheckVerifyResponse);

export const comparatorEffect = atomEffect((get, set) => {
  const { data: requestId, status } = get(comparatorJobIdAtom);
  if (status === "pending") {
    set(comparatorAtom, { type: "in-progress" });
    return;
  } else if (status === "error") {
    set(comparatorAtom, {
      type: "verification-failed",
      output: `Unexpected error initializing verification`,
    });
    return;
  }

  // If controller aborts, we mustn't set
  const controller = new AbortController();

  (async () => {
    for (;;) {
      await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 50));
      if (controller.signal.aborted) return;

      const response = await fetch("/comparator/api/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
        signal: controller.signal,
      });
      if (response.status !== 200) throw new Error(`got ${response.status} response on poll`);

      const body = zCheckVerifyResponse.parse(await response.json());
      if (controller.signal.aborted) return;
      set(comparatorAtom, body);
      if (body.type !== "in-progress" && body.type !== "in-queue") return;
    }
  })().catch((err: unknown) => {
    if (controller.signal.aborted) return;
    set(comparatorAtom, {
      type: "verification-failed",
      output: `Unexpected error waiting: ${err instanceof Error ? err.message : String(Error)}`,
    });
  });

  return () => {
    controller.abort();
    fetch("/comparator/api/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
    }).catch((err: unknown) => console.error(`Unexpected error during cancel`, err));
  };
});

/*

 { type: "verification-failed", output: `Unexpected error waiting: ${err instanceOf Error ? err.message : String(err)}` })export const comparatorAtom = atomWithQuery((get) => {
  const requestId = get(comparatorJobIdAtom);
  return {
    queryKey: ["comparator-run", requestId],
    queryFn: async ({ signal }) => {
      for (;;) {
        await new Promise((resolve) => setTimeout(resolve, 200 * Math.random() * 50));
        if (signal.aborted) {
          return { type: "verification-failed", output: "aborted" };
        }

        const response = await fetch("/comparator/api/poll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId }),
          signal,
        });

        if (response.status !== 200) {
          return { type: "verification-failed", output: `poll response ${response.status}` };
        }

        const body = zCheckVerifyResponse.parse(await response.json());
        if (body.type !== "in-progress" && body.type !== "in-queue") {
          return body;
        }
      }
    },
  };
});
*/
