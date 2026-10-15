# Bendemen Booster

Bendemen Booster is the performance dashboard and WordPress/WooCommerce companion for Bendemen. The goal is to improve measured performance without risking products, customer sessions, orders, payments or existing integrations.

## Components

| Component | Purpose | Status |
|---|---|---|
| Booster dashboard | PageSpeed Insights, Core Web Vitals where data exists, health bridge | Existing application; deploy separately |
| **Bendemen Booster Connector** | Authenticated, read-only health endpoint and reversible frontend controls | WordPress plugin in `wordpress-plugin/bendemen-booster/` |
| **Bendemen Booster Cache** | Opt-in early full-page HTML cache for anonymous requests | Experimental; review hosting compatibility and test on staging before production |
| Redis object cache integration | Uses a maintained Redis WordPress drop-in and adds Booster diagnostics | Diagnostics are built in; the Redis client/drop-in and working Redis endpoint are required |

## Safety rules

- WordPress and WooCommerce remain the source of truth for products, stock, customers, orders, checkout and payments.
- Smush remains responsible for image optimisation. Booster does not duplicate or rewrite Smush image processing.
- Never run two full-page HTML cache layers at the same time. Check the hosting layer as well as active WordPress plugins.
- Redis object caching is **not** full-page caching. They are separate layers and may coexist when correctly configured.
- Never cache cart, checkout, account, order-pay/order-received, logged-in, authenticated, cookie-bearing or personalised responses.
- Make a backup and test changes on staging. A passing PHP lint/build is not a substitute for a live WooCommerce checkout test.

## Dashboard and Core Web Vitals

The dashboard's **Run speed test** panel uses Google PageSpeed Insights. It reports the Lighthouse performance score and available LCP, INP, CLS, FCP and TTFB data. INP and other field metrics are only shown when Google has field data for the URL; a Lighthouse lab score is not a substitute for real-user Core Web Vitals. Results are cached for ten minutes to limit repeated requests. Optionally set `PAGESPEED_API_KEY` on the Booster server if Google requires a key or the quota is reached.

## WordPress Connector installation

1. Back up WordPress and verify the plugin files are compatible with the site's PHP version (PHP 8.0+).
2. Upload the `wordpress-plugin/bendemen-booster/` directory to `wp-content/plugins/bendemen-booster/`.
3. Activate **Bendemen Booster Connector** in WordPress.
4. Add the bridge secret to `wp-config.php` above the stop-editing line:
   ```php
   define('BENDEMEN_BOOSTER_BRIDGE_SECRET', 'use-the-same-long-random-secret-as-WORDPRESS_BRIDGE_SECRET');
   ```
5. Configure the same secret as `WORDPRESS_BRIDGE_SECRET` on the Booster dashboard server. Never commit it or share it in chat.
6. The read-only authenticated endpoint is `/wp-json/bendemen-booster/v1/status`; the dashboard must send the `x-bendemen-booster-secret` header.
7. Under **Settings → Bendemen Booster**, review the reversible emoji, guest Dashicons and embeds settings. Embeds remain off by default.

## Redis object caching

Booster provides **Settings → Bendemen Booster Redis** and reports safe, non-secret diagnostics through the authenticated status endpoint. It checks the object-cache drop-in, WordPress persistent-cache state, Redis configuration booleans, TLS/auth settings and a WordPress object-cache API read/write round trip.

