import {NextRequest,NextResponse} from "next/server";
import {getMolliePayment} from "@/lib/mollie";
import {wooFetch} from "@/lib/woocommerce";
type Order={id:number;order_key:string;status:string};
export async function POST(req:NextRequest){
 try{
  const form=await req.formData();const id=form.get("id");
  if(typeof id!=="string"||!/^tr_[A-Za-z0-9]+$/.test(id))return NextResponse.json({ok:true});
  const payment=await getMolliePayment(id);const orderId=Number(payment.metadata?.woo_order_id);const orderKey=payment.metadata?.woo_order_key;
  if(!Number.isInteger(orderId)||orderId<1||typeof orderKey!=="string")return NextResponse.json({ok:true});
  const order=await wooFetch<Order>("orders/"+orderId);if(order.order_key!==orderKey)return NextResponse.json({ok:true});
  if(payment.status==="paid"&&!["processing","completed"].includes(order.status)){
   await wooFetch("orders/"+orderId,{method:"PUT",body:JSON.stringify({status:"processing",set_paid:true,transaction_id:id})});
  }else if(["canceled","expired","failed"].includes(payment.status)&&order.status==="pending"){
   await wooFetch("orders/"+orderId,{method:"PUT",body:JSON.stringify({status:"failed",set_paid:false})});
  }
  return NextResponse.json({ok:true});
 }catch(e){console.error("Mollie webhook error",e instanceof Error?e.message:"unknown");return NextResponse.json({error:"Webhook tijdelijk niet verwerkt"},{status:500});}
}
