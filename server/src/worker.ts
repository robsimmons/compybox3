import type { StartVerifyRequest, VerifyResult } from "@sourdough/shared";

import { CheckingError, collectThms, comparator, compile, createTaskDir } from "./exec.ts";

export async function doWork(
  taskId: string,
  { project, challenge, solution }: StartVerifyRequest,
): Promise<VerifyResult> {
  await createTaskDir(taskId);
  const compileChallenge = compile(taskId, project, "Challenge", challenge);
  const compileSolution = compile(taskId, project, "Solution", solution);

  try {
    await Promise.all([compileChallenge, compileSolution]);
    const theoremNames = await collectThms(taskId, project);
    console.log(theoremNames);
    await comparator(taskId, theoremNames);
    return { type: "verification-ok", theoremNames };
  } catch (err) {
    if (err instanceof CheckingError) {
      return {
        type: "verification-failed",
        description: err.message,
        output: err.output,
      };
    }
    return {
      type: "verification-failed",
      description: "Unexpected error",
      output: err instanceof Error ? err.message : String(err),
    };
  } finally {
    
  }
}
