import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { getCachedLegalPage, getWordPressPage, safeWordPressHtml, wordpressOrigin } from "@/lib/wordpress-pages";

export const revalidate = 300;

type Props = { params: Promise<{ legalSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { legalSlug } = await params;
  const page = await getWordPressPage(legalSlug) ?? await getCachedLegalPage(legalSlug);
  if (!page) return { title: "Pagina niet gevonden | Bendemen" };
  return {
    title: page.title + " | Bendemen",
    description: page.excerpt || undefined,
    alternates: { canonical: "/" + page.slug + "/" },
  };
}

export default async function WordPressContentPage({ params }: Props) {
  const { legalSlug } = await params;
  const page = await getWordPressPage(legalSlug) ?? await getCachedLegalPage(legalSlug);
  if (!page) notFound();

  const html = safeWordPressHtml(page.content);
  return (
    <main className="wp-content-page">
      {page.id ? <link rel="stylesheet" href={`${wordpressOrigin}/wp-content/uploads/elementor/css/post-${page.id}.css`} /> : null}
      <SiteHeader />
      <nav className="wp-breadcrumb wrap" aria-label="Broodkruimelpad">
        <Link href="/">Home</Link><span>/</span><span>{page.title}</span>
      </nav>
      <article className="wp-content-article wrap">
        <span className="wp-eyebrow">BENDEMEN · INFORMATIE</span>
        {html.trim() ? (
          <div className="wordpress-content" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <div className="wp-content-empty">
            <h1>{page.title}</h1>
            <p>Deze pagina hoort bij Bendemen. De inhoud wordt voorbereid voor de nieuwe webshop.</p>
            <Link className="wp-red-button" href="/shop">Bekijk de collectie</Link>
          </div>
        )}
      </article>
      <SiteFooter />
    </main>
  );
}
