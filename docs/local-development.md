# Local development

Run `npm run dev` or `pnpm dev`. The development server normally uses port 3000.

Next.js 15 development servers and builds must not write to the same output
directory concurrently. Missing `.next/server` pages, manifests, and vendor
chunks can result from two servers sharing that directory, even on different
ports. The `dev`, `turbo`, and `build` scripts enforce one writer per output
directory using Linux's `flock` utility (provided by util-linux). Locks release
automatically when the process exits. Use these scripts instead of calling
`next dev` or `next build` directly.

To run an independent preview alongside the normal server:

```sh
NEXT_DIST_DIR=.next-preview npm run dev -- --port 3001
```

To run a build while developing:

```sh
NEXT_DIST_DIR=.next-build npm run build
```

After cache corruption, stop all processes using that output directory before
removing its generated contents and restarting. Never remove a running server's
output directory. No database or `.env` change is needed for this problem.
