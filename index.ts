import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const nextCli = path.join(root, "node_modules", "next", "dist", "bin", "next");
const port = process.env.SERVER_PORT || process.env.PORT || "3000";

function run(args: string[]) {
  return new Promise<number>((resolve, reject) => {
    const child = spawn(process.execPath, [nextCli, ...args], {
      cwd: root,
      env: { ...process.env, NODE_ENV: "production" },
      stdio: "inherit"
    });
    child.once("error", reject);
    child.once("exit", (code) => resolve(code ?? 1));
    process.once("SIGTERM", () => child.kill("SIGTERM"));
    process.once("SIGINT", () => child.kill("SIGINT"));
  });
}

async function main() {
  console.log("[Bendemen] Building production application...");
  const buildCode = await run(["build"]);
  if (buildCode !== 0) process.exit(buildCode);

  console.log(`[Bendemen] Starting Next.js on 0.0.0.0:${port}`);
  const startCode = await run(["start", "--hostname", "0.0.0.0", "--port", String(port)]);
  process.exitCode = startCode;
}

main().catch((error) => {
  console.error("[Bendemen] Startup failed:", error);
  process.exitCode = 1;
});
