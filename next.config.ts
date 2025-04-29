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
};

export default nextConfig;
