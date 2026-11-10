const MEDIA_HOSTS = new Set(["bendemen.com", "www.bendemen.com"]);

/** Route WordPress media through our server so the WordPress origin can be sent
 * as the Referer when a host's hotlink protection is enabled. */
export function getMediaUrl(source?: string) {
  if (!source) return "";
  try {
    const url = new URL(source);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    if (!MEDIA_HOSTS.has(url.hostname.toLowerCase())) return "";
    return `/api/media?url=${encodeURIComponent(url.toString())}`;
  } catch {
    return "";
  }
}
