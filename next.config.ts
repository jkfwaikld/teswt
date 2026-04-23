import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',          // Tells Next.js to build static files
  basePath: '/teswt',        // Matches your GitHub repo name
  images: {
    unoptimized: true,       // Required because GitHub Pages can't process images
  },
};

export default nextConfig;
output: 'standalone', // <--- Add this line
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
