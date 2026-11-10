import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/site-shell";
import { getProduct, formatPrice } from "@/lib/store-api";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { getMediaUrl } from "@/lib/media";

export async function generateMetadata({params}:{params:Promise<{slug:string}>}) {
 const {slug}=await params; const product=await getProduct(slug);
 return {title:product?`${product.name} | Bendemen`:"Product niet gevonden",description:product?.short_description?.replace(/<[^>]*>/g,"").slice(0,155)};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const product = await getProduct(slug); if (!product) notFound();
  return <PageShell><main className="content-page product-detail">
    <p className="eyebrow"><Link href="/shop">SHOP</Link> / {product.categories?.[0]?.name||"BENDEMEN"}</p>
    <div className="product-detail-grid">
      <div className="product-gallery">{product.images?.map((image,index)=><div className="product-detail-image" key={image.id||index}><Image src={getMediaUrl(image.src)} unoptimized alt={image.alt||product.name} fill sizes="(max-width: 760px) 100vw, 50vw" priority={index===0}/></div>)}</div>
      <section className="product-detail-copy"><p className="eyebrow">BENDEMEN COLLECTION</p><h1>{product.name}</h1>
        {product.is_on_sale&&<span className="sale-tag detail-sale">SALE</span>}
        <p className="detail-price">{formatPrice(product.prices?.price)}</p>
        {product.short_description&&<div className="product-description" dangerouslySetInnerHTML={{__html:product.short_description}}/>}
        <AddToCartButton productId={product.id}/>
        <div className="product-description full-description" dangerouslySetInnerHTML={{__html:product.description||""}}/>
        <p className="form-note">Veilig afrekenen via de betaalmethoden die bij het afrekenen beschikbaar zijn.</p>
      </section>
    </div>
  </main></PageShell>;
}
