import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const STORE_API = process.env.WC_STORE_API_URL || "https://www.bendemen.com/wp-json/wc/store/v1";

async function proxyStoreApi(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const target = new URL(`${STORE_API}/${path.map(encodeURIComponent).join("/")}`);
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.append(key, value));

  const headers = new Headers({ Accept: "application/json" });
  const cookie = request.headers.get("cookie");
  const nonce = request.headers.get("Nonce") || request.headers.get("X-WC-Store-API-Nonce");
  if (cookie) headers.set("Cookie", cookie);
  if (nonce) headers.set("Nonce", nonce);
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const method = request.method.toUpperCase();
  const body = ["GET", "HEAD"].includes(method) ? undefined : await request.text();

  try {
    const upstream = await fetch(target, {
      method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual"
    });
    const responseHeaders = new Headers();
    const upstreamType = upstream.headers.get("content-type");
    if (upstreamType) responseHeaders.set("Content-Type", upstreamType);
    const nonceHeader = upstream.headers.get("Nonce") || upstream.headers.get("X-WC-Store-API-Nonce");
    if (nonceHeader) responseHeaders.set("X-WC-Store-API-Nonce", nonceHeader);
    const setCookies = upstream.headers.getSetCookie?.() || [];
    for (const setCookie of setCookies) responseHeaders.append("Set-Cookie", setCookie);
    return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch (error) {
    console.error("[Bendemen Store API proxy]", error);
    return NextResponse.json({ message: "WooCommerce is tijdelijk niet bereikbaar." }, { status: 502 });
  }
}

export const GET = proxyStoreApi;
export const POST = proxyStoreApi;
export const PUT = proxyStoreApi;
export const PATCH = proxyStoreApi;
export const DELETE = proxyStoreApi;
