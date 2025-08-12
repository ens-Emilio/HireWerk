import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Desativa Strict Mode em dev para evitar double-invoke de effects, o que dá sensação de lentidão
  reactStrictMode: false,
};

export default nextConfig;
