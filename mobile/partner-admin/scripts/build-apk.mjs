import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const project = resolve(dirname(fileURLToPath(import.meta.url)), "..");
function run(command, args, cwd = project) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
      CMAKE_BUILD_PARALLEL_LEVEL: "2",
    },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw Error(`${command} failed (${result.status})`);
}
// Generated native directories are disposable; the independent Expo source is authoritative.
run("npx", ["expo", "prebuild", "--platform", "android", "--no-install"]);
run(
  "./gradlew",
  [
    ":app:assembleRelease",
    "--no-daemon",
    "--max-workers=2",
    "-PreactNativeArchitectures=arm64-v8a",
    "-Dorg.gradle.jvmargs=-Xmx3072m -XX:MaxMetaspaceSize=1024m",
  ],
  resolve(project, "android"),
);
mkdirSync(resolve(project, "artifacts"), { recursive: true });
copyFileSync(
  resolve(project, "android/app/build/outputs/apk/release/app-release.apk"),
  resolve(project, "artifacts/kaizen-partner-admin-preview.apk"),
);
console.log(
  "Standalone ARM64 preview APK: artifacts/kaizen-partner-admin-preview.apk",
);
console.log(
  "This local preview uses the generated debug signing key. Use the EAS production profile with your own signing credentials for store distribution.",
);
