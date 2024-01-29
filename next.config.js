/** @type {import('next').NextConfig} */
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === "development",
  // disable: false,
  workboxOptions: {
    disableDevLogs: true,
  },
});
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "deothemes.com",
      },
      {
        protocol: "https",
        hostname: "wordpress-597675-3975829.cloudwaysapps.com",
      },
      {
        protocol: "https",
        hostname: "i.ibb.co",
      },
      {
        protocol: "https",
        hostname: "karatebushido.com",
      },
    ],
  },
};

module.exports = withPWA(nextConfig);
