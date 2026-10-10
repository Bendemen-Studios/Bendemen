import "server-only";
const base = () => {
  const url = process.env.WOOCOMMERCE_URL;
  const secret = process.env.BENDEMEN_BRIDGE_SECRET;
  if (!url || !secret || secret.length < 32) throw new Error("WooCommerce account bridge is not configured");
  return { url: new URL("/wp-json/bendemen/v1/", url), secret };
};
export async function accountBridge<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config = base();
  const headers = new Headers(init.headers);
  headers.set("X-Bendemen-Bridge-Secret", config.secret);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(new URL(path, config.url), { ...init, headers, cache: "no-store", signal: init.signal ?? AbortSignal.timeout(10000) });
  const data = await response.json().catch(() => ({})) as { message?: string } & T;
  if (!response.ok) throw new Error(response.status === 401 ? "E-mailadres of wachtwoord is onjuist." : (data.message || "De accountservice is tijdelijk niet beschikbaar."));
  return data as T;
}
