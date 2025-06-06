/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Only ignore during development
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },
  typescript: {
    // Only ignore during development
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  images: {
    domains: ["hebbkx1anhila5yf.public.blob.vercel-storage.com"],
    unoptimized: true,
  },
  sassOptions: {
    includePaths: ["./src/styles"],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
