import type { NextConfig } from "next";

/**
 * No `@next/mdx` loader.
 *
 * The content tree lives outside `src/`, is read at build time, and is compiled
 * per page by `next-mdx-remote/rsc` — which is also where the remark plugins
 * live, since the loader cannot serialise a plugin function into its worker.
 * A second MDX compiler would only be a second set of rules.
 *
 * `remark-gfm` and the fence plugin are applied in the route, where the page and
 * its plugins are compiled together.
 */
const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/documentation", destination: "/docs", permanent: true },
      { source: "/reference", destination: "/api-reference", permanent: true },
    ];
  },
};

export default nextConfig;
