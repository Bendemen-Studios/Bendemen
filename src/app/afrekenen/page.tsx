"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PaymentMethod = { id: string; title: string; description?: string };
type CheckoutData = { payment_methods?: PaymentMethod[]; billing_address?: Record<string,string>; shipping_address?: Record<string,string> };

export default function CheckoutPage() {
  const [methods,setMethods]=useState<PaymentMethod[]>([]);
  const [method,setMethod]=useState("");
  const [nonce,setNonce]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [done,setDone]=useState("");
  const [form,setForm]=useState({first_name:"",last_name:"",email:"",phone:"",address_1:"",postcode:"",city:"",country:"NL"});
  useEffect(()=>{(async()=>{try{const r=await fetch("/api/store/checkout",{cache:"no-store"});const data:CheckoutData=await r.json();setNonce(r.headers.get("X-WC-Store-API-Nonce")||"");setMethods(data.payment_methods||[]);if(data.payment_methods?.[0])setMethod(data.payment_methods[0].id);}catch{setError("Afrekengegevens konden niet worden geladen.");}})();},[]);
  function change(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>){setForm({...form,[e.target.name]:e.target.value});}
  async function submit(e:React.FormEvent){e.preventDefault();setLoading(true);setError("");try{
    const address={...form,company:"",address_2:"",state:""};
    const r=await fetch("/api/store/checkout",{method:"POST",headers:{"Content-Type":"application/json",Nonce:nonce},body:JSON.stringify({billing_address:address,shipping_address:address,payment_method:method,payment_data:[]})});
    const data=await r.json();if(!r.ok)throw new Error(data.message||data?.errors?.[0]?.message||"Afrekenen is niet gelukt.");
    const redirect=data.payment_result?.redirect_url||data.redirect_url;
    if(redirect){window.location.assign(redirect);return;}
    if(data.order_id){setDone("Je bestelling is aangemaakt. Bestelnummer: "+data.order_id);return;}
    throw new Error("WooCommerce heeft geen betaal- of bevestigingslink teruggegeven.");
  }catch(e){setError(e instanceof Error?e.message:"Er ging iets mis.");}finally{setLoading(false);}}
  return <main className="content-page checkout-page"><div className="page-intro"><p className="eyebrow">BENDEMEN / SECURE CHECKOUT</p><h1>Afrekenen</h1></div>
    {done?<div className="empty-state"><h2>Bedankt voor je bestelling</h2><p>{done}</p></div>:<form className="checkout-form" onSubmit={submit}>
      <section><h2>Factuurgegevens</h2><div className="form-row"><label>Voornaam *<input name="first_name" required value={form.first_name} onChange={change}/></label><label>Achternaam *<input name="last_name" required value={form.last_name} onChange={change}/></label></div>
      <label>E-mailadres *<input type="email" name="email" required value={form.email} onChange={change}/></label><label>Telefoonnummer<input name="phone" value={form.phone} onChange={change}/></label>
      <label>Straat en huisnummer *<input name="address_1" required value={form.address_1} onChange={change}/></label><div className="form-row"><label>Postcode *<input name="postcode" required value={form.postcode} onChange={change}/></label><label>Plaats *<input name="city" required value={form.city} onChange={change}/></label></div>
      <label>Land<select name="country" value={form.country} onChange={change}><option value="NL">Nederland</option><option value="BE">België</option><option value="DE">Duitsland</option></select></label></section>
      <section><h2>Betaalmethode</h2>{methods.length?methods.map(m=><label className="payment-choice" key={m.id}><input type="radio" name="payment" value={m.id} checked={method===m.id} onChange={()=>setMethod(m.id)}/><span><strong>{m.title}</strong>{m.description&&<small>{m.description}</small>}</span></label>):<p>Betaalmethoden laden...</p>}</section>
      {error&&<p className="form-error" role="alert">{error}</p>}
      <p className="form-note">Door je bestelling te plaatsen ga je akkoord met de <Link href="/algemene-voorwaarden">algemene voorwaarden</Link> en het <Link href="/privacyverklaring-eu">privacybeleid</Link>.</p>
      <button className="button button-dark" disabled={loading||!method}>{loading?"Bestelling verwerken...":"Bestelling plaatsen"}</button>
    </form>}</main>;
}
