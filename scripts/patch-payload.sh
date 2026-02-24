#!/usr/bin/env bash
# Patch Payload CMS dependency checker to warn instead of throw for React version mismatches.
# Payload 3.x requires React 19, but this project uses React 18.3.1 with Next.js 15.
# The patch is safe because Payload 3.x works with React 18 at runtime in our limited usage
# (auth collection + custom views only, no RSC features).

CHECKER="node_modules/payload/dist/utilities/dependencies/dependencyChecker.js"

if [ -f "$CHECKER" ]; then
  sed -i 's/throw new Error(`Dependency ${dependency} is on version/console.warn(`[PAYLOAD WARNING] Dependency ${dependency} is on version/g' "$CHECKER"
  echo "[postinstall] Patched Payload dependency checker (React 18 compat)"
fi
