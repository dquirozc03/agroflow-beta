/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const target = process.env.API_PROXY_TARGET;

    if (!target) {
      throw new Error(
        "Falta API_PROXY_TARGET en .env.local (ej: http://localhost:8000 o https://tu-backend.onrender.com)"
      );
    }

    return [
      {
        source: "/api/v1/:path*",
        destination: `${target.replace(/\/$/, "")}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
