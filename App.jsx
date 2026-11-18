/* ===== PARTE 1 DE 6: Base: utilidades, datos y componentes compartidos ===== */

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
const scrollTo = (id) => {
  const go = () => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const v = SECTION_VIEW[id];
  if (v && v !== currentView) { window.location.hash = v; setTimeout(go, 150); } else go();
};

/* ---------- datos ---------- */
const VIEWS = [
  { id: "inicio", label: "Inicio", icon: "Home", title: "Inicio", desc: "", sections: [["beneficios", "Beneficios"], ["explorar", "Mapa de la guía"]] },
  { id: "invertir", label: "Dónde invertir", icon: "Target", title: "Dónde invertir",
    desc: "Qué instrumento conviene según tu objetivo, cómo invierten otras personas, qué podés comprar en la bolsa y dónde hacerlo.",
    sections: [["donde", "Según tu objetivo"], ["casos", "Casos de ejemplo"], ["instrumentos", "Instrumentos"], ["casas", "Casas de Bolsa"]] },
  { id: "mercado", label: "El mercado", icon: "Landmark", title: "Cómo funciona el mercado",
    desc: "Quiénes participan en la bolsa paraguaya, qué sectores emiten títulos y cómo se lee una emisión de principio a fin.",
    sections: [["ecosistema", "Cómo funciona"], ["mapa", "Mapa del mercado"], ["prospecto", "Leer un prospecto"], ["linea", "Línea de tiempo"]] },
  { id: "empezar", label: "Empezar", icon: "Rocket", title: "Empezá a invertir",
    desc: "Los pasos para abrir tu cuenta y hacer tu primera inversión, el checklist previo y el test para conocer tu perfil.",
    sections: [["guia", "Paso a paso"], ["checklist", "Checklist"], ["perfil", "Tu perfil"]] },
  { id: "herramientas", label: "Calculadoras", icon: "Calculator", title: "Calculadoras",
    desc: "Simulá tu inversión, calculá cuánto ahorrar para una meta, armá el calendario de cupones de un bono y compará monedas y costos.",
    sections: [["simulador", "Calculadoras"]] },
  { id: "aprender", label: "Aprender", icon: "GraduationCap", title: "Aprender",
    desc: "Tu ruta de aprendizaje, mini-cursos, un quiz para ponerte a prueba, el glosario y las fuentes oficiales.",
    sections: [["aprender", "Ruta y mini-cursos"], ["quiz", "Quiz"], ["glosario", "Glosario y FAQ"], ["oficial", "Fuentes oficiales"]] },
];
const VIEW_IDS = VIEWS.map((v) => v.id);
const SECTION_VIEW = {};
VIEWS.forEach((v) => v.sections.forEach(([id]) => { SECTION_VIEW[id] = v.id; }));
let currentView = "inicio";
const readHash = () => { const h = (window.location.hash || "").slice(1); return VIEW_IDS.includes(h) ? h : "inicio"; };


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
  "ACWM", "ASU Capital", "Atlas", "Avalon", "Basa Capital", "BNB Invest", "Cadiem", "Capital Markets", "FAIS", "Familiar", "GLT", "Green Capital", "Index", "Inversur", "Investor", "Itaú Invest", "Millenia Capital", "One Asset", "Puente", "Solar", "Sudameris Securities", "Tanto Capital", "ueno", "Valores",
].map((name) => ({ name }));

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
  ["Custodia", "Servicio de guarda y registro de tus títulos. En Paraguay la realiza la Caja de Valores del Paraguay (CAVAPY) y se refleja en tu cuenta comitente."],
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
  <section id={id} className="py-16 sm:py-20">
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

/* =====================================================================
   SECCIONES NUEVAS (v2): beneficios, dónde invertir, casos, checklist,
   mapa del mercado, prospecto, línea de tiempo, calculadoras, aprender,
   quiz, datos oficiales y compartir.
   ===================================================================== */
const SITE_URL = "https://hrivarolainsfran-sys.github.io/invertir-bolsa-paraguay/";
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
};
function usePersisted(key, init) {
  const [v, setV] = useState(() => store.get(key, init));
  useEffect(() => { store.set(key, v); }, [key, v]);
  return [v, setV];
}
const toNum = (v) => { const n = Number(v); return isFinite(n) ? n : 0; };
const pct = (v, d = 1) => toNum(v).toLocaleString("es-PY", { maximumFractionDigits: d }) + " %";
const fv = (initial, monthly, ratePct, months) => {
  const rm = Math.pow(1 + toNum(ratePct) / 100, 1 / 12) - 1;
  let b = toNum(initial);
  for (let k = 0; k < months; k++) b = b * (1 + rm) + toNum(monthly);
  return b;
};
const addMonths = (d, m) => { const x = new Date(d.getTime()); const day = x.getDate(); x.setMonth(x.getMonth() + m); if (x.getDate() < day) x.setDate(0); return x; };
const fmtDate = (d) => d.toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
const FIELD = "w-full rounded-lg border border-line bg-card px-3 py-2.5 text-ink num focus:border-em outline-none";
const instById = (id) => INSTRUMENTS.find((i) => i.id === id);
const rateOf = (inst, cur) => (cur === "PYG" ? inst.ratePYG : inst.rateUSD);
const TOOLTIP_STYLE = { background: "rgb(var(--card))", border: "1px solid rgb(var(--line))", borderRadius: 12, color: "rgb(var(--ink))" };

function NumField({ id, label, value, onChange, cur, suffix, step, min = 0, max, hint }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="text-sm font-semibold text-ink block mb-1.5">{label}</label>
      <div className="relative">
        <input id={id} type="number" inputMode="decimal" min={min} max={max} step={step || "any"} value={value}
          onChange={(e) => onChange(e.target.value)} className={FIELD + (suffix ? " pr-16" : "")} />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted pointer-events-none">{suffix}</span>}
      </div>
      {cur && <p className="mt-1 text-xs text-muted num">{fmtMoney(toNum(value), cur)}</p>}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

const Stat = ({ label, value, tone = "plain", sub }) => (
  <div className={"rounded-2xl p-4 sm:p-5 min-w-0 " + (tone === "navy" ? "bg-navy text-navyfg" : tone === "em" ? "bg-emsoft border border-em/30" : tone === "danger" ? "bg-dangersoft border border-danger/30" : "bg-bg border border-line")}>
    <p className={"text-xs uppercase tracking-wider " + (tone === "navy" ? "opacity-70" : tone === "em" ? "text-em" : tone === "danger" ? "text-danger" : "text-muted")}>{label}</p>
    <p className={"mt-1 num font-display text-xl font-bold break-words " + (tone === "navy" ? "" : tone === "em" ? "text-em" : tone === "danger" ? "text-danger" : "text-ink")}>{value}</p>
    {sub && <p className={"mt-1 text-xs " + (tone === "navy" ? "opacity-70" : "text-muted")}>{sub}</p>}
  </div>
);

const CurToggle = ({ id, cur, setCur, disabled }) => (
  <div className={disabled ? "opacity-60 pointer-events-none" : ""}>
    <Segmented idBase={id} label="Moneda" value={cur} onChange={setCur} options={[["PYG", "Guaraníes"], ["USD", "Dólares"]]} />
  </div>
);

/* ---------- 15. compartir ---------- */
function ShareButtons({ text }) {
  const [state, setState] = useState("idle");
  const full = text + "\n\nAprendé a invertir en la Bolsa de Paraguay: " + SITE_URL;
  const copy = async () => {
    try { await navigator.clipboard.writeText(full); setState("ok"); setTimeout(() => setState("idle"), 2000); }
    catch (e) { setState("manual"); }
  };
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap gap-2">
        <a href={"https://wa.me/?text=" + encodeURIComponent(full)} target="_blank" rel="noopener"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-em text-white hover:brightness-110 transition">
          <Icon name="MessageCircle" className="w-4 h-4" /> Compartir por WhatsApp
        </a>
        <button type="button" onClick={copy} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold border border-line text-ink hover:bg-soft transition">
          <Icon name={state === "ok" ? "Check" : "Copy"} className="w-4 h-4" /> {state === "ok" ? "Copiado" : "Copiar texto"}
        </button>
      </div>
      {state === "manual" && (
        <textarea readOnly value={full} onFocus={(e) => e.target.select()} autoFocus rows={3}
          className="mt-2 w-full rounded-lg border border-line bg-card p-2 text-xs text-ink" aria-label="Texto para copiar" />
      )}
    </div>
  );
}

/* ===== PARTE 2 DE 6: Navegación, portada, beneficios, dónde invertir y pie de página ===== */
/* ---------- navegación ---------- */
function Ticker() {
  const items = [
    ...INSTRUMENTS.filter((x) => x.ratePYG > 0).map((x) => [x.name.toUpperCase(), x.currencies.includes("PYG") ? "PYG " + pct(x.ratePYG) : null, x.currencies.includes("USD") && x.rateUSD ? "USD " + pct(x.rateUSD) : null]),
    ["META DE INFLACIÓN BCP", "4 %", null],
    ["CASAS DE BOLSA HABILITADAS", "24", null],
  ];
  const row = (prefix) => items.map(([k, a, b], i) => (
    <span key={prefix + i} className="inline-flex items-center gap-2 px-5">
      <span className="opacity-60">{k}</span>
      {a && <span className="text-up font-semibold">▲ {a}</span>}
      {b && <span className="text-up font-semibold">{b}</span>}
    </span>
  ));
  return (
    <div className="bg-navy text-navyfg text-[11px] font-mono tracking-wide border-b border-navyfg/10" aria-label="Tasas anuales referenciales">
      <div className="flex items-stretch">
        <span className="shrink-0 bg-em text-white px-3 py-1.5 font-semibold tracking-widest">TASAS REF.</span>
        <div className="overflow-hidden flex-1 min-w-0"><div className="ticker-track whitespace-nowrap py-1.5">{row("a")}{row("b")}</div></div>
      </div>
    </div>
  );
}

function Nav({ view }) {
  const tab = (v, compact) => (
    <a key={v.id} href={"#" + v.id} aria-current={view === v.id ? "page" : undefined}
      className={"inline-flex items-center gap-1.5 rounded-lg font-semibold transition whitespace-nowrap " + (compact ? "px-3 py-1.5 text-sm " : "px-3 py-2 text-sm ") +
        (view === v.id ? "bg-navy text-navyfg" : "text-muted hover:text-ink hover:bg-soft")}>
      <Icon name={v.icon} className="w-4 h-4" />{v.label}
    </a>
  );
  return (
    <header className="sticky z-50" style={{ top: "env(safe-area-inset-top, 0px)" }}>
      <Ticker />
      <div className="bg-card/95 backdrop-blur border-b border-line">
        <div className="wrap flex items-center justify-between h-14 gap-4">
          <a href="#inicio" className="flex items-center gap-2 font-display font-extrabold text-ink shrink-0">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-navy text-up"><Icon name="CandlestickChart" className="w-4 h-4" /></span>
            <span>Bolsa<span className="text-em">PY</span> Aprende</span>
          </a>
          <nav className="hidden lg:flex items-center gap-1" aria-label="Secciones">{VIEWS.map((v) => tab(v, false))}</nav>
        </div>
        <nav className="lg:hidden border-t border-line overflow-x-auto" aria-label="Secciones">
          <div className="wrap flex gap-1 py-1.5 min-w-max">{VIEWS.map((v) => tab(v, true))}</div>
        </nav>
      </div>
    </header>
  );
}

