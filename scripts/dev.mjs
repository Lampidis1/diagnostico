import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const args = ["dev"];
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === "--host") args.push("--hostname");
  else if (arg !== "--strictPort") args.push(arg);
}
const child = spawn(process.execPath, [join(here, "../node_modules/next/dist/bin/next"), ...args], { stdio: "inherit" });
child.on("exit", code => process.exit(code ?? 0));
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
