import { exec as execAsync } from "node:child_process";
import { createHash } from "node:crypto";
import { exists, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
const exec = promisify(execAsync);

const REPO_URL = "git@github.com:leanprover/lean-eval.git";
const WORK_DIR = ".scrips-tmp";
const REPO_DIR = join("WORK_DIR", "lean-eval");
const GENERATED_DIR = join(REPO_DIR, "generated");

async function sha256(contents: string) {
  const hash = createHash("sha256");
  hash.update(contents);
  return hash.digest("hex");
}

async function main() {
  await exec(`mkdir -p ${WORK_DIR}`);
  if (exists(REPO_DIR)) {
    console.error(`Pulling latest changes in ${REPO_DIR}`);
    await exec("git pull --ff-only", { cwd: REPO_DIR, stdio: "inherit" });
  } else {
    console.error(`Cloning ${REPO_URL} as ${REPO_DIR}`);
    await exec(`git clone ${REPO_URL} ${REPO_DIR}`, { cwd: WORK_DIR, stdio: "inherit" });
  }

  const projects = await readdir(GENERATED_DIR, { withFileTypes: true });
  const files = await Promise.all(
    projects.map(async (d) => {
      if (!d.isDirectory()) return null;
      const proj = d.name;
      const dir = join(GENERATED_DIR, d);
      try {
        const readme = await readFile(join(dir, "README.md"));
        const line = readme.split("\n")[3]?.trim() ?? "";
        if (line === "") throw new Error("README line 3 empty");
      } catch (e) {
        console.error(`skipping ${d.name}: ${e instanceof Error ? e.message : String(e)}`);
        return null;
      }
      const challengePath = join(GENERATED_DIR, d.name, "Challenge.lean");
      if (!(await exists(challengePath))) return null;
      return null;
    }),
  );
}

await main();
