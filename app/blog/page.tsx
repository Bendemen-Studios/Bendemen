import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Blog | Bendemen",
  description: "Nieuws, verhalen en updates van Bendemen.",
};

type WpPost = {
  id: number;
  slug: string;
  date: string;
  link: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  featured_media: number;
  _embedded?: { "wp:featuredmedia"?: { source_url?: string; alt_text?: string }[] };
};

async function getPosts(): Promise<WpPost[]> {
  const base = (process.env.WORDPRESS_URL || process.env.WOOCOMMERCE_URL || "https://www.bendemen.com").replace(/\/$/, "");
  try {
    const response = await fetch(`${base}/wp-json/wp/v2/posts?status=publish&per_page=24&_embed=1&_fields=id,slug,date,link,title,excerpt,featured_media,_embedded`, {
      next: { revalidate: 300, tags: ["wordpress-posts"] },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return [];
    return await response.json() as WpPost[];
  } catch {
    return [];
  }
}

function text(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&#8217;/g, "’").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
}

export default async function BlogPage() {
  const posts = await getPosts();
  return <main className="wp-home"><SiteHeader />
    <section className="wp-content-hero"><div className="wrap"><span className="wp-eyebrow">VERHALEN VAN BENDEMEN</span><h1>De Bendemen Blog</h1><p>Nieuws, inspiratie en updates uit onze wereld van streetwear en lifestyle.</p></div></section>
    <section className="wp-blog-grid wrap">
      {posts.length ? posts.map((post) => {
        const media = post._embedded?.["wp:featuredmedia"]?.[0];
        return <article className="wp-blog-card" key={post.id}>
          <Link className="wp-blog-image" href={`/blog/${post.slug}/`}>
            {media?.source_url ? <img src={media.source_url} alt={media.alt_text || text(post.title.rendered)} loading="lazy" /> : <span className="wp-blog-mark">B.</span>}
          </Link>
          <div className="wp-blog-copy"><time dateTime={post.date}>{new Date(post.date).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam" })}</time><h2><Link href={`/blog/${post.slug}/`}>{text(post.title.rendered)}</Link></h2><p>{text(post.excerpt.rendered)}</p><Link className="wp-text-link" href={`/blog/${post.slug}/`}>Lees meer <ArrowUpRight size={16}/></Link></div>
        </article>;
      }) : <div className="wp-content-empty"><h2>Nieuwe verhalen volgen binnenkort.</h2><p>Bekijk ondertussen de collectie van Bendemen.</p><Link className="wp-red-button" href="/shop">Shop de collectie</Link></div>}
    </section>
    <SiteFooter />
  </main>;
}
