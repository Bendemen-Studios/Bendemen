# Bendemen Booster Cache

A separate, conservative full-page HTML cache for WordPress/WooCommerce. Smush remains responsible for image optimisation.

## Safety and limitations

- The cache is opt-in and does not activate itself.
- Only anonymous GET requests without query strings or cookies can be cached.
- WooCommerce cart, checkout, account, order-pay/order-received, REST, AJAX, login and admin paths are excluded.
- Any Cookie header bypasses cache, including WooCommerce sessions and unknown plugin cookies.
- Responses with non-200 status, Set-Cookie, private/no-store cache directives, non-HTML content, or large bodies are not stored.
- Cache lifetime is 10 minutes. Product/content/term/stock/theme changes purge all cached HTML.
- No CSS/JS minification, delay/defer, image transformation, CDN, or Redis service is configured by this plugin.
- A persistent object cache (Redis/Memcached) is separate from full-page caching and must be enabled only if Cloud86 confirms it is supported by the actual package.

## Install and enable

1. Upload the `bendemen-booster-cache` folder to `wp-content/plugins/` and activate **Bendemen Booster Cache**.
2. Confirm there is no active full-page cache plugin or hosting page-cache layer. Do not run this alongside 10Web Booster, WP Rocket, LiteSpeed Cache page caching, WP Super Cache, W3 Total Cache, Cache Enabler or WP Fastest Cache.
3. Back up `wp-config.php`. Ensure it has exactly one `define('WP_CACHE', true);` before the “stop editing” line. Do not add a duplicate constant.
4. Open **Settings → Bendemen Booster Cache** and choose **Install and activate own cache**. The plugin refuses to overwrite an existing `wp-content/advanced-cache.php` and refuses activation if a known competing plugin is active.
5. Test logged-out pages, add-to-cart, cart totals, checkout, account, login, product stock/price changes, payment return pages and mobile. Inspect the response header `X-Bendemen-Cache: HIT` on a second eligible anonymous request.
6. If anything behaves unexpectedly, disable the cache from the settings page. This removes the activation flag and purges cached pages. It deliberately does not delete `advanced-cache.php` automatically.

## Hosting compatibility

The drop-in needs `WP_CACHE` enabled and writable `wp-content/advanced-cache.php` plus `wp-content/cache/bendemen-booster-page-cache/`. Some managed hosts control or reserve the advanced-cache drop-in. If Cloud86 or an existing cache plugin owns that file, do not overwrite it; use the host-supported page cache instead.

The drop-in only serves cache files for hosts whose name contains `bendemen.com`; verify production and staging hostnames before enabling. Cache is not enabled by this repository change and is not deployed to the live website automatically.
