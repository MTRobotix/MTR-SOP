import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Content files are read at runtime by server code; make sure they ship with the deployment.
  outputFileTracingIncludes: {
    "/**": ["./content/**/*.md", "./content/**/attachments/**", "./.markdownlint.jsonc"],
  },
  serverExternalPackages: ["@electric-sql/pglite", "mammoth"],
};

export default nextConfig;
