# Bendemen Booster

A separate performance dashboard and conservative WordPress/WooCommerce helper for the existing Bendemen website.

## Safety first
- WordPress/WooCommerce remains the source of truth for products, stock, customers, orders, checkout and payments.
- Existing Mollie, shipping, loyalty, invoice and other integrations are not replaced.
- Never cache cart, checkout, account, personalised pricing, logged-in or authenticated responses.
- Do not run two full-page cache plugins at once. Purge the page cache after changing caching configuration.
- Smush remains responsible for image optimisation; Booster does not duplicate or rewrite Smush image processing.

## Dashboard and Core Web Vitals
The dashboard has a **Run speed test** panel using Google PageSpeed Insights. It reports the Lighthouse performance score and available LCP, INP, CLS, FCP and TTFB data. INP and other field metrics are shown only if Google has field data for the URL; a Lighthouse lab score is not a substitute for real-user Core Web Vitals. Results are cached for ten minutes to limit repeated requests. Optionally set `PAGESPEED_API_KEY` on the Booster server if Google requires a key or the quota is reached.

## Full-page caching
Full-page caching must be enabled in exactly one supported WordPress cache plugin or at the hosting/reverse-proxy layer. The connector detects common plugins (WP Rocket, WP Super Cache, W3 Total Cache, LiteSpeed Cache, Cache Enabler and WP Fastest Cache), but it does not silently enable or configure a cache plugin because hosting and WooCommerce setups differ.

Enable cache only for public, anonymous GET requests. Exclude at minimum:
- Cart, checkout, order-pay/order-received and My Account pages.
- Requests with WooCommerce cart/session cookies, logged-in cookies, or personalised pricing.
- WooCommerce AJAX, REST endpoints and requests with nonces.
- Any page or API response containing customer/order data.

Do not activate a second full-page cache plugin if the host or an existing plugin already provides one. Verify cache headers and checkout/cart behaviour before and after enabling.

## Object caching
The connector reports whether WordPress has a persistent object-cache drop-in (`wp-content/object-cache.php`) and whether `wp_using_ext_object_cache()` is active. A persistent object cache requires a backend such as Redis or Memcached plus a compatible WordPress drop-in/plugin. Do not point the production site at Redis until the service is private, authenticated as needed, and reachable from the WordPress host. Without a persistent drop-in, WordPress object cache is request-local and is not persistent between page loads.

If the host offers Redis, use its supported Redis Object Cache integration and confirm the connector reports `persistentObjectCache: true`. Avoid enabling persistent caching on the Booster VPS alone: the WordPress PHP runtime needs to be able to reach the cache service.

## WordPress frontend controls
Install the connector from `wordpress-plugin/bendemen-booster/` and activate it in WordPress. Under **Settings → Bendemen Booster** you can:
- Disable WordPress emoji detection assets for logged-out visitors (enabled by default).
- Disable Dashicons for logged-out visitors (enabled by default).
- Disable WordPress embeds (off by default; enable only if the site does not rely on WordPress oEmbeds).

These settings are reversible and do not modify products, orders, payments, cart or customer records.

## Install
```bash
npm install --no-audit --no-fund
npm run build
npm run start
```
The app listens on port 2003. Run behind HTTPS using PM2 or systemd and protect `.env.local`.

## WordPress bridge
Define a separate shared secret in `wp-config.php`:
```php
define('BENDEMEN_BOOSTER_BRIDGE_SECRET', 'replace-with-the-same-random-secret-as-WORDPRESS_BRIDGE_SECRET');
```
Use the value of `WORDPRESS_BRIDGE_SECRET` from the Booster server. Do not commit it or post it in chat. The authenticated read-only endpoint is `/wp-json/bendemen-booster/v1/status`.

## Limits
Booster does not itself provision a Redis service, rewrite Nginx/Apache cache rules, or automatically enable full-page caching. Those actions must match the actual WordPress host. Measure before/after with PageSpeed Insights and real-user field data.
