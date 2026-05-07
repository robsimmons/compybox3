import type { CheckVerifyResponse } from "@sourdough/shared";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Suspense, useEffect, useState } from "react";

import { recognitionAtom } from "./store/trusted";
import { followVerificationJob, requestIdAtom, verifierJobAtom } from "./store/verifier";

export default function Verifier() {
  const [recognition] = useAtom(recognitionAtom);
  return (
    <>
      {JSON.stringify(recognition)}
      <Suspense fallback="Verifying the solution">
        <VerifyMessage />
      </Suspense>
    </>
  );
}

export function VerifyMessage() {
  const resetVerifierJob = useSetAtom(verifierJobAtom);
  const requestId = useAtomValue(requestIdAtom);
  const [status, setStatus] = useState<null | CheckVerifyResponse>(null);

  useEffect(() => {
    // There is a slight bug here with strict-mode re-rendering: it's possible
    // for two verification job followers to be running on the same request, which means they'll
    // respond in an arbitrary order
    const signal = new AbortController();
    followVerificationJob(requestId, setStatus, signal).catch((err: unknown) =>
      setStatus({
        type: "verification-failed",
        output: `error following verification job: ${err instanceof Error ? err.message : String(err)}`,
      }),
    );

    return () => {
      signal.abort();
    };
  }, [requestId]);

  return (
    <>
      {JSON.stringify(status)}
      <button onClick={() => resetVerifierJob()}>Reset</button>
    </>
  );
}
