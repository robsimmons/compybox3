import { atom } from "jotai";
import { unwrap } from "jotai/utils";

import type { SimpleStatus } from "../utils/style";
import { recognitionAtom } from "./trusted";
import { comparatorAtom, isComparatorSyncedAtom } from "./verifier";

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
          return "failure";
      }
    }

    default: {
      return "failure";
    }
  }
});
