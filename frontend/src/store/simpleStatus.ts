import { atom } from "jotai";
import { unwrap } from "jotai/utils";

import type { SimpleStatus } from "../utils/style.ts";
import { recognitionAtom } from "./trusted.ts";
import { comparatorAtom, isComparatorSyncedAtom } from "./verifier.ts";

const recognitionStateAtom = unwrap(recognitionAtom, () => null);

export const simpleStatusAtom = atom((get): SimpleStatus => {
  const isComparatorSynced = get(isComparatorSyncedAtom);
  const recognitionState = get(recognitionStateAtom);
  if (!isComparatorSynced || !recognitionState) return "stale";

  const comparator = get(comparatorAtom);

  switch (comparator.type) {
    case "in-progress":
    case "in-queue": {
      return "working";
    }

    case "verification-ok": {
      switch (recognitionState.type) {
        case "user":
          return "warning";
        case "built-in":
          return "success";
        default:
          // NB: verification success with an untrusted challenge
          // results in *failure* state, not a warning state (we want
          // to show red to the user in this case, treating it as
          // if it's as dangerous as an failed verification)
          return "failure";
      }
    }

    default: {
      return "failure";
    }
  }
});
