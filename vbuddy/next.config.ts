import { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const config: NextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Optimize images
  images: {
    domains: ["heiirnfsvkhsxxowpztz.supabase.co"],
    formats: ["image/avif", "image/webp"],
  },

  // Enable page-level static optimization
  experimental: {
    // Optimize CSS
    optimizeCss: true,
  },

  // Configure webpack for better performance
  webpack: (config, { dev, isServer }) => {
    // Optimize production builds
    if (!dev && !isServer) {
      // Enable tree shaking
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: true,
        splitChunks: {
          chunks: "all",
          minSize: 20000,
          maxSize: 244000,
          minChunks: 1,
          maxAsyncRequests: 30,
          maxInitialRequests: 30,
          cacheGroups: {
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
            },
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    return config;
  },

  // Configure headers for better caching
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
    ];
  },

  // Configure redirects
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/dashboard/employer",
        permanent: true,
      },
    ];
  },
};

export default config;
