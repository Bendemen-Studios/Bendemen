import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
