'use client';
import {useState} from "react";
import {ShoppingBag,Check} from "lucide-react";
import Link from "next/link";
type Product={id:number;name:string;price:string;image:string};
export default function ProductActions({product,disabled}:{product:Product;disabled:boolean}){
 const [added,setAdded]=useState(false);
 function add(){const key="bendemen-cart";const items=JSON.parse(localStorage.getItem(key)||"[]") as (Product&{quantity:number})[];const item=items.find(x=>x.id===product.id);if(item)item.quantity=Math.min(99,item.quantity+1);else items.push({...product,quantity:1});localStorage.setItem(key,JSON.stringify(items));setAdded(true);}
 return <div style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}><button className="button" disabled={disabled} onClick={add}><ShoppingBag size={16}/>{disabled?"Niet beschikbaar":added?"Toegevoegd":"Voeg toe aan winkelwagen"}</button>{added&&<Link className="under-link" href="/winkelwagen">Bekijk winkelwagen ↗</Link>}</div>;
}
