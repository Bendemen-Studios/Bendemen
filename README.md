# Bendemen Booster

A separate monitoring and safe-optimisation control plane for the existing Bendemen WordPress/WooCommerce website.

## Safety
- WordPress/WooCommerce remains the source of truth for products, stock, customers, orders, checkout and payments.
- Existing Mollie, shipping, loyalty, invoice and other integrations are not replaced.
- Monitoring starts read-only. Future write operations must be explicitly authorised and logged.
- Never commit secrets or customer/payment data.
- Never cache cart, checkout, account, personalised pricing or authenticated responses.

## Requirements
Node.js 20+, npm and WordPress for the optional connector.

## Development
```bash
cp .env.example .env.local
npm install
npm run dev
```
The app listens on port 2003.

## Production
```bash
npm ci
npm run build
npm run start
```
Run behind HTTPS using PM2 or systemd; preferably bind access to localhost and allow only the reverse proxy. Protect the environment file.

## Environment
`BOOSTER_ADMIN_TOKEN` protects administrative API routes. `WORDPRESS_BRIDGE_SECRET` is a separate secret for the WordPress connector. Generate them on the VPS with `openssl rand -hex 32`.

## Current scope
Fresh foundation: dashboard shell, health endpoint, authenticated read-only monitor endpoint, CI build and minimal WordPress connector. Persistent metrics, alert delivery and automatic optimisation are not implemented yet.
