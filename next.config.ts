import type { NextConfig } from "next";

/**
 * Production configuration for Vercel.
 *
 * IMPORTANT: `output: 'export'` was REMOVED. Static export has no server
 * runtime, which is incompatible with:
 *   - `src/middleware.ts` (Supabase session refresh + role-based redirects)
 *   - `@supabase/ssr` server-side cookie handling
 *   - any future Route Handlers / Server Actions
 * Vercel runs the full Next.js server runtime, so none of the static-export
 * options (basePath / assetPrefix / trailingSlash / unoptimized) are needed.
 */
const nextConfig: NextConfig = {
  images: {
    // Allow Supabase Storage public buckets (product/avatar images).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;
