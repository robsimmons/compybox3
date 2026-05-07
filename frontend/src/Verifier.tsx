import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";

import { comparatorAtom, comparatorEffect, comparatorJobParamsAtom } from "./store/verifier";

export default function Verifier() {
  return (
    <>
      <VerifyMessage />
    </>
  );
}

export function VerifyMessage() {
  const comparator = useAtomValue(comparatorAtom);
  const reset = useSetAtom(comparatorJobParamsAtom);
  useAtomValue(comparatorEffect);
  useEffect(() => reset(), [reset]);

  return (
    <>
      {JSON.stringify(comparator)}
      <button onClick={() => reset()}>Reset</button>
    </>
  );
}
