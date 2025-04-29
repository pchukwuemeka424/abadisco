const nextConfig = {
  images: {
    domains: ['wfhjcblhlsdtxpwuxvgm.supabase.co'],
  },
  
  // Ignore TypeScript and ESLint errors during build (helpful for Vercel deployment)
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  
  // Ignore ESLint errors during build
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  // Ignore build errors in general - use with caution
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 4,
  },

  // Increase build timeout if needed for larger projects
  experimental: {
    serverComponentsExternalPackages: [],
    // Allow more time for builds on Vercel
    workerThreads: false,
    cpus: 1,
  },
  
  // Provide helpful log output during build
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // Suppress certain webpack warnings
  webpack: (config, { dev, isServer }) => {
    // Suppress specific warnings if needed
    config.infrastructureLogging = {
      level: 'error',
    };
    
    return config;
  },
};

module.exports = nextConfig;
