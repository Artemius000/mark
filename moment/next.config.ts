import type { NextConfig } from "next";

// STATIC_EXPORT=1 builds a plain static site (out/) for previews and static hosting.
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(staticExport ? { output: "export", images: { unoptimized: true } } : {}),
};

export default nextConfig;
