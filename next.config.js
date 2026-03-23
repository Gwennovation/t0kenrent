/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Standalone output for Docker / Vercel
  output: 'standalone',
  
  // Performance optimizations
  swcMinify: true,
  
  // Compress responses
  compress: true,

  // Expose env vars to the browser bundle
  env: {
    NEXT_PUBLIC_BSV_NETWORK: process.env.NEXT_PUBLIC_BSV_NETWORK || process.env.BSV_NETWORK || process.env.NETWORK || 'test',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://t0kenrent.vercel.app',
    NEXT_PUBLIC_HANDCASH_APP_ID: process.env.NEXT_PUBLIC_HANDCASH_APP_ID || '',
    NEXT_PUBLIC_HANDCASH_REDIRECT_URL: process.env.NEXT_PUBLIC_HANDCASH_REDIRECT_URL || 'https://t0kenrent.vercel.app',
  },
  
  // Optimize images
  images: {
    domains: [
      'images.unsplash.com',
      'via.placeholder.com',
      't0kenrent.vercel.app',
      'cloud.handcash.io',
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Optimize packages
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{member}}',
    },
  },
  
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
      {
        // Cache static assets
        source: '/:all*(svg|jpg|png|webp|avif|ico|css|js)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Security headers
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ]
  },

  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
    
    // Optimize bundle size
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      }
    }
    
    return config
  },
}

module.exports = nextConfig
