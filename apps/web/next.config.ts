import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desativa Strict Mode em dev para evitar double-invoke de effects, o que dá sensação de lentidão
  reactStrictMode: false,
};

export default nextConfig;
