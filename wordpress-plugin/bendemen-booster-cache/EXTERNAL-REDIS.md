# External Redis object cache for Bendemen Booster

Bendemen Booster now includes a **Redis Object Cache diagnostics page** at **Settings → Bendemen Booster Redis** and authenticated REST diagnostics. It checks whether WordPress reports an external object cache, whether `object-cache.php` exists, whether the expected Redis constants are configured, and whether a WordPress object-cache read/write round trip succeeds.

## Important architecture decision

Bendemen Booster does not ship a home-grown Redis protocol client or a replacement `object-cache.php`. Implementing a custom WordPress object-cache drop-in without the mature client, compatibility tests and multisite support would be unsafe. Use one compatible Redis client/drop-in, such as the official [Redis Object Cache plugin](https://wordpress.org/plugins/redis-cache/), and let Booster diagnose it.

- Install/activate only one plugin that provides `wp-content/object-cache.php`.
- Keep Redis object caching separate from full-page HTML caching.
- Do not run two full-page cache plugins at once. The Bendemen Booster Cache feature is separate and opt-in.
- Smush remains responsible for image optimisation.
- Booster never stores or returns Redis credentials through its dashboard or REST endpoint.

## Redis VPS requirements

- A dedicated Redis instance for this WordPress site.
- TLS enabled on the Redis listener; disable the plaintext listener (`port 0`).
- Redis ACL user with a long unique password.
- Firewall limited to the real source IP/network used by the WordPress host. Do not assume the host's inbound IP is also its outbound IP.
- Valid TLS certificate for the Redis DNS hostname and CA verification enabled by the WordPress Redis client.
- Renewed certificates must be copied/linked safely to the Redis service and Redis reloaded/restarted after renewal.
- Never expose port 6379 to all internet sources.

## WordPress configuration

Place the provider's actual values in `wp-config.php` above the stop-editing line, or use a securely managed environment variable for the secret:

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

The environment variable must actually be configured by the hosting platform; otherwise the password will be empty. Do not paste passwords into the Booster dashboard, commit them to Git, or send them in chat. Confirm the chosen Redis client supports ACL username, TLS and certificate verification. Do not use insecure TLS options in production.

## Enable and verify

1. Install the official Redis Object Cache plugin (or another maintained, compatible object-cache drop-in).
2. Add the connection constants and secret securely.
3. Verify TLS and authentication from the WordPress host. A successful local Redis test on the VPS does not prove Cloud86 can connect.
4. Activate the object's cache drop-in only after the connection test succeeds.
5. Open **Settings → Bendemen Booster Redis**. Review the external object cache, drop-in, TLS, authentication and read/write diagnostics. The round-trip test verifies the WordPress cache API; it does not independently prove Redis is the backend, so also inspect the Redis client status/logs.
6. Test product pages, stock updates, cart, checkout, login/logout, account, order status, payment returns, webhooks and scheduled tasks.

## WooCommerce and full-page caching

Object caching stores application objects and is not the same as caching complete HTML responses. The Booster page cache separately bypasses requests with cookies or query strings and excludes cart, checkout, account, order endpoints, REST, AJAX and admin. Keep this conservative behaviour and do not add another full-page cache layer. Test all WooCommerce flows on staging before enabling a page cache on production.

## Current limitations

- Booster reports and diagnoses Redis object-cache integration; the compatible Redis client/drop-in still supplies the actual WordPress object-cache implementation.
- Booster does not provision Redis or change VPS firewall/TLS configuration automatically.
- A successful diagnostic is not a substitute for an end-to-end test from the actual WordPress hosting account.
