import Link from "next/link";
import { getMolliePayment } from "@/lib/mollie";
import { wooFetch } from "@/lib/woocommerce";

export const dynamic = "force-dynamic";

type WooOrder = {
  id: number; number: string; order_key: string; status: string;
  meta_data?: { key: string; value: unknown }[];
};

export default async function PaymentReturn({ searchParams }: { searchParams: Promise<{ order?: string; key?: string }> }) {
  const params = await searchParams;
  let order: WooOrder | undefined;
  let paymentStatus = "";
  let problem = false;
  if (params.order && /^\d+$/.test(params.order) && params.key && params.key.length < 200) {
    try {
      const candidate = await wooFetch<WooOrder>("orders/" + Number(params.order));
      if (candidate.order_key === params.key) {
        order = candidate;
        const paymentId = candidate.meta_data?.find((item) => item.key === "bendemen_mollie_payment_id")?.value;
        if (typeof paymentId === "string" && /^tr_[A-Za-z0-9]+$/.test(paymentId)) {
          try { paymentStatus = (await getMolliePayment(paymentId)).status; } catch { paymentStatus = ""; }
        }
      }
    } catch { problem = true; }
  }
  const paid = paymentStatus === "paid" || (!!order && ["processing", "completed"].includes(order.status));
  const failed = ["canceled", "expired", "failed"].includes(paymentStatus) || (!!order && order.status === "failed");
  const title = paid ? "Betaling gelukt." : failed ? "Betaling niet afgerond." : "Je betaling wordt gecontroleerd.";
  const description = paid
    ? "Bedankt voor je bestelling. Je betaling is bevestigd en je bestelling wordt door Bendemen verwerkt."
    : failed
      ? "De betaling is niet afgerond. Je kunt teruggaan naar de shop en het opnieuw proberen. Als er toch geld is afgeschreven, neem dan contact op."
      : problem || !order
        ? "We konden je bestelling niet direct ophalen. Controleer je bevestigingsmail of probeer het later opnieuw."
        : "Mollie heeft je teruggestuurd. De definitieve betaalstatus wordt veilig bij Mollie gecontroleerd en kan enkele momenten nodig hebben.";
  return <main className="status-card">
    <Link className="wordmark" href="/">BENDEMEN<span>®</span></Link>
    <span className="eyebrow">{paid ? "BETALING BEVESTIGD" : failed ? "BETALING NIET VOLTOOID" : "BESTELLINGSCONTROLE"}</span>
    <h1>{title}</h1>
    <p>{description}</p>
    {order && <p className="order-reference">Bestelnummer: <strong>{order.number}</strong></p>}
    {!paid && !failed && <p className="status-hint">Je hoeft niet opnieuw te betalen zolang de status nog wordt gecontroleerd. Vernieuw deze pagina over een paar momenten.</p>}
    <div className="status-actions">
      <Link className="button" href="/shop">{paid ? "Verder winkelen ↗" : failed ? "Opnieuw naar de shop →" : "Terug naar de shop →"}</Link>
      {!paid && !failed && <Link className="under-link" href="/winkelwagen">Naar winkelwagen</Link>}
    </div>
  </main>;
}
