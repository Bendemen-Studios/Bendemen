import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type LegalPageData = {
  slug: string;
  title: string;
  content: string;
  sourceUrl: string;
  modified: string | null;
};
type LegalPagesFile = { pages?: LegalPageData[]; syncedAt?: string };

async function getLegalPage(slug: string): Promise<LegalPageData | null> {
  try {
    const file = await fs.readFile(path.join(process.cwd(), "data", "legal-pages.json"), "utf8");
    const data = JSON.parse(file) as LegalPagesFile;
    return data.pages?.find((page) => page.slug === slug) ?? null;
  } catch {
    return null;
  }
}

// The HTML is sourced from Bendemen's own published WordPress pages. Remove active
// content and inline event handlers before rendering the synchronized page body.
function safeWordPressHtml(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|embed|form|input|button)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|style|iframe|object|embed|form|input|button)\b[^>]*\/?\s*>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(href|src)\s*=\s*("|')\s*javascript:[\s\S]*?\2/gi, "");
}

export async function generateMetadata({ params }: { params: Promise<{ legalSlug: string }> }) {
  const { legalSlug } = await params;
  const page = await getLegalPage(legalSlug);
  return page
    ? { title: `${page.title} | Bendemen`, alternates: { canonical: page.sourceUrl } }
    : { title: "Pagina niet gevonden | Bendemen" };
}

export default async function SyncedLegalPage({ params }: { params: Promise<{ legalSlug: string }> }) {
  const { legalSlug } = await params;
  const page = await getLegalPage(legalSlug);
  if (!page) notFound();

  return (
    <main className="legal-page wrap">
      <header className="header">
        <Link className="wordmark" href="/">BENDEMEN<span>®</span></Link>
        <Link className="under-link" href="/shop">Terug naar de shop</Link>
      </header>
      <article className="legal-content">
        <span className="eyebrow">JURIDISCHE INFORMATIE</span>
        <h1>{page.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: safeWordPressHtml(page.content) }} />
        <p className="legal-sync-note">Laatst bijgewerkt op de bronwebsite: {page.modified ? new Date(page.modified).toLocaleDateString("nl-NL", { dateStyle: "long", timeZone: "Europe/Amsterdam" }) : "onbekend"}.</p>
      </article>
      <footer className="footer">
        <Link href="/">Bendemen</Link>
        <Link href="/shop">Shop</Link>
        <Link href="/terms-and-conditions">Algemene voorwaarden</Link>
        <Link href="/privacyverklaring-eu">Privacyverklaring</Link>
      </footer>
    </main>
  );
}
