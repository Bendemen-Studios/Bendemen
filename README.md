# Bendemen Headless Shop

Een eigen, minimalistische Next.js storefront voor Bendemen. WooCommerce blijft de bron van waarheid voor producten, prijzen, voorraad en bestellingen. Mollie verzorgt de hosted betaalpagina.

## Stack
- Next.js + React + TypeScript
- WooCommerce REST API (server-side)
- Mollie Payments API + webhook
- Eigen VPS, standaard poort 3031

## Lokaal starten
```bash
npm install
cp .env.example .env.local
# Vul WooCommerce- en Mollie-gegevens in
npm run dev
```
Open http://localhost:3031.

## VPS
```bash
npm ci
cp .env.example .env.local
nano .env.local
npm run build
npm install -g pm2
pm2 start npm --name bendemen-headless-shop -- start
pm2 save
pm2 startup
```
Configureer Nginx/Nginx Proxy Manager naar `127.0.0.1:3031` met HTTPS.

## WooCommerce instellen
1. WooCommerce → Instellingen → Geavanceerd → REST API.
2. Maak een Read/Write API-sleutel aan.
3. Zet de sleutel in `.env.local`; commit deze nooit.
4. Stel een Mollie-test-API-sleutel in.
5. Configureer de webhook op `https://shop.bendemen.com/api/mollie/webhook`.
6. Test de volledige orderflow voordat je live gaat.

## MVP-beperkingen
De eerste versie richt zich op eenvoudige fysieke producten en Nederlandse bezorgadressen. Productvariaties, kortingscodes, klantaccounts en complexe verzendregels moeten nog verder worden uitgewerkt. Controleer btw en verzendkosten in WooCommerce en test de Mollie-webhook zorgvuldig vóór productie.

Geheime sleutels horen uitsluitend in server-side environment variables; gebruik nooit `NEXT_PUBLIC_` voor secrets.
