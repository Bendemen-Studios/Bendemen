import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = new Set(["bendemen.com", "www.bendemen.com"]);

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("url");
  if (!raw) return NextResponse.json({ message: "Image URL ontbreekt." }, { status: 400 });

  let imageUrl: URL;
  try {
    imageUrl = new URL(raw);
  } catch {
    return NextResponse.json({ message: "Ongeldige image URL." }, { status: 400 });
  }

  if (
    imageUrl.protocol !== "https:" ||
    !ALLOWED_HOSTS.has(imageUrl.hostname.toLowerCase()) ||
    imageUrl.username ||
    imageUrl.password
  ) {
    return NextResponse.json({ message: "Deze afbeeldingsbron is niet toegestaan." }, { status: 403 });
  }

  try {
    const upstream = await fetch(imageUrl, {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        Referer: "https://www.bendemen.com/",
        Origin: "https://www.bendemen.com",
        "User-Agent": "Mozilla/5.0 (compatible; BendemenStore/1.0; +https://www.bendemen.com)"
      },
      cache: "force-cache",
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(15000)
    });

    if (!upstream.ok) {
      return NextResponse.json({ message: `Afbeelding kon niet worden opgehaald (HTTP ${upstream.status}).` }, { status: upstream.status === 404 ? 404 : 502 });
    }

    const contentType = upstream.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("image/")) {
      return NextResponse.json({ message: "De bron heeft geen afbeelding teruggegeven." }, { status: 502 });
    }

    const headers = new Headers({
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff"
    });
    const length = upstream.headers.get("content-length");
    if (length) headers.set("Content-Length", length);
    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (error) {
    console.error("[Bendemen media proxy]", error);
    return NextResponse.json({ message: "Afbeeldingsserver is tijdelijk niet bereikbaar." }, { status: 502 });
  }
}
