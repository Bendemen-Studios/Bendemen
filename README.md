# Bendemen Booster

A separate dashboard and conservative WordPress/WooCommerce performance helper for the existing Bendemen website.

## Safety
- WordPress/WooCommerce remains the source of truth for products, stock, customers, orders, checkout and payments.
- Existing Mollie, shipping, loyalty, invoice and other integrations are not replaced.
- Monitoring is read-only. The plugin does not modify products, orders, customer records, payment settings, cart or checkout.
- Never commit secrets or customer/payment data.
- Never cache cart, checkout, account, personalised pricing or authenticated responses.

## Current performance controls
Install the WordPress connector from `wordpress-plugin/bendemen-booster/` and activate it in WordPress. Open **Settings → Bendemen Booster** to manage:
- Disable WordPress emoji detection assets for logged-out visitors (enabled by default).
- Disable Dashicons for logged-out visitors (enabled by default).
- Disable WordPress embeds (off by default; enable only if the site does not rely on WordPress oEmbeds).

These are conservative front-end reductions, not a substitute for page caching, image optimisation, CDN configuration or Core Web Vitals testing. They can be toggled off in WordPress.

## Requirements
Node.js 20+, npm and WordPress with WooCommerce for the connector.

## Development
```bash
cp .env.example .env.local
npm install
npm run dev
```
The app listens on port 2003.

## Production
```bash
npm install --no-audit --no-fund
npm run build
npm run start
```
Run behind HTTPS using PM2 or systemd; preferably bind access to localhost and allow only the reverse proxy. Protect the environment file.

## WordPress bridge
Define a separate shared secret in `wp-config.php`:
```php
define('BENDEMEN_BOOSTER_BRIDGE_SECRET', 'replace-with-the-same-random-secret-as-WORDPRESS_BRIDGE_SECRET');
```
Use the value of `WORDPRESS_BRIDGE_SECRET` from the Booster server, but do not put that value in public files or chat. The authenticated read-only endpoint is `/wp-json/bendemen-booster/v1/status`.

## Environment
`BOOSTER_ADMIN_TOKEN` protects administrative API routes. `WORDPRESS_BRIDGE_SECRET` is a separate secret for the WordPress connector. Generate them on the VPS with `openssl rand -hex 32`.

## Scope and limitations
The current dashboard foundation and authenticated monitor are in place. This release adds reversible WordPress frontend controls and an authenticated health bridge. It does not yet implement full-page caching, persistent metrics, alert delivery, automated image conversion, or automatic optimisation. Measure before and after changes using PageSpeed Insights / Lighthouse and real-user Core Web Vitals.
