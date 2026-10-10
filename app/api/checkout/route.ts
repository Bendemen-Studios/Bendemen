import {NextRequest,NextResponse} from "next/server";
import {getProduct,wooFetch} from "@/lib/woocommerce";
import {createMolliePayment} from "@/lib/mollie";
type Order={id:number;number:string;order_key:string;total:string};
const emailOk=(v:unknown):v is string=>typeof v==="string"&&v.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export async function POST(req:NextRequest){
 try{
  const body=await req.json();const items=body.items;const email=body.email;
  const fields=["firstName","lastName","address","postcode","city"];
  if(!Array.isArray(items)||items.length<1||items.length>30||!emailOk(email)||fields.some(k=>typeof body[k]!=="string"||!body[k].trim()||body[k].length>150))
   return NextResponse.json({error:"Controleer je winkelwagen en verplichte gegevens."},{status:400});
  if(items.some((i:any)=>!Number.isInteger(i.productId)||!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>99))
   return NextResponse.json({error:"Een product of aantal is ongeldig."},{status:400});
  const line_items=[];
  for(const item of items){const p=await getProduct(item.productId);if(!p.purchasable||p.stock_status!=="instock")return NextResponse.json({error:p.name+" is niet beschikbaar."},{status:409});line_items.push({product_id:p.id,quantity:item.quantity});}
  const billing={first_name:body.firstName.trim(),last_name:body.lastName.trim(),address_1:body.address.trim(),postcode:body.postcode.trim(),city:body.city.trim(),country:"NL",email};
  const order=await wooFetch<Order>("orders",{method:"POST",body:JSON.stringify({status:"pending",set_paid:false,currency:"EUR",billing,shipping:{...billing,email:undefined},line_items,customer_note:"Bestelling via de Bendemen headless webshop."})});
  const payment=await createMolliePayment({amount:order.total,description:"Bendemen bestelling "+order.number,orderId:order.id,orderKey:order.order_key,email});
  await wooFetch("orders/"+order.id,{method:"PUT",body:JSON.stringify({meta_data:[{key:"_bendemen_mollie_payment_id",value:payment.id}]})});
  return NextResponse.json({checkoutUrl:payment.checkoutUrl});
 }catch(e){console.error("Checkout failed",e instanceof Error?e.message:"unknown");return NextResponse.json({error:"Afrekenen lukt nu niet. Probeer het opnieuw."},{status:502});}
}
