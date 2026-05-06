import { useAtom } from "jotai";
import { useCallback, useRef, useState } from "react";

import { challengeAtom, solutionAtom } from "./store/params";
import { recognitionAtom, verifStateAtom } from "./store/verifier";
import z from "zod";
import { zStartVerifyResponse } from "@sourdough/shared";

export default function Verifier() {
  const project = "MathlibDemo";
  const [challenge] = useAtom(challengeAtom);
  const [solution] = useAtom(solutionAtom);
  const [verifState, setVerifState] = useAtom(verifStateAtom);
  const jobIdRef = useRef<null | string>(null);
  const currentWork = useState({ challenge, solution });

  const startVerification = useCallback(async () => {
    setVerifState({ type: "in-progress" });

    const startRequest = await fetch("/comparator/api/start", {
      method: "POST",
      body: JSON.stringify({ project, challenge, solution }),
    })
      .then((response) => {
        if (response.status !== 200) {
          throw new Error(`unexpected HTTP response: ${response.status}`);
        }
        return response.json();
      })
      .then((json) => {
        const body = zStartVerifyResponse.parse(json);
        if (body.type === "project-not-supported") {
          setVerifState({
            type: "failure",
            message: "Current project type not supported",
          });
          return;
        } else {
          return body;
        }
      })
      .catch((err: unknown) => {
        setVerifState({
          type: "failure",
          message: err instanceof Error ? err.message : String(err),
        });
      });

    return startRequest?.requestId;
  }, [challenge, solution, setVerifState]);

  useEffect(() => {
    
  }, [currentWork]);

  const [recognition] = useAtom(recognitionAtom);
  return JSON.stringify(recognition);
}
