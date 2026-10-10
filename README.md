# Bendemen Headless Shop

Een eigen, minimalistische Next.js-webshop voor Bendemen. WooCommerce blijft de bron van waarheid voor producten, variaties, voorraad en bestellingen. Mollie verzorgt de beveiligde betaalpagina. De frontend draait zelfstandig op een eigen VPS.

## Stack
- Next.js 15, React 19 en TypeScript
- WooCommerce REST API v3 (server-side; API-sleutels blijven privé)
- Mollie Payments API en server-side webhookcontrole
- Responsive shop, zoekfunctie, categorie- en prijsfilters
- Winkelwagen met aantallen, productvariaties en verwijderfunctie
- Checkout met contact-/bezorggegevens, ordernotitie en akkoord met juridische pagina's
- Nederlandse conceptpagina's voor algemene voorwaarden en privacy
- VPS, standaardpoort 3031

## Lokaal starten
```bash
npm install
cp .env.example .env.local
# Vul WooCommerce-, verzend- en Mollie-instellingen in
npm run dev
``
Open http://localhost:3031.

## Vereiste configuratie

### WooCommerce
1. Ga naar WooCommerce → Instellingen → Geavanceerd → REST API.
2. Maak een REST API-sleutel met lees- en schrijfrechten aan.
3. Vul `WOOCOMMERCE_URL`, `WOOCOMMERCE_CONSUMER_KEY` en `WOOCOMMERCE_CONSUMER_SECRET` in.
4. Controleer dat producten gepubliceerd zijn, voorraad correct is ingesteld en btw-instellingen kloppen.
5. Stel in WooCommerce de verzendzone en verzendmethode in. Deze eerste checkoutversie ondersteunt één vaste verzendmethode: zet `WOOCOMMERCE_SHIPPING_METHOD_ID`, `WOOCOMMERCE_SHIPPING_METHOD_TITLE` en `WOOCOMMERCE_SHIPPING_COST` gelijk aan die methode. De checkout weigert bestellingen zolang de kosten niet zijn ingesteld. Controleer in testorders of WooCommerce het juiste btw- en ordertotaal berekent.
6. Gebruik `WOOCOMMERCE_URL=https://www.bendemen.com` als WooCommerce daar draait; de frontend staat los op bijvoorbeeld `https://shop.bendemen.com`.

### Mollie
1. Vul eerst een Mollie-test-API-sleutel in als `MOLLIE_API_KEY`.
2. Stel `MOLLIE_WEBHOOK_URL` in op een publiek bereikbare HTTPS-URL: `https://shop.bendemen.com/api/mollie/webhook`.
3. Mollie maakt de betaling aan op basis van het door WooCommerce geretourneerde ordertotaal. De klant wordt doorgestuurd naar Mollie's gehoste checkout.
4. De webhook haalt de actuele betaalstatus bij Mollie op en markeert de WooCommerce-order pas als betaald nadat Mollie `paid` bevestigt. De terugkeerpagina alleen geldt niet als betaalbewijs.
5. Test betaalde, geannuleerde, verlopen en mislukte betalingen vóór livegang. Wissel daarna pas naar een live API-sleutel.

### Juridische pagina's
De pagina's `/voorwaarden` en `/privacy` zijn **concepten**. Vul de juridische bedrijfsnaam, vestigingsadres, e-mail, eventuele KvK-/btw-gegevens, retouradres, retourprocedure en de werkelijk gebruikte verwerkers in. Laat de teksten controleren vóór livegang.

## Build en VPS
```bash
npm install
npm run build
npm run start
``
De app luistert op poort 3031. Configureer Nginx/Nginx Proxy Manager met HTTPS en proxy naar `127.0.0.1:3031`. Voor PM2:
```bash
pm2 start npm --name bendemen-headless-shop -- start
pm2 save
pm2 startup
``

## Belangrijke grenzen vóór productie
- De verzendmethode is momenteel één vaste rate; meerdere verzendzones, gratis verzending vanaf een drempel, afhalen en gewichts-/landafhankelijke tarieven vereisen extra checkoutlogica.
- Controleer de berekening van btw, verzending, kortingen en variatieprijzen met echte WooCommerce-testorders.
- Kortingscodes, klantaccounts en orderbevestigingsmails vanuit de eigen frontend zijn nog niet apart uitgewerkt; WooCommerce e-mailinstellingen blijven van toepassing.
- Er is geen VPS-deployment of DNS-wijziging doorgevoerd. Test build, API-sleutels, Mollie-webhook en de volledige bestelcyclus in een testomgeving voordat je de shop live zet.
- Zet nooit API-sleutels in Git of in variabelen met de prefix `NEXT_PUBLIC_`.

