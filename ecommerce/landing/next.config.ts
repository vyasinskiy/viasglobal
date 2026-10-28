import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/aviso-legal',
        destination: '/es/aviso-legal',
        permanent: true,
      },
      {
        source: '/politica-cookies',
        destination: '/es/politica-cookies',
        permanent: true,
      },
      {
        source: '/politica-privacidad',
        destination: '/es/politica-privacidad',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
