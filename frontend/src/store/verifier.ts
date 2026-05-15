import {
  type CheckVerifyResponse,
  zCheckVerifyResponse,
  zStartVerifyResponse,
} from "@comparator/shared";
import { atom } from "jotai";
import { observe } from "jotai-effect";
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

/**
 * Tracks whether the version of code that's been sent to comparator most
 * recently is the code we're looking at,
 */
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

/**
 * The last known output from comparator for the current code. (If
 * isComparatorSyncedAtom is false, this should not be shown to the user, as
 * it's out of date!)
 */
export const comparatorResultAtom = atom<CheckVerifyResponse>({ type: "in-preparation" });

export const unobserve = observe((get, set) => {
  const { data: requestId, status, isEnabled } = get(comparatorJobIdAtom);
  if (!isEnabled || status === "pending") {
    // "in-preparation" as the status for `!isEnabled` is justified by
    // immediately kicking off verification in the initializeStore, which will
    // turn isEnabled true before pretty much anything happens.
    set(comparatorResultAtom, { type: "in-preparation" });
    return;
  }
  if (status === "error") {
    set(comparatorResultAtom, {
      type: "verification-failed",
      description: `Unexpected error initializing verification`,
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
      set(comparatorResultAtom, body);
      if (body.type !== "in-progress" && body.type !== "in-queue") return;
    }
  })().catch((err: unknown) => {
    if (controller.signal.aborted) return;
    // Don't set an error for an AbortError. It's probably cancellation due to
    // a page unload event. If something else aborted the fetch, the user will
    // just see the app as stuck in the waiting state.
    if (err instanceof Error && err.name === "AbortError") return;
    set(comparatorResultAtom, {
      type: "verification-failed",
      description: `Unexpected error while waiting for response`,
      output: err instanceof Error ? err.message : String(err),
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

if (import.meta.hot) {
  import.meta.hot.dispose(unobserve);
}
