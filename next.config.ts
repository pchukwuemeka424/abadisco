import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['wfhjcblhlsdtxpwuxvgm.supabase.co', 'images.unsplash.com'],
  },
  // Ignore TypeScript errors during the build process
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ignore ESLint errors during the build process
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Additional configuration to handle build warnings
  experimental: {
    serverComponentsExternalPackages: [],
  },
  // Suppress webpack warnings
  webpack: (config, { dev, isServer }) => {
    // Ignore specific warnings
    config.ignoreWarnings = [
      { module: /node_modules/ },
      { file: /node_modules/ },
    ];
    return config;
  },
};

export default nextConfig;
