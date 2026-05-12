import { spawn } from "node:child_process";
import { cp, mkdir, mkdtemp, readdir, rename, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { z } from "zod";

export interface VerifyTask {
  taskId: string;
  project: string;
  challenge: string;
  solution: string;
}

const PROJ_ROOT = resolve(process.env.PROJ_ROOT ?? "../Projects");
export const WORKING_TMP_ROOT_DIR = await mkdtemp(join(tmpdir(), "comparator-"));

function workingDir(taskId: string, module: string) {
  return join(WORKING_TMP_ROOT_DIR, taskId, module);
}

export class CheckingError extends Error {
  output: string;
  constructor(description: string, output: string) {
    super(description);
    this.output = output;
  }
}

async function spawnPromise(
  command: string,
  args?: readonly string[],
  options?: {
    description?: string;
    stdout?: (data: string) => void;
    stderr?: (data: string) => void;
    cwd?: string;
    env?: NodeJS.ProcessEnv;
  },
) {
  const description = options?.description ?? "Process";
  const proc = spawn(command, args, { cwd: options?.cwd, env: options?.env ?? process.env });
  const output: string[] = [];
  proc.stdout.on("data", (data) => {
    const str = data instanceof Buffer ? data.toString("utf-8") : String(data);
    output.push(str);
    options?.stdout?.(str);
  });
  proc.stderr.on("data", (data) => {
    const str = data instanceof Buffer ? data.toString("utf-8") : String(data);
    output.push(str);
    options?.stderr?.(str);
  });

  await new Promise((resolve, reject) => {
    proc.on("error", (err) => {
      reject(new CheckingError(`${description} failed: ${err.message}`, output.join("")));
    });
    proc.on("close", () => resolve(undefined));
  });
  if (proc.exitCode !== 0) {
    throw new CheckingError(
      `${description} returned a non-zero exit code, indicating failure`,
      output.join(""),
    );
  }
  return output.join("");
}

export async function createTaskDir(taskId: string) {
  await mkdir(join(workingDir(taskId, "Challenge"), ".lake"), { recursive: true });
  await mkdir(join(workingDir(taskId, "Solution"), ".lake"), { recursive: true });
  console.log(workingDir(taskId, "Challenge"));
}

function projectDir(project: string) {
  return join(PROJ_ROOT, project);
}

export async function collectThms(taskId: string, project: string) {
  const projDir = projectDir(project);
  const workDir = workingDir(taskId, "Challenge");

  await cp(join(projDir, "ChallengeThms.lean"), join(workDir, "ChallengeThms.lean"));

  const stdout: string[] = [];
  await spawnPromise("lake", ["exe", "challenge-thms"], {
    cwd: workDir,
    description: "Challenge theorem collection",
    stdout: (str) => stdout.push(str),
  });

  return z.array(z.string()).parse(JSON.parse(stdout.join("")));
}

export async function compile(
  taskId: string,
  project: string,
  module: string,
  leanContents: string,
) {
  const projDir = projectDir(project);
  const workDir = workingDir(taskId, module);

  await Promise.all([
    writeFile(join(workDir, module + ".lean"), leanContents),
    cp(join(projDir, "lake-manifest.json"), join(workDir, "lake-manifest.json")),
    cp(join(projDir, "lakefile.toml"), join(workDir, "lakefile.toml")),
    cp(join(projDir, "lean-toolchain"), join(workDir, "lean-toolchain")),
    symlink(join(projDir, ".lake", "packages"), join(workDir, ".lake", "packages")),
  ]);

  await spawnPromise("lake", ["build", module], {
    cwd: workDir,
    description: `Compilation of olean for ${module}`,
  });
  /* save leanchecker for later
  await spawnPromise("lake", ["env", "leanchecker", module], {
    cwd: workDir,
    description: `Leanchecker for ${module}`,
  });
  */
}

export async function comparator(taskId: string, theoremNames: string[]) {
  const workDir = workingDir(taskId, "Challenge");

  await writeFile(
    join(workDir, "config.json"),
    JSON.stringify(
      {
        challenge_module: "Challenge",
        solution_module: "Solution",
        theorem_names: theoremNames,
        permitted_axioms: ["propext", "Quot.sound", "Classical.choice"],
        enable_nanoda: false,
      },
      undefined,
      2,
    ),
  );

  // Move files into place
  const mvSrc = join(workDir, "..", "Solution", ".lake", "build", "lib", "lean");
  const mvDst = join(workDir, ".lake", "build", "lib", "lean");
  await Promise.all((await readdir(mvSrc)).map((name) => cp(join(mvSrc, name), join(mvDst, name))));
  await cp(join(workDir, "..", "Solution", "Solution.lean"), join(workDir, "Solution.lean"));

  await spawnPromise("lake", ["exe", "comparator", "config.json"], {
    cwd: workDir,
    description: "Comparator",
    env: {
      ...process.env,
      COMPARATOR_LANDRUN: ".lake/packages/comparator/scripts/fake-landrun.sh",
      COMPARATOR_LEAN4EXPORT: ".lake/packages/lean4export/.lake/build/bin/lean4export",
    },
  });
}
