import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next.js negotiates AVIF/WebP with browsers and falls back to the source
    // format for older browsers that do not advertise support.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.bendemen.com",
        pathname: "/**",
      },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  async rewrites() {
    return {
      // Existing Next.js routes (home, shop, product, account, cart, checkout,
      // privacy and terms) win first. Pages that have not yet been rebuilt
      // are served by the original WordPress frontend, preserving their
      // Elementor/Woodmart layout, CSS, images and working plugin pages.
      afterFiles: [
        {
          source: "/:path*",
          destination: "https://www.bendemen.com/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
