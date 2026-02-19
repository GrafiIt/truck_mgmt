/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP'],
  },
  env: {
    VERCEL_TOOLBAR: '0',
  },
}

export default nextConfig
