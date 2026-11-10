# Bendemen Storefront

Headless WooCommerce storefront built with Next.js App Router, React, TypeScript and Tailwind CSS. The repository is configured to run as a Node.js server in the **Pterodactyl Generic Node.js egg**.

## Pterodactyl (Generic Node.js egg)

Use Node.js 22 or newer.

1. Create a Pterodactyl server with the Generic Node.js egg and assign a primary allocation.
2. Deploy this repository into `/home/container` (for a public repository, clone it into the server directory).
3. Set the egg startup variable `MAIN_FILE` to `server.mjs`.
4. Keep the egg's normal startup command so it installs dependencies and runs `node /home/container/${MAIN_FILE}`.
5. Set WooCommerce environment variables in the server's Startup configuration if required. The public product listing only needs `WC_STORE_API_URL`.
6. Start the server. `server.mjs` runs `npm run build` and then starts Next.js bound to `0.0.0.0` on Pterodactyl's assigned `SERVER_PORT`.

The wrapper builds on each server start so a Git update followed by a restart cannot accidentally serve a stale Next.js build. This increases startup time but keeps deployment predictable. Do not run PM2 inside Pterodactyl; Wings already supervises the server process.

See [PTERODACTYL.md](./PTERODACTYL.md) for panel values and deployment steps.

## Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000.

## Manual production run (outside Pterodactyl)

```bash
npm install
npm run build
PORT=3000 npm start
```

## WooCommerce credentials

Create a dedicated WooCommerce REST API key with least-privilege permissions. Keep private credentials in server environment variables only. Never expose them through `NEXT_PUBLIC_*` variables or browser code.

## Current implementation scope

Included: responsive Bendemen-style homepage, public WooCommerce product listing, price/sale display, server-side WooCommerce REST client foundation and Pterodactyl startup wrapper.

Not yet production-ready for checkout: cart session persistence, product detail routes, customer accounts, checkout, Mollie payment handoff/webhooks, shipping/tax validation, search/filtering, legal pages, consent and end-to-end tests still need implementation. Keep the current production storefront active until those flows have been tested against WooCommerce staging.
