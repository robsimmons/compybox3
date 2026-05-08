import {
  type CheckVerifyResponse,
  zCheckVerifyResponse,
  zStartVerifyResponse,
} from "@sourdough/shared";
import { atom } from "jotai";
import { atomEffect } from "jotai-effect";
import { atomWithQuery } from "jotai-tanstack-query";

import { challengeAtom, projectAtom, solutionAtom } from "./params.ts";

interface ComparatorJobParams {
  internalId: number;
  project: string;
  challenge: string;
  solution: string;
}
let internalIdSequenceNumber = 0;
const comparatorJobParamsHolder = atom<ComparatorJobParams | null>(null);
export const comparatorJobParamsAtom = atom(
  (get) => get(comparatorJobParamsHolder),
  (get, set) => {
    set(comparatorJobParamsHolder, {
      internalId: ++internalIdSequenceNumber,
      project: get(projectAtom),
      challenge: get(challengeAtom),
      solution: get(solutionAtom),
    });
  },
);

/** Is the version of code that's been sent to comparator the code we're looking at? */
export const isComparatorSyncedAtom = atom((get) => {
  const params = get(comparatorJobParamsAtom);
  if (!params) return false;
  return (
    params.project === get(projectAtom) &&
    params.challenge === get(challengeAtom) &&
    params.solution === get(solutionAtom)
  );
});

export const comparatorJobIdAtom = atomWithQuery((get) => {
  const params = get(comparatorJobParamsAtom);
  return {
    queryKey: ["comparator-start", params?.internalId ?? null],
    enabled: params !== null,
    queryFn: async ({ signal }) => {
      if (!params)
        throw new Error(
          `invariant violation: queryFn in comparatorJobIdAtom called when query should be disabled`,
        );

      const response = await fetch("/comparator/api/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project: params.project,
          challenge: params.challenge,
          solution: params.solution,
        }),
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

export const comparatorAtom = atom<CheckVerifyResponse>({ type: "in-preparation" });

export const comparatorEffect = atomEffect((get, set) => {
  const { data: requestId, status } = get(comparatorJobIdAtom);
  if (status === "pending") {
    set(comparatorAtom, { type: "in-preparation" });
    return;
  }
  if (status === "error") {
    set(comparatorAtom, {
      type: "verification-failed",
      output: `Unexpected error initializing verification`,
    });
    return;
  }

  // If controller aborts, we mustn't set comparatorAtom
  const controller = new AbortController();
  (async () => {
    for (;;) {
      await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 50));
      const response = await fetch("/comparator/api/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
        signal: controller.signal,
      });
      if (response.status !== 200) throw new Error(`got ${response.status} response on poll`);

      const body = zCheckVerifyResponse.parse(await response.json());
      controller.signal.throwIfAborted();
      set(comparatorAtom, body);
      if (body.type !== "in-progress" && body.type !== "in-queue") return;
    }
  })().catch((err: unknown) => {
    if (controller.signal.aborted) return;
    set(comparatorAtom, {
      type: "verification-failed",
      output: `Unexpected error waiting: ${err instanceof Error ? err.message : String(err)}`,
    });
  });

  return () => {
    controller.abort();
    fetch("/comparator/api/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId }),
      keepalive: true, // run this to completion if at all possible
    }).catch((err: unknown) => console.error(`Unexpected error during cancel`, err));
  };
});
