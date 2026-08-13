import type { NextConfig } from "next";

// next-pwa uses webpack under the hood — we wrap it but tell Turbopack to ignore webpack config
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Tell Next.js 16 Turbopack that we know about the webpack config from next-pwa
  // This silences the "turbopack with webpack config" error
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "yt3.ggpht.com",
      },
      {
        protocol: "https",
        hostname: "yt3.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

module.exports = withPWA(nextConfig);
