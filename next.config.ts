import type { NextConfig } from "next";

const wordpressPages = [
  "ons-bedrijf",
  "goede-doelen",
  "contact",
  "blog",
  "retour-beleid",
  "levering-betaling-beleid",
  "disclaimer",
  "imprint",
  "cookiebeleid-eu",
  "privacyverklaring-eu",
  "afmelden",
  "gift-card",
  "wishsuite",
  "wishlist",
  "tracking",
  "login-customizer",
  "driver",
  "ticket-receipt",
  "ticket-details",
  "bekijk-bestelling-bericht",
  "pos",
  "delivery-drivers-manager",
  "mijn-account",
];

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
      // Keep WordPress pages that are not yet rebuilt visually identical by
      // proxying their original frontend before Next's catch-all [legalSlug]
      // route can intercept them.
      beforeFiles: wordpressPages.map((slug) => ({
        source: `/${slug}`,
        destination: `https://www.bendemen.com/${slug}/`,
      })),
      // Existing Next.js routes win first. Any other not-yet-migrated route
      // (including nested WooCommerce product URLs) falls back to WordPress.
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
