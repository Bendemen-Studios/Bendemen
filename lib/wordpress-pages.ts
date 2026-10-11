import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

export type WordPressPage = {
  id?: number;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  sourceUrl?: string;
  modified?: string | null;
};

type WpRestPage = {
  id: number;
  slug: string;
  link: string;
  date?: string;
  modified?: string;
  title: { rendered: string };
  content: { rendered: string; protected?: boolean };
  excerpt?: { rendered: string };
};

type LegalPagesFile = { pages?: WordPressPage[]; syncedAt?: string };

const wordpressOrigin = (process.env.WORDPRESS_URL || process.env.WOOCOMMERCE_URL || "https://www.bendemen.com").replace(/\/$/, "");

function decodeEntities(value: string): string {
  return value
    .replace(/&#8217;|&#x2019;/gi, "’")
    .replace(/&#8216;|&#x2018;/gi, "‘")
    .replace(/&#8220;|&#x201c;/gi, "“")
    .replace(/&#8221;|&#x201d;/gi, "”")
    .replace(/&#8211;|&#x2013;/gi, "–")
    .replace(/&#8212;|&#x2014;/gi, "—")
    .replace(/&nbsp;/gi, " ");
}

function stripTags(value: string): string {
  return decodeEntities(value.replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

export async function getWordPressPage(slug: string): Promise<WordPressPage | null> {
  if (!/^[a-z0-9-]+$/i.test(slug)) return null;
  try {
    const response = await fetch(
      `${wordpressOrigin}/wp-json/wp/v2/pages?slug=${encodeURIComponent(slug)}&status=publish&_fields=id,slug,link,date,modified,title,content,excerpt`,
      { next: { revalidate: 300, tags: [`wordpress-page-${slug}`] }, signal: AbortSignal.timeout(8000) },
    );
    if (!response.ok) return null;
    const pages = await response.json() as WpRestPage[];
    const page = pages.find((item) => item.slug === slug);
    if (!page) return null;
    return {
      id: page.id,
      slug: page.slug,
      title: stripTags(page.title?.rendered || slug),
      content: page.content?.rendered || "",
      excerpt: stripTags(page.excerpt?.rendered || ""),
      sourceUrl: page.link,
      modified: page.modified || null,
    };
  } catch {
    return null;
  }
}

export async function getCachedLegalPage(slug: string): Promise<WordPressPage | null> {
  try {
    const file = await fs.readFile(path.join(process.cwd(), "data", "legal-pages.json"), "utf8");
    const data = JSON.parse(file) as LegalPagesFile;
    return data.pages?.find((page) => page.slug === slug) ?? null;
  } catch {
    return null;
  }
}

// WordPress is our trusted content source, but page HTML is still sanitized
// before being rendered in the Next.js application.
export function safeWordPressHtml(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select|option)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|style|iframe|object|embed|form|input|button|textarea|select|option)\b[^>]*\/?\s*>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(href|src|xlink:href)\s*=\s*("|')\s*javascript:[\s\S]*?\2/gi, "")
    .replace(/\s+srcdoc\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/\s+style\s*=\s*("|')[^\1]*?expression\s*\([^\)]*\)[^\1]*?\1/gi, "");
}
