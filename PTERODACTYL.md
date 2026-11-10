# Pterodactyl deployment — Generic Node.js egg

This project is intended to run as a normal Node.js process supervised by Pterodactyl Wings.

## Panel configuration

| Setting | Value |
| --- | --- |
| Nest / Egg | Generic / Node.js |
| Runtime | Node.js 22 (or newer LTS) |
| Startup variable `MAIN_FILE` | `server.mjs` |
| Primary allocation | Assign a port in Pterodactyl |
| `NODE_PACKAGES` | Leave empty |
| `AUTO_UPDATE` | Optional; enable only if the egg can run Git in the container and the repository is cloned there |
| `NODE_ENV` | `production` |

Do not set `MAIN_FILE` to `node_modules/next/dist/bin/next`: the wrapper is responsible for building and launching Next.js.

## Startup behavior

The Generic Node.js egg's standard startup command should install package dependencies and execute:

```bash
node /home/container/${MAIN_FILE}
```

With `MAIN_FILE=server.mjs`, the wrapper:

1. Runs `npm run build`.
2. Starts Next.js with host `0.0.0.0`.
3. Uses `SERVER_PORT` supplied by Pterodactyl (falls back to `PORT`, then `3000`).
4. Forwards SIGTERM/SIGINT to the Next.js child process for clean shutdown.

If your Generic egg has a different startup command, make sure it ultimately executes `node /home/container/server.mjs` after installing dependencies.

## Deploying the repository

For a public GitHub repository, clone the repository into the server's working directory using the Pterodactyl console or SFTP workflow supported by your egg:

```bash
git clone https://github.com/Bendemen-Studios/Bendemen.git .
```

If the container directory already contains files, do not blindly clone over them. Back up or clear the directory first.

The egg normally runs `npm install` during startup. After the repository is present, start the server. Subsequent code updates can be pulled with `git pull` (or the egg's supported auto-update feature) and applied by restarting the server. The wrapper rebuilds on each start.

## Environment variables

Set these in Pterodactyl's Startup variables:

- `WC_STORE_API_URL=https://www.bendemen.com/wp-json/wc/store/v1`
- `WC_API_URL=https://www.bendemen.com` (only for private REST API operations)
- `WC_CONSUMER_KEY` and `WC_CONSUMER_SECRET` (only when private REST API operations are implemented)

The public product catalogue endpoint does not require consumer credentials. Never put secrets in variables beginning with `NEXT_PUBLIC_`, commit them to Git, or include them in client-side code.

## Networking

Pterodactyl must assign a primary allocation to the server. The app listens on `0.0.0.0:${SERVER_PORT}`. Point your reverse proxy at the node's allocated host/port and terminate HTTPS at the proxy. Do not assume port 3000: Pterodactyl may assign a different port.

## Important

- Do not run PM2 inside the Pterodactyl container. Wings supervises and restarts the main process.
- Do not expose the Node.js allocation directly without HTTPS/reverse-proxy protections.
- The current storefront is a foundation, not a complete checkout. Validate cart, checkout, Mollie callbacks, taxes and shipping in staging before switching the production domain.
