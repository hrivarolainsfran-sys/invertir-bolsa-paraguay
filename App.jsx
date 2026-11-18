
const { useState, useMemo, useEffect } = React;
const RC = window.Recharts;
const Lucide = window.LucideReact || {};
const Icon = ({ name, className = "w-5 h-5", ...rest }) => {
  const C = Lucide[name];
  return C ? <C className={className} aria-hidden="true" {...rest} /> : <span className={className} />;
};

/* ---------- utilidades ---------- */
const fmtMoney = (v, cur) => {
  if (!isFinite(v)) v = 0;
  if (cur === "PYG") return "Gs. " + Math.round(v).toLocaleString("es-PY");
  return "US$ " + v.toLocaleString("es-PY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const fmtShort = (v, cur) => {
  const p = cur === "PYG" ? "Gs. " : "US$ ";
  if (Math.abs(v) >= 1e9) return p + (v / 1e9).toLocaleString("es-PY", { maximumFractionDigits: 1 }) + " mil M";
  if (Math.abs(v) >= 1e6) return p + (v / 1e6).toLocaleString("es-PY", { maximumFractionDigits: 1 }) + " M";
  if (Math.abs(v) >= 1e3) return p + (v / 1e3).toLocaleString("es-PY", { maximumFractionDigits: 0 }) + " mil";
  return p + Math.round(v);
};
const scrollTo = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };

/* ---------- datos ---------- */
const NAV = [
  ["ecosistema", "Cómo funciona"], ["guia", "Paso a paso"], ["casas", "Casas de Bolsa"],
  ["instrumentos", "Instrumentos"], ["simulador", "Simulador"], ["perfil", "Mi perfil"], ["glosario", "Glosario y FAQ"],
];

const REF_RATES = [
  { k: "Fondos mutuos", pyg: "5 – 7 %", usd: "3 – 4,5 %" },
  { k: "CDA (1 a 3 años)", pyg: "6,5 – 8,5 %", usd: "4,5 – 6 %" },
  { k: "Bonos corporativos", pyg: "8 – 10,5 %", usd: "6 – 8 %" },
  { k: "Bonos del Tesoro", pyg: "7,5 – 9 %", usd: "—" },
];

const INSTRUMENTS = [
  {
    id: "fm", name: "Fondo Mutuo", family: "Fondos", icon: "PieChart", risk: "Bajo", liquidity: "Alta", currencies: ["PYG", "USD"],
    term: "Sin plazo fijo", min: "Desde Gs. 100.000 o US$ 100 aprox.", ratePYG: 6, rateUSD: 3.8,
    summary: "Un patrimonio común que reúne el dinero de muchos inversores y lo administra una Administradora de Fondos (AFPISA). Comprás cuotas y podés rescatarlas cuando quieras, normalmente en 24 a 72 horas.",
    points: ["Las cuotas son rescatables a la vista: entrás y salís sin esperar un vencimiento.", "Diversificación inmediata: con poco dinero quedás expuesto a CDA, bonos y depósitos de muchos emisores.", "El rendimiento no está garantizado: varía con el valor de la cuota día a día.", "Ideal como primer paso o para tu fondo de emergencia."],
  },
  {
    id: "fi", name: "Fondo de Inversión", family: "Fondos", icon: "Briefcase", risk: "Medio", liquidity: "Baja", currencies: ["PYG", "USD"],
    term: "Plazo definido (1 a 10 años)", min: "Varía según el reglamento del fondo", ratePYG: 9, rateUSD: 6.5,
    summary: "También reúne el dinero de varios inversores, pero sus cuotas no son rescatables: el dinero queda comprometido hasta el vencimiento del fondo o se vende la cuota a otro inversor en bolsa.",
    points: ["Cuotas no rescatables: no podés pedirle al fondo que te devuelva el dinero antes de tiempo.", "Suele invertir en activos de largo plazo (inmuebles, proyectos, deuda privada).", "Mayor rendimiento esperado a cambio de menor liquidez.", "Leé el reglamento interno: plazo, comisiones y política de inversión."],
  },
  {
    id: "cda", name: "CDA", family: "Renta fija", icon: "Landmark", risk: "Bajo", liquidity: "Media", currencies: ["PYG", "USD"],
    term: "6 meses a 5 años", min: "Desde Gs. 1.000.000 o US$ 1.000 aprox.", ratePYG: 7.5, rateUSD: 5.2,
    summary: "El Certificado de Depósito de Ahorro es un plazo fijo emitido por un banco o financiera. Prestás tu dinero a la entidad por un plazo y te paga una tasa pactada, en cuotas de interés o al vencimiento.",
    points: ["En el banco lo comprás nuevo (mercado primario) y en general esperás al vencimiento.", "En bolsa podés comprar CDA de otros inversores (mercado secundario), a veces con mejor tasa, o vender el tuyo antes de vencer a través de tu Casa de Bolsa.", "El Fondo de Garantía de Depósitos (FGD) del BCP cubre depósitos en entidades reguladas hasta 75 salarios mínimos por persona y por entidad. Consultá con tu Casa de Bolsa cómo aplica a un CDA comprado en bolsa.", "Riesgo principal: la solvencia de la entidad emisora. Revisá su calificación."],
  },
  {
    id: "bc", name: "Bono corporativo", family: "Renta fija", icon: "FileText", risk: "Medio", liquidity: "Media", currencies: ["PYG", "USD"],
    term: "2 a 10 años", min: "Desde Gs. 1.000.000 o US$ 1.000 (valor nominal)", ratePYG: 9.5, rateUSD: 7,
    summary: "Le prestás dinero a una empresa privada (o banco) que emite deuda en bolsa. A cambio cobrás intereses periódicos (cupones) y al vencimiento te devuelven el capital.",
    points: ["Renta fija: la tasa y el calendario de pagos se conocen desde el inicio.", "Cupones mensuales, trimestrales o semestrales según el prospecto.", "La calificación de riesgo (AAApy, AApy, Apy, BBBpy…) te indica la capacidad de pago del emisor.", "A mayor riesgo del emisor, mayor tasa ofrecida. No hay garantía del FGD."],
  },
  {
    id: "bt", name: "Bono del Tesoro", family: "Renta fija", icon: "ShieldCheck", risk: "Bajo", liquidity: "Media", currencies: ["PYG"],
    term: "3 a 15 años", min: "Desde Gs. 1.000.000 (valor nominal) aprox.", ratePYG: 8.5, rateUSD: 5.5,
    summary: "Deuda emitida por el Estado paraguayo a través del Ministerio de Economía y Finanzas para financiar el presupuesto. Se coloca en el mercado local y luego se negocia en bolsa.",
    points: ["Emisor soberano: considerado el riesgo más bajo del mercado local.", "Paga cupones periódicos y devuelve el capital al vencimiento.", "Plazos más largos que la mayoría de los CDA.", "Su precio en el mercado secundario puede subir o bajar si cambian las tasas."],
  },
  {
    id: "ao", name: "Acciones ordinarias", family: "Renta variable", icon: "TrendingUp", risk: "Alto", liquidity: "Baja", currencies: ["PYG"],
    term: "Sin vencimiento (largo plazo)", min: "Según precio de la acción y lote mínimo", ratePYG: 11, rateUSD: 8,
    summary: "Comprar una acción te convierte en socio de la empresa. Ganás si la empresa reparte dividendos o si la acción sube de precio, y asumís pérdidas si le va mal.",
    points: ["Dan derecho a voto en la asamblea de accionistas.", "Los dividendos dependen de las utilidades y de lo que decida la asamblea: no están asegurados.", "El mercado local de acciones es poco profundo: puede costar encontrar comprador rápido.", "Pensalas a 5 años o más y solo con dinero que no vas a necesitar."],
  },
  {
    id: "ap", name: "Acciones preferidas", family: "Renta variable", icon: "Star", risk: "Medio", liquidity: "Baja", currencies: ["PYG", "USD"],
    term: "Sin vencimiento o rescatables", min: "Según precio y lote mínimo", ratePYG: 9.5, rateUSD: 7,
    summary: "Muy comunes en el mercado paraguayo. Tienen características mixtas: suelen pagar un dividendo preferente (a veces con un mínimo fijo), cobran antes que las ordinarias y, en general, no tienen voto.",
    points: ["Se parecen a un bono por su dividendo más previsible, pero siguen siendo capital de la empresa.", "Algunas emisiones prevén rescate por parte de la empresa en una fecha determinada.", "Si la empresa no tiene utilidades, el dividendo puede no pagarse (salvo que sea acumulativo).", "Leé el prospecto: tipo de preferencia, rescate y condiciones de pago."],
  },
  {
    id: "rep", name: "Reporto (Repo)", family: "Otros", icon: "Repeat", risk: "Bajo", liquidity: "Alta", currencies: ["PYG", "USD"],
    term: "De días a pocos meses", min: "Según la operación", ratePYG: 6, rateUSD: 4,
    summary: "Operación de corto plazo: una parte vende un título (por ejemplo, un bono) y se compromete a recomprarlo en una fecha y precio pactados. Para quien pone el dinero funciona como una colocación de corto plazo garantizada por el título.",
    points: ["Sirve para colocar excedentes de liquidez por pocos días o semanas.", "El título funciona como garantía de la operación.", "Rendimiento conocido desde el inicio.", "Habitual entre inversores institucionales y empresas; consultá disponibilidad para personas."],
  },
  {
    id: "fut", name: "Futuro de divisas", family: "Otros", icon: "Scale", risk: "Alto", liquidity: "Media", currencies: ["PYG", "USD"],
    term: "Contratos a fecha futura", min: "Margen de garantía exigido", ratePYG: 0, rateUSD: 0,
    summary: "Contrato para comprar o vender dólares a un tipo de cambio fijado hoy, con liquidación en una fecha futura. Su uso principal es la cobertura: protegerse de una suba o baja del dólar.",
    points: ["Útil para importadores, exportadores o quien tiene deudas en otra moneda.", "No es una inversión para obtener renta: es una herramienta de protección.", "Exige depositar márgenes de garantía y seguir el contrato a diario.", "Usado con fines especulativos puede generar pérdidas mayores a lo esperado."],
  },
];

