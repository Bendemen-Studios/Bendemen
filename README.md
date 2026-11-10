# Bendemen Storefront

Headless WooCommerce storefront using Next.js App Router, React, TypeScript and Tailwind CSS. Runs in the Pterodactyl Generic Node.js egg.

## Pterodactyl
- Git repository: https://github.com/Bendemen-Studios/Bendemen
- Branch: main
- AUTO_UPDATE: 1
- MAIN_FILE: index.ts
- Node.js 22 LTS recommended (Node 25 currently supported by this project but not the preferred production LTS line)
- Assigned allocation is read from SERVER_PORT.

The egg installs dependencies; `index.ts` builds and starts Next.js. Do not run PM2 inside Pterodactyl.

## Environment
`WC_STORE_API_URL=https://www.bendemen.com/wp-json/wc/store/v1`
`WP_API_URL=https://www.bendemen.com/wp-json/wp/v2`

Private WooCommerce keys are not required for public catalog and Store API cart operations. Never expose API secrets in NEXT_PUBLIC variables.

## Implemented foundation
- Home, shop, product detail routes, WordPress content pages and company/legal pages
- Original WooCommerce catalog, prices, descriptions, product images and categories fetched live
- Product search/category/sale filtering
- Store API proxy with cart session cookies and nonce forwarding
- Cart add/update/remove and checkout form/payment method handoff (must be verified against the live WooCommerce + Mollie gateway setup)
- Bendemen visual identity with accent #C3110C

## Migration / go-live safety
The current WordPress website remains the source of truth for customer accounts, historical orders, refunds and payment settings. Customer account management and account-specific return/refund functions need a supported authentication integration before they can be moved fully. Do not change the production DNS or disable the WordPress frontend until end-to-end tests pass for product variations, shipping rates, taxes, coupons, guest checkout, customer login, Mollie redirects/webhooks, order confirmation, emails, refunds and privacy/cookie consent.

## Local
```bash
npm install
npm run dev
```
