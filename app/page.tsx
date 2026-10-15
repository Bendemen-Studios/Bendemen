import PerformancePanel from "./components/PerformancePanel";

const modules = [
  { n: "01", title: "Performance", text: "PageSpeed-metingen, responstijden en Core Web Vitals." },
  { n: "02", title: "WooCommerce", text: "Cachingdiagnose met uitsluiting van winkelmand, checkout en accounts." },
  { n: "03", title: "Integraties", text: "WordPress-connector, object cache en paginacache-status." },
  { n: "04", title: "Beveiliging", text: "Read-only diagnose; geen wijzigingen aan orders, betalingen of klantdata." },
];

export default function DashboardPage() {
  return <main className="shell">
    <aside className="sidebar">
      <a className="brand" href="/"><span className="brand-mark">B</span><span>BENDEMEN<small>BOOSTER</small></span></a>
      <div className="nav-label">WERKRUIMTE</div>
      <a className="nav-item active" href="/">◈　Overzicht</a>
      <a className="nav-item" href="#performance">⌁　Prestaties</a>
      <a className="nav-item" href="#woocommerce">▦　WooCommerce</a>
      <a className="nav-item" href="#integrations">⟷　Integraties</a>
      <div className="sidebar-bottom"><i/>Diagnose en veilige optimalisatie</div>
    </aside>
    <section className="main-area">
      <header className="topbar"><div><span className="crumb">BENDEMEN /</span> Booster dashboard</div><div className="top-right"><span className="env-chip">LIVE DIAGNOSE</span><span className="avatar">B</span></div></header>
      <div className="content">
        <div className="intro"><div><div className="eyebrow">CENTRAAL BEHEER</div><h1>Websiteprestaties<span>.</span></h1><p>Meet echte prestaties en ontdek welke cachelaag nog ontbreekt.</p></div><div className="date-chip"><i/> Geen wijzigingen zonder controle</div></div>
        <div className="notice"><span className="notice-icon">i</span><div><strong>Veilige WooCommerce-aanpak</strong><p>Publieke pagina's kunnen worden gecachet. Winkelmand, checkout, account, ingelogde sessies en gepersonaliseerde inhoud moeten altijd buiten de paginacache blijven. Afbeeldingsoptimalisatie blijft bij Smush.</p></div></div>
        <div className="metrics-grid" id="performance">
          <article className="metric-card"><div className="metric-label">PageSpeed Insights <span>↗</span></div><div className="metric-value">Lighthouse</div><div className="metric-foot">Mobiel en desktop op aanvraag</div></article>
          <article className="metric-card"><div className="metric-label">Core Web Vitals <span>◷</span></div><div className="metric-value">LCP · INP · CLS</div><div className="metric-foot">Velddata alleen indien beschikbaar</div></article>
          <article className="metric-card"><div className="metric-label">Full-page cache <span>▤</span></div><div className="metric-value state-value">Controleren</div><div className="metric-foot">WordPress/serverconfiguratie vereist</div></article>
          <article className="metric-card"><div className="metric-label">Object cache <span>◈</span></div><div className="metric-value state-value">Controleren</div><div className="metric-foot">Redis/Memcached persistent drop-in</div></article>
        </div>
        <PerformancePanel />
        <div className="section-heading" id="woocommerce"><div><div className="eyebrow">OPTIMALISATIE</div><h2>Veilige cachelagen</h2></div><span className="muted">GEEN GEGEVENS VERZINNEN</span></div>
        <div className="modules-grid">
          {modules.map(m => <article className="module-card" key={m.n} id={m.title === "Integraties" ? "integrations" : undefined}><div className="module-top"><span className="module-number">{m.n}</span><span className="module-arrow">↗</span></div><h3>{m.title}</h3><p>{m.text}</p><span className="module-status">{m.title === "Performance" ? "METING OP AANVRAAG" : m.title === "WooCommerce" ? "DYNAMISCHE PAGINA'S UITSLUITEN" : m.title === "Integraties" ? "STATUS VIA CONNECTOR" : "READ-ONLY"}</span></article>)}
        </div>
        <footer className="footer"><span>BENDEMEN BOOSTER · VEILIGE BEHEERLAAG</span><span>Poort 2003</span></footer>
      </div>
    </section>
  </main>;
}
