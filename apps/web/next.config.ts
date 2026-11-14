import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ["@skanproov/validation"],
  // pdfkit reads its font files from disk, so it must not be bundled.
  serverExternalPackages: ["pdfkit"],
};

export default config;
