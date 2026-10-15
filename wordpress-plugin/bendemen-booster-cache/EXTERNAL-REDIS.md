# External Redis for Bendemen Booster

Bendemen Booster can diagnose an external Redis object-cache configuration. It does **not** provision a Redis server or replace a Redis client/drop-in. WordPress needs a compatible persistent object-cache drop-in such as the official **Redis Object Cache** plugin, plus a Redis endpoint supplied by a provider.

## Required before configuration

Obtain these details from a Redis provider:
- TLS endpoint hostname and port (prefer a private endpoint/VPC if available).
- ACL username/password or token, as required by the provider.
- CA certificate requirements and whether the provider supports TLS.
- A dedicated Redis database/instance for this WordPress site, with eviction/memory policy appropriate for caching.

Do not use a public unauthenticated Redis endpoint, do not open port 6379 to the whole internet, and do not commit credentials to Git or paste them into chat. If WordPress hosting cannot reach the endpoint over a secure network, this design will not work safely.

## WordPress client

1. Install the official **Redis Object Cache** plugin from WordPress.org and activate it. It supplies the WordPress object-cache drop-in; do not manually create a second object-cache.php.
2. Add the provider's values to wp-config.php above the stop-editing line. Use the provider's exact endpoint and credentials. Example for a TLS endpoint:

```php
define('WP_REDIS_SCHEME', 'tls');
define('WP_REDIS_HOST', 'redis.example-provider.invalid');
define('WP_REDIS_PORT', 6379);
define('WP_REDIS_PASSWORD', getenv('BENDEMEN_REDIS_PASSWORD'));
define('WP_REDIS_DATABASE', 0);
define('WP_REDIS_PREFIX', 'bendemen_prod:');
define('WP_REDIS_TIMEOUT', 1.5);
define('WP_REDIS_READ_TIMEOUT', 1.5);
```

This is a template only: replace the hostname, database and credential source with values supplied by your provider. Prefer a secret/environment variable managed by the hosting platform. If the provider requires ACL username plus password or a custom CA certificate, follow its documented client configuration; do not disable TLS certificate verification to make a connection work.

3. Use the Redis Object Cache plugin's **Enable Object Cache** control only after its connection test succeeds.
4. Confirm the Booster bridge reports:
   - `persistentObjectCache: true`
   - `objectCacheDropInPresent: true`
   - `redisClientConfigured: true`
   - `redisTlsConfigured: true` for TLS endpoints
   - `redisAuthConfigured: true`
5. Test product pages, stock changes, cart, checkout, login/logout, account, order status, webhooks and scheduled tasks. Object cache is not the page cache and should not cache whole HTTP responses.

## Important

- A true value for the Redis configuration diagnostics only confirms that configuration constants exist; it does not prove the endpoint is reachable or that Redis is the active backend.
- Never configure Redis settings in the public Booster dashboard or expose them in a REST response.
- Do not add the native Bendemen page-cache drop-in and another full-page cache at the same time.
- Smush remains the image-optimization provider.
- Cloud86 says its own Redis service is available on Managed WordPress, Managed WooCommerce and Managed VPS; ordinary hosting may not have that service. An external provider is only needed if your actual Cloud86 package does not offer a suitable Redis endpoint.
