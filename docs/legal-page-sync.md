# Hourly legal-page synchronization

The Next.js frontend serves these WordPress pages locally, using a JSON snapshot refreshed by a VPS cron job:

- /terms-and-conditions/
- /privacyverklaring-eu/
- /retour-beleid/
- /levering-betaling-beleid/
- /cookiebeleid-eu/
- /imprint/
- /disclaimer/
- /ons-bedrijf/

## First sync after deployment

From the application directory, run:

```bash
npm run sync:legal
```

This uses the public WordPress REST API and does not require WooCommerce credentials. If WordPress REST API access to published pages is blocked, allow read-only access to `/wp-json/wp/v2/pages`. The sync is all-or-nothing: if any source page cannot be fetched, the existing JSON file is left unchanged.

## VPS cron (every hour)

Use `crontab -e` for the same Linux user that owns/runs the app. Replace `/var/www/bendemen` with the actual deployment directory and `/home/DEPLOYUSER` with that user’s home directory:

```cron
0 * * * * cd /var/www/bendemen && /usr/bin/npm run sync:legal >> /home/DEPLOYUSER/bendemen-legal-sync.log 2>&1
```

Find the correct Node/npm paths with `which node` and `which npm`. If the app runs under a Node version manager, use that user's full npm path or call the script with the correct Node executable. Run the first sync manually before adding cron. The page route reads the JSON file on each request, so the app does not need to restart after a successful sync.

Check the latest run with:

```bash
tail -n 100 /home/DEPLOYUSER/bendemen-legal-sync.log
```

The cron line must be installed on the VPS after deploying this branch; a GitHub change cannot edit the VPS crontab remotely.
