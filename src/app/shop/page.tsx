import Image from "next/image";
import Link from "next/link";
import { PageShell } from "@/components/site-shell";
import { getProducts, formatPrice } from "@/lib/store-api";

export const metadata = { title: "Shop alle producten | Bendemen", description: "Bekijk de volledige Bendemen collectie: streetwear, kleding en lifestyle." };

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ q?: string; categorie?: string; sale?: string }> }) {
  const params = await searchParams;
  const products = await getProducts(100);
  const filtered = products.filter(p =>
    (!params.q || p.name.toLowerCase().includes(params.q.toLowerCase())) &&
    (!params.categorie || p.categories?.some(c => c.slug === params.categorie)) &&
    (!params.sale || !p.is_on_sale ? !params.sale : true)
  );
  const categories = Array.from(new Map(products.flatMap(p=>p.categories||[]).map(c=>[c.slug,c])).values());
  return <PageShell><main className="content-page shop-page">
    <div className="page-intro"><p className="eyebrow">BENDEMEN COLLECTION</p><h1>Shop alle producten</h1><p>Ontdek de collectie van Bendemen.</p></div>
    <form className="shop-toolbar" action="/shop"><input name="q" defaultValue={params.q||""} placeholder="Zoek producten..." aria-label="Zoek producten"/><button className="button button-dark">Zoeken</button><label className="sale-filter"><input type="checkbox" name="sale" value="1" defaultChecked={!!params.sale}/> Alleen SALE</label></form>
    <nav className="category-chips" aria-label="Productcategorieën"><Link href="/shop">Alle producten</Link>{categories.map(c=><Link key={c.id} href={`/shop?categorie=${c.slug}`}>{c.name}</Link>)}</nav>
    {filtered.length ? <div className="product-grid">
      {filtered.map(product => <Link className="product-card" href={`/shop/${product.slug}`} key={product.id}>
        <div className="product-image">{product.is_on_sale && <span className="sale-tag">SALE</span>}
          {product.images?.[0]?.src ? <Image src={product.images[0].src} alt={product.images[0].alt || product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1000px) 33vw, 25vw" /> : <div className="image-placeholder">BENDEMEN</div>}
        </div><div className="product-meta"><h3>{product.name}</h3><span>{formatPrice(product.prices?.price)}</span></div>
        {product.is_on_sale && product.prices?.regular_price && <p className="regular-price">{formatPrice(product.prices.regular_price)}</p>}
      </Link>)}
    </div> : <div className="empty-state"><p>Geen producten gevonden.</p><Link href="/shop">Wis filters</Link></div>}
  </main></PageShell>;
}