function ViewHeader({ v }) {
  const i = VIEWS.findIndex((x) => x.id === v.id);
  return (
    <header className="board-bg bg-navy text-navyfg">
      <div className="wrap py-10 sm:py-14">
        <p className="font-mono text-xs tracking-widest uppercase text-up flex items-center gap-2">
          <a href="#inicio" className="hover:underline">Inicio</a><span className="opacity-50">/</span><span>Sección {i} de {VIEWS.length - 1}</span>
        </p>
        <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold">{v.title}</h1>
        <p className="mt-3 max-w-2xl text-lg opacity-80">{v.desc}</p>
        {v.sections.length > 1 && (
          <div className="mt-7 flex flex-wrap gap-2">
            {v.sections.map(([id, l], k) => (
              <button key={id} onClick={() => scrollTo(id)}
                className="inline-flex items-center gap-2 rounded-full border border-navyfg/20 bg-navyfg/5 px-3.5 py-1.5 text-sm font-medium hover:bg-navyfg/15 transition">
                <span className="font-mono text-xs text-up">{String(k + 1).padStart(2, "0")}</span>{l}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

function ViewPager({ view }) {
  const i = VIEWS.findIndex((v) => v.id === view);
  const prev = VIEWS[i - 1], next = VIEWS[i + 1];
  const card = "group rounded-2xl border border-line bg-card p-5 hover:border-em transition flex flex-col";
  return (
    <nav className="wrap py-10 grid sm:grid-cols-2 gap-3" aria-label="Recorrer la guía">
      {prev ? (
        <a href={"#" + prev.id} className={card}>
          <span className="text-xs font-mono uppercase tracking-wider text-muted flex items-center gap-1"><Icon name="ArrowLeft" className="w-3.5 h-3.5" /> Anterior</span>
          <span className="mt-1 font-display text-lg font-bold text-ink">{prev.label}</span>
        </a>
      ) : <span className="hidden sm:block" />}
      {next && (
        <a href={"#" + next.id} className={card + " sm:items-end sm:text-right"}>
          <span className="text-xs font-mono uppercase tracking-wider text-muted flex items-center gap-1">Siguiente <Icon name="ArrowRight" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" /></span>
          <span className="mt-1 font-display text-lg font-bold text-ink">{next.label}</span>
        </a>
      )}
    </nav>
  );
}

function Explorar() {
  return (
    <Section id="explorar" eyebrow="Mapa de la guía" title="Todo lo que vas a encontrar"
      intro="La guía está ordenada en cinco secciones. Recorrelas en orden o andá directo a lo que necesitás.">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {VIEWS.slice(1).map((v, i) => (
          <a key={v.id} href={"#" + v.id} className="group rounded-2xl border border-line bg-card p-6 hover:border-em hover:-translate-y-0.5 transition flex flex-col">
            <div className="flex items-center justify-between">
              <span className="grid place-items-center w-11 h-11 rounded-xl bg-navy text-up"><Icon name={v.icon} /></span>
              <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h3 className="mt-4 text-xl font-bold text-ink">{v.label}</h3>
            <p className="mt-1 text-sm text-muted">{v.desc}</p>
            <ul className="mt-4 space-y-1 flex-1">
              {v.sections.map(([id, l]) => <li key={id} className="text-sm text-ink flex gap-2"><Icon name="ChevronRight" className="w-4 h-4 text-em shrink-0 mt-0.5" />{l}</li>)}
            </ul>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-em">Entrar <Icon name="ArrowRight" className="w-4 h-4 group-hover:translate-x-0.5 transition" /></span>
          </a>
        ))}
        <div className="board-bg rounded-2xl bg-navy text-navyfg p-6 flex flex-col">
          <span className="grid place-items-center w-11 h-11 rounded-xl bg-em text-white"><Icon name="Compass" /></span>
          <h3 className="mt-4 text-xl font-bold">¿No sabés por dónde empezar?</h3>
          <p className="mt-1 text-sm opacity-80 flex-1">Hacé el test de perfil en menos de un minuto y recibí una cartera de ejemplo con instrumentos paraguayos.</p>
          <button onClick={() => scrollTo("perfil")} className="mt-5 self-start inline-flex items-center gap-2 rounded-xl bg-em px-4 py-2.5 font-semibold text-white hover:brightness-110 transition">
            Hacer el test <Icon name="ArrowRight" className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Section>
  );
}

/* ---------- 1. hero ---------- */
function Hero() {
  const { ResponsiveContainer, AreaChart, Area } = RC || {};
  const spark = Array.from({ length: 61 }, (_, m) => ({ m, v: 10000000 * Math.pow(1.08, m / 12) }));
  const board = ["fm", "cda", "bc", "bt", "fi", "ap", "rep"].map(instById);
  const dot = { Bajo: "bg-up", Medio: "bg-gold", Alto: "bg-danger" };
  return (
    <section className="board-bg bg-navy text-navyfg">
      <div className="wrap pt-12 pb-14 sm:pt-16 sm:pb-20 grid lg:grid-cols-[1.05fr_1fr] gap-10 items-center">
        <div className="min-w-0">
          <p className="font-mono text-xs tracking-widest uppercase text-up flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-up animate-pulse" aria-hidden="true" />Guía educativa · Mercado de valores del Paraguay
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold">Aprendé a invertir en la Bolsa de Paraguay <span className="text-up">desde cero</span></h1>
          <p className="mt-5 text-lg sm:text-xl opacity-80 prose-w">
            No hace falta ser millonario. Con un fondo mutuo podés empezar con montos accesibles, en guaraníes o en dólares, en un mercado regulado por el Banco Central del Paraguay.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => scrollTo("guia")} className="inline-flex items-center gap-2 rounded-xl bg-em px-5 py-3 font-semibold text-white shadow-lg shadow-em/20 hover:brightness-110 active:scale-[.98] transition">
              Empezar la guía paso a paso <Icon name="ArrowRight" className="w-4 h-4" />
            </button>
            <button onClick={() => scrollTo("simulador")} className="inline-flex items-center gap-2 rounded-xl border border-navyfg/25 px-5 py-3 font-semibold hover:bg-navyfg/10 transition">
              <Icon name="Calculator" className="w-4 h-4" /> Simular mi inversión
            </button>
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-4 max-w-md border-t border-navyfg/15 pt-6">
            {[["9", "instrumentos explicados"], ["6", "calculadoras"], ["24", "Casas de Bolsa habilitadas"]].map(([n, l]) => (
              <div key={l}><dd className="font-mono text-3xl font-semibold text-up">{n}</dd><dt className="text-xs opacity-70 leading-snug mt-1">{l}</dt></div>
            ))}
          </dl>
        </div>

        <div className="min-w-0 rounded-2xl border border-navyfg/15 bg-navyfg/5 backdrop-blur shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-navyfg/15 bg-navyfg/5">
            <p className="font-mono text-xs tracking-widest uppercase">Pizarra de tasas referenciales</p>
            <span className="font-mono text-[10px] uppercase tracking-wider rounded border border-gold/50 text-gold px-1.5 py-0.5">Orientativo</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-sm min-w-[380px] text-navyfg">
              <thead><tr className="text-[11px] uppercase tracking-wider opacity-60 text-left">
                <th className="px-5 py-2 font-medium">Instrumento</th><th className="px-3 py-2 font-medium text-right">PYG</th><th className="px-3 py-2 font-medium text-right">USD</th><th className="px-5 py-2 font-medium text-right">Riesgo</th>
              </tr></thead>
              <tbody>
                {board.map((x) => (
                  <tr key={x.id} className="border-t border-navyfg/10 hover:bg-navyfg/5">
                    <td className="px-5 py-2.5 font-sans font-medium">{x.name}</td>
                    <td className="px-3 py-2.5 text-right text-up">{x.currencies.includes("PYG") ? pct(x.ratePYG) : "—"}</td>
                    <td className="px-3 py-2.5 text-right text-up">{x.currencies.includes("USD") && x.rateUSD ? pct(x.rateUSD) : "—"}</td>
                    <td className="px-5 py-2.5 text-right"><span className="inline-flex items-center gap-1.5 text-xs"><span className={"w-2 h-2 rounded-full " + dot[x.risk]} />{x.risk}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-navyfg/15 px-5 pt-4 pb-3">
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <div><p className="font-mono text-[11px] uppercase tracking-wider opacity-60">Gs. 10.000.000 al 8 % · 5 años</p><p className="font-mono text-2xl font-semibold text-up">{fmtMoney(spark[60].v, "PYG")}</p></div>
              <p className="font-mono text-xs text-up">▲ {pct((spark[60].v / spark[0].v - 1) * 100)}</p>
            </div>
            <div className="h-16 mt-2" aria-hidden="true">
              {ResponsiveContainer && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={spark} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs><linearGradient id="gHero" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgb(var(--up))" stopOpacity={0.45} /><stop offset="100%" stopColor="rgb(var(--up))" stopOpacity={0} /></linearGradient></defs>
                    <Area type="monotone" dataKey="v" stroke="rgb(var(--up))" strokeWidth={2} fill="url(#gHero)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <p className="px-5 py-3 text-xs opacity-70 border-t border-navyfg/15">Rangos con fines educativos, no son cotizaciones en tiempo real. Consultá las tasas vigentes en tu Casa de Bolsa.</p>
        </div>
      </div>
    </section>
  );
}

/* ---------- Beneficios + 1. caja de ahorro vs invertir ---------- */
const BENEFITS = [
  ["TrendingUp", "Rinde más que la caja de ahorro", "Un CDA o un bono suele pagar varias veces la tasa de una caja de ahorro y te ayuda a ganarle a la inflación."],
  ["CalendarClock", "Ingreso pasivo con cupones", "Los bonos pagan intereses periódicos: podés cobrar cada mes, trimestre o semestre sin vender nada."],
  ["Coins", "Empezás con poco", "Con un fondo mutuo podés arrancar con montos accesibles y sumar aportes cuando puedas."],
  ["DollarSign", "Guaraníes o dólares", "Elegís la moneda según tus metas: PYG para gastos locales y USD para protegerte de la suba del dólar."],
  ["ShieldCheck", "Mercado regulado", "La Superintendencia de Valores del BCP supervisa a las Casas de Bolsa y registra cada emisión."],
  ["PieChart", "Diversificación", "Repartís tu dinero entre varios emisores, plazos e instrumentos para bajar el riesgo."],
  ["ArrowLeftRight", "Podés salir antes", "En el mercado secundario podés vender un bono o un CDA antes del vencimiento, si hay un comprador."],
  ["Factory", "Impulsás la economía local", "Tu dinero financia a empresas paraguayas y al Estado, que generan empleo, producción y obras."],
];

function Beneficios() {
  const [cur, setCur] = useState("PYG");
  const [amount, setAmount] = useState(10000000);
  const [caja, setCaja] = useState(1);
  const [inst, setInst] = useState("cda");
  const [inv, setInv] = useState(7.5);
  const [infl, setInfl] = useState(4);
  const [years, setYears] = useState(5);
  const changeCur = (c) => { setCur(c); setAmount(c === "PYG" ? 10000000 : 2000); setCaja(c === "PYG" ? 1 : 0.5); setInv(rateOf(instById(inst), c)); };
  const changeInst = (id) => { setInst(id); setInv(rateOf(instById(id), cur)); };

  const Y = Math.max(1, Math.min(30, Math.round(toNum(years))));
  const m = toNum(amount), c = toNum(caja) / 100, i = toNum(inv) / 100, f = toNum(infl) / 100;
  const data = Array.from({ length: Y + 1 }, (_, y) => ({
    label: y === 0 ? "Hoy" : "Año " + y,
    "Caja de ahorro": m * Math.pow(1 + c, y),
    "Invirtiendo": m * Math.pow(1 + i, y),
    "Para no perder (inflación)": m * Math.pow(1 + f, y),
  }));
  const cajaF = m * Math.pow(1 + c, Y), invF = m * Math.pow(1 + i, Y);
  const realLoss = 1 - Math.pow(1 + c, Y) / Math.pow(1 + f, Y);
  const realInv = Math.pow(1 + i, Y) / Math.pow(1 + f, Y) - 1;
  const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } = RC || {};

  return (
    <Section id="beneficios" eyebrow="Por qué invertir" title="Beneficios de invertir en la bolsa"
      intro="Dejar el dinero quieto también tiene un costo: la inflación le quita poder de compra todos los años. Estos son los motivos por los que miles de paraguayos ya invierten en la bolsa.">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {BENEFITS.map(([ic, t, d]) => (
          <article key={t} className="group rounded-2xl border border-line bg-card p-5 hover:border-em/50 hover:-translate-y-0.5 transition">
            <span className="grid place-items-center w-11 h-11 rounded-xl bg-emsoft text-em group-hover:bg-em group-hover:text-white transition"><Icon name={ic} /></span>
            <h3 className="mt-4 font-bold text-ink">{t}</h3>
            <p className="mt-1 text-sm text-muted">{d}</p>
          </article>
        ))}
      </div>

      <div id="ahorro-vs-invertir" className="mt-10 rounded-2xl border border-line bg-card p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="prose-w">
            <p className="eyebrow">Calculadora</p>
            <h3 className="mt-1 text-2xl font-bold text-ink">Caja de ahorro vs. invertir</h3>
            <p className="mt-2 text-sm text-muted">Compará lo que pasa con tu dinero si lo dejás en la caja de ahorro o si lo invertís, frente a la inflación. La meta de inflación del BCP es 4 % anual.</p>
          </div>
          <CurToggle id="ben-cur" cur={cur} setCur={changeCur} />
        </div>
        <div className="mt-6 grid lg:grid-cols-[320px_1fr] gap-6">
          <div className="grid gap-4 content-start">
            <NumField id="ben-amount" label={"Dinero que tenés hoy (" + (cur === "PYG" ? "Gs." : "US$") + ")"} value={amount} onChange={setAmount} cur={cur} step={cur === "PYG" ? 100000 : 50} />
            <div>
              <label htmlFor="ben-inst" className="text-sm font-semibold text-ink block mb-1.5">Invertirlo en</label>
              <select id="ben-inst" value={inst} onChange={(e) => changeInst(e.target.value)} className={FIELD}>
                {["fm", "cda", "bc", "bt", "fi"].filter((id) => instById(id).currencies.includes(cur)).map((id) => <option key={id} value={id}>{instById(id).name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumField id="ben-inv" label="Tasa inversión" value={inv} onChange={setInv} suffix="% año" step={0.1} />
              <NumField id="ben-caja" label="Tasa caja ahorro" value={caja} onChange={setCaja} suffix="% año" step={0.1} />
              <NumField id="ben-infl" label="Inflación" value={infl} onChange={setInfl} suffix="% año" step={0.1} />
              <NumField id="ben-years" label="Años" value={years} onChange={setYears} min={1} max={30} step={1} />
            </div>
          </div>
          <div className="min-w-0 space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <Stat tone="em" label="Invirtiendo tendrías" value={fmtMoney(invF, cur)} sub={"Rendimiento real: " + (realInv >= 0 ? "+" : "") + pct(realInv * 100)} />
              <Stat label="En la caja de ahorro" value={fmtMoney(cajaF, cur)} sub={realLoss > 0 ? "Perdés " + pct(realLoss * 100) + " de poder de compra" : "Mantenés tu poder de compra"} />
              <Stat tone="navy" label="Dejás de ganar por año" value={fmtMoney((invF - cajaF) / Y, cur)} sub={"Promedio en " + Y + (Y === 1 ? " año" : " años")} />
            </div>
            <div className="h-64 rounded-xl border border-line bg-bg p-3">
              {ResponsiveContainer && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={20} />
                    <YAxis tickLine={false} axisLine={false} width={84} tickFormatter={(v) => fmtShort(v, cur)} domain={["auto", "auto"]} />
                    <Tooltip formatter={(v, n) => [fmtMoney(v, cur), n]} contentStyle={TOOLTIP_STYLE} />
                    <Line type="monotone" dataKey="Invirtiendo" stroke="rgb(var(--em))" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="Caja de ahorro" stroke="rgb(var(--muted))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Para no perder (inflación)" stroke="rgb(var(--amber))" strokeWidth={2} strokeDasharray="6 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5"><span className="w-4 h-1 rounded bg-em" />Invirtiendo</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-1 rounded bg-muted" />Caja de ahorro</span>
              <span className="flex items-center gap-1.5"><span className="w-4 h-1 rounded bg-amber" />Lo que necesitás para no perder frente a la inflación</span>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ---------- Dónde invertir según tu objetivo ---------- */
const GOALS = [
  { id: "emergencia", icon: "Umbrella", label: "Fondo de emergencia", months: 12, main: "fm", alt: "rep",
    where: "En una Administradora de Fondos (AFPISA) o a través de tu Casa de Bolsa. Algunos bancos también los ofrecen desde su app.",
    why: "Necesitás poder retirar el dinero en 24 a 72 horas sin perder valor. Un fondo mutuo rescatable te da esa liquidez con un rendimiento mayor que la caja de ahorro.",
    tips: ["Separá entre 3 y 6 meses de tus gastos.", "Evitá instrumentos con plazo fijo para este dinero.", "Elegí un fondo de renta fija de corto plazo."] },
  { id: "meta", icon: "Car", label: "Meta en 1 a 3 años", months: 24, main: "cda", alt: "bc",
    where: "En tu banco (CDA nuevo) o en una Casa de Bolsa (CDA o bonos cortos en el mercado secundario, a veces con mejor tasa).",
    why: "Como sabés cuándo vas a usar el dinero, podés elegir un plazo que venza justo antes de tu meta y asegurar la tasa desde hoy.",
    tips: ["Hacé coincidir el vencimiento con la fecha de tu meta.", "Preferí emisores con calificación AApy o superior.", "Compará la tasa del banco con la del mercado secundario."] },
  { id: "ingreso", icon: "CalendarClock", label: "Cobrar un ingreso mensual", months: 36, main: "bc", alt: "bt", income: true,
    where: "En una Casa de Bolsa: bonos con cupón mensual o trimestral, en colocaciones nuevas o en el mercado secundario.",
    why: "Los bonos pagan intereses periódicos sin que tengas que vender. Si combinás emisiones con distintas fechas de pago, podés cobrar todos los meses.",
    tips: ["Combiná bonos con cupones en meses distintos.", "Diversificá entre varios emisores.", "Revisá cuándo vence cada bono para reinvertir el capital."] },
  { id: "largo", icon: "Sprout", label: "Jubilación o largo plazo", months: 120, main: "bt", alt: "ap",
    where: "En una Casa de Bolsa: bonos del Tesoro y corporativos de largo plazo, acciones y cuotas de fondos de inversión.",
    why: "Con 10 años o más por delante podés tolerar variaciones de precio y aprovechar al máximo el interés compuesto reinvirtiendo los cupones.",
    tips: ["Reinvertí los intereses para potenciar el interés compuesto.", "Sumá una parte en acciones solo si toleras caídas temporales.", "Revisá tu cartera una vez al año."] },
  { id: "dolar", icon: "DollarSign", label: "Protegerme del dólar", months: 36, main: "cda", alt: "bc", forceCur: "USD",
    where: "En un banco o una Casa de Bolsa: CDA, bonos y fondos mutuos en dólares.",
    why: "Si tus metas están en dólares (viajes, estudios, importaciones), invertir en USD evita que una suba del tipo de cambio reduzca tu poder de compra.",
    tips: ["Las empresas con pagos en USD pueden usar futuros de divisas para cubrirse.", "Compará la tasa en USD con la de PYG usando la calculadora PYG vs. USD.", "Tené en cuenta el tipo de cambio de compra y de venta."] },
];

function DondeInvertir() {
  const [goalId, setGoalId] = useState("meta");
  const [curSel, setCurSel] = useState("PYG");
  const [amount, setAmount] = useState(10000000);
  const goal = GOALS.find((g) => g.id === goalId);
  const cur = goal.forceCur || curSel;
  const pick = (id) => { const x = instById(id); return x.currencies.includes(cur) ? x : instById("bc"); };
  const main = pick(goal.main), alt = pick(goal.alt);
  const rate = rateOf(main, cur), altRate = rateOf(alt, cur);
  const amt = toNum(amount);
  const final = fv(amt, 0, rate, goal.months);
  const changeCur = (c) => { setCurSel(c); setAmount(c === "PYG" ? 10000000 : 2000); };
  const selectGoal = (id) => { setGoalId(id); const g = GOALS.find((x) => x.id === id); if (g.forceCur && curSel !== "USD") { setCurSel("USD"); setAmount(5000); } };

  return (
    <Section id="donde" eyebrow="Dónde invertir" title="¿Dónde invierto según mi objetivo?"
      intro="Elegí qué querés lograr y cuánto tenés. Te mostramos qué instrumento suele encajar, dónde se compra y cuánto podría rendir. Es una guía educativa, no una recomendación personal.">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" role="radiogroup" aria-label="Objetivo">
        {GOALS.map((g) => (
          <button key={g.id} id={"goal-" + g.id} role="radio" aria-checked={goalId === g.id} onClick={() => selectGoal(g.id)}
            className={"text-left rounded-2xl border p-4 transition " + (goalId === g.id ? "border-em bg-emsoft ring-2 ring-em/20" : "border-line bg-card hover:border-em/50")}>
            <Icon name={g.icon} className={"w-6 h-6 " + (goalId === g.id ? "text-em" : "text-muted")} />
            <p className="mt-2 font-semibold text-ink leading-snug text-sm sm:text-base">{g.label}</p>
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-end gap-4 rounded-2xl border border-line bg-card p-4">
        <div>
          <p className="text-sm font-semibold text-ink mb-1.5">Moneda</p>
          <CurToggle id="donde-cur" cur={cur} setCur={changeCur} disabled={!!goal.forceCur} />
        </div>
        <div className="w-full sm:w-64">
          <NumField id="donde-amount" label={"Monto a invertir (" + (cur === "PYG" ? "Gs." : "US$") + ")"} value={amount} onChange={setAmount} cur={cur} step={cur === "PYG" ? 100000 : 50} />
        </div>
        {goal.forceCur && <p className="text-xs text-amber">Para este objetivo el cálculo se hace en dólares.</p>}
      </div>

      <div key={goalId + cur} className="fade-in mt-5 grid lg:grid-cols-[1.4fr_1fr] gap-5">
        <article className="rounded-2xl border border-em/40 bg-card p-6 sm:p-7 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="eyebrow">Opción principal</p>
              <h3 className="mt-1 text-2xl font-bold text-ink">{main.name} {cur === "USD" && "en dólares"}</h3>
            </div>
            <Pill className={RISK_STYLE[main.risk]}>Riesgo {main.risk.toLowerCase()}</Pill>
          </div>
          <p className="mt-3 text-ink">{goal.why}</p>
          <div className="mt-4 rounded-xl bg-soft p-4 flex gap-3">
            <Icon name="MapPin" className="w-5 h-5 text-em shrink-0 mt-0.5" />
            <div><p className="text-sm font-semibold text-ink">Dónde se compra</p><p className="text-sm text-muted">{goal.where}</p></div>
          </div>
          <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {[["Tasa de referencia", "≈ " + pct(rate)], ["Plazo típico", main.term], ["Liquidez", main.liquidity], ["Monto mínimo", main.min]].map(([k, v]) => (
              <div key={k} className="min-w-0"><dt className="text-xs text-muted">{k}</dt><dd className="font-semibold text-ink num">{v}</dd></div>
            ))}
          </dl>
          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <Stat tone="navy" label={"En " + (goal.months >= 12 ? goal.months / 12 + (goal.months === 12 ? " año" : " años") : goal.months + " meses") + " tendrías"} value={fmtMoney(final, cur)} sub="Reinvirtiendo los intereses" />
            {goal.income
              ? <Stat tone="em" label="Cobro mensual estimado" value={fmtMoney(amt * rate / 100 / 12, cur)} sub="Si cobrás los cupones en vez de reinvertir" />
              : <Stat tone="em" label="Intereses ganados" value={"+ " + fmtMoney(final - amt, cur)} />}
          </div>
        </article>

        <div className="space-y-5 min-w-0">
          <article className="rounded-2xl border border-line bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Alternativa</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <h4 className="text-lg font-bold text-ink">{alt.name}</h4>
              <span className="num font-semibold text-em">≈ {pct(altRate)}</span>
            </div>
            <p className="mt-1 text-sm text-muted line-clamp-3">{alt.summary}</p>
          </article>
          <article className="rounded-2xl border border-line bg-card p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-ink"><Icon name="Lightbulb" className="w-4 h-4 text-amber" /> Tené en cuenta</p>
            <ul className="mt-3 space-y-2">{goal.tips.map((t) => <li key={t} className="flex gap-2 text-sm text-ink"><Icon name="Check" className="w-4 h-4 text-em shrink-0 mt-0.5" />{t}</li>)}</ul>
          </article>
          <button onClick={() => scrollTo("simulador")} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-em px-5 py-3 font-semibold text-white hover:brightness-110 transition">
            <Icon name="Calculator" className="w-4 h-4" /> Simular con aportes mensuales
          </button>
        </div>
      </div>
      <div className="mt-5"><Notice>Las tasas son orientativas y cambian con el mercado. Antes de invertir, pedí a tu Casa de Bolsa las opciones vigentes, el prospecto y la calificación de cada emisor.</Notice></div>
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
            <a href="https://www.bolsadevalores.com.py" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 opacity-90 hover:opacity-100 underline-offset-2 hover:underline">Bolsa de Valores de Asunción <Icon name="ExternalLink" className="w-3.5 h-3.5" /></a>
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

/* ===== PARTE 3 DE 6: Cómo funciona, mapa del mercado, casos, paso a paso y checklist ===== */
/* ---------- 2. ecosistema ---------- */
function Ecosistema() {
  const actors = [
    { icon: "Scale", title: "Superintendencia de Valores (SIV – BCP)", role: "Regula y supervisa", text: "Dependiente del Banco Central del Paraguay (antes Comisión Nacional de Valores). Autoriza a las Casas de Bolsa, registra las emisiones y controla que se cumplan las reglas del mercado para proteger al inversor." },
    { icon: "Landmark", title: "Bolsa de Valores de Asunción (BVA)", role: "Donde se negocia", text: "Antes conocida como BVPASA. Es el mercado organizado donde se compran y venden los títulos, publica precios y emisiones. La custodia y liquidación de los títulos la realiza la Caja de Valores del Paraguay (CAVAPY)." },
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
            ["Ejemplo", "Una empresa paraguaya lanza bonos a 5 años al 9 % en Gs. y vos comprás en la colocación."],
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
    list: ["Buscala en el registro de Casas de Bolsa de la Superintendencia de Valores (bcp.gov.py).", "Confirmá que figure como miembro de la BVA (bolsadevalores.com.py).", "Pedí el tarifario: comisión de corretaje, custodia y otros costos.", "Probá su atención y su app antes de transferir dinero."],
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

/* ---------- 13. mapa del mercado ---------- */
const SECTORS = [
  { icon: "Landmark", name: "Bancos y financieras", issues: ["CDA", "Bonos", "Bonos subordinados"], risk: "Bajo a medio", text: "Son los emisores más frecuentes. Captan fondos con CDA y bonos para prestar a sus clientes. Además están supervisados por la Superintendencia de Bancos del BCP." },
  { icon: "Building2", name: "Estado paraguayo", issues: ["Bonos del Tesoro"], risk: "Bajo", text: "El Ministerio de Economía y Finanzas emite bonos para financiar el presupuesto y obras públicas." },
  { icon: "Wheat", name: "Agro y agroindustria", issues: ["Bonos", "Acciones preferidas"], risk: "Medio", text: "Exportadores, acopiadores e industrias de alimentos se financian para capital de trabajo e inversión. Su desempeño depende del clima y de los precios internacionales." },
  { icon: "Store", name: "Comercio y consumo", issues: ["Bonos", "Acciones preferidas"], risk: "Medio", text: "Cadenas de retail, distribuidoras y empresas de consumo masivo que financian su expansión." },
  { icon: "HardHat", name: "Inmobiliario y construcción", issues: ["Bonos", "Fondos de inversión"], risk: "Medio a alto", text: "Desarrolladoras y fondos que financian edificios, loteamientos y proyectos de largo plazo." },
  { icon: "Zap", name: "Industria, energía y servicios", issues: ["Bonos", "Acciones"], risk: "Medio", text: "Empresas industriales, de logística, salud, educación y servicios que buscan financiamiento de mediano plazo." },
  { icon: "PieChart", name: "Administradoras de fondos", issues: ["Fondos mutuos", "Fondos de inversión"], risk: "Bajo a alto", text: "Las AFPISA reúnen el dinero de muchos inversores y lo invierten en una cartera diversificada según el reglamento de cada fondo." },
];

function Mapa() {
  const [sel, setSel] = useState(0);
  const s = SECTORS[sel];
  return (
    <Section id="mapa" eyebrow="Mapa del mercado" title="¿Quiénes emiten en la bolsa paraguaya?"
      intro="Distintos sectores de la economía se financian en la bolsa. Elegí uno para ver qué tipo de títulos suele emitir y cuál es su perfil de riesgo.">
      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {SECTORS.map((x, k) => (
            <button key={x.name} id={"sector-" + k} onClick={() => setSel(k)} aria-pressed={sel === k}
              className={"text-left rounded-2xl border p-4 transition min-h-[120px] " + (sel === k ? "border-navy bg-navy text-navyfg" : "border-line bg-card hover:border-em/50 text-ink")}>
              <Icon name={x.icon} className={"w-6 h-6 " + (sel === k ? "" : "text-em")} />
              <p className="mt-3 font-semibold text-sm leading-snug">{x.name}</p>
            </button>
          ))}
        </div>
        <article key={sel} className="fade-in rounded-2xl border border-line bg-card p-6">
          <span className="grid place-items-center w-11 h-11 rounded-xl bg-emsoft text-em"><Icon name={s.icon} /></span>
          <h3 className="mt-3 text-xl font-bold text-ink">{s.name}</h3>
          <p className="mt-2 text-sm text-muted">{s.text}</p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">Suele emitir</p>
          <div className="mt-2 flex flex-wrap gap-1.5">{s.issues.map((i) => <Pill key={i} className="bg-soft text-ink">{i}</Pill>)}</div>
          <p className="mt-4 text-sm"><span className="text-muted">Riesgo típico: </span><span className="font-semibold text-ink">{s.risk}</span></p>
          <p className="mt-4 text-xs text-muted">Las emisiones vigentes y sus emisores se publican en el sitio de la BVA. El riesgo real depende de cada emisor: revisá siempre su calificación.</p>
        </article>
      </div>
    </Section>
  );
}

/* ---------- 6. casos de ejemplo ---------- */
const CASES = [
  { name: "Ana", age: 24, who: "Empleada, primer trabajo", icon: "User", goal: "Armar su fondo de emergencia y empezar a invertir.", cur: "PYG", initial: 500000, monthly: 500000, years: 3,
    mix: [["Fondo mutuo", 70, 6], ["CDA", 30, 7.5]] },
  { name: "Diego", age: 35, who: "Profesional independiente", icon: "Briefcase", goal: "Juntar la entrega de un departamento en 4 años.", cur: "PYG", initial: 20000000, monthly: 2000000, years: 4,
    mix: [["CDA", 50, 7.5], ["Bonos corporativos AApy", 50, 9.5]] },
  { name: "Don Carlos", age: 66, who: "Jubilado", icon: "Sprout", goal: "Complementar su jubilación con cupones mensuales.", cur: "PYG", initial: 300000000, monthly: 0, years: 5, income: true,
    mix: [["Bonos del Tesoro", 50, 8.5], ["Bonos corporativos", 30, 9.5], ["Fondo mutuo", 20, 6]] },
  { name: "Laura", age: 29, who: "Trabaja para una empresa del exterior", icon: "Plane", goal: "Ahorrar en dólares para un posgrado.", cur: "USD", initial: 3000, monthly: 300, years: 3,
    mix: [["Fondo mutuo USD", 30, 3.8], ["CDA USD", 40, 5.2], ["Bonos USD", 30, 7]] },
];

function Casos() {
  const [sel, setSel] = useState(0);
  const c = CASES[sel];
  const rate = c.mix.reduce((s, [, w, r]) => s + (w * r) / 100, 0);
  const months = c.years * 12;
  const final = fv(c.initial, c.monthly, rate, months);
  const contrib = c.initial + c.monthly * months;
  return (
    <Section id="casos" eyebrow="Casos de ejemplo" title="Cómo invierten personas como vos"
      intro="Cuatro ejemplos ilustrativos con objetivos distintos. Tocá cada persona para ver su cartera y su resultado estimado.">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {CASES.map((p, k) => (
          <button key={p.name} id={"case-" + k} onClick={() => setSel(k)} aria-pressed={sel === k}
            className={"text-left rounded-2xl border p-4 transition " + (sel === k ? "border-em bg-emsoft" : "border-line bg-card hover:border-em/50")}>
            <span className={"grid place-items-center w-10 h-10 rounded-full " + (sel === k ? "bg-em text-white" : "bg-soft text-ink")}><Icon name={p.icon} className="w-5 h-5" /></span>
            <p className="mt-2 font-bold text-ink">{p.name}, <span className="num">{p.age}</span></p>
            <p className="text-xs text-muted">{p.who}</p>
          </button>
        ))}
      </div>
      <article key={sel} className="fade-in mt-5 rounded-2xl border border-line bg-card p-6 sm:p-7 grid lg:grid-cols-[1fr_1fr] gap-6">
        <div className="min-w-0">
          <p className="eyebrow">Objetivo</p>
          <h3 className="mt-1 text-xl font-bold text-ink">{c.goal}</h3>
          <p className="mt-3 text-sm text-muted num">
            Empieza con {fmtMoney(c.initial, c.cur)}{c.monthly > 0 ? " y suma " + fmtMoney(c.monthly, c.cur) + " por mes" : ""} durante {c.years} años.
          </p>
          <p className="mt-5 text-sm font-semibold text-ink">Su cartera</p>
          <ul className="mt-2 space-y-3">
            {c.mix.map(([n, w, r]) => (
              <li key={n}>
                <div className="flex justify-between text-sm"><span className="text-ink">{n}</span><span className="num text-muted">{w} % · ≈ {pct(r)}</span></div>
                <div className="mt-1 h-2 rounded-full bg-soft overflow-hidden"><div className="h-full bg-em rounded-full" style={{ width: w + "%" }} /></div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted num">Tasa promedio ponderada: ≈ {pct(rate, 2)} anual</p>
        </div>
        <div className="grid gap-3 content-start">
          {c.income ? (
            <>
              <Stat tone="navy" label="Cobro mensual estimado" value={fmtMoney((c.initial * rate) / 100 / 12, c.cur)} sub="Cobrando los cupones sin reinvertir" />
              <Stat label="Cobro anual estimado" value={fmtMoney((c.initial * rate) / 100, c.cur)} />
              <Stat tone="em" label="Capital que conserva" value={fmtMoney(c.initial, c.cur)} sub="Se devuelve al vencimiento de cada título" />
            </>
          ) : (
            <>
              <Stat tone="navy" label={"Tendría en " + c.years + " años"} value={fmtMoney(final, c.cur)} />
              <Stat label="Total aportado" value={fmtMoney(contrib, c.cur)} />
              <Stat tone="em" label="Intereses ganados" value={"+ " + fmtMoney(final - contrib, c.cur)} />
            </>
          )}
        </div>
      </article>
      <p className="mt-3 text-xs text-muted">Personas y cifras ficticias, con tasas constantes y sin comisiones ni impuestos. Sirven para entender el mecanismo, no como recomendación.</p>
    </Section>
  );
}

/* ---------- 9. checklist antes de invertir ---------- */
const PRE_CHECK = [
  "Tengo un fondo de emergencia separado (3 a 6 meses de gastos).",
  "Sé para qué invierto y cuándo voy a necesitar el dinero.",
  "Verifiqué que la Casa de Bolsa esté habilitada por el BCP y la BVA.",
  "Conozco el tarifario: comisiones, custodia y aranceles.",
  "Leí el prospecto o la ficha del producto.",
  "Revisé la calificación de riesgo del emisor.",
  "Entiendo cuándo y cómo cobro los intereses y el capital.",
  "Sé si puedo vender antes del vencimiento y en qué condiciones.",
  "No estoy usando dinero que necesito para los gastos del mes.",
  "Diversifiqué: no puse todo en un solo emisor.",
];

function ChecklistPre() {
  const [done, setDone] = usePersisted("bpy-checklist", {});
  const n = PRE_CHECK.filter((_, k) => done[k]).length;
  const ready = n === PRE_CHECK.length;
  return (
    <Section id="checklist" eyebrow="Antes de invertir" title="Checklist: ¿estás listo para tu primera inversión?"
      intro="Marcá cada punto que ya cumpliste. Tu progreso se guarda en este navegador.">
      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        <ul className="grid sm:grid-cols-2 gap-3">
          {PRE_CHECK.map((t, k) => (
            <li key={k}>
              <label htmlFor={"pre-" + k} className={"flex gap-3 h-full cursor-pointer rounded-xl border p-4 transition " + (done[k] ? "border-em/40 bg-emsoft" : "border-line bg-card hover:border-em/50")}>
                <input id={"pre-" + k} type="checkbox" className="mt-1 w-4 h-4 accent-[rgb(var(--em))] shrink-0" checked={!!done[k]} onChange={(e) => setDone({ ...done, [k]: e.target.checked })} />
                <span className="text-sm text-ink"><span className="num text-muted mr-1">{k + 1}.</span>{t}</span>
              </label>
            </li>
          ))}
        </ul>
        <aside className="rounded-2xl border border-line bg-card p-6 text-center lg:sticky lg:top-24">
          <div className="relative mx-auto w-32 h-32">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgb(var(--soft))" strokeWidth="12" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="rgb(var(--em))" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52 * (1 - n / PRE_CHECK.length)} style={{ transition: "stroke-dashoffset .5s" }} />
            </svg>
            <div className="absolute inset-0 grid place-items-center"><p className="num font-display text-3xl font-extrabold text-ink">{n}/{PRE_CHECK.length}</p></div>
          </div>
          <p className={"mt-4 font-bold " + (ready ? "text-em" : "text-ink")}>{ready ? "¡Estás listo para invertir!" : n >= 7 ? "Te falta poco" : "Seguí preparándote"}</p>
          <p className="mt-1 text-sm text-muted">{ready ? "Cumpliste todos los puntos básicos. El siguiente paso es hablar con tu Casa de Bolsa." : "Completá los puntos pendientes antes de transferir dinero."}</p>
          {n > 0 && <button onClick={() => setDone({})} className="mt-4 text-sm text-muted underline hover:text-ink">Reiniciar</button>}
        </aside>
      </div>
    </Section>
  );
}

/* ===== PARTE 4 DE 6: Casas de Bolsa, instrumentos, prospecto y línea de tiempo ===== */
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
  const done = Object.values(checked).filter(Boolean).length;
  const list = BROKERS.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()));

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
            <p className="text-sm text-muted num">{list.length} de {BROKERS.length} habilitadas</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {list.map((b) => (
              <div key={b.name} className="flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-2.5">
                <span className="grid place-items-center w-9 h-9 shrink-0 rounded-lg bg-navy text-navyfg font-display font-bold text-xs">{b.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink leading-snug text-sm">{b.name}</p>
                  <p className="text-xs text-muted">Casa de Bolsa S.A.</p>
                </div>
              </div>
            ))}
            {list.length === 0 && <p className="text-sm text-muted sm:col-span-2 p-4">No hay resultados para «{q}». Probá con otro nombre.</p>}
          </div>
          <div className="mt-4">
            <Notice>
              <strong>Lista de Casas de Bolsa habilitadas según el sitio de la BVA, consultado en noviembre de 2026.</strong> Es informativa y no constituye una recomendación. La lista puede cambiar. Verificá siempre la lista vigente en el sitio oficial del Banco Central del Paraguay (<a className="underline text-em" href="https://www.bcp.gov.py" target="_blank" rel="noopener">bcp.gov.py</a>) y de la Bolsa de Valores de Asunción (<a className="underline text-em" href="https://www.bolsadevalores.com.py" target="_blank" rel="noopener">bolsadevalores.com.py</a>).
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

/* ---------- 7. cómo leer un prospecto ---------- */
const PROSPECTO = [
  ["Emisor", "Ejemplo Alimentos S.A.", "La empresa que pide el dinero prestado. Investigá a qué se dedica, hace cuánto opera y cómo le va."],
  ["Programa de emisión", "PEG G1 · hasta Gs. 50.000.000.000", "Programa de Emisión Global: el monto máximo que la empresa puede emitir, dividido en series que se colocan en distintos momentos."],
  ["Serie", "Serie 3", "Cada colocación dentro del programa. Las series pueden tener distinta tasa, plazo y monto."],
  ["Moneda", "Guaraníes (PYG)", "La moneda en que invertís, cobrás los intereses y recibís el capital."],
  ["Monto de la serie", "Gs. 10.000.000.000", "Cuánto dinero busca colocar el emisor en esta serie."],
  ["Valor nominal", "Gs. 1.000.000 por título", "El valor de cada título y la base sobre la que se calculan los intereses. Suele ser el monto mínimo de compra."],
  ["Tasa de interés", "9,50 % anual", "El rendimiento anual que paga el bono sobre el valor nominal."],
  ["Pago de intereses", "Trimestral", "Cada cuánto cobrás el cupón. Trimestral significa 4 pagos por año: con Gs. 10.000.000 cobrarías Gs. 237.500 cada tres meses."],
  ["Plazo y vencimiento", "1.825 días · 15/11/2031", "Cuánto dura el bono y en qué fecha te devuelven el capital."],
  ["Amortización", "Al vencimiento", "Cómo se devuelve el capital: todo junto al final o en cuotas durante la vida del bono."],
  ["Garantía", "Común", "Garantía común: respaldada por todo el patrimonio del emisor, sin un bien específico. Otras emisiones tienen garantías especiales, como hipotecas o fideicomisos."],
  ["Calificación", "AApy · Tendencia estable", "La nota de riesgo que asignó una calificadora. La tendencia (fuerte, estable o sensible) anticipa posibles cambios."],
  ["Destino de los fondos", "Capital de trabajo y refinanciación de deudas", "Para qué usará la empresa tu dinero. Un destino claro y productivo es una buena señal."],
  ["Agente colocador", "Casa de Bolsa Ejemplo S.A.", "La Casa de Bolsa encargada de colocar la emisión en el mercado primario."],
  ["Representante de obligacionistas", "Ejemplo Representante S.A.", "Representa y defiende a los inversores que tienen los bonos frente al emisor."],
];

function Prospecto() {
  const [sel, setSel] = useState(6);
  const [k, v, exp] = PROSPECTO[sel];
  return (
    <Section id="prospecto" eyebrow="Aprendé a leer" title="Cómo leer el prospecto de un bono"
      intro="Esta es la ficha resumen de una emisión de ejemplo. Tocá o pasá el mouse sobre cada dato para entender qué significa.">
      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 items-start">
        <div className="rounded-2xl border border-line bg-card overflow-hidden">
          <div className="bg-navy text-navyfg px-5 py-4 flex items-center justify-between gap-3">
            <div><p className="text-xs uppercase tracking-wider opacity-70">Ficha de emisión</p><p className="font-display font-bold">Bonos Ejemplo Alimentos S.A.</p></div>
            <Pill className="bg-amber text-navy">Ficticia</Pill>
          </div>
          <dl className="divide-y divide-line">
            {PROSPECTO.map(([kk, vv], i) => (
              <button key={kk} id={"pros-" + i} type="button" onMouseEnter={() => setSel(i)} onFocus={() => setSel(i)} onClick={() => setSel(i)}
                className={"w-full text-left grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 px-5 py-2.5 text-sm transition " + (sel === i ? "bg-emsoft" : "hover:bg-soft")}>
                <dt className={sel === i ? "font-semibold text-em" : "text-muted"}>{kk}</dt>
                <dd className="text-ink font-medium num">{vv}</dd>
              </button>
            ))}
          </dl>
        </div>
        <aside className="rounded-2xl border border-em/40 bg-card p-6 lg:sticky lg:top-24">
          <p className="flex items-center gap-2 text-sm font-semibold text-em"><Icon name="HelpCircle" className="w-4 h-4" /> ¿Qué significa?</p>
          <h3 className="mt-2 text-xl font-bold text-ink">{k}</h3>
          <p className="mt-1 text-sm text-muted num">En este ejemplo: <span className="text-ink font-semibold">{v}</span></p>
          <p key={sel} className="fade-in mt-4 text-ink">{exp}</p>
          <div className="mt-5 flex justify-between gap-2">
            <button onClick={() => setSel((sel - 1 + PROSPECTO.length) % PROSPECTO.length)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-line text-sm text-ink hover:bg-soft"><Icon name="ChevronLeft" className="w-4 h-4" /> Anterior</button>
            <span className="text-xs text-muted num self-center">{sel + 1} / {PROSPECTO.length}</span>
            <button onClick={() => setSel((sel + 1) % PROSPECTO.length)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-line text-sm text-ink hover:bg-soft">Siguiente <Icon name="ChevronRight" className="w-4 h-4" /></button>
          </div>
        </aside>
      </div>
    </Section>
  );
}

/* ---------- 8. línea de tiempo de una inversión ---------- */
function LineaTiempo() {
  const start = new Date(2026, 0, 15);
  const nominal = 10000000, rate = 9, per = 6, years = 3;
  const coupon = (nominal * rate) / 100 / (12 / per);
  const events = [{ type: "buy", date: start, title: "Compra", amount: -nominal, text: "Comprás Gs. 10.000.000 en bonos a 3 años, al 9 % anual con cupón semestral, a través de tu Casa de Bolsa. El dinero sale de tu cuenta y los títulos quedan registrados a tu nombre." }];
  for (let k = 1; k <= (years * 12) / per; k++) {
    const last = k === (years * 12) / per;
    events.push({ type: last ? "end" : "coupon", date: addMonths(start, k * per), title: last ? "Vencimiento" : "Cupón " + k, amount: last ? coupon + nominal : coupon,
      text: last ? "Cobrás el último cupón de Gs. 450.000 y te devuelven el capital de Gs. 10.000.000. La inversión terminó." : "Cobrás Gs. 450.000 de intereses (9 % ÷ 2). El dinero llega a tu cuenta en la Casa de Bolsa y podés retirarlo o reinvertirlo." });
  }
  events.push({ type: "reinvest", date: addMonths(start, years * 12 + 1), title: "Reinversión", amount: 0, text: "Decidís qué hacer: reinvertir el capital y los intereses en una nueva emisión, cambiar de instrumento o usar el dinero para tu meta." });
  const [sel, setSel] = useState(1);
  const e = events[sel];
  const totalInt = coupon * ((years * 12) / per);
  const style = { buy: "bg-navy text-navyfg", coupon: "bg-em text-white", end: "bg-amber text-navy", reinvest: "bg-soft text-ink border border-line" };
  const icon = { buy: "ShoppingCart", coupon: "Coins", end: "Flag", reinvest: "RefreshCw" };
  return (
    <Section id="linea" eyebrow="Ciclo de vida" title="Línea de tiempo de una inversión"
      intro="Así se ve, paso a paso, un bono de Gs. 10.000.000 a 3 años con cupón semestral. Tocá cada punto para ver qué pasa ese día.">
      <div className="rounded-2xl border border-line bg-card p-5 sm:p-7">
        <div className="overflow-x-auto pb-2">
          <ol className="relative flex min-w-[720px] justify-between gap-2 pt-2">
            <div className="absolute left-6 right-6 top-8 h-1 rounded-full bg-soft" aria-hidden="true" />
            <div className="absolute left-6 top-8 h-1 rounded-full bg-em transition-all duration-500" style={{ width: "calc((100% - 3rem) * " + sel / (events.length - 1) + ")" }} aria-hidden="true" />
            {events.map((ev, k) => (
              <li key={k} className="relative flex flex-col items-center text-center w-20">
                <button id={"ev-" + k} onClick={() => setSel(k)} aria-pressed={sel === k} aria-label={ev.title + " " + fmtDate(ev.date)}
                  className={"grid place-items-center w-12 h-12 rounded-full transition " + style[ev.type] + (sel === k ? " ring-4 ring-em/30 scale-110" : " hover:scale-105")}>
                  <Icon name={icon[ev.type]} className="w-5 h-5" />
                </button>
                <p className="mt-2 text-xs font-semibold text-ink">{ev.title}</p>
                <p className="text-[11px] text-muted num">{fmtDate(ev.date)}</p>
              </li>
            ))}
          </ol>
        </div>
        <div key={sel} className="fade-in mt-5 grid md:grid-cols-[1fr_auto] gap-4 items-center rounded-xl bg-bg border border-line p-5">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-em num">{fmtDate(e.date)}</p>
            <h3 className="text-lg font-bold text-ink">{e.title}</h3>
            <p className="mt-1 text-sm text-muted">{e.text}</p>
          </div>
          {e.amount !== 0 && <p className={"num font-display text-2xl font-bold " + (e.amount < 0 ? "text-ink" : "text-em")}>{e.amount < 0 ? "− " : "+ "}{fmtMoney(Math.abs(e.amount), "PYG")}</p>}
        </div>
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <Stat label="Invertiste" value={fmtMoney(nominal, "PYG")} />
          <Stat tone="em" label="Cobraste en intereses" value={"+ " + fmtMoney(totalInt, "PYG")} sub="6 cupones de Gs. 450.000" />
          <Stat tone="navy" label="Recibiste en total" value={fmtMoney(nominal + totalInt, "PYG")} />
        </div>
        <p className="mt-3 text-xs text-muted">Ejemplo ilustrativo sin comisiones ni impuestos. Las fechas reales de pago figuran en el prospecto de cada emisión.</p>
      </div>
    </Section>
  );
}

/* ===== PARTE 5 DE 6: Simulador y calculadoras ===== */
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
    <div>
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
          <ShareButtons text={"Simulé invertir " + fmtMoney(toNum(initial), cur) + " + " + fmtMoney(toNum(monthly), cur) + " por mes durante " + months + " meses al " + rate + " % anual: llegaría a " + fmtMoney(sim.total, cur) + "."} />
        </div>
      </div>
    </div>
  );
}

/* ---------- 2. meta de ahorro ---------- */
function CalcMeta() {
  const [cur, setCur] = useState("PYG");
  const [target, setTarget] = useState(50000000);
  const [years, setYears] = useState(4);
  const [now, setNow] = useState(5000000);
  const [rate, setRate] = useState(8);
  const changeCur = (c) => { setCur(c); if (c === "PYG") { setTarget(50000000); setNow(5000000); setRate(8); } else { setTarget(10000); setNow(1000); setRate(5.5); } };
  const n = Math.max(1, Math.round(toNum(years) * 12));
  const r = Math.pow(1 + toNum(rate) / 100, 1 / 12) - 1;
  const grownNow = toNum(now) * Math.pow(1 + r, n);
  const need = toNum(target) - grownNow;
  const pmt = need <= 0 ? 0 : r === 0 ? need / n : (need * r) / (Math.pow(1 + r, n) - 1);
  const contrib = toNum(now) + pmt * n;
  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-6">
      <div className="grid gap-4 content-start">
        <CurToggle id="meta-cur" cur={cur} setCur={changeCur} />
        <NumField id="meta-target" label="¿Cuánto querés juntar?" value={target} onChange={setTarget} cur={cur} step={cur === "PYG" ? 1000000 : 100} />
        <NumField id="meta-now" label="¿Cuánto tenés hoy para empezar?" value={now} onChange={setNow} cur={cur} step={cur === "PYG" ? 100000 : 50} />
        <div className="grid grid-cols-2 gap-3">
          <NumField id="meta-years" label="Plazo" value={years} onChange={setYears} suffix="años" min={1} max={40} step={1} />
          <NumField id="meta-rate" label="Tasa anual" value={rate} onChange={setRate} suffix="%" step={0.1} />
        </div>
      </div>
      <div className="min-w-0 space-y-4">
        {need <= 0 ? (
          <div className="rounded-2xl bg-emsoft border border-em/30 p-6">
            <p className="text-em font-bold text-lg">¡No necesitás aportes mensuales!</p>
            <p className="mt-1 text-ink num">Con {fmtMoney(now, cur)} invertidos al {pct(rate)} llegarías a {fmtMoney(grownNow, cur)}, por encima de tu meta.</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-navy text-navyfg p-6">
            <p className="text-xs uppercase tracking-wider opacity-70">Tenés que invertir por mes</p>
            <p className="mt-1 num font-display text-4xl font-extrabold break-words">{fmtMoney(pmt, cur)}</p>
            <p className="mt-2 text-sm opacity-80 num">durante {n} meses para llegar a {fmtMoney(target, cur)}</p>
          </div>
        )}
        <div className="grid sm:grid-cols-3 gap-3">
          <Stat label="Total que aportás" value={fmtMoney(contrib, cur)} />
          <Stat tone="em" label="Lo que ponen los intereses" value={"+ " + fmtMoney(Math.max(0, Math.max(toNum(target), grownNow) - contrib), cur)} />
          <Stat label="Sin invertir, por mes" value={fmtMoney(Math.max(0, (toNum(target) - toNum(now)) / n), cur)} sub="Guardando sin ganar intereses" />
        </div>
        <Notice tone="em">Consejo: si tu meta es en menos de 3 años, usá instrumentos de bajo riesgo con vencimiento cercano a la fecha de tu meta.</Notice>
      </div>
    </div>
  );
}

/* ---------- 3. bono y calendario de cupones ---------- */
function CalcBono() {
  const [cur, setCur] = useState("PYG");
  const [nominal, setNominal] = useState(10000000);
  const [rate, setRate] = useState(9);
  const [freq, setFreq] = useState(6);
  const [years, setYears] = useState(3);
  const [startStr, setStartStr] = useState(() => new Date().toISOString().slice(0, 10));
  const [wanted, setWanted] = useState(1000000);
  const changeCur = (c) => { setCur(c); if (c === "PYG") { setNominal(10000000); setRate(9); setWanted(1000000); } else { setNominal(5000); setRate(7); setWanted(300); } };
  const start = (() => { const d = new Date(startStr + "T12:00:00"); return isNaN(d) ? new Date() : d; })();
  const nPay = Math.max(1, Math.min(240, Math.round((toNum(years) * 12) / freq)));
  const coupon = (toNum(nominal) * toNum(rate)) / 100 / (12 / freq);
  const rows = Array.from({ length: nPay }, (_, k) => ({ n: k + 1, date: addMonths(start, (k + 1) * freq), coupon, capital: k === nPay - 1 ? toNum(nominal) : 0 }));
  const needed = toNum(rate) > 0 ? (toNum(wanted) * 12) / (toNum(rate) / 100) : 0;
  const freqName = { 1: "mensual", 3: "trimestral", 6: "semestral", 12: "anual" }[freq];
  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        <div className="grid gap-4 content-start">
          <CurToggle id="bono-cur" cur={cur} setCur={changeCur} />
          <NumField id="bono-nominal" label="Monto invertido (valor nominal)" value={nominal} onChange={setNominal} cur={cur} step={cur === "PYG" ? 1000000 : 500} />
          <div className="grid grid-cols-2 gap-3">
            <NumField id="bono-rate" label="Tasa anual" value={rate} onChange={setRate} suffix="%" step={0.1} />
            <NumField id="bono-years" label="Plazo" value={years} onChange={setYears} suffix="años" min={1} max={20} step={1} />
          </div>
          <div>
            <label htmlFor="bono-freq" className="text-sm font-semibold text-ink block mb-1.5">Pago de cupones</label>
            <select id="bono-freq" value={freq} onChange={(e) => setFreq(Number(e.target.value))} className={FIELD}>
              <option value={1}>Mensual</option><option value={3}>Trimestral</option><option value={6}>Semestral</option><option value={12}>Anual</option>
            </select>
          </div>
          <div>
            <label htmlFor="bono-start" className="text-sm font-semibold text-ink block mb-1.5">Fecha de compra</label>
            <input id="bono-start" type="date" value={startStr} onChange={(e) => setStartStr(e.target.value)} className={FIELD} />
          </div>
        </div>
        <div className="min-w-0 space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <Stat tone="navy" label={"Cupón " + freqName} value={fmtMoney(coupon, cur)} />
            <Stat tone="em" label="Total de intereses" value={"+ " + fmtMoney(coupon * nPay, cur)} sub={nPay + " cupones"} />
            <Stat label="Equivale por mes a" value={fmtMoney((toNum(nominal) * toNum(rate)) / 100 / 12, cur)} />
          </div>
          <div className="rounded-xl border border-line overflow-hidden">
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-sm min-w-[420px]">
                <thead className="bg-soft sticky top-0"><tr className="text-left text-muted">
                  <th className="p-2.5 font-semibold">N.º</th><th className="p-2.5 font-semibold">Fecha</th><th className="p-2.5 font-semibold text-right">Cupón</th><th className="p-2.5 font-semibold text-right">Capital</th><th className="p-2.5 font-semibold text-right">Cobrás</th>
                </tr></thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.n} className={r.capital ? "bg-emsoft" : ""}>
                      <td className="p-2.5 num text-muted">{r.n}</td><td className="p-2.5 num text-ink">{fmtDate(r.date)}</td>
                      <td className="p-2.5 num text-right text-ink">{fmtMoney(r.coupon, cur)}</td>
                      <td className="p-2.5 num text-right text-ink">{r.capital ? fmtMoney(r.capital, cur) : "—"}</td>
                      <td className="p-2.5 num text-right font-semibold text-em">{fmtMoney(r.coupon + r.capital, cur)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-muted">Fechas aproximadas: el calendario real lo fija el prospecto. Montos brutos, antes de impuestos y comisiones.</p>
        </div>
      </div>
      <div className="rounded-2xl border border-line bg-bg p-5 grid md:grid-cols-[1fr_1fr] gap-5 items-center">
        <div>
          <h4 className="font-bold text-ink flex items-center gap-2"><Icon name="Target" className="w-5 h-5 text-em" /> ¿Cuánto necesito para cobrar un ingreso mensual?</h4>
          <p className="mt-1 text-sm text-muted">Calculado con la tasa anual de arriba ({pct(rate)}), cobrando los intereses sin reinvertir.</p>
          <div className="mt-3 max-w-xs"><NumField id="bono-wanted" label="Quiero cobrar por mes" value={wanted} onChange={setWanted} cur={cur} step={cur === "PYG" ? 100000 : 50} /></div>
        </div>
        <Stat tone="navy" label="Necesitás invertir" value={fmtMoney(needed, cur)} sub="Repartido en bonos con cupones en distintos meses" />
      </div>
    </div>
  );
}

/* ---------- 4. PYG vs USD ---------- */
function CalcMoneda() {
  const [amount, setAmount] = useState(10000000);
  const [tc, setTc] = useState(7500);
  const [rPyg, setRPyg] = useState(8);
  const [rUsd, setRUsd] = useState(6);
  const [years, setYears] = useState(3);
  const [dev, setDev] = useState(2);
  const Y = Math.max(0.25, toNum(years));
  const pygFinal = toNum(amount) * Math.pow(1 + toNum(rPyg) / 100, Y);
  const usdStart = toNum(tc) > 0 ? toNum(amount) / toNum(tc) : 0;
  const usdFinal = usdStart * Math.pow(1 + toNum(rUsd) / 100, Y);
  const tcFinal = toNum(tc) * Math.pow(1 + toNum(dev) / 100, Y);
  const usdInPyg = usdFinal * tcFinal;
  const breakeven = ((1 + toNum(rPyg) / 100) / (1 + toNum(rUsd) / 100) - 1) * 100;
  const winner = pygFinal >= usdInPyg ? "PYG" : "USD";
  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-6">
      <div className="grid gap-4 content-start">
        <NumField id="fx-amount" label="Monto que tenés (Gs.)" value={amount} onChange={setAmount} cur="PYG" step={1000000} />
        <NumField id="fx-tc" label="Tipo de cambio hoy (Gs. por US$)" value={tc} onChange={setTc} step={10} hint="Valor de ejemplo: cargá la cotización del día." />
        <div className="grid grid-cols-2 gap-3">
          <NumField id="fx-rpyg" label="Tasa en PYG" value={rPyg} onChange={setRPyg} suffix="%" step={0.1} />
          <NumField id="fx-rusd" label="Tasa en USD" value={rUsd} onChange={setRUsd} suffix="%" step={0.1} />
          <NumField id="fx-years" label="Plazo" value={years} onChange={setYears} suffix="años" min={1} max={20} step={1} />
          <NumField id="fx-dev" label="Suba anual del dólar" value={dev} onChange={setDev} suffix="%" step={0.5} min={-20} />
        </div>
      </div>
      <div className="min-w-0 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className={"rounded-2xl p-5 border " + (winner === "PYG" ? "border-em bg-emsoft" : "border-line bg-bg")}>
            <p className="text-xs uppercase tracking-wider text-muted">Invirtiendo en guaraníes</p>
            <p className="mt-1 num font-display text-2xl font-bold text-ink break-words">{fmtMoney(pygFinal, "PYG")}</p>
            {winner === "PYG" && <Pill className="mt-2 bg-em text-white">Mejor resultado</Pill>}
          </div>
          <div className={"rounded-2xl p-5 border " + (winner === "USD" ? "border-em bg-emsoft" : "border-line bg-bg")}>
            <p className="text-xs uppercase tracking-wider text-muted">Invirtiendo en dólares</p>
            <p className="mt-1 num font-display text-2xl font-bold text-ink break-words">{fmtMoney(usdInPyg, "PYG")}</p>
            <p className="text-xs text-muted num">{fmtMoney(usdFinal, "USD")} a Gs. {Math.round(tcFinal).toLocaleString("es-PY")}</p>
            {winner === "USD" && <Pill className="mt-2 bg-em text-white">Mejor resultado</Pill>}
          </div>
        </div>
        <div className="rounded-2xl bg-navy text-navyfg p-5">
          <p className="text-xs uppercase tracking-wider opacity-70">Punto de equilibrio</p>
          <p className="mt-1 text-lg">Invertir en dólares conviene si el dólar sube más de <span className="num font-bold">{pct(breakeven, 2)}</span> por año.</p>
          <p className="mt-1 text-sm opacity-80">Por debajo de ese valor, rinde más quedarse en guaraníes.</p>
        </div>
        <Notice>No incluye la diferencia entre el tipo de cambio de compra y de venta, que reduce el resultado de cambiar de moneda. Nadie puede predecir el tipo de cambio: probá varios escenarios.</Notice>
      </div>
    </div>
  );
}

/* ---------- 5. costo real de invertir ---------- */
function CalcCosto() {
  const [cur, setCur] = useState("PYG");
  const [amount, setAmount] = useState(10000000);
  const [rate, setRate] = useState(9);
  const [years, setYears] = useState(3);
  const [com, setCom] = useState(0.5);
  const [cust, setCust] = useState(0.1);
  const [tax, setTax] = useState(true);
  const changeCur = (c) => { setCur(c); setAmount(c === "PYG" ? 10000000 : 5000); setRate(c === "PYG" ? 9 : 7); };
  const Y = Math.max(0.25, toNum(years));
  const m = toNum(amount);
  const gross = (m * toNum(rate)) / 100 * Y;
  const commission = (m * toNum(com)) / 100;
  const custody = (m * toNum(cust)) / 100 * Y;
  const taxAmt = tax ? gross * 0.08 : 0;
  const net = gross - commission - custody - taxAmt;
  const netRate = m > 0 ? (net / m / Y) * 100 : 0;
  const parts = [["Comisiones de compra/venta", commission, "bg-amber"], ["Custodia", custody, "bg-muted"], ["Impuesto (IRP 8 %)", taxAmt, "bg-danger"], ["Ganancia neta para vos", Math.max(0, net), "bg-em"]];
  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-6">
      <div className="grid gap-4 content-start">
        <CurToggle id="costo-cur" cur={cur} setCur={changeCur} />
        <NumField id="costo-amount" label="Monto invertido" value={amount} onChange={setAmount} cur={cur} step={cur === "PYG" ? 1000000 : 500} />
        <div className="grid grid-cols-2 gap-3">
          <NumField id="costo-rate" label="Tasa bruta" value={rate} onChange={setRate} suffix="% año" step={0.1} />
          <NumField id="costo-years" label="Plazo" value={years} onChange={setYears} suffix="años" min={1} max={20} step={1} />
          <NumField id="costo-com" label="Comisiones totales" value={com} onChange={setCom} suffix="%" step={0.05} hint="Sobre el monto, una vez." />
          <NumField id="costo-cust" label="Custodia" value={cust} onChange={setCust} suffix="% año" step={0.05} />
        </div>
        <label htmlFor="costo-tax" className="flex items-start gap-3 cursor-pointer">
          <input id="costo-tax" type="checkbox" checked={tax} onChange={(e) => setTax(e.target.checked)} className="mt-1 w-4 h-4 accent-[rgb(var(--em))]" />
          <span className="text-sm text-ink">Aplicar IRP del 8 % sobre los intereses<span className="block text-xs text-muted">Algunos instrumentos tienen exenciones. Confirmá tu caso con un contador.</span></span>
        </label>
        <p className="text-xs text-muted">Los valores de comisión y custodia son ejemplos: pedí el tarifario de tu Casa de Bolsa.</p>
      </div>
      <div className="min-w-0 space-y-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <Stat label="Intereses brutos" value={fmtMoney(gross, cur)} sub={"Tasa " + pct(rate)} />
          <Stat tone="danger" label="Costos e impuestos" value={"− " + fmtMoney(commission + custody + taxAmt, cur)} />
          <Stat tone="em" label="Ganancia neta" value={fmtMoney(net, cur)} sub={"Tasa neta ≈ " + pct(netRate, 2) + " anual"} />
        </div>
        <div className="rounded-2xl border border-line bg-bg p-5">
          <p className="text-sm font-semibold text-ink">¿A dónde va cada guaraní de intereses?</p>
          <div className="mt-3 flex h-6 w-full overflow-hidden rounded-full bg-soft">
            {parts.map(([n, v, c]) => gross > 0 && v > 0 && <div key={n} className={c + " h-full"} style={{ width: (v / gross) * 100 + "%" }} title={n} />)}
          </div>
          <ul className="mt-4 grid sm:grid-cols-2 gap-2">
            {parts.map(([n, v, c]) => (
              <li key={n} className="flex items-center gap-2 text-sm"><span className={"w-3 h-3 rounded-sm shrink-0 " + c} /><span className="flex-1 text-ink">{n}</span><span className="num text-muted">{gross > 0 ? pct((v / gross) * 100) : "—"}</span></li>
            ))}
          </ul>
        </div>
        <Notice>Cálculo simplificado con intereses cobrados (sin reinversión). Las comisiones y el tratamiento impositivo varían según la Casa de Bolsa, el instrumento y tu situación.</Notice>
      </div>
    </div>
  );
}

/* ---------- Centro de calculadoras ---------- */
const TOOLS = [
  ["sim", "Simulador", "LineChart"],
  ["meta", "Meta de ahorro", "Target"],
  ["bono", "Bono y cupones", "CalendarDays"],
  ["moneda", "PYG vs. USD", "ArrowLeftRight"],
  ["costo", "Costo real", "Receipt"],
];
function Herramientas() {
  const [tab, setTab] = useState("sim");
  const titles = {
    sim: ["Simulador de inversión", "Calculá cuánto podría crecer tu dinero con aportes mensuales. Las tasas vienen precargadas como referencia y podés editarlas."],
    meta: ["Calculadora de meta", "Decinos cuánto querés juntar y en cuánto tiempo, y te decimos cuánto invertir por mes."],
    bono: ["Calculadora de bono", "Armá el calendario de cupones de un bono y calculá cuánto necesitás para cobrar un ingreso mensual."],
    moneda: ["¿Guaraníes o dólares?", "Compará invertir en PYG o en USD según cuánto creas que va a subir el dólar."],
    costo: ["Costo real de invertir", "Descontá comisiones, custodia e impuestos para ver tu rendimiento neto."],
  };
  return (
    <Section id="simulador" eyebrow="Herramientas" title="Calculadoras para decidir mejor"
      intro="Cinco herramientas prácticas para planificar tus inversiones en guaraníes o en dólares.">
      <div className="overflow-x-auto -mx-1 px-1 pb-1">
        <div role="tablist" aria-label="Calculadoras" className="inline-flex gap-2 min-w-max">
          {TOOLS.map(([id, label, ic]) => (
            <button key={id} id={"tab-" + id} role="tab" aria-selected={tab === id} aria-controls={"panel-" + id} onClick={() => setTab(id)}
              className={"inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition " + (tab === id ? "bg-navy text-navyfg border-navy" : "bg-card text-ink border-line hover:border-em")}>
              <Icon name={ic} className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>
      <div id={"panel-" + tab} role="tabpanel" aria-labelledby={"tab-" + tab} key={tab} className="fade-in mt-5 rounded-2xl border border-line bg-card p-5 sm:p-7">
        <h3 className="text-2xl font-bold text-ink">{titles[tab][0]}</h3>
        <p className="mt-1 mb-6 text-muted prose-w">{titles[tab][1]}</p>
        {tab === "sim" && <Simulador />}
        {tab === "meta" && <CalcMeta />}
        {tab === "bono" && <CalcBono />}
        {tab === "moneda" && <CalcMoneda />}
        {tab === "costo" && <CalcCosto />}
      </div>
    </Section>
  );
}

/* ===== PARTE 6 DE 6: Perfil, aprender, quiz, glosario, fuentes oficiales y App ===== */
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
    <Section id="perfil" eyebrow="Test" title="Test rápido de perfil de inversionista"
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
              <div className="mt-4"><ShareButtons text={"Hice el test de perfil de inversionista y soy " + profile + ". ¿Qué perfil tenés vos?"} /></div>
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

/* ---------- 11. ruta de aprendizaje + 12. mini-cursos ---------- */
const ROUTE = [
  { level: "Principiante", icon: "Sprout", items: [["ecosistema", "Cómo funciona la bolsa"], ["beneficios", "Beneficios de invertir"], ["guia", "Paso a paso para empezar"], ["glosario", "Glosario básico"]] },
  { level: "Intermedio", icon: "TrendingUp", items: [["donde", "Dónde invertir según tu objetivo"], ["instrumentos", "Instrumentos financieros"], ["casas", "Cómo elegir una Casa de Bolsa"], ["simulador", "Calculadoras"]] },
  { level: "Avanzado", icon: "GraduationCap", items: [["prospecto", "Cómo leer un prospecto"], ["linea", "Ciclo de vida de una inversión"], ["mapa", "Mapa del mercado"], ["quiz", "Quiz final"]] },
];

function MiniCursos() {
  const [c, setC] = useState(0);
  const [nom, setNom] = useState(8);
  const [inf, setInf] = useState(4);
  const { ResponsiveContainer, LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid } = RC || {};
  const compData = Array.from({ length: 21 }, (_, y) => ({ label: y + " a", Simple: 10000000 * (1 + 0.09 * y), Compuesto: 10000000 * Math.pow(1.09, y) }));
  const riskOrder = { Bajo: 1, Medio: 2, Alto: 3 };
  const riskColor = { Bajo: "rgb(var(--em))", Medio: "rgb(var(--amber))", Alto: "rgb(var(--red))" };
  const rrData = INSTRUMENTS.filter((x) => x.ratePYG > 0).sort((a, b) => riskOrder[a.risk] - riskOrder[b.risk] || a.ratePYG - b.ratePYG).map((x) => ({ name: x.name, tasa: x.ratePYG, risk: x.risk }));
  const real = ((1 + toNum(nom) / 100) / (1 + toNum(inf) / 100) - 1) * 100;
  const courses = [
    ["Percent", "Tasa nominal y efectiva"],
    ["Layers", "Interés compuesto"],
    ["Gauge", "Riesgo vs. rendimiento"],
    ["TrendingDown", "Inflación y rendimiento real"],
  ];
  return (
    <div className="rounded-2xl border border-line bg-card p-5 sm:p-7">
      <h3 className="text-xl font-bold text-ink flex items-center gap-2"><Icon name="PlayCircle" className="w-5 h-5 text-em" /> Mini-cursos de 3 minutos</h3>
      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
        {courses.map(([ic, t], k) => (
          <button key={t} id={"curso-" + k} onClick={() => setC(k)} aria-pressed={c === k}
            className={"flex items-center gap-2 text-left rounded-xl border px-3 py-2.5 text-sm font-semibold transition " + (c === k ? "border-em bg-emsoft text-ink" : "border-line text-ink hover:border-em/50")}>
            <Icon name={ic} className={"w-4 h-4 shrink-0 " + (c === k ? "text-em" : "text-muted")} /> {t}
          </button>
        ))}
      </div>
      <div key={c} className="fade-in mt-5">
        {c === 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-ink space-y-3 prose-w">
              <p>La <strong>tasa nominal</strong> es la que se anuncia: por ejemplo, 9 % anual. La <strong>tasa efectiva</strong> es lo que realmente ganás en un año si reinvertís los intereses que cobrás en el camino.</p>
              <p>Cuanto más seguido cobrás y reinvertís, mayor es la tasa efectiva. Por eso un CDA que paga intereses mensuales y uno que paga al vencimiento, con la misma tasa nominal, no rinden igual si reinvertís.</p>
            </div>
            <table className="w-full text-sm self-start rounded-xl overflow-hidden border border-line">
              <thead className="bg-soft text-left text-muted"><tr><th className="p-3">9 % nominal con pago…</th><th className="p-3 text-right">Tasa efectiva</th></tr></thead>
              <tbody className="divide-y divide-line">
                {[["Anual", 1], ["Semestral", 2], ["Trimestral", 4], ["Mensual", 12]].map(([n, k]) => (
                  <tr key={n}><td className="p-3 text-ink">{n}</td><td className="p-3 text-right num font-semibold text-em">{pct((Math.pow(1 + 0.09 / k, k) - 1) * 100, 2)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {c === 1 && (
          <div className="grid md:grid-cols-[1fr_1.3fr] gap-6 items-center">
            <div className="text-ink space-y-3 prose-w">
              <p>Con <strong>interés simple</strong> cobrás intereses solo sobre tu capital inicial. Con <strong>interés compuesto</strong> reinvertís los intereses y estos también generan intereses.</p>
              <p className="num">Gs. 10.000.000 al 9 % durante 20 años: con interés simple llegás a <strong>{fmtMoney(compData[20].Simple, "PYG")}</strong>; con interés compuesto, a <strong className="text-em">{fmtMoney(compData[20].Compuesto, "PYG")}</strong>.</p>
              <p className="text-sm text-muted">El tiempo es tu mejor aliado: cuanto antes empieces, más trabaja el interés compuesto.</p>
            </div>
            <div className="h-60">
              {ResponsiveContainer && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={compData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis tickLine={false} axisLine={false} width={80} tickFormatter={(v) => fmtShort(v, "PYG")} />
                    <Tooltip formatter={(v, n) => [fmtMoney(v, "PYG"), n]} contentStyle={TOOLTIP_STYLE} />
                    <Line type="monotone" dataKey="Compuesto" stroke="rgb(var(--em))" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="Simple" stroke="rgb(var(--muted))" strokeWidth={2} strokeDasharray="6 4" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
        {c === 2 && (
          <div className="grid md:grid-cols-[1fr_1.3fr] gap-6 items-center">
            <div className="text-ink space-y-3 prose-w">
              <p>En inversiones no hay almuerzo gratis: <strong>a mayor rendimiento esperado, mayor riesgo</strong>. Un emisor que paga más tasa suele hacerlo porque tiene más chances de atrasarse o porque su título es menos líquido.</p>
              <p className="text-sm text-muted">Desconfiá de cualquier propuesta con rendimiento alto y "sin riesgo": es la señal más clara de una estafa.</p>
              <div className="flex flex-wrap gap-3 text-xs text-muted">
                {["Bajo", "Medio", "Alto"].map((r) => <span key={r} className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: riskColor[r] }} />Riesgo {r.toLowerCase()}</span>)}
              </div>
            </div>
            <div className="h-72">
              {ResponsiveContainer && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rrData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => v + " %"} />
                    <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={130} />
                    <Tooltip formatter={(v) => [pct(v) + " anual (ref. PYG)", "Tasa"]} contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgb(var(--soft))" }} />
                    <Bar dataKey="tasa" radius={[0, 6, 6, 0]}>{rrData.map((d) => <Cell key={d.name} fill={riskColor[d.risk]} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
        {c === 3 && (
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="text-ink space-y-3 prose-w">
              <p>La inflación hace que con el mismo dinero compres menos cosas. Tu <strong>rendimiento real</strong> es lo que ganás por encima de la inflación.</p>
              <p className="text-sm text-muted">Fórmula: (1 + tasa) ÷ (1 + inflación) − 1. Restar directamente es una buena aproximación cuando las tasas son bajas.</p>
            </div>
            <div className="rounded-xl border border-line bg-bg p-5 space-y-4">
              <div>
                <label htmlFor="mc-nom" className="flex justify-between text-sm font-semibold text-ink">Rendimiento de tu inversión <span className="num text-em">{pct(nom)}</span></label>
                <input id="mc-nom" type="range" min="0" max="15" step="0.5" value={nom} onChange={(e) => setNom(e.target.value)} className="w-full mt-2" />
              </div>
              <div>
                <label htmlFor="mc-inf" className="flex justify-between text-sm font-semibold text-ink">Inflación anual <span className="num text-amber">{pct(inf)}</span></label>
                <input id="mc-inf" type="range" min="0" max="15" step="0.5" value={inf} onChange={(e) => setInf(e.target.value)} className="w-full mt-2" />
              </div>
              <div className={"rounded-xl p-4 " + (real >= 0 ? "bg-emsoft" : "bg-dangersoft")}>
                <p className="text-xs uppercase tracking-wider text-muted">Rendimiento real</p>
                <p className={"num font-display text-3xl font-extrabold " + (real >= 0 ? "text-em" : "text-danger")}>{real >= 0 ? "+" : ""}{pct(real, 2)}</p>
                <p className="text-sm text-ink">{real >= 0 ? "Tu dinero gana poder de compra." : "Tu dinero pierde poder de compra."}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Aprender() {
  const [done, setDone] = usePersisted("bpy-ruta", {});
  const all = ROUTE.flatMap((l) => l.items.map(([id]) => id));
  const n = all.filter((id) => done[id]).length;
  return (
    <Section id="aprender" eyebrow="Aprender" title="Tu ruta de aprendizaje"
      intro="Avanzá por niveles. Marcá cada tema cuando lo termines: tu progreso queda guardado en este navegador.">
      <div className="rounded-2xl border border-line bg-card p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="font-semibold text-ink">Progreso total</p>
          <p className="num text-sm font-semibold text-em">{n} de {all.length} temas · {Math.round((n / all.length) * 100)} %</p>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-soft overflow-hidden"><div className="h-full bg-em rounded-full transition-all duration-500" style={{ width: (n / all.length) * 100 + "%" }} /></div>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          {ROUTE.map((l, li) => {
            const ld = l.items.filter(([id]) => done[id]).length;
            return (
              <div key={l.level} className="rounded-xl border border-line bg-bg p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-bold text-ink"><span className="grid place-items-center w-8 h-8 rounded-lg bg-navy text-navyfg"><Icon name={l.icon} className="w-4 h-4" /></span>Nivel {li + 1}: {l.level}</p>
                  {ld === l.items.length && <Icon name="Trophy" className="w-5 h-5 text-amber" />}
                </div>
                <ul className="mt-3 space-y-1">
                  {l.items.map(([id, label]) => (
                    <li key={id} className="flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-soft">
                      <input id={"ruta-" + id} type="checkbox" checked={!!done[id]} onChange={(e) => setDone({ ...done, [id]: e.target.checked })} className="w-4 h-4 accent-[rgb(var(--em))] shrink-0" />
                      <label htmlFor={"ruta-" + id} className={"flex-1 text-sm cursor-pointer " + (done[id] ? "text-muted line-through" : "text-ink")}>{label}</label>
                      <button onClick={() => scrollTo(id)} className="text-xs font-semibold text-em hover:underline shrink-0" aria-label={"Ir a " + label}>Ir</button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-6"><MiniCursos /></div>
    </Section>
  );
}

/* ---------- 10. quiz ---------- */
const QUIZ = [
  ["¿Quién supervisa el mercado de valores en Paraguay?", ["La Bolsa de Valores de Asunción", "La Superintendencia de Valores del BCP", "Las Casas de Bolsa"], 1, "La Superintendencia de Valores, dentro del Banco Central del Paraguay, regula y supervisa el mercado."],
  ["¿Se puede comprar un bono en la bolsa sin una Casa de Bolsa?", ["Sí, directamente en la web de la BVA", "No, la Casa de Bolsa es el intermediario obligatorio", "Solo si es un bono del Tesoro"], 1, "Toda operación en la bolsa se hace a través de una Casa de Bolsa habilitada."],
  ["Un bono de Gs. 10.000.000 al 9 % anual con cupón semestral paga en cada cupón:", ["Gs. 900.000", "Gs. 450.000", "Gs. 75.000"], 1, "El 9 % anual dividido en 2 semestres es 4,5 % por semestre: Gs. 450.000."],
  ["¿Qué calificación indica menor riesgo?", ["BBBpy", "Apy", "AAApy"], 2, "AAApy es la calificación más alta de la escala local paraguaya."],
  ["¿Qué instrumento conviene más para un fondo de emergencia?", ["Acciones ordinarias", "Fondo mutuo rescatable", "Fondo de inversión cerrado"], 1, "Un fondo mutuo te permite rescatar el dinero en pocos días. Las acciones y los fondos cerrados no garantizan esa liquidez."],
  ["¿Qué pasa en el mercado secundario?", ["El emisor coloca títulos nuevos", "Los inversores compran y venden títulos ya emitidos", "El BCP fija las tasas de interés"], 1, "En el mercado secundario los inversores negocian entre sí, lo que permite salir antes del vencimiento."],
  ["Si tu inversión rinde 7 % y la inflación es 4 %, tu rendimiento real es aproximadamente:", ["11 %", "3 %", "7 %"], 1, "(1,07 ÷ 1,04) − 1 ≈ 2,9 %, es decir, cerca de 3 %."],
  ["¿Qué es una cuenta comitente?", ["Una caja de ahorro del banco", "La cuenta a tu nombre en la Casa de Bolsa donde se registran tus títulos", "Un préstamo para invertir"], 1, "La abrís en una Casa de Bolsa y en ella quedan registrados tus títulos y el dinero de tus operaciones."],
  ["Las acciones preferidas en Paraguay normalmente…", ["Tienen voto y nunca pagan dividendos", "Pagan un dividendo preferente y en general no tienen voto", "Están garantizadas por el Fondo de Garantía de Depósitos"], 1, "Tienen preferencia en el cobro de dividendos y suelen no tener voto. No están cubiertas por el FGD."],
  ["Alguien te promete 5 % de ganancia mensual garantizada y te pide transferir a su cuenta personal. ¿Qué hacés?", ["Invierto un monto chico para probar", "No transfiero y verifico en el BCP y la BVA: son señales de estafa", "Transfiero si me muestra comprobantes de otros clientes"], 1, "Ninguna entidad habilitada garantiza rendimientos tan altos ni pide transferencias a cuentas personales."],
];

function Quiz() {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [picked, setPicked] = useState(null);
  const finished = answers.length === QUIZ.length;
  const score = answers.filter((a, k) => a === QUIZ[k][2]).length;
  const choose = (k) => { if (picked === null) setPicked(k); };
  const next = () => { setAnswers([...answers, picked]); setPicked(null); setI(i + 1); };
  const reset = () => { setI(0); setAnswers([]); setPicked(null); };
  const level = score >= 9 ? ["¡Experto en la bolsa!", "Tenés una base sólida para empezar a invertir con criterio."] : score >= 6 ? ["¡Muy bien!", "Entendés lo principal. Repasá los temas donde fallaste."] : ["Vas por buen camino", "Recorré la ruta de aprendizaje y volvé a intentarlo."];
  const q = QUIZ[i];
  return (
    <Section id="quiz" eyebrow="Poné a prueba lo aprendido" title="Quiz: ¿estás listo para invertir?"
      intro="Diez preguntas con explicación. Al final ves tu puntaje y podés compartirlo.">
      <div className="rounded-2xl border border-line bg-card p-6 sm:p-8 max-w-3xl">
        {!finished ? (
          <div key={i} className="fade-in">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-em num">Pregunta {i + 1} de {QUIZ.length}</p>
              <p className="text-sm text-muted num">Aciertos: {score}</p>
            </div>
            <div className="mt-3 h-1.5 rounded-full bg-soft overflow-hidden"><div className="h-full bg-em transition-all" style={{ width: (i / QUIZ.length) * 100 + "%" }} /></div>
            <h3 className="mt-6 text-xl sm:text-2xl font-bold text-ink">{q[0]}</h3>
            <div className="mt-5 grid gap-3">
              {q[1].map((opt, k) => {
                const isRight = k === q[2], isPicked = picked === k;
                const cls = picked === null ? "border-line hover:border-em hover:bg-soft" : isRight ? "border-em bg-emsoft" : isPicked ? "border-danger bg-dangersoft" : "border-line opacity-60";
                return (
                  <button key={k} id={"quiz-" + i + "-" + k} onClick={() => choose(k)} disabled={picked !== null}
                    className={"text-left rounded-xl border px-4 py-3.5 font-medium text-ink transition flex items-center justify-between gap-3 " + cls}>
                    {opt}
                    {picked !== null && isRight && <Icon name="CheckCircle2" className="w-5 h-5 text-em shrink-0" />}
                    {picked !== null && isPicked && !isRight && <Icon name="XCircle" className="w-5 h-5 text-danger shrink-0" />}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <div className="fade-in mt-5 rounded-xl bg-soft p-4">
                <p className={"font-bold " + (picked === q[2] ? "text-em" : "text-danger")}>{picked === q[2] ? "¡Correcto!" : "Incorrecto"}</p>
                <p className="mt-1 text-sm text-ink">{q[3]}</p>
                <button onClick={next} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-em text-white font-semibold hover:brightness-110">
                  {i === QUIZ.length - 1 ? "Ver resultado" : "Siguiente"} <Icon name="ArrowRight" className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="fade-in">
            <div className="flex items-center gap-4">
              <span className="grid place-items-center w-16 h-16 rounded-2xl bg-ambersoft text-amber"><Icon name="Trophy" className="w-8 h-8" /></span>
              <div>
                <p className="num font-display text-4xl font-extrabold text-ink">{score}/{QUIZ.length}</p>
                <p className="font-bold text-em">{level[0]}</p>
              </div>
            </div>
            <p className="mt-4 text-ink">{level[1]}</p>
            <ul className="mt-5 grid sm:grid-cols-2 gap-2">
              {QUIZ.map((qq, k) => (
                <li key={k} className="flex gap-2 text-sm">
                  <Icon name={answers[k] === qq[2] ? "CheckCircle2" : "XCircle"} className={"w-4 h-4 shrink-0 mt-0.5 " + (answers[k] === qq[2] ? "text-em" : "text-danger")} />
                  <span className="text-ink">{qq[0]}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3 items-start">
              <button onClick={reset} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-line font-semibold text-ink hover:bg-soft"><Icon name="RotateCcw" className="w-4 h-4" /> Repetir</button>
              <ShareButtons text={"Saqué " + score + "/" + QUIZ.length + " en el quiz \"¿Estás listo para invertir en la Bolsa de Paraguay?\" ¿Cuánto sacás vos?"} />
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

/* ---------- 14. datos oficiales ---------- */
const OFFICIAL = [
  ["Landmark", "Bolsa de Valores de Asunción (BVA)", "Casas de Bolsa habilitadas, emisiones vigentes, datos de mercado y material educativo.", "https://www.bolsadevalores.com.py"],
  ["Scale", "Banco Central del Paraguay (BCP)", "Superintendencia de Valores: registro de entidades y normativa. También tasas de interés e inflación.", "https://www.bcp.gov.py"],
  ["Building2", "Ministerio de Economía y Finanzas", "Información sobre la deuda pública y las emisiones de bonos del Tesoro.", "https://www.mef.gov.py"],
  ["Receipt", "DNIT", "Dirección Nacional de Ingresos Tributarios: IRP y tratamiento de las rentas de capital.", "https://www.dnit.gov.py"],
  ["Star", "Feller Rate", "Calificadora de riesgo con informes de emisores paraguayos.", "https://www.feller-rate.com"],
  ["Star", "Fitch Ratings", "Calificadora de riesgo con escala nacional para Paraguay.", "https://www.fitchratings.com"],
];

function DatosOficiales() {
  return (
    <Section id="oficial" eyebrow="Fuentes oficiales" title="Datos y noticias de primera mano"
      intro="Las tasas y las emisiones cambian todas las semanas. Consultá siempre la información vigente en estos sitios oficiales.">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {OFFICIAL.map(([ic, t, d, url]) => (
          <a key={t} href={url} target="_blank" rel="noopener" className="group flex gap-4 rounded-2xl border border-line bg-card p-5 hover:border-em/50 hover:-translate-y-0.5 transition">
            <span className="grid place-items-center w-11 h-11 shrink-0 rounded-xl bg-soft text-ink group-hover:bg-em group-hover:text-white transition"><Icon name={ic} /></span>
            <div className="min-w-0">
              <p className="font-bold text-ink flex items-center gap-1.5">{t} <Icon name="ArrowUpRight" className="w-4 h-4 text-muted group-hover:text-em" /></p>
              <p className="mt-1 text-sm text-muted">{d}</p>
              <p className="mt-2 text-xs text-em break-all">{url.replace("https://", "")}</p>
            </div>
          </a>
        ))}
      </div>
    </Section>
  );
}

function App() {
  const [view, setView] = useState(readHash);
  useEffect(() => {
    const onHash = () => setView(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [view]);
  currentView = view;
  const v = VIEWS.find((x) => x.id === view);
  const pages = {
    invertir: [<DondeInvertir key="d" />, <Casos key="c" />, <Instrumentos key="i" />, <Casas key="cb" />],
    mercado: [<Ecosistema key="e" />, <Mapa key="m" />, <Prospecto key="p" />, <LineaTiempo key="l" />],
    empezar: [<Stepper key="s" />, <ChecklistPre key="ch" />, <Perfil key="pf" />],
    herramientas: [<Herramientas key="h" />],
    aprender: [<Aprender key="a" />, <Quiz key="q" />, <GlosarioFAQ key="g" />, <DatosOficiales key="o" />],
  };
  return (
    <>
      <Nav view={view} />
      {view === "inicio" ? (
        <main key="inicio">
          <Hero />
          <Beneficios />
          <Explorar />
        </main>
      ) : (
        <>
          <ViewHeader v={v} />
          <main key={view} className="fade-in">{pages[view]}</main>
        </>
      )}
      <ViewPager view={view} />
      <Footer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

