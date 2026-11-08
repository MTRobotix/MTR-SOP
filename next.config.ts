import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SOP content is read from GitHub at runtime (src/lib/content/source.ts); only the lint config ships.
  outputFileTracingIncludes: {
    "/**": ["./.markdownlint.jsonc"],
  },
  serverExternalPackages: ["@electric-sql/pglite", "mammoth"],
};

export default nextConfig;
