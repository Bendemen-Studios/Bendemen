import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { safeWordPressHtml } from "@/lib/wordpress-pages";

type WpPost = { id: number; slug: string; date: string; title: { rendered: string }; content: { rendered: string }; excerpt?: { rendered: string }; featured_media: number; _embedded?: { "wp:featuredmedia"?: { source_url?: string; alt_text?: string }[] } };
type Props = { params: Promise<{ slug: string }> };

async function getPost(slug: string): Promise<WpPost | null> {
  const base = (process.env.WORDPRESS_URL || process.env.WOOCOMMERCE_URL || "https://www.bendemen.com").replace(/\/$/, "");
  try {
    const response = await fetch(`${base}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&status=publish&_embed=1&_fields=id,slug,date,title,content,excerpt,featured_media,_embedded`, {
      next: { revalidate: 300, tags: [`wordpress-post-${slug}`] },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return null;
    const posts = await response.json() as WpPost[];
    return posts.find((post) => post.slug === slug) ?? null;
  } catch { return null; }
}

function text(html: string) { return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim(); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  return post ? { title: text(post.title.rendered) + " | Bendemen", description: text(post.excerpt?.rendered || "") } : { title: "Artikel niet gevonden | Bendemen" };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const image = post._embedded?.["wp:featuredmedia"]?.[0];
  return <main className="wp-home"><SiteHeader />
    <nav className="wp-breadcrumb wrap" aria-label="Broodkruimelpad"><Link href="/">Home</Link><span>/</span><Link href="/blog/">Blog</Link><span>/</span><span>{text(post.title.rendered)}</span></nav>
    <article className="wp-blog-article wrap">
      {image?.source_url && <img className="wp-blog-hero-image" src={image.source_url} alt={image.alt_text || text(post.title.rendered)} />}
      <time dateTime={post.date}>{new Date(post.date).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam" })}</time>
      <h1>{text(post.title.rendered)}</h1>
      <div className="wordpress-content" dangerouslySetInnerHTML={{ __html: safeWordPressHtml(post.content.rendered) }} />
      <Link className="wp-text-link" href="/blog/">← Terug naar de blog</Link>
    </article>
    <SiteFooter />
  </main>;
}