const RISK_STYLE = {
  Bajo: "bg-emsoft text-em",
  Medio: "bg-ambersoft text-amber",
  Alto: "bg-dangersoft text-danger",
};

const BROKERS = [
  { name: "Avalon Casa de Bolsa", tag: "Independiente", focus: "Asesoría personalizada y renta fija" },
  { name: "Cadiem Casa de Bolsa", tag: "Independiente", focus: "Renta fija, fondos y finanzas corporativas" },
  { name: "Investor Casa de Bolsa", tag: "Independiente", focus: "Bonos, CDA y estructuración de emisiones" },
  { name: "Itaú Invest Casa de Bolsa", tag: "Grupo bancario", focus: "Clientes del banco y canales digitales" },
  { name: "Puente Casa de Bolsa", tag: "Grupo regional", focus: "Inversiones locales y regionales" },
  { name: "Capital Markets Casa de Bolsa", tag: "Independiente", focus: "Mercado de capitales y asesoría" },
  { name: "Sudameris Securities", tag: "Grupo bancario", focus: "Clientes del banco y renta fija" },
  { name: "Atlas Casa de Bolsa", tag: "Grupo bancario", focus: "Productos bursátiles para clientes del grupo" },
  { name: "Basa Capital Casa de Bolsa", tag: "Grupo bancario", focus: "Renta fija y operaciones bursátiles" },
  { name: "ueno Casa de Bolsa", tag: "Grupo bancario", focus: "Inversión 100 % digital desde la app" },
];

const GLOSSARY = [
  ["Renta fija", "Inversión en la que conocés de antemano la tasa y el calendario de pagos, como un CDA o un bono. El riesgo está en que el emisor no pueda pagar."],
  ["Renta variable", "Inversión cuyo resultado no se conoce de antemano, como las acciones. Depende de cómo le vaya a la empresa y del precio en el mercado."],
  ["Cupón", "Cada pago periódico de intereses de un bono. Un bono de Gs. 10.000.000 al 9 % con cupón semestral paga Gs. 450.000 cada seis meses."],
  ["Calificación de riesgo", "Nota que otorga una calificadora autorizada (por ejemplo AAApy, AApy, Apy, BBBpy) sobre la capacidad de un emisor de pagar sus deudas. El sufijo «py» indica que es una escala local paraguaya."],
  ["Cuenta comitente", "La cuenta que abrís en una Casa de Bolsa a tu nombre. Ahí quedan registrados tus títulos y el dinero de tus operaciones."],
  ["Liquidez", "Facilidad y rapidez con la que podés convertir una inversión en efectivo sin perder valor. Un fondo mutuo tiene alta liquidez; una acción local poco negociada, baja."],
  ["Mercado secundario", "Donde los inversores compran y venden entre sí títulos que ya fueron emitidos. Te permite salir de una inversión antes del vencimiento si hay comprador."],
  ["Mercado primario", "Donde un emisor coloca títulos nuevos por primera vez. El dinero que pagás va directamente al emisor."],
  ["ISIN", "Código internacional de 12 caracteres que identifica de forma única a cada título valor. Los títulos paraguayos comienzan con «PY»."],
  ["Dividendo", "Parte de las utilidades de una empresa que se reparte entre sus accionistas, por decisión de la asamblea."],
  ["Reporto", "Venta de un título con el compromiso de recomprarlo en una fecha y precio pactados. Funciona como un préstamo de corto plazo garantizado por el título."],
  ["Prospecto", "Documento oficial de una emisión con todas sus condiciones: tasa, plazo, garantías, calendario de pagos y riesgos."],
  ["Valor nominal", "El monto que figura en el título y sobre el cual se calculan los intereses. El precio de mercado puede ser mayor o menor."],
  ["Custodia", "Servicio de guarda y registro de tus títulos. En Paraguay la realiza la BVA como depositaria y se refleja en tu cuenta comitente."],
];

const FAQ = [
  ["¿Desde cuánto dinero puedo invertir?", "Con los fondos mutuos podés empezar con montos pequeños, en muchos casos desde Gs. 100.000 o US$ 100. Para comprar bonos o CDA en bolsa el mínimo suele ser el valor nominal de un título, a menudo Gs. 1.000.000 o US$ 1.000. Cada Casa de Bolsa y cada emisión fija sus propios mínimos."],
  ["¿Es seguro invertir en la bolsa?", "El mercado está regulado por la Superintendencia de Valores del BCP, las Casas de Bolsa deben estar autorizadas y tus títulos quedan registrados a tu nombre. Eso no elimina el riesgo de inversión: un emisor puede atrasarse en sus pagos o una acción puede bajar de precio. Diversificá, revisá calificaciones y operá solo con entidades habilitadas."],
  ["¿Qué impuestos pagan las inversiones?", "En Paraguay, las rentas de capital de las personas físicas (intereses, dividendos, ganancias por venta de títulos) están alcanzadas, en general, por el Impuesto a la Renta Personal (IRP) en la categoría de rentas y ganancias de capital, con una tasa del 8 %. La ley prevé exenciones y tratamientos especiales según el instrumento, y para los dividendos existen retenciones específicas. Las reglas cambian: confirmá tu caso con un contador o en la DNIT."],
  ["¿Puedo retirar mi dinero antes del vencimiento?", "Depende del instrumento. En un fondo mutuo rescatás tus cuotas cuando quieras. Un bono o un CDA comprado en bolsa podés venderlo en el mercado secundario a través de tu Casa de Bolsa, pero el precio dependerá de las tasas del momento y de que aparezca un comprador. Las cuotas de un fondo de inversión no son rescatables."],
  ["¿Se puede invertir desde el interior del país o el exterior?", "Sí. Muchas Casas de Bolsa permiten abrir la cuenta de forma remota, enviar documentos en formato digital, operar por app o con un asesor por teléfono y transferir fondos vía SIPAP desde cualquier banco del país. Los paraguayos residentes en el exterior y los extranjeros también pueden invertir, cumpliendo requisitos adicionales de identificación y origen de fondos."],
  ["¿Cuánto cobra una Casa de Bolsa?", "Cobran una comisión de corretaje por cada operación, que suele ser un porcentaje pequeño del monto negociado, más los aranceles de la bolsa. Algunas cobran por custodia. Pedí siempre el tarifario completo antes de abrir la cuenta."],
];

/* ---------- componentes base ---------- */
const Section = ({ id, eyebrow, title, intro, children, alt }) => (
  <section id={id} className={(alt ? "bg-card border-y border-line " : "") + "py-16 sm:py-20"}>
    <div className="wrap">
      <div className="mb-10 prose-w">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-3xl sm:text-4xl font-bold text-ink">{title}</h2>
        {intro && <p className="mt-4 text-muted text-lg">{intro}</p>}
      </div>
      {children}
    </div>
  </section>
);

const Pill = ({ children, className = "" }) => (
  <span className={"inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap " + className}>{children}</span>
);

