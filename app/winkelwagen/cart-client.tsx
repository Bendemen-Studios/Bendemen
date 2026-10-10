'use client';
import Link from "next/link";import {useEffect,useState} from "react";
type Item={id:number;name:string;price:string;image:string;quantity:number};
const money=(n:number)=>new Intl.NumberFormat("nl-NL",{style:"currency",currency:"EUR"}).format(n);
export default function CartClient(){const [items,setItems]=useState<Item[]>([]);
useEffect(()=>{try{setItems(JSON.parse(localStorage.getItem("bendemen-cart")||"[]"))}catch{}},[]);
function save(next:Item[]){setItems(next);localStorage.setItem("bendemen-cart",JSON.stringify(next))}
const total=items.reduce((s,i)=>s+Number(i.price)*i.quantity,0);
return items.length?<><div style={{borderTop:"1px solid #e4e5de"}}>{items.map(i=><div key={i.id} style={{display:"flex",alignItems:"center",gap:18,padding:"18px 0",borderBottom:"1px solid #e4e5de"}}><div style={{width:75,height:80,background:"#e9eae2"}}>{i.image&&<img src={i.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}</div><div style={{flex:1}}><b>{i.name}</b><p>{money(Number(i.price))}</p><button onClick={()=>save(items.map(x=>x.id===i.id?{...x,quantity:Math.max(1,x.quantity-1)}:x))}>−</button> {i.quantity} <button onClick={()=>save(items.map(x=>x.id===i.id?{...x,quantity:Math.min(99,x.quantity+1)}:x))}>+</button></div><b>{money(Number(i.price)*i.quantity)}</b><button onClick={()=>save(items.filter(x=>x.id!==i.id))} aria-label="Verwijderen">×</button></div>)}</div><div style={{maxWidth:400,margin:"25px 0 70px auto"}}><p>Subtotaal <b style={{float:"right"}}>{money(total)}</b></p><p style={{fontSize:11,color:"#777a72"}}>Definitieve verzendkosten en belasting worden door WooCommerce berekend.</p><Link className="button" href="/afrekenen">Verder naar afrekenen →</Link></div></>:<div className="empty-products"><h3>Je winkelwagen is nog leeg.</h3><p>Ontdek de collectie en voeg je favoriete producten toe.</p><Link className="button" href="/shop">Naar de shop →</Link></div>
}
