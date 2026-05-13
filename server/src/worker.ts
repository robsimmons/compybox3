import type { StartVerifyRequest, VerifyResult } from "@sourdough/shared";

import { CheckingError, cleanup, collectThms, comparator, compile, createTaskDir } from "./exec.ts";
import { doMockWork } from "./mockworker.ts";

export async function doWork(
  taskId: string,
  { project, challenge, solution }: StartVerifyRequest,
): Promise<VerifyResult> {
  if (process.env.USE_MOCK_VERIFICATION) {
    return doMockWork(challenge, solution);
  }

  try {
    await createTaskDir(taskId);
    await Promise.all([
      compile(taskId, project, "Challenge", challenge),
      compile(taskId, project, "Solution", solution),
    ]);
    const theoremNames = await collectThms(taskId, project);
    await comparator(taskId, project, theoremNames);
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
    await cleanup(taskId);
  }
}
