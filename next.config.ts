import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // E2E runs use a separate output folder so your regular dev server can keep running.
  distDir: process.env.NEXT_TEST_DIST_DIR || ".next",
  devIndicators: false,
};

export default nextConfig;