import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 600;

function finite(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function GET(request: NextRequest) {
  const strategy = request.nextUrl.searchParams.get("strategy") === "desktop" ? "desktop" : "mobile";
  const rawTarget = process.env.MONITOR_TARGET_URL || process.env.WORDPRESS_URL;
  if (!rawTarget) {
    return NextResponse.json({ error: "MONITOR_TARGET_URL is niet ingesteld." }, { status: 503 });
  }

  let target: URL;
  try {
    target = new URL(rawTarget);
  } catch {
    return NextResponse.json({ error: "De meet-URL is ongeldig." }, { status: 500 });
  }
  if (target.protocol !== "https:" || !["www.bendemen.com", "bendemen.com"].includes(target.hostname)) {
    return NextResponse.json({ error: "PageSpeed-metingen zijn alleen toegestaan voor de ingestelde Bendemen-site." }, { status: 400 });
  }

  const api = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  api.searchParams.set("url", target.toString());
  api.searchParams.set("strategy", strategy);
  api.searchParams.append("category", "performance");
  if (process.env.PAGESPEED_API_KEY) api.searchParams.set("key", process.env.PAGESPEED_API_KEY);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 55000);
  try {
    const response = await fetch(api, {
      signal: controller.signal,
      next: { revalidate: 600 },
      headers: { "Accept": "application/json" },
    });
    if (!response.ok) {
      return NextResponse.json({ error: response.status === 429 ? "Google PageSpeed heeft de limiet bereikt. Probeer later opnieuw." : "Google PageSpeed kon de website niet meten (HTTP " + response.status + ")." }, { status: 502, headers: { "Cache-Control": "no-store" } });
    }
    const payload = await response.json();
    const audits = payload?.lighthouseResult?.audits ?? {};
    const field = payload?.loadingExperience?.metrics ?? {};
    const performanceScore = payload?.lighthouseResult?.categories?.performance?.score;
    const lcpField = field?.LARGEST_CONTENTFUL_PAINT_MS?.percentile;
    const inpField = field?.INTERACTION_TO_NEXT_PAINT?.percentile;
    const clsField = field?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile;

    const data = {
      target: target.origin,
      strategy,
      checkedAt: new Date().toISOString(),
      performanceScore: typeof performanceScore === "number" ? Math.round(performanceScore * 100) : null,
      fieldDataAvailable: Boolean(payload?.loadingExperience?.id || payload?.originLoadingExperience?.id),
      metrics: {
        lcpMs: finite(lcpField) ?? finite(audits["largest-contentful-paint"]?.numericValue),
        inpMs: finite(inpField),
        cls: finite(clsField) !== null ? (clsField as number) / 1000 : finite(audits["cumulative-layout-shift"]?.numericValue),
        fcpMs: finite(audits["first-contentful-paint"]?.numericValue),
        ttfbMs: finite(audits["server-response-time"]?.numericValue),
      },
    };
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json({ error: "Google PageSpeed reageerde niet op tijd. Probeer het later opnieuw." }, { status: 502, headers: { "Cache-Control": "no-store" } });
  } finally {
    clearTimeout(timer);
  }
}
