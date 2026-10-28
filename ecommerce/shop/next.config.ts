import type { NextConfig } from "next";

/**
 * Конфигурация Next.js для интернет-магазина Viasglobal Shop
 */
const nextConfig: NextConfig = {
  // Разрешаем загрузку оптимизированных изображений с проверенных внешних источников
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "yzaarsfeztkkzuexhivl.supabase.co",
      },
    ],
  },
};

export default nextConfig;
