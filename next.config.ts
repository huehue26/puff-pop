import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: `npm run build` writes a self-contained site to `out/`.
  // That folder can be hosted anywhere, uploaded to web game portals,
  // or wrapped later as an Android/iOS app (for example with Capacitor).
  output: "export",
  reactStrictMode: true,
};

export default nextConfig;
