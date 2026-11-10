import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
const port = process.env.SERVER_PORT || process.env.PORT || "3000";
let child = null;
let stopping = false;

function run(args, label) {
  return new Promise((resolve, reject) => {
    child = spawn(process.execPath, [nextCli, ...args], {
      cwd: root,
      env: { ...process.env, NODE_ENV: "production" },
      stdio: "inherit"
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      child = null;
      resolve({ code, signal, label });
    });
  });
}

function shutdown(signal) {
  stopping = true;
  if (child && !child.killed) child.kill(signal);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

async function main() {
  if (!existsSync(nextCli)) {
    throw new Error("Next.js is not installed. Ensure the Generic Node.js egg runs npm install before MAIN_FILE.");
  }

  console.log("[Bendemen] Building the Next.js production application...");
  const build = await run(["build"], "build");
  if (stopping) return;
  if (build.code !== 0) {
    throw new Error(`Next.js build failed (exit code: ${build.code ?? build.signal}).`);
  }

  console.log(`[Bendemen] Starting Next.js on 0.0.0.0:${port}`);
  const result = await run(["start", "--hostname", "0.0.0.0", "--port", String(port)], "start");
  if (result.code !== 0 && !stopping) {
    process.exitCode = result.code ?? 1;
  }
}

main().catch((error) => {
  console.error("[Bendemen] Startup failed:", error);
  process.exitCode = 1;
});
