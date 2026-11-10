"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/site-shell";

type PaymentMethod = { id: string; title: string; description?: string };
type ShippingRate = { rate_id: string; name: string; price: string; selected?: boolean; package_id?: number };
type CartData = { shipping_rates?: { package_id: number; shipping_rates: ShippingRate[] }[]; totals?: { total_price: string; total_shipping: string }; items?: unknown[] };
type CheckoutData = { payment_methods?: PaymentMethod[] };

export default function CheckoutPage() {
  const [methods,setMethods]=useState<PaymentMethod[]>([]);
  const [method,setMethod]=useState("");
  const [nonce,setNonce]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [done,setDone]=useState("");
  const [shippingRates,setShippingRates]=useState<{package_id:number;shipping_rates:ShippingRate[]}[]>([]);
  const [shippingDifferent,setShippingDifferent]=useState(false);
  const [form,setForm]=useState({first_name:"",last_name:"",email:"",phone:"",address_1:"",address_2:"",postcode:"",city:"",country:"NL"});
  const [shipping,setShipping]=useState({first_name:"",last_name:"",address_1:"",address_2:"",postcode:"",city:"",country:"NL"});
  useEffect(()=>{(async()=>{try{
    const [checkoutResponse,cartResponse]=await Promise.all([
      fetch("/api/store/checkout",{cache:"no-store",credentials:"same-origin"}),
      fetch("/api/store/cart",{cache:"no-store",credentials:"same-origin"})
    ]);
    const data:CheckoutData=await checkoutResponse.json();
    const cart:CartData=await cartResponse.json();
    setNonce(checkoutResponse.headers.get("X-WC-Store-API-Nonce")||cartResponse.headers.get("X-WC-Store-API-Nonce")||"");
    setMethods(data.payment_methods||[]);
    if(data.payment_methods?.[0])setMethod(data.payment_methods[0].id);
    setShippingRates(cart.shipping_rates||[]);
  }catch{setError("Afrekengegevens konden niet worden geladen.");}})();},[]);
  function change(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>){setForm({...form,[e.target.name]:e.target.value});}
  function changeShipping(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>){setShipping({...shipping,[e.target.name]:e.target.value});}

  async function updateAddress() {
    const shippingAddress=shippingDifferent?shipping:{...form};
    const response=await fetch("/api/store/cart/update-customer",{
      method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json",Nonce:nonce},
      body:JSON.stringify({billing_address:form,shipping_address:shippingAddress})
    });
    const data=await response.json();
    if(!response.ok)throw new Error(data.message||"Adresgegevens konden niet worden bijgewerkt.");
    setNonce(response.headers.get("X-WC-Store-API-Nonce")||nonce);
    setShippingRates(data.shipping_rates||[]);
  }

  async function chooseShipping(packageId:number,rateId:string) {
    setError("");
    try{
      const response=await fetch(`/api/store/cart/select-shipping-rate?package_id=${packageId}&rate_id=${encodeURIComponent(rateId)}`,{
        method:"POST",credentials:"same-origin",headers:{Nonce:nonce}
      });
      const data=await response.json();
      if(!response.ok)throw new Error(data.message||"Verzendmethode kiezen is mislukt.");
      setShippingRates(data.shipping_rates||[]);
      setNonce(response.headers.get("X-WC-Store-API-Nonce")||nonce);
    }catch(e){setError(e instanceof Error?e.message:"Verzendmethode kiezen is mislukt.");}
  }

  async function submit(e:React.FormEvent){
    e.preventDefault();setLoading(true);setError("");
    try{
      await updateAddress();
      const r=await fetch("/api/store/checkout",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json",Nonce:nonce},body:JSON.stringify({billing_address:form,shipping_address:shippingDifferent?shipping:form,payment_method:method,payment_data:[]})});
      const data=await r.json();
      if(!r.ok)throw new Error(data.message||data?.errors?.[0]?.message||"Afrekenen is niet gelukt.");
      const redirect=data.payment_result?.redirect_url||data.redirect_url;
      if(redirect){window.location.assign(redirect);return;}
      if(data.order_id){setDone("Je bestelling is aangemaakt. Bestelnummer: "+data.order_id);return;}
      throw new Error("WooCommerce heeft geen betaal- of bevestigingslink teruggegeven.");
    }catch(e){setError(e instanceof Error?e.message:"Er ging iets mis.");}finally{setLoading(false);}
  }

  return <PageShell><main className="content-page checkout-page"><div className="page-intro"><p className="eyebrow">BENDEMEN / SECURE CHECKOUT</p><h1>Afrekenen</h1></div>
    {done?<div className="empty-state"><h2>Bedankt voor je bestelling</h2><p>{done}</p></div>:<form className="checkout-form" onSubmit={submit}>
      <section><h2>Factuurgegevens</h2><div className="form-row"><label>Voornaam *<input name="first_name" required value={form.first_name} onChange={change}/></label><label>Achternaam *<input name="last_name" required value={form.last_name} onChange={change}/></label></div>
      <label>E-mailadres *<input type="email" name="email" required value={form.email} onChange={change}/></label><label>Telefoonnummer<input name="phone" value={form.phone} onChange={change}/></label>
      <label>Straat en huisnummer *<input name="address_1" required value={form.address_1} onChange={change}/></label><label>Adresregel 2<input name="address_2" value={form.address_2} onChange={change}/></label>
      <div className="form-row"><label>Postcode *<input name="postcode" required value={form.postcode} onChange={change}/></label><label>Plaats *<input name="city" required value={form.city} onChange={change}/></label></div>
      <label>Land<select name="country" value={form.country} onChange={change}><option value="NL">Nederland</option><option value="BE">België</option><option value="DE">Duitsland</option></select></label>
      <label className="checkbox-row"><input type="checkbox" checked={shippingDifferent} onChange={e=>setShippingDifferent(e.target.checked)}/> Verzenden naar een ander adres</label>
      {shippingDifferent&&<div className="shipping-address-fields"><h3>Verzendadres</h3><div className="form-row"><label>Voornaam *<input name="first_name" required value={shipping.first_name} onChange={changeShipping}/></label><label>Achternaam *<input name="last_name" required value={shipping.last_name} onChange={changeShipping}/></label></div><label>Straat en huisnummer *<input name="address_1" required value={shipping.address_1} onChange={changeShipping}/></label><label>Adresregel 2<input name="address_2" value={shipping.address_2} onChange={changeShipping}/></label><div className="form-row"><label>Postcode *<input name="postcode" required value={shipping.postcode} onChange={changeShipping}/></label><label>Plaats *<input name="city" required value={shipping.city} onChange={changeShipping}/></label></div><label>Land<select name="country" value={shipping.country} onChange={changeShipping}><option value="NL">Nederland</option><option value="BE">België</option><option value="DE">Duitsland</option></select></label></div>}
      </section>
      {shippingRates.length>0&&<section><h2>Verzendmethode</h2>{shippingRates.map(pkg=><div className="shipping-package" key={pkg.package_id}>{pkg.shipping_rates.map(rate=><label className="payment-choice" key={rate.rate_id}><input type="radio" name={`shipping-${pkg.package_id}`} checked={!!rate.selected} onChange={()=>chooseShipping(pkg.package_id,rate.rate_id)}/><span><strong>{rate.name}</strong><small>{new Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR"}).format(Number(rate.price)/100)}</small></span></label>)}</div>)}</section>}
      <section><h2>Betaalmethode</h2>{methods.length?methods.map(m=><label className="payment-choice" key={m.id}><input type="radio" name="payment" value={m.id} checked={method===m.id} onChange={()=>setMethod(m.id)}/><span><strong>{m.title}</strong>{m.description&&<small>{m.description}</small>}</span></label>):<p>Betaalmethoden laden...</p>}</section>
      {error&&<p className="form-error" role="alert">{error}</p>}
      <p className="form-note">Door je bestelling te plaatsen ga je akkoord met de <Link href="/algemene-voorwaarden">algemene voorwaarden</Link> en het <Link href="/privacyverklaring-eu">privacybeleid</Link>.</p>
      <button className="button button-dark" disabled={loading||!method}>{loading?"Bestelling verwerken...":"Bestelling plaatsen"}</button>
    </form>}</main></PageShell>;
}
