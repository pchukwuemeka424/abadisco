const nextConfig = {
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

module.exports = nextConfig;
