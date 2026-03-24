/** @type {import('next').NextConfig} */
const { withPayload } = require("@payloadcms/next/withPayload");
const withNextra = require("nextra")({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.jsx",
});
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  buildExcludes: [/dynamic-css-manifest\.json$/],
  // disable: false,
  workboxOptions: {
    disableDevLogs: true,
  },
  fallbacks: {
    // Failed page requests fallback to this.
    document: "/~offline",
  },
});
// const removeImports = require("next-remove-imports")();

const redirects = async () => {
  return [
    // Redirect /profile to /dashboard/profile
    { source: "/profile", destination: "/dashboard/profile", permanent: true },
    { source: "/:locale/profile", destination: "/:locale/dashboard/profile", permanent: true },
  ];
};

const rewrites = async () => {
  return {
    beforeFiles: [
      // Fix: Next.js intercepting route pattern (.)login leaking into partner-admin URLs.
      // Rewrite to the normal partner-admin catch-all so Payload handles it properly.
      // Handle both encoded (%28.%29) and unencoded escaped forms.
      {
        source: "/partner-admin/%28.%29login",
        destination: "/partner-admin",
      },
      {
        source: "/partner-admin/%28.%29login/:path*",
        destination: "/partner-admin",
      },
      {
        source: "/partner-admin/\\(.\\)login",
        destination: "/partner-admin",
      },
      {
        source: "/partner-admin/\\(.\\)login/:path*",
        destination: "/partner-admin",
      },
    ],
  };
};

const nextConfig = {
  experimental: {
    taint: true,
  },
  serverExternalPackages: ["postgres", "bcrypt", "sharp"],
  turbopack: {
    resolveExtensions: [
      ".mdx",
      ".tsx",
      ".ts",
      ".jsx",
      ".js",
      ".mjs",
      ".json",
    ],
  },
  typescript: {
    // Set this to false if you want production builds to abort if there's type errors
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true, // HYB
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  redirects,
  rewrites,
};
// module.exports = removeImports(withPWA(nextConfig));

module.exports = withPayload(withPWA(withNextra(nextConfig)));
