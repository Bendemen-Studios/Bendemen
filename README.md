# Bendemen Headless Shop

Een eigen, minimalistische Next.js-webshop voor Bendemen. WooCommerce blijft de bron van waarheid voor producten, variaties, voorraad, verzendzones, verzendmethoden en bestellingen. Mollie verzorgt de beveiligde betaalpagina. De frontend draait zelfstandig op een eigen VPS.

## Stack
- Next.js 15, React 19 en TypeScript
- WooCommerce REST API v3 (server-side; API-sleutels blijven privé)
- WooCommerce-native shipping-zone/rate calculation via de meegeleverde WordPress-plugin
- Mollie Payments API en server-side webhookcontrole
- Responsive shop, zoekfunctie, categorie- en prijsfilters
- Winkelwagen met aantallen, productvariaties en verwijderfunctie
- Checkout met contact-/bezorggegevens, dynamische verzendopties, ordernotitie en akkoord met juridische pagina's
- Nederlandse conceptpagina's voor algemene voorwaarden en privacy
- VPS, standaardpoort 3031

## Lokaal starten
```bash
npm install
cp .env.example .env.local
# Vul WooCommerce- en Mollie-instellingen in
npm run dev
```
Open http://localhost:3031.

## Vereiste configuratie

### WooCommerce API
1. Ga naar WooCommerce → Instellingen → Geavanceerd → REST API.
2. Maak een REST API-sleutel met lees- en schrijfrechten aan.
3. Vul `WOOCOMMERCE_URL`, `WOOCOMMERCE_CONSUMER_KEY` en `WOOCOMMERCE_CONSUMER_SECRET` in.
4. Gebruik `WOOCOMMERCE_URL=https://www.bendemen.com` als WooCommerce daar draait; de frontend staat los op `https://test.bendemen.com`.
5. Controleer dat producten gepubliceerd zijn, voorraad correct is ingesteld en btw-instellingen kloppen.

### Verzendzones en dynamische tarieven
1. Upload de map `wordpress-plugin/bendemen-shipping-rates` naar `wp-content/plugins/` van de WordPress/WooCommerce-installatie. De pluginmap moet dus worden `wp-content/plugins/bendemen-shipping-rates/`.
2. Activeer **Bendemen Shipping Rates** in WordPress → Plugins.
3. De plugin biedt intern het beveiligde endpoint `/wp-json/bendemen/v1/shipping-rates`. Het endpoint vereist WooCommerce REST API-authenticatie met een account dat `manage_woocommerce` mag uitvoeren. De API-sleutel blijft uitsluitend op de Next.js-server.
4. Stel de verzendzones in via WooCommerce → Instellingen → Verzending. Configureer per zone de verzendmethoden en tarieven zoals je die wilt aanbieden.
5. De checkout vraagt de tarieven op voor het ingevulde Nederlandse adres en de huidige winkelwagen. WooCommerce bepaalt de passende zone en voert de berekening uit met de ingeschakelde verzendmethoden. De getoonde tarieven worden bij het plaatsen van de bestelling opnieuw server-side berekend; een bedrag uit de browser wordt niet vertrouwd.
6. Controleer elke verzendmethode die je gebruikt, inclusief eventuele externe vervoerdersplugins. Een methode die extra accountgegevens, sessiegegevens of een eigen checkout vereist, kan aanvullende integratie nodig hebben.
7. Deze checkout ondersteunt op dit moment Nederlandse bezorgadressen (`NL`). Andere landen vereisen uitbreiding van het landveld en de adresvalidatie in de checkout en API.

### Mollie
1. Vul eerst een Mollie-test-API-sleutel in als `MOLLIE_API_KEY`.
2. Stel `MOLLIE_WEBHOOK_URL` in op een publiek bereikbare HTTPS-URL: `https://test.bendemen.com/api/mollie/webhook`.
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
```
De app luistert op poort 3031. Configureer Nginx/Nginx Proxy Manager met HTTPS en proxy naar `127.0.0.1:3031`. Voor PM2:
```bash
pm2 start npm --name bendemen-headless-shop -- start
pm2 save
pm2 startup
```

## Belangrijke grenzen vóór productie
- WooCommerce blijft de bron van waarheid voor zones en tarieven. Test verschillende postcodes, alle actieve zones, gratis-verzenddrempels, lokale afhaalopties, btw en eventuele vervoerdersplugins.
- De PHP-plugin gebruikt de WooCommerce shipping engine. Installeer en activeer de plugin op de WooCommerce-site; alleen de Next.js-deploy is niet voldoende.
- Controleer dat de WooCommerce REST API-sleutel hoort bij een gebruiker met `manage_woocommerce`-rechten, zodat het tariefendpoint is toegestaan.
- Controleer de berekening van btw, verzending, kortingen en variatieprijzen met echte WooCommerce-testorders.
- De headless accountpagina biedt registratie, login en weergave van het WooCommerce Points & Rewards-saldo. Ingelogde klanten kunnen bij checkout een puntenkorting berekenen; de server berekent deze opnieuw via de cart engine van de plugin en schrijft de inwisseling via de officiële puntenmanager weg. Test de volledige flow met je daadwerkelijke product- en categoriebeperkingen voordat je live gaat.
- Er is geen VPS-deployment of DNS-wijziging doorgevoerd. Test build, API-sleutels, Mollie-webhook en de volledige bestelcyclus in een testomgeving voordat je de shop live zet.
- Zet nooit API-sleutels in Git of in variabelen met de prefix `NEXT_PUBLIC_`.

## Huisstijl en tijdelijk domein
- Achtergrond: wit (`#FFFFFF`).
- Hoofdkleur: zwart (`#000000`).
- Accentkleur: rood (`#C3110C`).
- Tijdelijk frontend-domein: `https://test.bendemen.com`.
- Zet dezelfde URL in `NEXT_PUBLIC_SITE_URL` en gebruik `https://test.bendemen.com/api/mollie/webhook` als `MOLLIE_WEBHOOK_URL`.

## Klantaccounts en Points & Rewards

De frontend bevat `/account` voor registratie, inloggen, uitloggen en het actuele saldo uit WooCommerce Points & Rewards. De Next.js-server bewaart de sessie in een ondertekende, httpOnly-cookie. De browser krijgt nooit de bridge-secret of WooCommerce REST API-sleutels.

1. Installeer en activeer `wordpress-plugin/bendemen-account-bridge/bendemen-account-bridge.php) op WordPress.
2. Voeg in `wp-config.php` een geheim van minimaal 32 tekens toe: `define('BENDEMEN_BRIDGE_SECRET', '...');`.
3. Stel op de Next.js-server `BENDEMEN_BRIDGE_SECRET` in op exact dezelfde waarde en genereer daarnaast een aparte `BENDEMEN_AUTH_SECRET` van minimaal 32 tekens.
4. Zorg dat WooCommerce en de officiële WooCommerce Points & Rewards-plugin actief zijn. Het bestaande saldo wordt niet overschreven of opnieuw aangemaakt.
5. Test registratie, inloggen, saldo ophalen en een betaalde bestelling op `test.bendemen.com`.

De kortingsberekening gebruikt de cart engine van Points & Rewards, inclusief de geconfigureerde product-/categoriebeperkingen en kortingslimieten. Test met verschillende producten en puntenstanden voordat je dit live gebruikt.
