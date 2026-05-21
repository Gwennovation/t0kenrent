/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Standalone output for Docker
  output: 'standalone',

  // Compress responses
  compress: true,

  // Optimize images
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
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

  // Turbopack config (default bundler in Next.js 16)
  turbopack: {},

  async headers() {
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    return [
      // ── manifest.json: restrict CORS to own origin ───────────────────
      {
        source: '/manifest.json',
        headers: [
          { key: 'Content-Type', value: 'application/json' },
          { key: 'Access-Control-Allow-Origin', value: APP_URL },
        ],
      },

      // ── Static assets: long-lived cache ──────────────────────────────
      {
        source: '/:all*(svg|jpg|png|webp|avif|ico|css|js)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },

      // ── Security headers on all routes ───────────────────────────────
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Enable XSS filter in older browsers
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Control referrer data
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable browser features not needed by this app
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          // DNS prefetch control
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          // HSTS — only sent over HTTPS (Vercel/production)
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Content Security Policy
          // Allows: own origin, HandCash CDN (avatars), Unsplash (images), inline styles (Tailwind)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",   // unsafe-inline needed for Next.js hydration
              "style-src 'self' 'unsafe-inline'",    // Tailwind inlines styles
              "img-src 'self' data: blob: https://images.unsplash.com https://cloud.handcash.io https://via.placeholder.com",
              "font-src 'self' data:",
              "connect-src 'self' https://cloud.handcash.io https://app.handcash.io",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
