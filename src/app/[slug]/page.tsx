import { notFound } from "next/navigation";
import { PageShell } from "@/components/site-shell";
import { getWordPressPage } from "@/lib/wordpress";

const LEGAL_PAGES: Record<string, { wpSlug: string; fallbackTitle: string }> = {
  "terms-and-conditions": { wpSlug: "terms-and-conditions", fallbackTitle: "Algemene voorwaarden" },
  "algemene-voorwaarden": { wpSlug: "terms-and-conditions", fallbackTitle: "Algemene voorwaarden" },
  "privacyverklaring-eu": { wpSlug: "privacyverklaring-eu", fallbackTitle: "Privacyverklaring" },
  "retour-beleid": { wpSlug: "retour-beleid", fallbackTitle: "Retourbeleid" },
  "levering-betaling-beleid": { wpSlug: "levering-betaling-beleid", fallbackTitle: "Levering & betaling" },
  "ons-bedrijf": { wpSlug: "ons-bedrijf", fallbackTitle: "Ons bedrijf" },
  "goede-doelen": { wpSlug: "goede-doelen", fallbackTitle: "Goede doelen" },
  "cookiebeleid-eu": { wpSlug: "cookiebeleid-eu", fallbackTitle: "Cookiebeleid" }
};

function localizeWordPressLinks(html: string) {
  return html.replace(/(href=["\'])https?:\\/\\/(?:www\\.)?bendemen\\.com(\\/[^"\']*)?(["\'])/gi, (_match, start, path = "/", end) => `${start}${path || "/"}${end}`);
}

export function generateStaticParams() {
  return Object.keys(LEGAL_PAGES).map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = LEGAL_PAGES[slug];
  if (!config) return { title: "Pagina niet gevonden | Bendemen" };
  const page = await getWordPressPage(config.wpSlug);
  return { title: `${page?.title.rendered || config.fallbackTitle} | Bendemen` };
}

export default async function WordPressContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const config = LEGAL_PAGES[slug];
  if (!config) notFound();
  const page = await getWordPressPage(config.wpSlug);

  if (!page) return <PageShell><main className="content-page legal-page"><div className="legal-content legal-error">
    <p className="eyebrow">BENDEMEN / INFORMATIE</p><h1>{config.fallbackTitle}</h1>
    <p>Deze pagina kon momenteel niet uit WordPress worden opgehaald. Probeer het later opnieuw.</p>
    <p>De oorspronkelijke pagina blijft beschikbaar op <a href={`/${config.wpSlug}/`}>www.bendemen.com</a>.</p>
  </div></main></PageShell>;

  return <PageShell><main className="content-page legal-page"><article className="legal-content">
    <p className="eyebrow">BENDEMEN / INFORMATIE</p><h1>{page.title.rendered}</h1>
    <div dangerouslySetInnerHTML={{ __html: localizeWordPressLinks(page.content.rendered) }} />
  </article></main></PageShell>;
}