const Notice = ({ children, tone = "amber" }) => (
  <div className={"flex gap-3 rounded-xl border p-4 text-sm " + (tone === "amber" ? "bg-ambersoft border-amber/30 text-ink" : "bg-emsoft border-em/30 text-ink")}>
    <Icon name={tone === "amber" ? "AlertTriangle" : "Info"} className={"w-5 h-5 shrink-0 mt-0.5 " + (tone === "amber" ? "text-amber" : "text-em")} />
    <div className="min-w-0">{children}</div>
  </div>
);

const Segmented = ({ options, value, onChange, label, idBase }) => (
  <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-soft p-1 border border-line">
    {options.map(([v, l]) => (
      <button key={v} id={idBase + "-" + v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
        className={"px-3 py-1.5 text-sm font-semibold rounded-md transition " + (value === v ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink")}>
        {l}
      </button>
    ))}
  </div>
);

/* ---------- navegación ---------- */
function Nav() {
  const [open, setOpen] = useState(false);
  const go = (id) => { setOpen(false); scrollTo(id); };
  return (
    <header className="sticky z-50 bg-card/90 backdrop-blur border-b border-line" style={{ top: "env(safe-area-inset-top, 0px)" }}>
      <div className="wrap flex items-center justify-between h-16 gap-4">
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2 font-display font-extrabold text-ink">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-navy text-navyfg"><Icon name="TrendingUp" className="w-4 h-4" /></span>
          <span>Bolsa<span className="text-em">PY</span> Aprende</span>
        </button>
        <nav className="hidden lg:flex items-center gap-1" aria-label="Secciones">
          {NAV.map(([id, l]) => (
            <button key={id} onClick={() => go(id)} className="px-3 py-2 text-sm font-medium text-muted hover:text-ink rounded-md hover:bg-soft transition">{l}</button>
          ))}
        </nav>
        <button className="lg:hidden p-2 rounded-md text-ink hover:bg-soft" aria-label={open ? "Cerrar menú" : "Abrir menú"} aria-expanded={open} onClick={() => setOpen(!open)}>
          <Icon name={open ? "X" : "Menu"} />
        </button>
      </div>
      {open && (
        <nav className="lg:hidden border-t border-line bg-card fade-in" aria-label="Secciones móvil">
          <div className="wrap py-2 grid">
            {NAV.map(([id, l]) => (
              <button key={id} onClick={() => go(id)} className="text-left px-2 py-3 text-ink font-medium border-b border-line last:border-0">{l}</button>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}

/* ---------- 1. hero ---------- */
function Hero() {
  const [cur, setCur] = useState("PYG");
  return (
    <section className="pt-12 pb-16 sm:pt-20 sm:pb-24">
      <div className="wrap grid lg:grid-cols-[1.15fr_1fr] gap-12 items-center">
        <div className="min-w-0">
          <Pill className="bg-emsoft text-em mb-5"><Icon name="BookOpen" className="w-3.5 h-3.5" /> Guía educativa gratuita</Pill>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-ink">
            Aprendé a invertir en la Bolsa de Paraguay <span className="text-em">desde cero</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted prose-w">
            No hace falta ser millonario. Con un fondo mutuo podés empezar con montos accesibles, en guaraníes o en dólares, y poner tus ahorros a trabajar en un mercado regulado por el Banco Central del Paraguay.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => scrollTo("guia")} className="inline-flex items-center gap-2 rounded-xl bg-em px-5 py-3 font-semibold text-white shadow-sm hover:brightness-110 active:scale-[.98] transition">
              Empezar la guía paso a paso <Icon name="ArrowRight" className="w-4 h-4" />
            </button>
            <button onClick={() => scrollTo("simulador")} className="inline-flex items-center gap-2 rounded-xl border border-line bg-card px-5 py-3 font-semibold text-ink hover:border-em hover:text-em transition">
              <Icon name="Calculator" className="w-4 h-4" /> Simular mi inversión
            </button>
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            {[["2", "monedas: PYG y USD"], ["5", "pasos para empezar"], ["9", "instrumentos explicados"]].map(([n, l]) => (
              <div key={l}><dt className="sr-only">{l}</dt><dd className="font-display text-2xl font-extrabold text-ink num">{n}</dd><p className="text-xs text-muted leading-snug">{l}</p></div>
            ))}
          </dl>
        </div>

        <div className="min-w-0 rounded-2xl bg-card border border-line shadow-xl shadow-navy/5 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Tasas anuales de referencia</p>
              <p className="font-display font-bold text-ink text-lg">Mercado paraguayo</p>
            </div>
            <Segmented idBase="hero-cur" label="Moneda" value={cur} onChange={setCur} options={[["PYG", "Gs."], ["USD", "US$"]]} />
          </div>
          <ul className="mt-5 divide-y divide-line">
            {REF_RATES.map((r) => (
              <li key={r.k} className="flex items-center justify-between py-3 gap-3">
                <span className="text-sm text-ink">{r.k}</span>
                <span className="num font-semibold text-em text-lg">{cur === "PYG" ? r.pyg : r.usd}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-xl bg-navy text-navyfg p-4">
            <p className="text-xs uppercase tracking-wider opacity-70">Ejemplo con Gs. 10.000.000 a 3 años</p>
            <div className="mt-1 flex items-end justify-between gap-2 flex-wrap">
              <p className="num font-display text-2xl font-bold">≈ Gs. 12.250.000</p>
              <p className="text-sm opacity-80">CDA al 7 % con reinversión</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted flex gap-1.5"><Icon name="Info" className="w-3.5 h-3.5 shrink-0 mt-0.5" />Rangos orientativos con fines educativos. Las tasas cambian cada semana: consultá las vigentes en tu Casa de Bolsa.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------- 2. ecosistema ---------- */
function Ecosistema() {
  const actors = [
    { icon: "Scale", title: "Superintendencia de Valores (SIV – BCP)", role: "Regula y supervisa", text: "Dependiente del Banco Central del Paraguay. Autoriza a las Casas de Bolsa, registra las emisiones y controla que se cumplan las reglas del mercado para proteger al inversor." },
    { icon: "Landmark", title: "Bolsa de Valores de Asunción (BVA)", role: "Donde se negocia", text: "Antes conocida como BVPASA. Es el mercado organizado donde se compran y venden los títulos, publica precios y emisiones, y registra la custodia de los valores." },
    { icon: "Building2", title: "Casas de Bolsa (C.B.S.A.)", role: "Intermediario obligatorio", text: "Solo ellas pueden operar en la bolsa. Te abren la cuenta, ejecutan tus órdenes de compra y venta, te asesoran y custodian tus títulos." },
    { icon: "Users", title: "Emisores e inversionistas", role: "Los protagonistas", text: "Empresas, bancos y el Estado emiten títulos para financiarse. Personas y empresas como vos ponen su capital a cambio de intereses, dividendos o ganancias." },
  ];
  const [mkt, setMkt] = useState("primario");
  return (
    <Section id="ecosistema" alt eyebrow="El ecosistema" title="¿Cómo funciona la Bolsa de Valores en Paraguay?"
      intro="La bolsa conecta a quienes necesitan financiamiento con quienes tienen ahorros. Cuatro actores hacen que eso funcione con reglas claras.">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actors.map((a) => (
          <article key={a.title} className="group rounded-2xl border border-line bg-bg p-5 hover:border-em/50 hover:-translate-y-0.5 transition">
            <span className="grid place-items-center w-11 h-11 rounded-xl bg-navy text-navyfg group-hover:bg-em transition"><Icon name={a.icon} /></span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-em">{a.role}</p>
            <h3 className="mt-1 font-bold text-ink text-lg">{a.title}</h3>
            <p className="mt-2 text-sm text-muted">{a.text}</p>
          </article>
        ))}
      </div>

      {/* flujo */}
      <div className="mt-8 rounded-2xl border border-line bg-bg p-5 overflow-x-auto">
        <p className="text-sm font-semibold text-ink mb-4">Cómo viaja tu dinero</p>
        <div className="flex items-center gap-2 min-w-[640px] text-sm">
          {["Vos (inversor)", "Tu Casa de Bolsa", "BVA (negociación)", "Emisor (empresa / Estado)"].map((s, i, arr) => (
            <React.Fragment key={s}>
              <div className={"flex-1 rounded-xl px-3 py-3 text-center font-semibold " + (i === 0 ? "bg-em text-white" : "bg-card border border-line text-ink")}>{s}</div>
              {i < arr.length - 1 && <Icon name="ArrowRight" className="w-4 h-4 text-muted shrink-0" />}
            </React.Fragment>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted min-w-[640px]">Todo el circuito está supervisado por la Superintendencia de Valores del BCP. A cambio de tu dinero recibís títulos registrados a tu nombre y, luego, intereses o dividendos.</p>
      </div>

      {/* primario vs secundario */}
      <div className="mt-8 grid lg:grid-cols-[280px_1fr] gap-6 items-start">
        <div>
          <h3 className="text-xl font-bold text-ink">Mercado primario y secundario</h3>
          <p className="mt-2 text-sm text-muted">Un mismo bono pasa por dos momentos de su vida. Elegí uno para ver la diferencia.</p>
          <div className="mt-4"><Segmented idBase="mkt" label="Tipo de mercado" value={mkt} onChange={setMkt} options={[["primario", "Primario"], ["secundario", "Secundario"]]} /></div>
        </div>
        <div key={mkt} className="fade-in rounded-2xl border border-line bg-bg p-6 grid sm:grid-cols-3 gap-5">
          {(mkt === "primario" ? [
            ["¿Qué pasa?", "El emisor coloca títulos nuevos por primera vez. Es el «estreno» del bono o la acción."],
            ["¿A quién le pagás?", "Tu dinero va directamente a la empresa o al Estado que emite."],
            ["Ejemplo", "Una cooperativa lanza bonos a 5 años al 9 % en Gs. y vos comprás en la colocación."],
          ] : [
            ["¿Qué pasa?", "Los inversores compran y venden entre sí títulos que ya existen."],
            ["¿A quién le pagás?", "A otro inversor que quiere vender. El emisor no recibe dinero nuevo."],
            ["Ejemplo", "Comprás a otro inversor un CDA al que le quedan 14 meses, o vendés tu bono antes de que venza."],
          ]).map(([t, d]) => (
            <div key={t}><p className="text-xs font-semibold uppercase tracking-wider text-em">{t}</p><p className="mt-1 text-ink text-sm">{d}</p></div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---------- 3. stepper ---------- */
const STEPS = [
  { icon: "Target", title: "Definí objetivo, plazo y moneda", body: "Antes de elegir un producto, respondé tres preguntas: ¿para qué invierto?, ¿cuándo voy a necesitar este dinero? y ¿en qué moneda lo voy a usar?",
    list: ["Fondo de emergencia o liquidez: fondo mutuo rescatable.", "Meta a 1–3 años (auto, viaje, estudios): CDA o bonos cortos.", "Largo plazo (jubilación, patrimonio): bonos largos, fondos de inversión y una parte en acciones.", "Si tus gastos son en guaraníes, invertí mayormente en PYG; si ahorrás para algo dolarizado, considerá USD."],
    tip: "Mantené siempre un fondo de emergencia de 3 a 6 meses de gastos fuera de inversiones de largo plazo." },
  { icon: "ShieldCheck", title: "Elegí una Casa de Bolsa habilitada", body: "Es tu puerta de entrada obligatoria a la bolsa. Antes de abrir cuenta, verificá que esté autorizada y comparala con otras.",
    list: ["Buscala en el registro de Casas de Bolsa de la Superintendencia de Valores (bcp.gov.py).", "Confirmá que figure como miembro de la BVA (bva.com.py).", "Pedí el tarifario: comisión de corretaje, custodia y otros costos.", "Probá su atención y su app antes de transferir dinero."],
    tip: "Desconfiá de cualquiera que te prometa rendimientos garantizados muy altos o te pida transferir a una cuenta personal." },
  { icon: "FileText", title: "Abrí tu cuenta comitente", body: "Es la cuenta a tu nombre donde se registran tus títulos y tu dinero. Muchas casas permiten hacerlo en línea en pocos días.",
    list: ["Cédula de identidad paraguaya vigente (o pasaporte si sos extranjero).", "Comprobante de ingresos u origen de fondos (liquidación de salario, facturas, declaraciones).", "Constancia de RUC si sos contribuyente.", "Formulario de perfil de inversionista y datos de tu cuenta bancaria."],
    tip: "El perfil de inversionista no es un trámite más: define qué productos te pueden ofrecer. Respondelo con sinceridad." },
  { icon: "Smartphone", title: "Transferí fondos y hacé tu primera compra", body: "Enviá dinero desde tu banco a la cuenta de la Casa de Bolsa y da la orden de compra con tu asesor o desde la app.",
    list: ["Transferí vía SIPAP o transferencia bancaria a la cuenta oficial de la Casa de Bolsa (nunca a cuentas personales).", "Pedile a tu asesor las opciones disponibles: tasa, plazo, emisor y calificación.", "Leé el prospecto o la ficha del producto antes de confirmar.", "Guardá el comprobante de operación que te envía la Casa de Bolsa."],
    tip: "Para tu primera inversión, un fondo mutuo o un CDA de una entidad bien calificada es una forma sencilla de aprender." },
  { icon: "RefreshCw", title: "Seguí tus pagos y reinvertí", body: "Invertir no termina con la compra. Revisá tu cuenta, cobrá tus cupones y decidí qué hacer con ellos.",
    list: ["Revisá el estado de cuenta mensual de tu Casa de Bolsa.", "Anotá fechas de cobro de cupones y vencimientos.", "Reinvertí los intereses para aprovechar el interés compuesto.", "Revisá tu cartera una o dos veces al año y ajustala a tus metas."],
    tip: "Seguí las calificaciones de riesgo de tus emisores: si bajan, conversá con tu asesor." },
];

function Stepper() {
  const [i, setI] = useState(0);
  const s = STEPS[i];
  return (
    <Section id="guia" eyebrow="Guía paso a paso" title="Cómo empezar a invertir desde cero"
      intro="Cinco pasos en orden. Tocá cada uno para ver qué hacer y qué tener en cuenta.">
      <ol className="grid grid-cols-5 gap-2 sm:gap-3 mb-6" aria-label="Pasos">
        {STEPS.map((st, k) => (
          <li key={k}>
            <button id={"step-" + k} onClick={() => setI(k)} aria-current={k === i ? "step" : undefined}
              className={"w-full text-left rounded-xl border p-2 sm:p-3 transition " + (k === i ? "border-em bg-emsoft" : k < i ? "border-line bg-card" : "border-line bg-card hover:border-em/50")}>
              <span className={"grid place-items-center w-8 h-8 rounded-full text-sm font-bold num " + (k < i ? "bg-em text-white" : k === i ? "bg-navy text-navyfg" : "bg-soft text-muted")}>
                {k < i ? <Icon name="Check" className="w-4 h-4" /> : k + 1}
              </span>
              <span className="hidden sm:block mt-2 text-sm font-semibold text-ink leading-snug">{st.title}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="h-1.5 rounded-full bg-soft mb-6 overflow-hidden"><div className="h-full bg-em transition-all duration-500" style={{ width: ((i + 1) / STEPS.length) * 100 + "%" }} /></div>

      <article key={i} className="fade-in rounded-2xl bg-card border border-line p-6 sm:p-8 grid lg:grid-cols-[1fr_320px] gap-8">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-11 h-11 rounded-xl bg-navy text-navyfg"><Icon name={s.icon} /></span>
            <p className="text-sm font-semibold text-em num">Paso {i + 1} de {STEPS.length}</p>
          </div>
          <h3 className="mt-4 text-2xl font-bold text-ink">{s.title}</h3>
          <p className="mt-2 text-muted">{s.body}</p>
          <ul className="mt-5 space-y-3">
            {s.list.map((l) => (
              <li key={l} className="flex gap-3 text-ink"><Icon name="CheckCircle2" className="w-5 h-5 text-em shrink-0 mt-0.5" /><span>{l}</span></li>
            ))}
          </ul>
        </div>
        <aside className="rounded-xl bg-ambersoft border border-amber/30 p-5 self-start">
          <p className="flex items-center gap-2 text-sm font-bold text-amber"><Icon name="Lightbulb" className="w-4 h-4" /> Consejo práctico</p>
          <p className="mt-2 text-sm text-ink">{s.tip}</p>
        </aside>
        <div className="lg:col-span-2 flex justify-between gap-3 pt-2 border-t border-line">
          <button disabled={i === 0} onClick={() => setI(i - 1)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-ink border border-line disabled:opacity-40 hover:bg-soft transition">
            <Icon name="ArrowLeft" className="w-4 h-4" /> Anterior
          </button>
          {i < STEPS.length - 1 ? (
            <button onClick={() => setI(i + 1)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-em text-white hover:brightness-110 transition">
              Siguiente <Icon name="ArrowRight" className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => scrollTo("perfil")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-em text-white hover:brightness-110 transition">
              Descubrí tu perfil <Icon name="ArrowRight" className="w-4 h-4" />
            </button>
          )}
        </div>
      </article>
    </Section>
  );
}

/* ---------- 4. casas de bolsa ---------- */
function Casas() {
  const services = [
    ["MessagesSquare", "Asesoría", "Te explican opciones según tu perfil y objetivo."],
    ["ArrowLeftRight", "Compra y venta", "Ejecutan tus órdenes en la BVA, en mercado primario y secundario."],
    ["Lock", "Custodia", "Registran tus títulos a tu nombre y te informan cobros y vencimientos."],
    ["Smartphone", "Apps digitales", "Varias permiten invertir y seguir tu cartera desde el celular."],
  ];
  const checklist = [
    "Está registrada en la Superintendencia de Valores del BCP y es miembro de la BVA.",
    "Te entrega por escrito el tarifario: corretaje, custodia y aranceles.",
    "Responde rápido y explica sin apuros ni presiones.",
    "Ofrece app o plataforma web para ver tu cartera y estados de cuenta.",
    "Tiene productos propios o vinculados, como fondos mutuos de su administradora.",
    "Publica información clara de sus emisiones y riesgos.",
  ];
  const [checked, setChecked] = useState({});
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("Todas");
  const done = Object.values(checked).filter(Boolean).length;
  const list = BROKERS.filter((b) => (tag === "Todas" || b.tag === tag) && b.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Section id="casas" alt eyebrow="Intermediarios" title="Casas de Bolsa en Paraguay"
      intro="Una Casa de Bolsa (C.B.S.A.) es una sociedad anónima autorizada para comprar y vender títulos en la bolsa por cuenta de sus clientes. Ganan dinero con comisiones de corretaje sobre cada operación y, en algunos casos, con cargos de custodia.">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {services.map(([ic, t, d]) => (
          <div key={t} className="rounded-2xl border border-line bg-bg p-5">
            <Icon name={ic} className="w-6 h-6 text-em" />
            <p className="mt-3 font-bold text-ink">{t}</p>
            <p className="mt-1 text-sm text-muted">{d}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid lg:grid-cols-[380px_1fr] gap-6 items-start">
        <div className="rounded-2xl border border-line bg-bg p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-ink">Checklist para elegir</h3>
            <span className="num text-sm font-semibold text-em">{done}/{checklist.length}</span>
          </div>
          <div className="mt-3 h-1.5 rounded-full bg-soft overflow-hidden"><div className="h-full bg-em transition-all" style={{ width: (done / checklist.length) * 100 + "%" }} /></div>
          <ul className="mt-4 space-y-2">
            {checklist.map((c, k) => (
              <li key={k}>
                <label htmlFor={"chk-" + k} className="flex gap-3 cursor-pointer rounded-lg p-2 hover:bg-soft">
                  <input id={"chk-" + k} type="checkbox" className="mt-1 w-4 h-4 accent-[rgb(var(--em))] shrink-0" checked={!!checked[k]} onChange={(e) => setChecked({ ...checked, [k]: e.target.checked })} />
                  <span className={"text-sm " + (checked[k] ? "text-muted line-through" : "text-ink")}>{c}</span>
                </label>
              </li>
            ))}
          </ul>
          {done === checklist.length && <p className="mt-3 text-sm font-semibold text-em fade-in">Excelente: esa Casa de Bolsa cumple todos los criterios básicos.</p>}
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Icon name="Search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input id="broker-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar Casa de Bolsa"
                className="w-full rounded-lg border border-line bg-card pl-9 pr-3 py-2 text-sm text-ink placeholder:text-muted focus:border-em outline-none" />
            </div>
            <Segmented idBase="broker-tag" label="Tipo" value={tag} onChange={setTag} options={[["Todas", "Todas"], ["Grupo bancario", "Bancarias"], ["Independiente", "Independientes"]]} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {list.map((b) => (
              <div key={b.name} className="flex items-start gap-3 rounded-xl border border-line bg-bg p-4">
                <span className="grid place-items-center w-10 h-10 shrink-0 rounded-lg bg-navy text-navyfg font-display font-bold text-sm">{b.name.replace(/^ueno/, "U").slice(0, 2).toUpperCase()}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink leading-snug">{b.name}</p>
                  <p className="text-sm text-muted">{b.focus}</p>
                  <Pill className="mt-2 bg-soft text-muted">{b.tag}</Pill>
                </div>
              </div>
            ))}
            {list.length === 0 && <p className="text-sm text-muted sm:col-span-2 p-4">No hay resultados para «{q}». Probá con otro nombre.</p>}
          </div>
          <div className="mt-4">
            <Notice>
              <strong>Directorio informativo, no exhaustivo ni una recomendación.</strong> Las Casas de Bolsa habilitadas pueden cambiar. Verificá siempre la lista vigente en el sitio oficial del Banco Central del Paraguay (<a className="underline text-em" href="https://www.bcp.gov.py" target="_blank" rel="noopener">bcp.gov.py</a>) y de la Bolsa de Valores de Asunción (<a className="underline text-em" href="https://www.bva.com.py" target="_blank" rel="noopener">bva.com.py</a>).
            </Notice>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ---------- 5. instrumentos ---------- */
function Instrumentos() {
  const [risk, setRisk] = useState("Todos");
  const [liq, setLiq] = useState("Todas");
  const [cur, setCur] = useState("Todas");
  const [sel, setSel] = useState("fm");
  const [compare, setCompare] = useState(["fm", "cda", "bc"]);

  const filtered = INSTRUMENTS.filter((x) =>
    (risk === "Todos" || x.risk === risk) && (liq === "Todas" || x.liquidity === liq) && (cur === "Todas" || x.currencies.includes(cur)));
  const active = INSTRUMENTS.find((x) => x.id === sel);
  const toggleCompare = (id) => setCompare((c) => c.includes(id) ? c.filter((x) => x !== id) : c.length >= 4 ? [...c.slice(1), id] : [...c, id]);
  const cmp = INSTRUMENTS.filter((x) => compare.includes(x.id));

  const ratings = [
    ["AAApy", "Máxima capacidad de pago. Riesgo muy bajo.", "bg-emsoft text-em"],
    ["AApy", "Muy alta capacidad de pago.", "bg-emsoft text-em"],
    ["Apy", "Alta capacidad, algo más sensible a cambios económicos.", "bg-ambersoft text-amber"],
    ["BBBpy", "Capacidad suficiente; último escalón del grado de inversión.", "bg-ambersoft text-amber"],
    ["BBpy o menor", "Especulativo: mayor riesgo de atrasos o impago.", "bg-dangersoft text-danger"],
  ];

  const Filter = ({ label, value, onChange, options, idBase }) => (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o} id={idBase + "-" + o} onClick={() => onChange(o)} aria-pressed={value === o}
            className={"px-3 py-1.5 rounded-full text-sm font-medium border transition " + (value === o ? "bg-navy text-navyfg border-navy" : "bg-card text-ink border-line hover:border-em")}>{o}</button>
        ))}
      </div>
    </div>
  );

  return (
    <Section id="instrumentos" eyebrow="Instrumentos financieros" title="Qué podés comprar en la bolsa paraguaya"
      intro="Filtrá por riesgo, liquidez y moneda. Tocá una tarjeta para leer la explicación completa y marcá hasta cuatro para compararlas lado a lado.">
      <div className="rounded-2xl border border-line bg-card p-4 sm:p-5 grid md:grid-cols-3 gap-4">
        <Filter idBase="f-risk" label="Nivel de riesgo" value={risk} onChange={setRisk} options={["Todos", "Bajo", "Medio", "Alto"]} />
        <Filter idBase="f-liq" label="Liquidez" value={liq} onChange={setLiq} options={["Todas", "Alta", "Media", "Baja"]} />
        <Filter idBase="f-cur" label="Moneda" value={cur} onChange={setCur} options={["Todas", "PYG", "USD"]} />
      </div>
      <p className="mt-3 text-sm text-muted num">{filtered.length} de {INSTRUMENTS.length} instrumentos</p>

      <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((x) => (
          <article key={x.id} className={"rounded-2xl border bg-card p-5 flex flex-col transition " + (sel === x.id ? "border-em ring-2 ring-em/20" : "border-line hover:border-em/50")}>
            <button onClick={() => setSel(x.id)} className="text-left flex-1">
              <div className="flex items-start justify-between gap-3">
                <span className="grid place-items-center w-10 h-10 rounded-xl bg-soft text-ink"><Icon name={x.icon} /></span>
                <Pill className={RISK_STYLE[x.risk]}>Riesgo {x.risk.toLowerCase()}</Pill>
              </div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted">{x.family}</p>
              <h3 className="text-lg font-bold text-ink">{x.name}</h3>
              <p className="mt-1 text-sm text-muted line-clamp-3">{x.summary}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Pill className="bg-soft text-ink">Liquidez {x.liquidity.toLowerCase()}</Pill>
                {x.currencies.map((c) => <Pill key={c} className="bg-soft text-ink">{c}</Pill>)}
              </div>
            </button>
            <div className="mt-4 pt-3 border-t border-line flex items-center justify-between gap-2">
              <button onClick={() => setSel(x.id)} className="text-sm font-semibold text-em inline-flex items-center gap-1">Ver detalle <Icon name="ChevronRight" className="w-4 h-4" /></button>
              <label htmlFor={"cmp-" + x.id} className="inline-flex items-center gap-2 text-sm text-ink cursor-pointer">
                <input id={"cmp-" + x.id} type="checkbox" className="w-4 h-4 accent-[rgb(var(--em))]" checked={compare.includes(x.id)} onChange={() => toggleCompare(x.id)} /> Comparar
              </label>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-dashed border-line p-8 text-center text-muted">
            Ningún instrumento combina esos filtros. <button className="text-em font-semibold underline" onClick={() => { setRisk("Todos"); setLiq("Todas"); setCur("Todas"); }}>Quitar filtros</button>
          </div>
        )}
      </div>

      {active && (
        <article key={active.id} className="fade-in mt-6 rounded-2xl border border-line bg-card p-6 sm:p-8 grid lg:grid-cols-[1fr_300px] gap-8">
          <div className="min-w-0">
            <p className="eyebrow">{active.family}</p>
            <h3 className="mt-1 text-2xl font-bold text-ink">{active.name}</h3>
            <p className="mt-3 text-ink">{active.summary}</p>
            <ul className="mt-5 space-y-3">
              {active.points.map((p) => <li key={p} className="flex gap-3 text-ink text-sm"><Icon name="CheckCircle2" className="w-5 h-5 text-em shrink-0" /><span>{p}</span></li>)}
            </ul>
          </div>
          <dl className="rounded-xl bg-bg border border-line p-5 space-y-3 text-sm self-start">
            {[["Riesgo", active.risk], ["Liquidez", active.liquidity], ["Monedas", active.currencies.join(" / ")], ["Plazo típico", active.term], ["Monto mínimo", active.min],
              ["Tasa ref. PYG", active.ratePYG ? "≈ " + active.ratePYG.toLocaleString("es-PY") + " % anual" : "No aplica"],
              ["Tasa ref. USD", active.currencies.includes("USD") && active.rateUSD ? "≈ " + active.rateUSD.toLocaleString("es-PY") + " % anual" : "No aplica"]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4"><dt className="text-muted">{k}</dt><dd className="text-ink font-semibold text-right num">{v}</dd></div>
            ))}
            <p className="text-xs text-muted pt-2 border-t border-line">Valores orientativos. En acciones, la cifra es un rendimiento histórico esperado, no una tasa.</p>
          </dl>
        </article>
      )}

      {/* tabla comparativa */}
      <div className="mt-10">
        <div className="flex items-end justify-between gap-3 flex-wrap mb-3">
          <h3 className="text-xl font-bold text-ink">Comparador</h3>
          <p className="text-sm text-muted">Comparando <span className="num">{cmp.length}</span> de 4 posibles</p>
        </div>
        {cmp.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-6 text-center text-muted">Marcá «Comparar» en al menos una tarjeta.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line bg-card">
            <table className="w-full text-sm min-w-[560px]">
              <thead><tr className="bg-soft text-left">
                <th className="p-3 font-semibold text-muted w-36">Característica</th>
                {cmp.map((x) => <th key={x.id} className="p-3 font-bold text-ink">{x.name}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-line">
                {[
                  ["Riesgo", (x) => <Pill className={RISK_STYLE[x.risk]}>{x.risk}</Pill>],
                  ["Liquidez", (x) => x.liquidity],
                  ["Monedas", (x) => x.currencies.join(" / ")],
                  ["Plazo típico", (x) => x.term],
                  ["Tasa ref. PYG", (x) => <span className="num font-semibold text-em">{x.ratePYG ? x.ratePYG.toLocaleString("es-PY") + " %" : "—"}</span>],
                  ["Tasa ref. USD", (x) => <span className="num font-semibold text-em">{x.currencies.includes("USD") && x.rateUSD ? x.rateUSD.toLocaleString("es-PY") + " %" : "—"}</span>],
                  ["Mínimo", (x) => x.min],
                ].map(([k, f]) => (
                  <tr key={k}><th scope="row" className="p-3 text-left font-medium text-muted align-top">{k}</th>{cmp.map((x) => <td key={x.id} className="p-3 text-ink align-top">{f(x)}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* calificaciones */}
      <div className="mt-10 rounded-2xl border border-line bg-card p-6">
        <h3 className="text-xl font-bold text-ink">Cómo leer una calificación de riesgo local</h3>
        <p className="mt-2 text-sm text-muted prose-w">Las calificadoras autorizadas por la Superintendencia de Valores evalúan a cada emisor. El sufijo «py» indica escala nacional paraguaya. Los signos + y − ordenan dentro de cada categoría, y la tendencia (fuerte, estable, sensible) anticipa cambios.</p>
        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {ratings.map(([r, d, c]) => (
            <div key={r} className="rounded-xl border border-line p-4">
              <Pill className={c + " text-sm"}>{r}</Pill>
              <p className="mt-2 text-sm text-ink">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ---------- 6a. simulador ---------- */
const SIM_PRESETS = ["fm", "cda", "bc", "bt", "fi", "ap", "ao"];

function Simulador() {
  const [cur, setCur] = useState("PYG");
  const [inst, setInst] = useState("cda");
  const [rate, setRate] = useState(7.5);
  const [initial, setInitial] = useState(10000000);
  const [monthly, setMonthly] = useState(500000);
  const [term, setTerm] = useState(5);
  const [unit, setUnit] = useState("años");
  const [reinvest, setReinvest] = useState(true);

  const defaults = { PYG: { initial: 10000000, monthly: 500000 }, USD: { initial: 2000, monthly: 100 } };
  const changeCur = (c) => {
    setCur(c); setInitial(defaults[c].initial); setMonthly(defaults[c].monthly);
    const x = INSTRUMENTS.find((i) => i.id === inst); setRate(c === "PYG" ? x.ratePYG : x.rateUSD);
  };
  const changeInst = (id) => { setInst(id); const x = INSTRUMENTS.find((i) => i.id === id); setRate(cur === "PYG" ? x.ratePYG : x.rateUSD); };

  const months = Math.max(1, Math.min(600, Math.round(unit === "años" ? term * 12 : term)));
  const sim = useMemo(() => {
    const a = Math.max(0, Number(rate) || 0) / 100;
    const rm = Math.pow(1 + a, 1 / 12) - 1;
    let bal = Math.max(0, Number(initial) || 0), contrib = bal, paidOut = 0;
    const m = Math.max(0, Number(monthly) || 0);
    const step = months <= 36 ? 1 : months <= 120 ? 3 : 12;
    const data = [{ label: "0", Aportado: contrib, Intereses: 0 }];
    for (let k = 1; k <= months; k++) {
      if (reinvest) { bal = bal * (1 + rm) + m; }
      else { paidOut += bal * a / 12; bal += m; }
      contrib += m;
      if (k % step === 0 || k === months) {
        const total = reinvest ? bal : bal + paidOut;
        data.push({ label: months <= 36 ? "Mes " + k : (k / 12).toLocaleString("es-PY", { maximumFractionDigits: 1 }) + " a", Aportado: contrib, Intereses: Math.max(0, total - contrib) });
      }
    }
    const total = reinvest ? bal : bal + paidOut;
    return { data, total, contrib, interest: total - contrib };
  }, [rate, initial, monthly, months, reinvest]);

  const field = "w-full rounded-lg border border-line bg-card px-3 py-2.5 text-ink num focus:border-em outline-none";
  const step = cur === "PYG" ? 100000 : 50;
  const { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } = RC || {};

  return (
    <Section id="simulador" alt eyebrow="Herramienta" title="Simulador de inversión"
      intro="Calculá cuánto podría crecer tu dinero con aportes mensuales. Las tasas vienen precargadas como referencia, pero podés editarlas con la tasa real que te ofrezca tu Casa de Bolsa.">
      <div className="grid lg:grid-cols-[360px_1fr] gap-6 items-start">
        <form className="rounded-2xl border border-line bg-bg p-5 sm:p-6 space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div>
            <p className="text-sm font-semibold text-ink mb-2">Moneda</p>
            <Segmented idBase="sim-cur" label="Moneda" value={cur} onChange={changeCur} options={[["PYG", "Guaraníes (PYG)"], ["USD", "Dólares (USD)"]]} />
          </div>
          <div>
            <label htmlFor="sim-inst" className="text-sm font-semibold text-ink block mb-2">Instrumento</label>
            <select id="sim-inst" value={inst} onChange={(e) => changeInst(e.target.value)} className={field}>
              {SIM_PRESETS.map((id) => { const x = INSTRUMENTS.find((i) => i.id === id); return <option key={id} value={id}>{x.name}</option>; })}
            </select>
          </div>
          <div>
            <label htmlFor="sim-rate" className="text-sm font-semibold text-ink flex justify-between mb-2">Tasa anual estimada <span className="text-em num">{Number(rate).toLocaleString("es-PY")} %</span></label>
            <div className="flex gap-3 items-center">
              <input id="sim-rate-range" type="range" min="0" max="20" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} className="flex-1" aria-label="Tasa anual" />
              <input id="sim-rate" type="number" min="0" max="50" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} className={field + " w-24"} />
            </div>
          </div>
          <div>
            <label htmlFor="sim-initial" className="text-sm font-semibold text-ink block mb-2">Monto inicial ({cur === "PYG" ? "Gs." : "US$"})</label>
            <input id="sim-initial" type="number" min="0" step={step} value={initial} onChange={(e) => setInitial(e.target.value)} className={field} />
            <p className="mt-1 text-xs text-muted num">{fmtMoney(Number(initial) || 0, cur)}</p>
          </div>
          <div>
            <label htmlFor="sim-monthly" className="text-sm font-semibold text-ink block mb-2">Aporte mensual ({cur === "PYG" ? "Gs." : "US$"})</label>
            <input id="sim-monthly" type="number" min="0" step={step / 2} value={monthly} onChange={(e) => setMonthly(e.target.value)} className={field} />
            <p className="mt-1 text-xs text-muted num">{fmtMoney(Number(monthly) || 0, cur)}</p>
          </div>
          <div>
            <label htmlFor="sim-term" className="text-sm font-semibold text-ink block mb-2">Plazo</label>
            <div className="flex gap-2">
              <input id="sim-term" type="number" min="1" max={unit === "años" ? 50 : 600} value={term} onChange={(e) => setTerm(e.target.value)} className={field + " flex-1"} />
              <Segmented idBase="sim-unit" label="Unidad de plazo" value={unit} onChange={(u) => { setUnit(u); setTerm(u === "meses" ? Math.round((Number(term) || 1) * 12) : Math.max(1, Math.round((Number(term) || 12) / 12))); }} options={[["meses", "Meses"], ["años", "Años"]]} />
            </div>
          </div>
          <label htmlFor="sim-reinvest" className="flex items-start gap-3 cursor-pointer">
            <input id="sim-reinvest" type="checkbox" checked={reinvest} onChange={(e) => setReinvest(e.target.checked)} className="mt-1 w-4 h-4 accent-[rgb(var(--em))]" />
            <span className="text-sm text-ink">Reinvertir intereses (interés compuesto)<span className="block text-xs text-muted">Si lo desmarcás, los intereses se cobran como cupones y no generan nuevos intereses.</span></span>
          </label>
        </form>

        <div className="min-w-0 space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-navy text-navyfg p-5">
              <p className="text-xs uppercase tracking-wider opacity-70">Capital final</p>
              <p className="mt-1 num font-display text-2xl font-bold break-words">{fmtMoney(sim.total, cur)}</p>
            </div>
            <div className="rounded-2xl border border-line bg-bg p-5">
              <p className="text-xs uppercase tracking-wider text-muted">Total aportado</p>
              <p className="mt-1 num font-display text-xl font-bold text-ink break-words">{fmtMoney(sim.contrib, cur)}</p>
            </div>
            <div className="rounded-2xl border border-em/30 bg-emsoft p-5">
              <p className="text-xs uppercase tracking-wider text-em">Intereses ganados</p>
              <p className="mt-1 num font-display text-xl font-bold text-em break-words">+ {fmtMoney(sim.interest, cur)}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-bg p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
              <p className="font-semibold text-ink">Crecimiento en <span className="num">{months}</span> meses</p>
              <div className="flex gap-4 text-xs text-muted">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "rgb(var(--navy))", opacity: .55 }} />Aportado</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-em" />Intereses</span>
              </div>
            </div>
            <div className="h-72">
              {ResponsiveContainer ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sim.data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gEm" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgb(var(--em))" stopOpacity={0.55} /><stop offset="100%" stopColor="rgb(var(--em))" stopOpacity={0.15} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis tickLine={false} axisLine={false} width={84} tickFormatter={(v) => fmtShort(v, cur)} />
                    <Tooltip formatter={(v, n) => [fmtMoney(v, cur), n]} contentStyle={{ background: "rgb(var(--card))", border: "1px solid rgb(var(--line))", borderRadius: 12, color: "rgb(var(--ink))" }} labelStyle={{ color: "rgb(var(--muted))" }} />
                    <Area type="monotone" dataKey="Aportado" stackId="1" stroke="rgb(var(--navy))" fill="rgb(var(--navy))" fillOpacity={0.35} strokeWidth={2} />
                    <Area type="monotone" dataKey="Intereses" stackId="1" stroke="rgb(var(--em))" fill="url(#gEm)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted">El gráfico no pudo cargarse.</p>}
            </div>
          </div>
          <Notice>Simulación educativa con tasa constante y capitalización mensual equivalente. No incluye comisiones, impuestos ni variaciones de precio. Las tasas reales dependen del emisor, el plazo y el momento del mercado.</Notice>
        </div>
      </div>
    </Section>
  );
}

/* ---------- 6b. perfil ---------- */
const QUESTIONS = [
  { q: "¿Cuál es tu objetivo principal al invertir?", a: [["Proteger mis ahorros de la inflación", 1], ["Hacer crecer mi dinero con algo de riesgo", 2], ["Maximizar la ganancia a largo plazo", 3]] },
  { q: "¿En cuánto tiempo vas a necesitar este dinero?", a: [["En menos de 1 año", 1], ["Entre 1 y 3 años", 2], ["En más de 3 años", 3]] },
  { q: "Si tu inversión baja un 15 % en un año, ¿qué hacés?", a: [["Retiro todo para no perder más", 1], ["Espero a que se recupere", 2], ["Aprovecho para invertir más", 3]] },
  { q: "¿Cuánta experiencia tenés invirtiendo?", a: [["Ninguna, solo caja de ahorro o plazo fijo", 1], ["Algo: fondos mutuos o CDA", 2], ["Bastante: bonos, acciones u otros", 3]] },
  { q: "¿Qué parte de tus ahorros vas a invertir?", a: [["La mayor parte de lo que tengo", 1], ["Una parte, tengo un colchón aparte", 2], ["Un excedente que no voy a necesitar", 3]] },
];
const PROFILES = {
  Conservador: { color: "text-em", desc: "Priorizás la seguridad y la liquidez por sobre la rentabilidad. Te conviene una cartera de renta fija de emisores bien calificados y plazos cortos a medianos.",
    alloc: [["Fondo mutuo", 40], ["CDA", 35], ["Bonos AAApy/AApy y del Tesoro", 25], ["Acciones", 0]] },
  Moderado: { color: "text-amber", desc: "Buscás un equilibrio entre seguridad y crecimiento. Aceptás alguna variación a cambio de mejores tasas en plazos medianos.",
    alloc: [["Fondo mutuo", 20], ["CDA", 25], ["Bonos corporativos y del Tesoro", 40], ["Acciones preferidas", 15]] },
  Dinámico: { color: "text-danger", desc: "Tenés horizonte largo y tolerás caídas temporales. Podés sumar más bonos de mayor tasa y una porción relevante de acciones.",
    alloc: [["Fondo mutuo", 10], ["CDA", 10], ["Bonos corporativos", 45], ["Acciones y fondos de inversión", 35]] },
};
const PIE_COLORS = ["rgb(var(--em))", "rgb(var(--navy))", "rgb(var(--amber))", "rgb(var(--muted))"];

function Perfil() {
  const [answers, setAnswers] = useState({});
  const [idx, setIdx] = useState(0);
  const finished = Object.keys(answers).length === QUESTIONS.length && idx >= QUESTIONS.length;
  const score = Object.values(answers).reduce((s, v) => s + v, 0);
  const profile = score <= 8 ? "Conservador" : score <= 11 ? "Moderado" : "Dinámico";
  const P = PROFILES[profile];
  const pick = (v) => { setAnswers({ ...answers, [idx]: v }); setIdx(idx + 1); };
  const reset = () => { setAnswers({}); setIdx(0); };
  const { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } = RC || {};
  const pieData = P.alloc.filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));

  return (
    <Section id="perfil" eyebrow="Herramienta" title="Test rápido de perfil de inversionista"
      intro="Cinco preguntas, menos de un minuto. Al final te mostramos tu perfil y una distribución de cartera de ejemplo con instrumentos paraguayos.">
      <div className="rounded-2xl border border-line bg-card p-6 sm:p-8 max-w-4xl">
        {!finished ? (
          <div key={idx} className="fade-in">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-em num">Pregunta {idx + 1} de {QUESTIONS.length}</p>
              {idx > 0 && <button onClick={() => setIdx(idx - 1)} className="text-sm text-muted hover:text-ink inline-flex items-center gap-1"><Icon name="ArrowLeft" className="w-4 h-4" /> Volver</button>}
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-soft overflow-hidden"><div className="h-full bg-em transition-all" style={{ width: (idx / QUESTIONS.length) * 100 + "%" }} /></div>
            <h3 className="mt-6 text-2xl font-bold text-ink">{QUESTIONS[idx].q}</h3>
            <div className="mt-5 grid gap-3">
              {QUESTIONS[idx].a.map(([t, v]) => (
                <button key={t} id={"q" + idx + "-" + v} onClick={() => pick(v)}
                  className={"text-left rounded-xl border px-4 py-3.5 font-medium transition flex items-center justify-between gap-3 " + (answers[idx] === v ? "border-em bg-emsoft text-ink" : "border-line text-ink hover:border-em hover:bg-soft")}>
                  {t}<Icon name="ChevronRight" className="w-4 h-4 text-muted shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="fade-in grid md:grid-cols-[1fr_280px] gap-8 items-center">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-muted">Tu perfil es</p>
              <h3 className={"text-4xl font-extrabold " + P.color}>{profile}</h3>
              <p className="mt-1 text-xs text-muted num">Puntaje: {score} de 15</p>
              <p className="mt-4 text-ink">{P.desc}</p>
              <ul className="mt-5 space-y-2">
                {P.alloc.map(([n, v], k) => (
                  <li key={n} className="flex items-center gap-3 text-sm">
                    <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: PIE_COLORS[k] }} />
                    <span className="flex-1 text-ink">{n}</span>
                    <span className="num font-bold text-ink">{v} %</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <button onClick={reset} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-line font-semibold text-ink hover:bg-soft"><Icon name="RotateCcw" className="w-4 h-4" /> Repetir test</button>
                <button onClick={() => scrollTo("simulador")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-em text-white font-semibold hover:brightness-110">Simular con esta idea <Icon name="ArrowRight" className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="h-64">
              {ResponsiveContainer && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="90%" paddingAngle={2} stroke="rgb(var(--card))" strokeWidth={2}>
                      {pieData.map((d) => <Cell key={d.name} fill={PIE_COLORS[P.alloc.findIndex(([n]) => n === d.name)]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [v + " %", n]} contentStyle={{ background: "rgb(var(--card))", border: "1px solid rgb(var(--line))", borderRadius: 12 }} itemStyle={{ color: "rgb(var(--ink))" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="md:col-span-2"><Notice>Distribución de ejemplo con fines educativos. No es una recomendación personalizada: tu Casa de Bolsa debe evaluar tu perfil formalmente antes de ofrecerte productos.</Notice></div>
          </div>
        )}
      </div>
    </Section>
  );
}

/* ---------- 7. glosario + faq ---------- */
const highlight = (text, q) => {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return <>{text.slice(0, i)}<mark className="bg-ambersoft text-ink rounded px-0.5">{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
};
const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function GlosarioFAQ() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(0);
  const items = GLOSSARY.filter(([t, d]) => norm(t + " " + d).includes(norm(q.trim())));
  return (
    <Section id="glosario" alt eyebrow="Aprendé el idioma" title="Glosario bursátil y preguntas frecuentes">
      <div className="grid lg:grid-cols-2 gap-10 items-start">
        <div className="min-w-0">
          <h3 className="text-xl font-bold text-ink">Glosario</h3>
          <div className="relative mt-4">
            <Icon name="Search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input id="glossary-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscá un término, por ejemplo «cupón»"
              className="w-full rounded-xl border border-line bg-bg pl-9 pr-9 py-3 text-ink placeholder:text-muted focus:border-em outline-none" />
            {q && <button aria-label="Borrar búsqueda" onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-muted hover:text-ink"><Icon name="X" className="w-4 h-4" /></button>}
          </div>
          <p className="mt-2 text-xs text-muted num">{items.length} {items.length === 1 ? "término" : "términos"}</p>
          <dl className="mt-3 space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {items.map(([t, d]) => (
              <div key={t} className="rounded-xl border border-line bg-bg p-4">
                <dt className="font-bold text-ink">{highlight(t, q.trim())}</dt>
                <dd className="mt-1 text-sm text-muted">{highlight(d, q.trim())}</dd>
              </div>
            ))}
            {items.length === 0 && <p className="rounded-xl border border-dashed border-line p-6 text-center text-muted text-sm">No encontramos «{q}». Probá con otra palabra.</p>}
          </dl>
        </div>

        <div className="min-w-0">
          <h3 className="text-xl font-bold text-ink">Preguntas frecuentes</h3>
          <div className="mt-4 space-y-2">
            {FAQ.map(([qq, a], k) => (
              <div key={k} className={"rounded-xl border bg-bg transition " + (open === k ? "border-em/50" : "border-line")}>
                <h4>
                  <button id={"faq-" + k} aria-expanded={open === k} aria-controls={"faq-p-" + k} onClick={() => setOpen(open === k ? -1 : k)}
                    className="w-full flex items-center justify-between gap-3 text-left p-4 font-semibold text-ink">
                    {qq}<Icon name="ChevronDown" className={"w-5 h-5 shrink-0 text-muted transition-transform " + (open === k ? "rotate-180 text-em" : "")} />
                  </button>
                </h4>
                {open === k && <div id={"faq-p-" + k} className="fade-in px-4 pb-4 text-sm text-muted">{a}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ---------- 8. footer ---------- */
function Footer() {
  return (
    <footer className="bg-navy text-navyfg">
      <div className="wrap py-12 grid md:grid-cols-[1fr_1.4fr] gap-10">
        <div>
          <p className="font-display font-extrabold text-lg">Bolsa<span className="text-em">PY</span> Aprende</p>
          <p className="mt-2 text-sm opacity-75 max-w-sm">Guía educativa para dar los primeros pasos en el mercado de valores paraguayo.</p>
          <div className="mt-4 flex flex-col gap-1 text-sm">
            <a href="https://www.bcp.gov.py" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 opacity-90 hover:opacity-100 underline-offset-2 hover:underline">Banco Central del Paraguay <Icon name="ExternalLink" className="w-3.5 h-3.5" /></a>
            <a href="https://www.bva.com.py" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 opacity-90 hover:opacity-100 underline-offset-2 hover:underline">Bolsa de Valores de Asunción <Icon name="ExternalLink" className="w-3.5 h-3.5" /></a>
          </div>
        </div>
        <div className="rounded-2xl border border-white/15 p-5">
          <p className="flex items-center gap-2 font-semibold"><Icon name="AlertTriangle" className="w-4 h-4 text-amber" /> Aviso legal</p>
          <p className="mt-2 text-sm opacity-80">
            Todo el contenido de este sitio es exclusivamente educativo e informativo. No constituye asesoría financiera, legal ni tributaria, ni una recomendación de compra o venta de ningún valor o instrumento. Las tasas, montos mínimos y entidades mencionadas son ilustrativas y pueden no estar vigentes. Toda inversión implica riesgos, incluida la posible pérdida del capital, y los rendimientos pasados no garantizan resultados futuros. Antes de invertir, consultá con una Casa de Bolsa autorizada por la Superintendencia de Valores del Banco Central del Paraguay y leé el prospecto de cada emisión.
          </p>
        </div>
      </div>
    </footer>
  );
}

function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Ecosistema />
        <Stepper />
        <Casas />
        <Instrumentos />
        <Simulador />
        <Perfil />
        <GlosarioFAQ />
      </main>
      <Footer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
