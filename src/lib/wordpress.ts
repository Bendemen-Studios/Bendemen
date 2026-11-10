import "server-only";

const WP_API = process.env.WP_API_URL || "https://www.bendemen.com/wp-json/wp/v2";

export type WordPressPage = {
  id: number; slug: string; date: string; modified: string; link: string;
  title: { rendered: string }; content: { rendered: string; protected: boolean };
};

export async function getWordPressPage(slug: string): Promise<WordPressPage | null> {
  try {
    const response = await fetch(`${WP_API}/pages?slug=${encodeURIComponent(slug)}&_embed=1`, {
      next: { revalidate: 300 }, headers: { Accept: "application/json" }
    });
    if (!response.ok) return null;
    const pages: WordPressPage[] = await response.json();
    return pages[0] ?? null;
  } catch (error) {
    console.error("[Bendemen] WordPress page fetch failed:", error);
    return null;
  }
}
