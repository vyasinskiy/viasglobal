import type { NextConfig } from "next";

/**
 * Конфигурация Next.js для административной панели E-Commerce CRM.
 * Поддерживает проксирование клиентских API запросов на внутренний бэкенд NestJS
 * через встроенный механизм rewrites, исключая CORS проблемы в продакшене.
 */
const nextConfig: NextConfig = {
  transpilePackages: ["@mui/material", "@mui/icons-material", "@emotion/react", "@emotion/styled"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.INTERNAL_API_URL || "http://backend:3001"}/:path*`,
      },
    ];
  },
};

export default nextConfig;