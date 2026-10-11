# Bendemen performance and Redis

## Current caching policy

- Public product catalogue requests use a 60-second Next.js Data Cache.
- If `REDIS_URL` is configured, the same public catalogue payload is also cached in Redis for 60 seconds.
- If Redis is absent or unavailable, the shop continues using the Next.js cache and WooCommerce; Redis is optional and must not be required for checkout to work.
- Product detail reads, variation/stock validation, account data, shipping rates, orders, Mollie payment requests and webhooks remain uncached.
- The cart, checkout and account pages must not be put behind shared/public full-page caching.
- Product images are served through the Next.js Image Optimization endpoint. The optimizer negotiates AVIF/WebP using the browser's `Accept` header and returns a compatible format/source when AVIF is unsupported.

## Enable Redis on the frontend VPS

1. Install and secure Redis on the **Next.js frontend VPS**, not the separate WooCommerce VPS, unless you intentionally operate a private cache service.
2. Bind Redis to loopback/private networking only. Do not expose TCP 6379 publicly; configure authentication/ACLs and firewall rules if it is reachable over a private network.
3. Add this to the frontend's server-side environment (not a `NEXT_PUBLIC_*` variable):

   ```dotenv
   REDIS_URL=redis://127.0.0.1:6379
   ```

   If Redis authentication is enabled, use the corresponding authenticated URL, for example `redis://:PASSWORD@127.0.0.1:6379`, and protect the environment file.
4. Install dependencies with `npm install`, then rebuild and restart the Next.js process.
5. Check logs and browse the home page and shop. Redis only holds public product catalogue data; no customer, session, cart, order, payment, or checkout data is stored there.

The Redis cache uses a 60-second TTL. Product prices and stock are rechecked directly against WooCommerce during checkout, so a cached listing is never treated as purchase authorization.

## Image optimization

`next.config.ts` enables AVIF and WebP output for images hosted on `*.bendemen.com`. Product cards use lazy loading through `next/image`; the product detail image is prioritized. Keep original WooCommerce image files in place—the Next.js optimizer creates the browser-appropriate variants on demand. If the media host changes to an external CDN, add that host explicitly to `images.remotePatterns` before deploying.