Booster intentionally does **not** implement a new Redis wire-protocol client or replace the mature `object-cache.php` drop-in. Use one maintained WordPress Redis client, such as [Redis Object Cache](https://wordpress.org/plugins/redis-cache/), configured to connect to your Redis service. The client plugin supplies the actual object-cache implementation; Booster diagnoses the integration.

### Redis VPS requirements

- Redis must use a dedicated ACL account and a long unique password.
- Use TLS with certificate verification and a hostname matching the certificate.
- Disable the plaintext listener (`port 0`) when using the TLS listener.
- Restrict the firewall to the confirmed source IP/network from which the WordPress host connects. An inbound server IP is not necessarily its outbound source IP.
- Never expose Redis to all internet addresses.
- Store secrets in secure hosting environment configuration or `wp-config.php`, never in Git, plugin options, screenshots or the dashboard.
- Make sure the hosting environment actually provides any referenced environment variable; `getenv()` can otherwise return `false`/an empty value.

Example for a TLS-capable client (use the actual provider values and confirm that your client version supports ACL usernames and TLS):

```php
define('WP_REDIS_SCHEME', 'tls');
define('WP_REDIS_HOST', 'redis-cache.bendemen.com');
define('WP_REDIS_PORT', 6379);
define('WP_REDIS_USERNAME', 'bendemen-cache');
define('WP_REDIS_PASSWORD', getenv('BENDEMEN_REDIS_PASSWORD'));
define('WP_REDIS_DATABASE', 0);
define('WP_REDIS_PREFIX', 'bendemen_prod:');
define('WP_REDIS_TIMEOUT', 1.5);
define('WP_REDIS_READ_TIMEOUT', 1.5);
```

Do not copy this example until `BENDEMEN_REDIS_PASSWORD` is securely configured in the actual WordPress hosting environment. Never disable TLS certificate verification to get a connection working.

### Redis activation checklist

1. Install/activate only one compatible Redis object-cache client.
2. Configure the Redis hostname, port, ACL username, password and TLS in the supported way for that client.
3. Test connectivity and certificate validation from the WordPress hosting environment. A local `PING` on the VPS only proves Redis responds locally.
4. Activate the persistent object-cache drop-in only after the connection works.
5. Open **Settings → Bendemen Booster Redis** and review the diagnostics. A cache API round trip alone does not prove Redis is the backend; also check the client status/logs.
6. Test product pages, stock updates, cart, checkout, account, login/logout, payment returns, webhooks and scheduled jobs.

## Bendemen Booster Cache (full-page HTML cache)

The separate `wordpress-plugin/bendemen-booster-cache/` plugin adds an opt-in early page cache. It is experimental and **must not be enabled on production until hosting compatibility and WooCommerce flows have been verified**.

### Safety behaviour

- Only anonymous `GET` requests without query strings or cookies are candidates for cache.
- Bypasses authentication headers, Range requests, non-HTML Accept headers, REST, AJAX, admin/login and common WooCommerce cart/checkout/account/order paths.
- Refuses to store responses that are not HTTP 200 HTML, exceed size limits, set cookies, request private/no-store caching or contain common nonce markers.
- Uses a ten-minute TTL and purges the HTML cache after content, term, product, stock and theme changes.
- Refuses to overwrite an existing `wp-content/advanced-cache.php` drop-in and refuses activation when known competing page-cache plugins are active.
- It does not provision Redis, optimise images, or configure the hosting web server.

### Install and test

1. Back up files/database and test on a staging copy first.
2. Confirm the hosting layer does not already provide full-page caching and deactivate any competing page-cache plugin only if you intentionally plan to replace it.
3. Upload `wordpress-plugin/bendemen-booster-cache/` to `wp-content/plugins/bendemen-booster-cache/` and activate **Bendemen Booster Cache**.
4. Check **Settings → Bendemen Booster Cache**. Do not proceed if another page cache or an existing `advanced-cache.php` is detected.
5. Back up `wp-config.php` and ensure it contains exactly one `define('WP_CACHE', true);` above the stop-editing line. Do not add a duplicate constant.
6. Activate from the Booster Cache settings page only if the host allows WordPress to own the drop-in and the cache directory is writable.
7. Test logged-out pages and inspect `X-Bendemen-Cache: HIT` on a second eligible request. Test add-to-cart, cart totals, checkout, account, login/logout, stock/price changes, payment callbacks/returns, webhooks and mobile.
8. If anything is unexpected, disable the cache from its settings page. This removes the activation flag and purges HTML; it deliberately does not delete `advanced-cache.php` automatically.

**Hosting note:** `.htaccess` rules do not protect files when the server is configured to ignore `.htaccess` (common with Nginx). Confirm the host blocks direct HTTP access to the cache directory before enabling. If Cloud86 controls the page-cache drop-in or the server rules, use a host-supported cache instead. Do not force this experimental cache onto a managed host.

## Dashboard server

The app listens on port 2003. Install dependencies and build from the repository root:

```bash
npm install --no-audit --no-fund
npm run build
npm run start
```

Run behind HTTPS using PM2 or systemd and protect `.env.local`. Do not expose the app's internal port directly if a reverse proxy is intended.

## CI and release readiness

The repository's GitHub Actions workflows lint the WordPress PHP files and run the project CI. Green CI confirms only the checks actually executed; it does not prove Redis connectivity, cache-file access controls, Cloud86 compatibility or WooCommerce transaction safety. Release only after staging verification and a backup/rollback plan.

## Known limits

- Redis service provisioning, VPS firewall/TLS setup and Cloud86 outbound network access are not changed automatically by the plugin.
- Booster does not silently enable full-page caching.
- The native full-page cache remains experimental until validated on the actual hosting stack.
- Performance changes should be measured before and after with PageSpeed Insights and, where available, real-user field data.
