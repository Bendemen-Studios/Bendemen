import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "www.bendemen.com" },
      { protocol: "https", hostname: "bendemen.com" }
    ]
  }
};

export default nextConfig;
