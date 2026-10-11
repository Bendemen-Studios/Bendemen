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
};

export default nextConfig;
