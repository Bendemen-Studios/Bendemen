#!/usr/bin/env node
/**
 * Sync the public legal/about pages from the WordPress site into local JSON.
 * Run once after deployment, then hourly from cron. Does not require WooCommerce API keys.
 */
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const source = (process.env.LEGAL_SOURCE_URL || "https://www.bendemen.com").replace(/\/+$/, "");
const output = resolve(process.env.LEGAL_PAGES_FILE || "data/legal-pages.json");
const slugs = [
  "terms-and-conditions",
  "privacyverklaring-eu",
  "retour-beleid",
  "levering-betaling-beleid",
  "cookiebeleid-eu",
  "imprint",
  "disclaimer",
  "ons-bedrijf",
];

function plainText(html = "") {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, " ").trim();
}

async function fetchPage(slug) {
  const endpoint = new URL("/wp-json/wp/v2/pages", source);
  endpoint.searchParams.set("slug", slug);
  endpoint.searchParams.set("_fields", "id,slug,status,date,modified,link,title,content,excerpt");
  const response = await fetch(endpoint, {
    headers: { accept: "application/json", "user-agent": "BendemenLegalSync/1.0 (+https://www.bendemen.com)" },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`${slug}: WordPress REST API returned HTTP ${response.status}`);
  const result = await response.json();
  const page = Array.isArray(result) ? result.find((item) => item.slug === slug && item.status === "publish") : null;
  if (!page) throw new Error(`${slug}: published page not found through the WordPress REST API`);
  if (!page.content?.rendered) throw new Error(`${slug}: page has no rendered content`);
  return {
    slug: page.slug,
    title: plainText(page.title?.rendered || slug),
    content: page.content.rendered,
    excerpt: page.excerpt?.rendered || "",
    sourceUrl: page.link,
    modified: page.modified || null,
    syncedAt: new Date().toISOString(),
  };
}

async function main() {
  const pages = [];
  // Fail the entire sync if any page is unavailable; never replace good data with a partial set.
  for (const slug of slugs) pages.push(await fetchPage(slug));
  await mkdir(dirname(output), { recursive: true });
  const temp = `${output}.tmp`;
  await writeFile(temp, JSON.stringify({ source, syncedAt: new Date().toISOString(), pages }, null, 2) + "\n", "utf8");
  await rename(temp, output);
  console.log(`Synced ${pages.length} legal/about pages from ${source} to ${output}`);
}

main().catch((error) => {
  console.error(`Legal page sync failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
