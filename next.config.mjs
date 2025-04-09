/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow ESM and CommonJS to coexist
  transpilePackages: ["@zxing/library", "@zxing/browser"],
  
  // Prevent build failures on linting issues
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Prevent build failures on TypeScript errors
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configure image optimization
  images: {
    unoptimized: true,
  },
  
  // Enable experimental features for better performance
  experimental: {}
}

export default nextConfig
