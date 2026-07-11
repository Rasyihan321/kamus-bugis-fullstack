/** @type {import('next').NextConfig} */

// Alamat backend (di dalam jaringan docker-compose: http://backend:4000).
// Browser cukup memanggil /api/... — Next.js meneruskannya ke backend,
// sehingga tidak ada masalah CORS/port forwarding di GitHub Codespaces.
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

const nextConfig = {
  output: 'standalone', // build ringkas untuk image Docker
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` },
      // Dokumentasi Swagger backend juga bisa dibuka lewat port frontend
      { source: '/api-docs', destination: `${BACKEND_URL}/api-docs` },
      { source: '/api-docs/:path*', destination: `${BACKEND_URL}/api-docs/:path*` },
      { source: '/api-docs.json', destination: `${BACKEND_URL}/api-docs.json` },
    ];
  },
};

export default nextConfig;
