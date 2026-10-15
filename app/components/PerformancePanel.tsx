"use client";

import { useState } from "react";

type VitalsResult = {
  target: string;
  strategy: "mobile" | "desktop";
  checkedAt: string;
  performanceScore: number | null;
  fieldDataAvailable: boolean;
  metrics: {
    lcpMs: number | null;
    inpMs: number | null;
    cls: number | null;
    fcpMs: number | null;
    ttfbMs: number | null;
  };
  note?: string;
};

function displayMs(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("nl-NL") + " ms";
}

function displayCls(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("nl-NL", { maximumFractionDigits: 3 });
}

export default function PerformancePanel() {
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");
  const [result, setResult] = useState<VitalsResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function measure() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/vitals?strategy=" + strategy, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "De meting is mislukt.");
      setResult(data as VitalsResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "De meting is mislukt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="performance-panel" id="vitals">
      <div className="eyebrow">GOOGLE PAGESPEED INSIGHTS</div>
      <h2>Core Web Vitals & snelheid</h2>
      <p>Start een Lighthouse-test voor de openbare website. Veldgegevens worden alleen getoond als Google voldoende echte gebruikersdata beschikbaar heeft. Dit is een diagnose; de test wijzigt niets aan WordPress.</p>
      <div className="performance-actions">
        <select aria-label="Meetapparaat" value={strategy} onChange={(event) => setStrategy(event.target.value as "mobile" | "desktop")} style={{ background: "#101010", color: "#fff", border: "1px solid #555", borderRadius: 7, padding: "10px" }}>
          <option value="mobile">Mobiel</option>
          <option value="desktop">Desktop</option>
        </select>
        <button className="booster-button" type="button" onClick={measure} disabled={loading}>{loading ? "Meting bezig…" : "Voer snelheidsmeting uit"}</button>
      </div>
      {error && <p role="alert">{error}</p>}
      {result && <>
        <div className="vitals-grid">
          <article className="vital-item"><div className="vital-name">Lighthouse performance</div><div className="vital-value">{result.performanceScore === null ? "—" : result.performanceScore + "/100"}</div><div className="vital-detail">Labscore · {result.strategy}</div></article>
          <article className="vital-item"><div className="vital-name">LCP · grootste content</div><div className="vital-value">{displayMs(result.metrics.lcpMs)}</div><div className="vital-detail">Goed ≤ 2.500 ms</div></article>
          <article className="vital-item"><div className="vital-name">INP · interactie</div><div className="vital-value">{displayMs(result.metrics.inpMs)}</div><div className="vital-detail">Goed ≤ 200 ms · alleen beschikbaar met velddata</div></article>
          <article className="vital-item"><div className="vital-name">CLS · visuele stabiliteit</div><div className="vital-value">{displayCls(result.metrics.cls)}</div><div className="vital-detail">Goed ≤ 0,1</div></article>
          <article className="vital-item"><div className="vital-name">First Contentful Paint</div><div className="vital-value">{displayMs(result.metrics.fcpMs)}</div><div className="vital-detail">Labmeting</div></article>
          <article className="vital-item"><div className="vital-name">Time to First Byte</div><div className="vital-value">{displayMs(result.metrics.ttfbMs)}</div><div className="vital-detail">Labmeting; beïnvloed door hosting en caching</div></article>
        </div>
        <p>{result.fieldDataAvailable ? "Google heeft velddata voor deze URL beschikbaar." : "Geen bruikbare Core Web Vitals-velddata voor deze URL. Labmetingen zijn wel beschikbaar; gebruik echte gebruikersdata zodra die beschikbaar is."}</p>
        <div className="vital-detail">Laatste test: {new Date(result.checkedAt).toLocaleString("nl-NL")} · {result.target}</div>
      </>}
    </section>
  );
}
