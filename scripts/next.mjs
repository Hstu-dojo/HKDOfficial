import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Next 15 dev and build both write to distDir. A second writer can remove chunks
// that the first server still needs, even when the servers use different ports.
const project = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), ".."));
const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
if (!["dev", "build"].includes(args[0])) {
  console.error("Usage: node scripts/next.mjs <dev|build> [Next.js options]");
  process.exit(1);
}
// Match Next's .env loading so the guard locks the configured output directory.
const nextRequire = createRequire(require.resolve("next/package.json"));
nextRequire("@next/env").loadEnvConfig(project, args[0] === "dev");
const cache = resolve(project, process.env.NEXT_DIST_DIR || ".next");
const key = createHash("sha256").update(cache).digest("hex");
const lock = join(tmpdir(), `kaizen-next-${key}.lock`);

// Linux flock releases the lock when Next exits, including crashes/SIGKILL.
// Keep the lock file: unlinking it could allow two processes to lock different
// inodes. --no-fork keeps Next itself holding the lock for its entire lifetime.
const child = spawn("flock", [
  "--nonblock", "--conflict-exit-code", "73", "--no-fork", lock,
  process.execPath, require.resolve("next/dist/bin/next"), ...args,
], { cwd: project, stdio: "inherit", detached: true });

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => {
    try { process.kill(-child.pid, signal); }
    catch (error) { if (error.code !== "ESRCH") throw error; }
  });
}
child.on("error", (error) => {
  console.error(`Unable to launch Next.js: ${error.message}`);
  if (error.code === "ENOENT") console.error("This launcher requires Linux's flock utility (util-linux).");
  process.exitCode = 1;
});
child.on("exit", (code, signal) => {
  if (code === 73) {
    console.error(`Next.js is already using ${cache}. Stop that dev/build process first.`);
    console.error("For a separate preview, use NEXT_DIST_DIR=.next-preview npm run dev -- --port 3001.");
  }
  process.exitCode = code ?? (signal === "SIGINT" ? 130 : 1);
});
