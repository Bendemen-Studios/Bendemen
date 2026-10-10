type Payment={id:string;status:string;_links?:{checkout?:{href:string}};metadata?:{woo_order_id?:number;woo_order_key?:string}};
export async function createMolliePayment(input:{amount:string;description:string;orderId:number;orderKey:string;email:string}){
 const key=process.env.MOLLIE_API_KEY,site=process.env.NEXT_PUBLIC_SITE_URL,webhookUrl=process.env.MOLLIE_WEBHOOK_URL;
 if(!key||key.includes("replace_me")||!site||!webhookUrl)throw new Error("Mollie is not configured");
 const response=await fetch("https://api.mollie.com/v2/payments",{method:"POST",headers:{Authorization:"Bearer "+key,"Content-Type":"application/json","Idempotency-Key":"bendemen-order-"+input.orderId},body:JSON.stringify({
 amount:{currency:"EUR",value:Number(input.amount).toFixed(2)},description:input.description.slice(0,255),
 redirectUrl:site+"/betaling/terug?order="+input.orderId+"&key="+encodeURIComponent(input.orderKey),
 webhookUrl,metadata:{woo_order_id:input.orderId,woo_order_key:input.orderKey}
 }),cache:"no-store"});
 const data=await response.json();if(!response.ok)throw new Error("Mollie API "+response.status);
 const payment=data as Payment;const checkoutUrl=payment._links?.checkout?.href;
 if(!checkoutUrl)throw new Error("Mollie returned no checkout URL");
 return {id:payment.id,checkoutUrl};
}
export async function getMolliePayment(id:string):Promise<Payment>{
 const key=process.env.MOLLIE_API_KEY;if(!key)throw new Error("Mollie is not configured");
 const response=await fetch("https://api.mollie.com/v2/payments/"+encodeURIComponent(id),{headers:{Authorization:"Bearer "+key},cache:"no-store"});
 const data=await response.json();if(!response.ok)throw new Error("Mollie API "+response.status);return data;
}
