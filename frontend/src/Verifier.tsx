import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Suspense,  } from "react";

import { recognitionAtom } from "./store/trusted";
import { comparatorAtom, comparatorEffect, comparatorJobParamsAtom } from "./store/verifier";

export default function Verifier() {
  return (
    <>
      <Suspense fallback="Verifying the solution">
        <TrustMessage />
      </Suspense>
      <VerifyMessage />
    </>
  );
}

export function TrustMessage() {
  const [recognition] = useAtom(recognitionAtom);
  return JSON.stringify(recognition);
}

export function VerifyMessage() {
  useAtomValue(comparatorEffect);
  const comparator = useAtomValue(comparatorAtom);
  const reset = useSetAtom(comparatorJobParamsAtom);
  return (
    <>
      {JSON.stringify(comparator)}
      <button onClick={() => reset()}>Reset</button>
    </>
  );
}
