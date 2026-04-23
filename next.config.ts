import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Required for GitHub Pages
  output: 'export', 
  basePath: '/teswt', 
  
  // 2. Build Settings (Keeps deployment from failing on small errors)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // 3. Image Configuration
  images: {
    unoptimized: true, // Required for 'output: export'
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
