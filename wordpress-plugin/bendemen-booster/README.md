# Bendemen Booster Connector

The Bendemen Booster Connector adds conservative frontend settings, an authenticated health endpoint for the Booster dashboard, and Redis object-cache diagnostics.

## Install

1. Upload the `bendemen-booster` folder to `wp-content/plugins/`.
2. Activate **Bendemen Booster Connector** in WordPress.
3. Configure the dashboard bridge secret in `wp-config.php` as documented by the dashboard integration. Do not commit or share the secret.
4. Open **Settings → Bendemen Booster** for reversible frontend settings.
5. Open **Settings → Bendemen Booster Redis** to inspect object-cache integration.

## Redis object cache

Booster intentionally does not ship a home-grown Redis protocol client or its own `object-cache.php` drop-in. Use one maintained Redis client/drop-in, for example [Redis Object Cache](https://wordpress.org/plugins/redis-cache/), configured with a TLS endpoint and ACL credentials. Booster reports configuration booleans and performs a WordPress object-cache API read/write test; it never returns hostnames, passwords or other secret values through its authenticated status endpoint.

A successful API round trip does not by itself prove Redis is the active backend. Confirm the client plugin reports connected/connected status and inspect server-side Redis logs.

## Cache layers

- **Redis object cache** stores WordPress objects and database-query results where supported.
- **Bendemen Booster Cache** is a separate, opt-in full-page HTML cache in the companion `bendemen-booster-cache` plugin.
- Never enable two full-page cache plugins at once.
- WooCommerce cart, checkout, account, payment/order endpoints, logged-in and personalized responses must remain uncached by the full-page cache.
- Smush remains responsible for image optimization.

## Security

- Keep Redis credentials in `wp-config.php` or secure environment configuration, not plugin options.
- Use TLS with certificate validation and a Redis ACL user.
- Limit the Redis firewall to the confirmed source IP/network of the WordPress host.
- Never expose the Redis listener to all internet sources.
- Test checkout, cart, product stock, authentication and payment return flows on staging before production changes.
