import { atom } from "jotai";

import { type SimpleStatus } from "../utils/style.ts";
import { recognitionStateAtom } from "./trusted.ts";
import { comparatorResultAtom, isComparatorSyncedAtom } from "./verifier.ts";

/**
 * Atom for calculating the current global UI styling.
 *
 * NOTE: Avoid the temptation to use this output for any decision aside from
 * applying a classname to a class. If you need anything else, directly access
 * `isComparatorSyncedAtom` and `recognitionStateAtom`, or whatever
 * information is most relevant to the task at hand.
 */
export const statusClassAtom = atom((get): SimpleStatus => {
  const isComparatorSynced = get(isComparatorSyncedAtom);
  const recognitionState = get(recognitionStateAtom);
  if (!isComparatorSynced) return "stale";
  if (!recognitionState) return "working";

  const comparator = get(comparatorResultAtom);

  switch (comparator.type) {
    case "in-preparation":
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
          // results in *failure* UI state, not a warning state. We want
          // to show red to the user in this case; we're treating it as
          // if it's as dangerous as an failed verification.
          return "failure";
      }
    }

    default: {
      return "failure";
    }
  }
});
