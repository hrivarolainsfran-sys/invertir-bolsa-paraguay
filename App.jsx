/* ===== PARTE 1 DE 6: Base: utilidades, datos y componentes compartidos ===== */

const { useState, useMemo, useEffect } = React;
const RC = window.Recharts;
const ICONS = window.__ICONS__ || {};
const camel = (k) => k.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const Icon = ({ name, className = "w-5 h-5", ...rest }) => {
  const node = ICONS[name];
  if (!node) return <span className={className} aria-hidden="true" />;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...rest}>
      {node.map(([tag, attrs], i) => React.createElement(tag, Object.fromEntries(Object.entries(attrs).filter(([k]) => k !== "key").map(([k, v]) => [camel(k), v]).concat([["key", i]]))))}
    </svg>
  );
};
const DATA_DATE = "noviembre de 2026";
const REPO_URL = "https://github.com/hrivarolainsfran-sys/invertir-bolsa-paraguay";

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
  { id: "empezar", label: "Empezar", icon: "Rocket", title: "Empezá a invertir",
    desc: "Derribá los mitos, seguí los pasos para tu primera inversión, aprendé a detectar estafas, completá el checklist y conocé tu perfil.",
    sections: [["mitos", "Mitos y realidades"], ["guia", "Paso a paso"], ["estafas", "Señales de estafa"], ["checklist", "Checklist"], ["perfil", "Tu perfil"]] },
  { id: "instrumentos", label: "Instrumentos", icon: "Layers", title: "Instrumentos y riesgos",
    desc: "Qué podés comprar en la bolsa paraguaya, cómo funcionan los fondos por dentro y qué riesgos tiene cada inversión.",
    sections: [["instrumentos", "Instrumentos"], ["fondos", "Fondos por dentro"], ["riesgos", "Riesgos"]] },
  { id: "invertir", label: "Dónde invertir", icon: "Target", title: "Dónde invertir",
    desc: "Qué instrumento conviene según tu objetivo, cómo invierten otras personas, cómo armar tu cartera y con qué Casa de Bolsa operar.",
    sections: [["donde", "Según tu objetivo"], ["casos", "Casos de ejemplo"], ["estrategias", "Estrategias"], ["casas", "Casas de Bolsa"]] },
  { id: "mercado", label: "El mercado", icon: "Landmark", title: "Cómo funciona el mercado",
    desc: "Quiénes participan, qué sectores emiten, cómo se negocia, cómo se mueve el precio de un bono y cómo se lee una emisión de principio a fin.",
    sections: [["ecosistema", "Cómo funciona"], ["mapa", "Mapa del mercado"], ["negociacion", "Cómo se negocia"], ["precios", "Precio de un bono"], ["prospecto", "Leer un prospecto"], ["linea", "Línea de tiempo"]] },
  { id: "herramientas", label: "Calculadoras", icon: "Calculator", title: "Calculadoras",
    desc: "Simulá tu inversión, calculá cuánto ahorrar para una meta, armá el calendario de cupones de un bono y compará monedas y costos.",
    sections: [["simulador", "Calculadoras"]] },
  { id: "aprender", label: "Aprender", icon: "GraduationCap", title: "Aprender",
    desc: "Tu ruta de aprendizaje en 5 niveles, mini-cursos, temas de nivel experto y profesional, un quiz, el glosario, las fuentes oficiales y quiénes hacemos esta guía.",
    sections: [["aprender", "Ruta y mini-cursos"], ["experto", "Nivel experto"], ["profesional", "Nivel profesional"], ["quiz", "Quiz"], ["glosario", "Glosario y FAQ"], ["oficial", "Fuentes oficiales"], ["acerca", "Sobre esta guía"]] },
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
  ["Rendimiento al vencimiento (TIR)", "La tasa que realmente ganás si comprás un bono a su precio de hoy y lo mantenés hasta el final. Si lo comprás bajo la par, la TIR es mayor que la tasa del cupón."],
  ["A la par / bajo la par / sobre la par", "Un bono a la par cuesta el 100 % de su valor nominal; bajo la par, menos (con descuento); sobre la par, más (con prima)."],
  ["Intereses corridos", "Los intereses que un bono acumuló desde el último cupón. Si comprás entre dos fechas de pago, se los pagás al vendedor."],
  ["Orden con precio límite", "Orden de compra o venta en la que fijás el precio máximo que pagás o el mínimo que aceptás."],
  ["Spread", "Diferencia entre la mejor oferta de venta y la mejor oferta de compra de un título. Cuanto menor es, más líquido es el título."],
  ["Valor cuota", "Valor de cada cuota de un fondo: su patrimonio dividido por la cantidad de cuotas. Se publica todos los días."],
  ["Hecho relevante", "Información que un emisor debe comunicar al mercado porque puede afectar el valor de sus títulos."],
  ["Escalera de vencimientos", "Estrategia de repartir la inversión en títulos que vencen en años distintos para tener liquidez periódica."],
  ["Duración", "Medida, en años, de la sensibilidad del precio de un bono a los cambios de tasa. Con duración modificada de 4, si la tasa sube 1 punto el precio cae cerca de 4 %."],
  ["Convexidad", "Corrige la estimación de la duración cuando el cambio de tasa es grande. Más convexidad es mejor para el inversor."],
  ["Curva de rendimientos", "Gráfico de las tasas que paga el mercado según el plazo. Normalmente es creciente: a más plazo, más tasa."],
  ["Spread de crédito", "Tasa adicional que paga un bono corporativo sobre un bono del Tesoro del mismo plazo. Se mide en puntos básicos (100 pb = 1 %)."],
  ["Covenant (resguardo)", "Compromiso que asume un emisor en el prospecto, como no superar cierto nivel de deuda."],
  ["Volatilidad", "Cuánto varía el rendimiento de una inversión. Es la medida más usada del riesgo de mercado."],
  ["Índice de Sharpe", "Rendimiento por encima de la tasa libre de riesgo dividido por la volatilidad. Cuanto más alto, mejor la relación riesgo-retorno."],
  ["Drawdown (caída máxima)", "La mayor pérdida desde un máximo hasta el punto más bajo de una inversión o cartera."],
  ["Tasa de política monetaria", "Tasa de referencia que fija el BCP para guiar las tasas de interés de la economía y controlar la inflación."],
  ["Formador de mercado", "Participante que publica de forma continua precios de compra y venta de un título para darle liquidez."],
  ["Titularización", "Proceso de convertir activos que generan flujos (préstamos, alquileres) en títulos negociables en bolsa."],
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
const sectionIndex = (id) => {
  const v = VIEWS.find((x) => x.id === SECTION_VIEW[id]);
  if (!v || v.id === "inicio" || v.sections.length < 2) return null;
  const i = v.sections.findIndex(([sid]) => sid === id);
  return String(i + 1).padStart(2, "0") + " / " + String(v.sections.length).padStart(2, "0");
};
const Section = ({ id, eyebrow, title, intro, children }) => (
  <section id={id} className="py-16 sm:py-20">
    <div className="wrap">
      <div className="mb-10 prose-w">
        {eyebrow && <p className="eyebrow mb-3 flex items-center gap-3">{sectionIndex(id) && <span className="rounded-md bg-navy text-up px-2 py-0.5 tracking-normal">{sectionIndex(id)}</span>}<span>{eyebrow}</span></p>}
        <h2 className="text-3xl sm:text-4xl font-bold text-ink">{title}</h2>
        <span aria-hidden="true" className="mt-4 block h-1 w-14 rounded-full bg-gradient-to-r from-em to-gold" />
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
    <p key={String(value)} className={"pop mt-1 num font-display text-xl font-bold break-words " + (tone === "navy" ? "" : tone === "em" ? "text-em" : tone === "danger" ? "text-danger" : "text-ink")}>{value}</p>
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
    ["META DE INFLACIÓN BCP", "3,5 %", null], ["TASA DE POLÍTICA MONETARIA", "5,50 %", null],
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

function useTheme() {
  const [theme, setTheme] = useState(() => store.get("bpy-theme", null));
  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.setAttribute("data-theme", theme); else root.removeAttribute("data-theme");
    store.set("bpy-theme", theme);
  }, [theme]);
  const isDark = theme ? theme === "dark" : (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  return [isDark, () => setTheme(isDark ? "light" : "dark")];
}

function useActiveSection(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        let cur = ids[0];
        ids.forEach((id) => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < 200) cur = id; });
        setActive(cur);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, [ids.join(",")]);
  return active;
}

function ReadingProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => { const h = document.documentElement; const max = h.scrollHeight - h.clientHeight; setP(max > 0 ? (h.scrollTop / max) * 100 : 0); };
    on(); window.addEventListener("scroll", on, { passive: true }); window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); };
  }, []);
  return <div className="absolute left-0 bottom-0 h-0.5 bg-em transition-[width] duration-150" style={{ width: p + "%" }} aria-hidden="true" />;
}

function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => { const on = () => setShow(window.scrollY > 900); on(); window.addEventListener("scroll", on, { passive: true }); return () => window.removeEventListener("scroll", on); }, []);
  if (!show) return null;
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Volver arriba"
      className="fade-in fixed z-40 grid place-items-center w-11 h-11 rounded-full bg-navy text-navyfg shadow-lg border border-navyfg/15 hover:bg-em transition"
      style={{ right: "calc(16px + env(safe-area-inset-right, 0px))", bottom: "calc(16px + env(safe-area-inset-bottom, 0px))" }}>
      <Icon name="ArrowUp" className="w-5 h-5" />
    </button>
  );
}

function SubNav({ v }) {
  const ids = v.sections.map(([id]) => id);
  const active = useActiveSection(ids);
  const seen = useSeen();
  if (v.sections.length < 2) return null;
  return (
    <nav className="hidden lg:block border-t border-line bg-bg/95" aria-label={"En " + v.label}>
      <div className="wrap flex items-center gap-1 h-11 overflow-x-auto">
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted mr-2 shrink-0">En esta sección</span>
        {v.sections.map(([id, l], k) => (
          <button key={id} onClick={() => scrollTo(id)} aria-current={active === id ? "location" : undefined}
            className={"shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm transition " + (active === id ? "bg-emsoft text-em font-semibold" : "text-muted hover:text-ink hover:bg-soft")}>
            {seen[id] ? <Icon name="CheckCircle2" className="w-3.5 h-3.5 text-em" /> : <span className="font-mono text-[11px] opacity-70">{String(k + 1).padStart(2, "0")}</span>}{l}
          </button>
        ))}
      </div>
    </nav>
  );
}

function Nav({ view }) {
  const [isDark, toggleTheme] = useTheme();
  const v = VIEWS.find((x) => x.id === view);
  const mref = React.useRef(null);
  useEffect(() => {
    const box = mref.current; if (!box) return;
    const a = box.querySelector('[aria-current="page"]');
    if (a) box.scrollTo({ left: Math.max(0, a.offsetLeft - box.clientWidth / 2 + a.offsetWidth / 2), behavior: "smooth" });
  }, [view]);
  const tab = (x, compact) => (
    <a key={x.id} href={"#" + x.id} aria-current={view === x.id ? "page" : undefined}
      className={"inline-flex items-center gap-1.5 rounded-lg font-semibold transition whitespace-nowrap text-sm " + (compact ? "px-3 py-1.5 " : "px-2.5 py-2 ") +
        (view === x.id ? "bg-navy text-navyfg" : "text-muted hover:text-ink hover:bg-soft")}>
      <Icon name={x.icon} className={"w-4 h-4" + (compact ? "" : " xl:hidden 2xl:block")} />{x.label}
    </a>
  );
  return (
    <header className="sticky z-50" style={{ top: "env(safe-area-inset-top, 0px)" }}>
      <Ticker />
      <div className="relative bg-card/95 backdrop-blur border-b border-line">
        <div className="wrap flex items-center justify-between h-14 gap-3">
          <a href="#inicio" className="flex items-center gap-2 font-display font-extrabold text-ink shrink-0">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-navy text-up"><Icon name="CandlestickChart" className="w-4 h-4" /></span>
            <span>Bolsa<span className="text-em">PY</span> Aprende</span>
          </a>
          <nav className="hidden xl:flex items-center gap-0.5" aria-label="Secciones">{VIEWS.map((x) => tab(x, false))}</nav>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => window.dispatchEvent(new CustomEvent("bpy-search"))} aria-label="Buscar en la guía" title="Buscar (Ctrl + K)"
              className="inline-flex items-center gap-2 h-9 px-2.5 shrink-0 rounded-lg border border-line text-muted hover:text-ink hover:bg-soft transition">
              <Icon name="Search" className="w-4 h-4" /><span className="hidden sm:inline xl:hidden text-sm">Buscar</span>
            </button>
            <ProgressButton />
          <button onClick={toggleTheme} aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"} title={isDark ? "Tema claro" : "Tema oscuro"}
            className="grid place-items-center w-9 h-9 shrink-0 rounded-lg border border-line text-ink hover:bg-soft transition">
            <Icon name={isDark ? "Sun" : "Moon"} className="w-4 h-4" />
          </button>
          </div>
        </div>
        <nav ref={mref} className="xl:hidden border-t border-line overflow-x-auto" aria-label="Secciones">
          <div className="wrap flex gap-1 py-1.5 min-w-max">{VIEWS.map((x) => tab(x, true))}</div>
        </nav>
        {view !== "inicio" && <SubNav v={v} />}
        <ReadingProgress />
      </div>
    </header>
  );
}

function ViewHeader({ v }) {
  const i = VIEWS.findIndex((x) => x.id === v.id);
  const s = useSeen();
  const len = v.sections.length, n = v.sections.filter(([id]) => s[id]).length;
  return (
    <header className="relative overflow-hidden board-bg bg-navy text-navyfg">
      <div aria-hidden="true" className="orb orb-a" />
      <span aria-hidden="true" className="hidden md:block absolute right-[5%] top-1/2 -translate-y-1/2 pointer-events-none"><Icon name={v.icon} className="float-slow w-60 h-60 text-up/10" /></span>
      <div className="wrap relative py-10 sm:py-14">
        <p className="font-mono text-xs tracking-widest uppercase text-up flex items-center gap-2">
          <a href="#inicio" className="hover:underline">Inicio</a><span className="opacity-50">/</span><span>Sección {i} de {VIEWS.length - 1}</span>
        </p>
        <h1 className="mt-3 text-3xl sm:text-5xl font-extrabold">{v.title}</h1>
        <p className="mt-3 max-w-2xl text-lg opacity-80">{v.desc}</p>
        <div className="mt-6 flex items-center gap-3 max-w-md">
          <div className="flex-1 h-1.5 rounded-full bg-navyfg/15 overflow-hidden"><div className="h-full rounded-full bg-up transition-all duration-700" style={{ width: (n / len) * 100 + "%" }} /></div>
          <span className="font-mono text-xs opacity-80 num shrink-0">{n === len ? "¡Sección completa!" : n + " de " + len + (len === 1 ? " tema visto" : " temas vistos")}</span>
        </div>
        {len > 1 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {v.sections.map(([id, l], k) => (
              <button key={id} onClick={() => scrollTo(id)}
                className={"inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition hover:-translate-y-0.5 " + (s[id] ? "border-up/40 bg-up/10" : "border-navyfg/20 bg-navyfg/5 hover:bg-navyfg/15")}>
                {s[id] ? <Icon name="CheckCircle2" className="w-4 h-4 text-up" /> : <span className="font-mono text-xs text-up">{String(k + 1).padStart(2, "0")}</span>}{l}
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
  const s = useSeen();
  return (
    <Section id="explorar" eyebrow="Mapa de la guía" title="Todo lo que vas a encontrar"
      intro="La guía está ordenada en seis secciones, de lo más simple a lo más avanzado. Recorrelas en orden o andá directo a lo que necesitás.">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {VIEWS.slice(1).map((v, i) => (
          <a key={v.id} href={"#" + v.id} className="group rounded-2xl border border-line bg-card p-6 hover:border-em hover:-translate-y-0.5 transition flex flex-col">
            <div className="flex items-center justify-between">
              <span className="grid place-items-center w-11 h-11 rounded-xl bg-navy text-up group-hover:bg-em group-hover:text-white group-hover:-rotate-6 transition"><Icon name={v.icon} /></span>
              <span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, "0")}</span>
            </div>
            <h3 className="mt-4 text-xl font-bold text-ink">{v.label}</h3>
            <p className="mt-1 text-sm text-muted">{v.desc}</p>
            <ul className="mt-4 space-y-1 flex-1">
              {v.sections.map(([id, l]) => <li key={id} className="text-sm text-ink flex gap-2"><Icon name="ChevronRight" className="w-4 h-4 text-em shrink-0 mt-0.5" />{l}</li>)}
            </ul>
            <div className="mt-4">
              <div className="h-1.5 rounded-full bg-soft overflow-hidden"><div className="h-full rounded-full bg-em transition-all duration-700" style={{ width: (v.sections.filter(([id]) => s[id]).length / v.sections.length) * 100 + "%" }} /></div>
              <p className="mt-1.5 text-xs text-muted num">{v.sections.filter(([id]) => s[id]).length} de {v.sections.length} {v.sections.length === 1 ? "tema visto" : "temas vistos"}</p>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-em">Entrar <Icon name="ArrowRight" className="w-4 h-4 group-hover:translate-x-0.5 transition" /></span>
          </a>
        ))}
        <div className="board-bg rounded-2xl bg-navy text-navyfg p-6 flex flex-col sm:col-span-2">
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

/* ---------- 1. hero (interactivo: tocá una fila de la pizarra y simulá) ---------- */
function Hero() {
  const { ResponsiveContainer, AreaChart, Area } = RC || {};
  const board = ["fm", "cda", "bc", "bt", "fi", "ap", "rep"].map(instById);
  const dot = { Bajo: "bg-up", Medio: "bg-gold", Alto: "bg-danger" };
  const [sel, setSel] = useState("cda");
  const [amt, setAmt] = useState(10000000);
  const [yrs, setYrs] = useState(5);
  const inst = instById(sel);
  const rate = inst.ratePYG;
  const months = yrs * 12;
  const spark = useMemo(() => Array.from({ length: months + 1 }, (_, m) => ({ m, v: amt * Math.pow(1 + rate / 100, m / 12) })), [amt, rate, months]);
  const final = spark[months].v;
  const shown = useCountUp(final, 650);
  return (
    <section className="relative overflow-hidden board-bg bg-navy text-navyfg">
      <div aria-hidden="true" className="orb orb-a" />
      <div aria-hidden="true" className="orb orb-b" />
      <div className="wrap relative pt-12 pb-24 sm:pt-16 sm:pb-28 grid lg:grid-cols-[1.05fr_1fr] gap-10 items-center">
        <div className="min-w-0">
          <p className="font-mono text-xs tracking-widest uppercase text-up flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-up animate-pulse" aria-hidden="true" />Guía educativa · Mercado de valores del Paraguay
          </p>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold">Aprendé a invertir en la Bolsa de Paraguay <Rotator /></h1>
          <p className="mt-5 text-lg sm:text-xl opacity-80 prose-w">
            No hace falta ser millonario. Con un fondo mutuo podés empezar con montos accesibles, en guaraníes o en dólares, en un mercado regulado por el Banco Central del Paraguay.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => scrollTo("guia")} className="shine inline-flex items-center gap-2 rounded-xl bg-em px-5 py-3 font-semibold text-white shadow-lg shadow-em/30 hover:brightness-110 transition">
              Empezar la guía paso a paso <Icon name="ArrowRight" className="w-4 h-4" />
            </button>
            <button onClick={() => window.dispatchEvent(new CustomEvent("bpy-search"))} className="inline-flex items-center gap-2 rounded-xl border border-navyfg/25 px-5 py-3 font-semibold hover:bg-navyfg/10 transition">
              <Icon name="Search" className="w-4 h-4" /> Buscar un tema
            </button>
          </div>
          <dl className="mt-10 grid grid-cols-3 gap-4 max-w-md border-t border-navyfg/15 pt-6">
            {[[9, "instrumentos explicados"], [6, "calculadoras"], [24, "Casas de Bolsa habilitadas"]].map(([n, l]) => (
              <div key={l}><dd className="font-mono text-3xl font-semibold text-up num"><CountUp to={n} /></dd><dt className="text-xs opacity-70 leading-snug mt-1">{l}</dt></div>
            ))}
          </dl>
        </div>

        <div className="min-w-0 rounded-2xl border border-navyfg/15 bg-navyfg/5 backdrop-blur shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-navyfg/15 bg-navyfg/5">
            <p className="font-mono text-xs tracking-widest uppercase">Pizarra de tasas referenciales</p>
            <span className="font-mono text-[10px] uppercase tracking-wider rounded border border-gold/50 text-gold px-1.5 py-0.5">Orientativo · {DATA_DATE.replace("noviembre de ", "nov. ")}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[13px] sm:text-sm text-navyfg">
              <thead><tr className="text-[11px] uppercase tracking-wider opacity-60 text-left">
                <th className="pl-4 pr-2 sm:px-5 py-2 font-medium">Instrumento</th><th className="px-2 sm:px-3 py-2 font-medium text-right">PYG</th><th className="px-2 sm:px-3 py-2 font-medium text-right">USD</th><th className="pl-2 pr-4 sm:px-5 py-2 font-medium text-right">Riesgo</th>
              </tr></thead>
              <tbody>
                {board.map((x) => (
                  <tr key={x.id} onClick={() => setSel(x.id)} className={"cursor-pointer border-t border-navyfg/10 transition " + (sel === x.id ? "bg-up/15" : "hover:bg-navyfg/5")}>
                    <td className="pl-4 pr-2 sm:px-5 py-2.5 font-sans font-medium">
                      <button type="button" aria-pressed={sel === x.id} className="text-left inline-flex items-center gap-2">
                        <span className={"w-1.5 h-1.5 rounded-full shrink-0 transition " + (sel === x.id ? "bg-up scale-150" : "bg-navyfg/25")} />{x.name}
                      </button>
                    </td>
                    <td className="px-2 sm:px-3 py-2.5 text-right text-up whitespace-nowrap">{x.currencies.includes("PYG") ? pct(x.ratePYG) : "—"}</td>
                    <td className="px-2 sm:px-3 py-2.5 text-right text-up whitespace-nowrap">{x.currencies.includes("USD") && x.rateUSD ? pct(x.rateUSD) : "—"}</td>
                    <td className="pl-2 pr-4 sm:px-5 py-2.5 text-right"><span className="inline-flex items-center gap-1.5 text-xs" title={"Riesgo " + x.risk.toLowerCase()}><span className={"w-2 h-2 rounded-full " + dot[x.risk]} /><span className="hidden sm:inline">{x.risk}</span></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-navyfg/15 px-5 pt-4 pb-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-gold flex items-center gap-1.5"><Icon name="MousePointerClick" className="w-3.5 h-3.5" /> Tocá una fila y mové los controles</p>
            <div className="mt-2 flex items-end justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-wider opacity-60">{inst.name} al {pct(rate)} · {yrs} {yrs === 1 ? "año" : "años"}</p>
                <p className="font-mono text-2xl sm:text-3xl font-semibold text-up num" aria-live="polite">{fmtMoney(shown, "PYG")}</p>
              </div>
              <p className="font-mono text-xs text-up num">▲ ganás {fmtShort(final - amt, "PYG")}</p>
            </div>
            <div className="mt-3 grid sm:grid-cols-2 gap-x-5 gap-y-2">
              <label className="block">
                <span className="flex justify-between font-mono text-[11px] uppercase tracking-wider"><span className="opacity-60">Monto</span><span className="text-up num">{fmtShort(amt, "PYG")}</span></span>
                <input type="range" min={1000000} max={100000000} step={1000000} value={amt} onChange={(e) => setAmt(Number(e.target.value))} className="hero-range w-full" aria-label="Monto a invertir en guaraníes" />
              </label>
              <label className="block">
                <span className="flex justify-between font-mono text-[11px] uppercase tracking-wider"><span className="opacity-60">Plazo</span><span className="text-up num">{yrs} {yrs === 1 ? "año" : "años"}</span></span>
                <input type="range" min={1} max={10} step={1} value={yrs} onChange={(e) => setYrs(Number(e.target.value))} className="hero-range w-full" aria-label="Plazo en años" />
              </label>
            </div>
            <div className="h-16 mt-2" aria-hidden="true">
              {ResponsiveContainer && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={spark} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <defs><linearGradient id="gHero" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgb(var(--up))" stopOpacity={0.45} /><stop offset="100%" stopColor="rgb(var(--up))" stopOpacity={0} /></linearGradient></defs>
                    <Area type="monotone" dataKey="v" stroke="rgb(var(--up))" strokeWidth={2} fill="url(#gHero)" animationDuration={500} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          <p className="px-5 py-3 text-xs opacity-70 border-t border-navyfg/15">Actualizado a {DATA_DATE}. Rangos con fines educativos, no son cotizaciones en tiempo real ni una promesa de rendimiento. Consultá las tasas vigentes en tu Casa de Bolsa.</p>
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
  const [infl, setInfl] = useState(3.5);
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
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {BENEFITS.map(([ic, t, d], k) => <BenefitCard key={t} ic={ic} t={t} d={d} ex={BEN_EX[k]} />)}
      </div>

      <div id="ahorro-vs-invertir" className="mt-10 rounded-2xl border border-line bg-card p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="prose-w">
            <p className="eyebrow">Calculadora</p>
            <h3 className="mt-1 text-2xl font-bold text-ink">Caja de ahorro vs. invertir</h3>
            <p className="mt-2 text-sm text-muted">Compará lo que pasa con tu dinero si lo dejás en la caja de ahorro o si lo invertís, frente a la inflación. La meta de inflación del BCP es 3,5 % anual; en octubre de 2026 la inflación interanual fue 1,7 %.</p>
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
  const col = "font-mono text-xs uppercase tracking-widest text-up";
  const link = "text-sm opacity-80 hover:opacity-100 hover:underline underline-offset-2 text-left";
  return (
    <footer className="board-bg bg-navy text-navyfg">
      <div className="wrap pt-14 pb-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <p className="flex items-center gap-2 font-display font-extrabold text-lg">
              <span className="grid place-items-center w-8 h-8 rounded-lg bg-em text-white"><Icon name="CandlestickChart" className="w-4 h-4" /></span>Bolsa<span className="text-up -ml-2">PY</span> Aprende
            </p>
            <p className="mt-3 text-sm opacity-75 max-w-xs">Guía educativa e independiente para aprender a invertir en el mercado de valores del Paraguay.</p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-navyfg/20 px-3 py-1 font-mono text-xs"><span className="w-2 h-2 rounded-full bg-up" />Datos actualizados a {DATA_DATE}</p>
          </div>
          <div>
            <p className={col}>Secciones</p>
            <ul className="mt-3 space-y-2">{VIEWS.map((v) => <li key={v.id}><a href={"#" + v.id} className={link}>{v.label}</a></li>)}</ul>
          </div>
          <div>
            <p className={col}>Recursos</p>
            <ul className="mt-3 space-y-2">
              {[["simulador", "Simulador"], ["glosario", "Glosario"], ["quiz", "Quiz"], ["oficial", "Fuentes oficiales"]].map(([id, l]) => <li key={id}><button onClick={() => scrollTo(id)} className={link}>{l}</button></li>)}
              <li><a href="https://www.bolsadevalores.com.py" target="_blank" rel="noopener" className={link + " inline-flex items-center gap-1"}>BVA <Icon name="ExternalLink" className="w-3 h-3" /></a></li>
              <li><a href="https://www.bcp.gov.py" target="_blank" rel="noopener" className={link + " inline-flex items-center gap-1"}>BCP <Icon name="ExternalLink" className="w-3 h-3" /></a></li>
            </ul>
          </div>
          <div>
            <p className={col}>Sobre la guía</p>
            <ul className="mt-3 space-y-2">
              <li><button onClick={() => scrollTo("acerca")} className={link}>Quiénes somos</button></li>
              <li><button onClick={() => scrollTo("acerca")} className={link}>Privacidad</button></li>
              <li><a href={REPO_URL + "/issues/new"} target="_blank" rel="noopener" className={link + " inline-flex items-center gap-1"}>Enviar una sugerencia <Icon name="ExternalLink" className="w-3 h-3" /></a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 rounded-2xl border border-navyfg/15 bg-navyfg/5 p-5">
          <p className="flex items-center gap-2 font-semibold"><Icon name="AlertTriangle" className="w-4 h-4 text-gold" /> Aviso legal</p>
          <p className="mt-2 text-sm opacity-80">
            Todo el contenido de este sitio es exclusivamente educativo e informativo. No constituye asesoría financiera, legal ni tributaria, ni una recomendación de compra o venta de ningún valor o instrumento. Las tasas, montos mínimos y entidades mencionadas son ilustrativas y pueden no estar vigentes. Toda inversión implica riesgos, incluida la posible pérdida del capital, y los rendimientos pasados no garantizan resultados futuros. Antes de invertir, consultá con una Casa de Bolsa autorizada por la Superintendencia de Valores del Banco Central del Paraguay y leé el prospecto de cada emisión.
          </p>
        </div>
        <p className="mt-6 text-xs opacity-60 font-mono">BolsaPY Aprende · Proyecto educativo · No es una Casa de Bolsa ni una entidad regulada</p>
      </div>
    </footer>
  );
}

/* ---------- sobre esta guía: quiénes somos, privacidad, contacto ---------- */
function Acerca() {
  const [cleared, setCleared] = useState(false);
  const clearData = () => {
    try { Object.keys(localStorage).filter((k) => k.startsWith("bpy-")).forEach((k) => localStorage.removeItem(k)); } catch (e) { /* sin almacenamiento */ }
    document.documentElement.removeAttribute("data-theme");
    setCleared(true);
  };
  return (
    <Section id="acerca" eyebrow="Sobre esta guía" title="Quiénes somos, privacidad y contacto"
      intro={"Información sobre este sitio. Los datos de mercado están actualizados a " + DATA_DATE + "."}>
      <div className="grid lg:grid-cols-3 gap-4">
        <article className="rounded-2xl border border-line bg-card p-6">
          <span className="grid place-items-center w-11 h-11 rounded-xl bg-navy text-up"><Icon name="Users" /></span>
          <h3 className="mt-4 text-lg font-bold text-ink">Quiénes somos</h3>
          <p className="mt-2 text-sm text-muted">BolsaPY Aprende es un proyecto educativo independiente, hecho para que cualquier persona en Paraguay pueda entender cómo invertir en la bolsa, desde cero.</p>
          <ul className="mt-4 space-y-2">
            <Bullet>No es una Casa de Bolsa ni una entidad regulada.</Bullet>
            <Bullet>No ofrece, vende ni recomienda productos financieros.</Bullet>
            <Bullet>Los datos se toman de fuentes oficiales y se revisan periódicamente.</Bullet>
          </ul>
        </article>
        <article className="rounded-2xl border border-line bg-card p-6">
          <span className="grid place-items-center w-11 h-11 rounded-xl bg-navy text-up"><Icon name="Lock" /></span>
          <h3 className="mt-4 text-lg font-bold text-ink">Privacidad</h3>
          <p className="mt-2 text-sm text-muted">Este sitio no pide registro ni recolecta datos personales. Tus respuestas y cálculos no se envían a ningún servidor.</p>
          <ul className="mt-4 space-y-2">
            <Bullet>El progreso del checklist y de la ruta, y el tema elegido, se guardan solo en tu navegador.</Bullet>
            <Bullet>Para mostrarse, la página usa GitHub Pages (alojamiento), Google Fonts (tipografías) y cdnjs (librerías). Esos servicios pueden registrar datos técnicos de la conexión, como la dirección IP.</Bullet>
          </ul>
          <button onClick={clearData} className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-line text-sm font-semibold text-ink hover:bg-soft">
            <Icon name={cleared ? "Check" : "Trash2"} className="w-4 h-4" /> {cleared ? "Datos borrados" : "Borrar mis datos guardados"}
          </button>
        </article>
        <article className="rounded-2xl border border-line bg-card p-6">
          <span className="grid place-items-center w-11 h-11 rounded-xl bg-navy text-up"><Icon name="MessageCircle" /></span>
          <h3 className="mt-4 text-lg font-bold text-ink">Contacto y sugerencias</h3>
          <p className="mt-2 text-sm text-muted">¿Encontraste un dato desactualizado, un error o querés proponer un tema? Escribinos.</p>
          <a href={REPO_URL + "/issues/new"} target="_blank" rel="noopener" className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-em text-white font-semibold hover:brightness-110 transition">
            Enviar una sugerencia <Icon name="ExternalLink" className="w-4 h-4" />
          </a>
          <p className="mt-3 text-xs text-muted">Se abre en GitHub; necesitás una cuenta gratuita para escribir. También podés ver el código del sitio en <a href={REPO_URL} target="_blank" rel="noopener" className="text-em underline">el repositorio</a>.</p>
        </article>
      </div>
    </Section>
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
                <input id={"pre-" + k} type="checkbox" className="mt-1 w-4 h-4 accent-[rgb(var(--em))] shrink-0" checked={!!done[k]} onChange={(e) => { const nd = { ...done, [k]: e.target.checked }; setDone(nd); if (e.target.checked && PRE_CHECK.every((_, j) => nd[j])) { celebrate(); toast("¡Checklist completo!", "Cumpliste todos los puntos para tu primera inversión.", "CheckCircle2"); } }} />
                <span className="text-sm text-ink"><span className="num text-muted mr-1">{k + 1}.</span>{t}</span>
              </label>
            </li>
          ))}
        </ul>
        <aside className="rounded-2xl border border-line bg-card p-6 text-center lg:sticky lg:top-48 xl:top-36">
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
              <strong>Lista de Casas de Bolsa habilitadas según el sitio de la BVA, consultado en {DATA_DATE}.</strong> Es informativa y no constituye una recomendación. La lista puede cambiar. Verificá siempre la lista vigente en el sitio oficial del Banco Central del Paraguay (<a className="underline text-em" href="https://www.bcp.gov.py" target="_blank" rel="noopener">bcp.gov.py</a>) y de la Bolsa de Valores de Asunción (<a className="underline text-em" href="https://www.bolsadevalores.com.py" target="_blank" rel="noopener">bolsadevalores.com.py</a>).
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
        <aside className="rounded-2xl border border-em/40 bg-card p-6 lg:sticky lg:top-48 xl:top-36">
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
  const [tab, setTab] = useState(() => { const t = PENDING.tool || "sim"; PENDING.tool = null; return t; });
  useEffect(() => { const on = (e) => { setTab(e.detail); PENDING.tool = null; }; window.addEventListener("bpy-tool", on); return () => window.removeEventListener("bpy-tool", on); }, []);
  useEffect(() => { if (tab !== "sim") markSeen("tool-" + tab); }, [tab]);
  const titles = {
    sim: ["Simulador de inversión", "Calculá cuánto podría crecer tu dinero con aportes mensuales. Las tasas vienen precargadas como referencia y podés editarlas."],
    meta: ["Calculadora de meta", "Decinos cuánto querés juntar y en cuánto tiempo, y te decimos cuánto invertir por mes."],
    bono: ["Calculadora de bono", "Armá el calendario de cupones de un bono y calculá cuánto necesitás para cobrar un ingreso mensual."],
    moneda: ["¿Guaraníes o dólares?", "Compará invertir en PYG o en USD según cuánto creas que va a subir el dólar."],
    costo: ["Costo real de invertir", "Descontá comisiones, custodia e impuestos para ver tu rendimiento neto."],
  };
  return (
    <Section id="simulador" eyebrow="Herramientas" title="Elegí una herramienta"
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
  const [q, setQ] = useState(() => { const t = PENDING.glos || ""; PENDING.glos = null; return t; });
  useEffect(() => { const on = (e) => { setQ(e.detail); PENDING.glos = null; }; window.addEventListener("bpy-glos", on); return () => window.removeEventListener("bpy-glos", on); }, []);
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
  { level: "Principiante", icon: "Sprout", items: [["beneficios", "Beneficios de invertir"], ["mitos", "Mitos y realidades"], ["ecosistema", "Cómo funciona la bolsa"], ["guia", "Paso a paso para empezar"], ["glosario", "Glosario básico"]] },
  { level: "Intermedio", icon: "TrendingUp", items: [["donde", "Dónde invertir según tu objetivo"], ["instrumentos", "Instrumentos financieros"], ["fondos", "Fondos por dentro"], ["casas", "Cómo elegir una Casa de Bolsa"], ["estafas", "Señales de estafa"]] },
  { level: "Avanzado", icon: "LineChart", items: [["riesgos", "Los 6 riesgos"], ["estrategias", "Estrategias de cartera"], ["prospecto", "Cómo leer un prospecto"], ["linea", "Ciclo de vida de una inversión"], ["simulador", "Calculadoras"]] },
  { level: "Experto", icon: "GraduationCap", items: [["negociacion", "Cómo se negocia"], ["precios", "Precio de un bono"], ["mapa", "Mapa del mercado"], ["experto", "Emisores, derechos e impuestos"], ["quiz", "Quiz final"]] },
  { level: "Profesional", icon: "Award", items: [["pro-rf", "Duración, convexidad y curva"], ["pro-credito", "Spread y análisis de crédito"], ["pro-valuacion", "Valuación de acciones"], ["pro-carteras", "Carteras, volatilidad y Sharpe"], ["pro-macro", "Macroeconomía y el BCP"], ["pro-derivados", "Futuros, opciones y fideicomisos"], ["pro-micro", "Subastas y formadores de mercado"], ["pro-psico", "Psicología del inversor"], ["pro-practica", "Cartera de práctica y quiz profesional"]] },
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
        <div className="mt-6 grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ROUTE.map((l, li) => {
            const ld = l.items.filter(([id]) => done[id]).length;
            return (
              <div key={l.level} className={"rounded-xl border p-4 " + (li === 4 ? "md:col-span-2 border-navy/40 bg-navy/5" : "border-line bg-bg")}>
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 font-bold text-ink"><span className="grid place-items-center w-8 h-8 rounded-lg bg-navy text-navyfg"><Icon name={l.icon} className="w-4 h-4" /></span>Nivel {li + 1}: {l.level}</p>
                  {ld === l.items.length && <Icon name="Trophy" className="w-5 h-5 text-amber" />}
                </div>
                <ul className={"mt-3 gap-x-4 " + (li === 4 ? "grid sm:grid-cols-2 gap-y-1" : "space-y-1")}>
                  {l.items.map(([id, label]) => (
                    <li key={id} className="flex items-center gap-2 rounded-lg px-1 py-1.5 hover:bg-soft">
                      <input id={"ruta-" + id} type="checkbox" checked={!!done[id]} onChange={(e) => { const nd = { ...done, [id]: e.target.checked }; setDone(nd); if (e.target.checked && l.items.every(([x]) => nd[x])) { celebrate(); toast("¡Nivel " + (li + 1) + " completado!", l.level + ". Seguí con el próximo nivel.", "Trophy"); } }} className="w-4 h-4 accent-[rgb(var(--em))] shrink-0" />
                      <label htmlFor={"ruta-" + id} className={"flex-1 text-sm cursor-pointer " + (done[id] ? "text-muted line-through" : "text-ink")}>{label}</label>
                      <button onClick={() => goTo(id)} className="text-xs font-semibold text-em hover:underline shrink-0" aria-label={"Ir a " + label}>Ir</button>
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
  const next = () => {
    const na = [...answers, picked];
    setAnswers(na); setPicked(null); setI(i + 1);
    if (na.length === QUIZ.length && na.filter((a, k) => a === QUIZ[k][2]).length >= 7) { markSeen("quiz-ok"); setTimeout(() => celebrate(), 150); }
  };
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

/* =====================================================================
   SECCIONES NUEVAS (v4): mitos, estafas, negociación, precios de bonos,
   riesgos, estrategias, fondos y nivel experto.
   ===================================================================== */
const TabBar = ({ idBase, tabs, value, onChange, label }) => (
  <div className="overflow-x-auto -mx-1 px-1 pb-1">
    <div role="tablist" aria-label={label} className="inline-flex gap-2 min-w-max">
      {tabs.map(([id, l, ic]) => (
        <button key={id} id={idBase + "-" + id} role="tab" aria-selected={value === id} onClick={() => onChange(id)}
          className={"inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition " + (value === id ? "bg-navy text-navyfg border-navy" : "bg-card text-ink border-line hover:border-em")}>
          {ic && <Icon name={ic} className="w-4 h-4" />} {l}
        </button>
      ))}
    </div>
  </div>
);
const Bullet = ({ children, icon = "Check", tone = "text-em" }) => (
  <li className="flex gap-2.5 text-sm text-ink"><Icon name={icon} className={"w-4 h-4 shrink-0 mt-0.5 " + tone} /><span>{children}</span></li>
);

/* ---------- 1a. mitos vs realidad ---------- */
const MYTHS = [
  ["La bolsa es solo para ricos", "Con un fondo mutuo podés empezar con montos accesibles y sumar aportes cada mes."],
  ["Invertir en la bolsa es como apostar", "En la renta fija conocés la tasa y las fechas de pago desde el inicio. Invertir con información y diversificación no tiene nada que ver con el azar."],
  ["Si invierto, no puedo sacar mi plata", "Los fondos mutuos se rescatan en pocos días, y los bonos y CDA se pueden vender en el mercado secundario."],
  ["Tengo que ser experto en finanzas", "Tu Casa de Bolsa te asesora, y con lo básico de esta guía ya podés tomar decisiones informadas."],
  ["Es lo mismo que un plazo fijo del banco", "Hay muchos más emisores, plazos e instrumentos, a menudo con mejores tasas, y podés vender antes del vencimiento."],
  ["Si la tasa es más alta, siempre conviene", "Una tasa más alta suele indicar más riesgo. Mirá la calificación del emisor y el plazo, no solo el número."],
];
function Mitos() {
  const [open, setOpen] = useState({});
  const all = Object.values(open).filter(Boolean).length === MYTHS.length;
  return (
    <Section id="mitos" eyebrow="Antes de empezar" title="Mitos y realidades de la bolsa"
      intro="Muchas personas no invierten por ideas equivocadas. Tocá cada mito para ver la realidad.">
      <div className="flex justify-end mb-3">
        <button onClick={() => setOpen(all ? {} : Object.fromEntries(MYTHS.map((_, k) => [k, true])))} className="text-sm font-semibold text-em hover:underline">
          {all ? "Ocultar todas" : "Ver todas las realidades"}
        </button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MYTHS.map(([m, r], k) => (
          <button key={k} id={"mito-" + k} onClick={() => setOpen((o) => ({ ...o, [k]: !o[k] }))} aria-expanded={!!open[k]}
            className={"text-left rounded-2xl border p-5 min-h-[170px] flex flex-col transition " + (open[k] ? "border-em bg-emsoft" : "border-line bg-card hover:border-em/50")}>
            <Pill className={open[k] ? "bg-em text-white self-start" : "bg-dangersoft text-danger self-start"}>{open[k] ? "Realidad" : "Mito"}</Pill>
            <p className={"mt-3 font-bold " + (open[k] ? "text-muted line-through text-sm" : "text-ink text-lg")}>«{m}»</p>
            {open[k] ? <p className="fade-in mt-2 text-ink">{r}</p> : <p className="mt-auto pt-3 text-sm text-em font-semibold inline-flex items-center gap-1">Ver la realidad <Icon name="ArrowRight" className="w-4 h-4" /></p>}
          </button>
        ))}
      </div>
    </Section>
  );
}

/* ---------- 1b. señales de estafa ---------- */
const SCAM_SIGNS = [
  ["BadgePercent", "Rendimientos garantizados muy altos", "Por ejemplo, 3 % o 5 % mensual \"sin riesgo\". Ninguna inversión legítima garantiza eso."],
  ["Timer", "Presión y urgencia", "\"Solo por hoy\", \"quedan pocos cupos\". Te apuran para que no verifiques."],
  ["UserX", "Transferir a una cuenta personal", "Las Casas de Bolsa reciben dinero en cuentas a nombre de la entidad, nunca de una persona."],
  ["SearchX", "No figura en los registros oficiales", "Si no está en la lista del BCP o de la BVA, no puede ofrecerte valores."],
  ["Users", "Ganás más si sumás gente", "Pagar por reclutar personas es la marca de un esquema piramidal."],
  ["FileX", "Sin contrato ni prospecto", "Todo producto regulado tiene documentación con sus condiciones y riesgos."],
  ["MessageCircle", "Contacto de desconocidos por redes", "Mensajes no solicitados por WhatsApp, Instagram o Facebook con \"oportunidades únicas\"."],
  ["KeyRound", "Te piden claves o datos bancarios", "Nadie legítimo te pide tu PIN, contraseña o código de verificación."],
];
const SCAM_CASES = [
  ["Un \"asesor\" te escribe por Instagram: ofrece 4 % mensual garantizado y te pide transferir hoy a su cuenta personal.", true, "Rendimiento garantizado altísimo, urgencia, contacto por redes y cuenta personal: cuatro señales de estafa juntas."],
  ["Una Casa de Bolsa que figura en la lista de la BVA te ofrece un bono AApy al 9 % anual, te envía el prospecto y te pide transferir a la cuenta de la entidad.", false, "Entidad habilitada, tasa acorde al mercado, documentación y cuenta institucional: es lo esperable de una operación legítima. Igual leé el prospecto."],
  ["Te invitan a un \"club de inversión\" donde cobrás comisiones por cada persona que sumás.", true, "Ganar por reclutar gente, y no por una inversión real, es un esquema piramidal."],
  ["Un fondo mutuo publica su valor cuota diario y su reglamento, y aclara que la rentabilidad pasada no garantiza la futura.", false, "Transparencia y advertencias de riesgo son propias de un producto regulado."],
];
function Estafas() {
  const [ans, setAns] = useState({});
  return (
    <Section id="estafas" eyebrow="Protegé tu dinero" title="Señales de estafa"
      intro="Las estafas financieras se disfrazan de inversiones. Aprendé a reconocerlas antes de transferir un solo guaraní.">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SCAM_SIGNS.map(([ic, t, d]) => (
          <div key={t} className="rounded-2xl border border-line bg-card p-4">
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-dangersoft text-danger"><Icon name={ic} className="w-5 h-5" /></span>
            <p className="mt-3 font-bold text-ink text-sm">{t}</p>
            <p className="mt-1 text-sm text-muted">{d}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 grid lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
        <div className="rounded-2xl border border-line bg-card p-5 sm:p-6">
          <h3 className="text-xl font-bold text-ink">¿Estafa o inversión legítima?</h3>
          <p className="mt-1 text-sm text-muted">Leé cada caso y elegí. Te decimos por qué.</p>
          <ol className="mt-4 space-y-3">
            {SCAM_CASES.map(([txt, scam, why], k) => {
              const a = ans[k];
              return (
                <li key={k} className="rounded-xl border border-line bg-bg p-4">
                  <p className="text-sm text-ink"><span className="font-mono text-muted mr-1">{k + 1}.</span>{txt}</p>
                  {a === undefined ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button id={"scam-" + k + "-si"} onClick={() => setAns((a0) => ({ ...a0, [k]: true }))} className="px-3 py-1.5 rounded-lg border border-danger/40 text-danger text-sm font-semibold hover:bg-dangersoft">Es estafa</button>
                      <button id={"scam-" + k + "-no"} onClick={() => setAns((a0) => ({ ...a0, [k]: false }))} className="px-3 py-1.5 rounded-lg border border-em/40 text-em text-sm font-semibold hover:bg-emsoft">Parece legítimo</button>
                    </div>
                  ) : (
                    <div className={"fade-in mt-3 rounded-lg p-3 text-sm " + (a === scam ? "bg-emsoft" : "bg-dangersoft")}>
                      <p className={"font-bold " + (a === scam ? "text-em" : "text-danger")}>{a === scam ? "¡Bien!" : "Ojo:"} {scam ? "es una estafa." : "es una operación legítima."}</p>
                      <p className="mt-1 text-ink">{why}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
        <aside className="board-bg rounded-2xl bg-navy text-navyfg p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-up">Qué hacer</p>
          <ol className="mt-4 space-y-4">
            {[["Verificá", "Buscá la entidad en la lista del BCP y de la BVA (sección Fuentes oficiales)."], ["No transfieras", "Nunca envíes dinero a cuentas personales ni compartas claves."], ["Pedí todo por escrito", "Contrato, prospecto, tarifario y datos de la entidad."], ["Denunciá", "Si sospechás una estafa, informá a la Superintendencia de Valores del BCP y a la Policía Nacional."]].map(([t, d], k) => (
              <li key={t} className="flex gap-3"><span className="grid place-items-center w-7 h-7 shrink-0 rounded-full bg-em text-white font-mono text-sm">{k + 1}</span><div><p className="font-bold">{t}</p><p className="text-sm opacity-80">{d}</p></div></li>
            ))}
          </ol>
        </aside>
      </div>
    </Section>
  );
}

/* ---------- 3. cómo se negocia ---------- */
const ORDER_FLOW = [
  ["Smartphone", "Das la orden", "Le indicás a tu Casa de Bolsa qué querés comprar o vender, cuánto y a qué precio, por app, correo o con tu asesor."],
  ["Building2", "La Casa de Bolsa la ingresa", "Tu orden entra al sistema de negociación electrónico de la BVA, donde se ven todas las ofertas de compra y venta."],
  ["Handshake", "Se calza la operación", "Cuando una oferta de compra coincide en precio con una de venta, la operación se concreta."],
  ["Repeat", "Compensación y liquidación", "La Caja de Valores del Paraguay (CAVAPY) se encarga de que el comprador pague y el vendedor entregue los títulos."],
  ["Wallet", "Títulos en tu cuenta", "Los valores quedan registrados a tu nombre y los ves en el estado de cuenta de tu Casa de Bolsa."],
];
const BOOK = { bids: [[99.8, 120], [99.6, 300], [99.4, 150]], asks: [[100.1, 80], [100.3, 200], [100.5, 250]] };
function Negociacion() {
  const [step, setStep] = useState(0);
  const maxQ = 300;
  return (
    <Section id="negociacion" eyebrow="Mercado secundario" title="Cómo se negocia en la bolsa"
      intro="Qué pasa desde que das una orden hasta que el título queda a tu nombre, y cómo se leen las ofertas de compra y venta.">
      <div className="rounded-2xl border border-line bg-card p-5 sm:p-6">
        <ol className="grid grid-cols-5 gap-2">
          {ORDER_FLOW.map(([ic, t], k) => (
            <li key={t}>
              <button id={"flow-" + k} onClick={() => setStep(k)} aria-current={step === k ? "step" : undefined}
                className={"w-full rounded-xl border p-2 sm:p-3 text-left transition " + (step === k ? "border-em bg-emsoft" : "border-line hover:border-em/50")}>
                <span className={"grid place-items-center w-9 h-9 rounded-lg " + (step >= k ? "bg-navy text-up" : "bg-soft text-muted")}><Icon name={ic} className="w-4 h-4" /></span>
                <span className="hidden sm:block mt-2 text-xs font-semibold text-ink leading-snug">{t}</span>
              </button>
            </li>
          ))}
        </ol>
        <div key={step} className="fade-in mt-4 rounded-xl bg-bg border border-line p-4">
          <p className="font-mono text-xs text-em">PASO {step + 1} DE {ORDER_FLOW.length}</p>
          <p className="mt-1 font-bold text-ink">{ORDER_FLOW[step][1]}</p>
          <p className="mt-1 text-sm text-muted">{ORDER_FLOW[step][2]}</p>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-[1fr_1.1fr] gap-5 items-start">
        <div className="space-y-4 min-w-0">
          <div className="rounded-2xl border border-line bg-card p-5">
            <h3 className="font-bold text-ink text-lg">Tipos de orden</h3>
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              <div className="rounded-xl bg-bg border border-line p-4"><p className="font-semibold text-ink">A precio de mercado</p><p className="mt-1 text-sm text-muted">Comprás o vendés al mejor precio disponible en ese momento. Es rápida, pero no controlás el precio exacto.</p></div>
              <div className="rounded-xl bg-bg border border-line p-4"><p className="font-semibold text-ink">Con precio límite</p><p className="mt-1 text-sm text-muted">Fijás el precio máximo al que comprás o el mínimo al que vendés. Controlás el precio, pero puede no ejecutarse.</p></div>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-card p-5">
            <h3 className="font-bold text-ink text-lg">Liquidación y custodia</h3>
            <p className="mt-2 text-sm text-muted">La CAVAPY compensa y liquida las operaciones: verifica que el dinero y los títulos cambien de manos. El plazo de liquidación de cada operación te lo informa tu Casa de Bolsa.</p>
            <p className="mt-3 text-sm text-muted">La BVA y la CAVAPY están modernizando su infraestructura con proveedores internacionales (Nasdaq para la negociación y Montran para la liquidación), con el objetivo de operar más rápido y conectar el mercado con el exterior.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-card overflow-hidden min-w-0">
          <div className="bg-navy text-navyfg px-5 py-3 flex items-center justify-between gap-3">
            <div><p className="font-mono text-[11px] uppercase tracking-widest opacity-70">Libro de órdenes</p><p className="font-display font-bold">Bono EJEMPLO S.A. · Serie 1 · PYG</p></div>
            <Pill className="bg-gold text-navy">Ficticio</Pill>
          </div>
          <div className="grid grid-cols-2 font-mono text-sm">
            <div className="border-r border-line">
              <p className="px-4 py-2 text-[11px] uppercase tracking-wider text-em bg-emsoft">Compra (puntas compradoras)</p>
              {BOOK.bids.map(([p, q]) => (
                <div key={p} className="relative px-4 py-2 flex justify-between border-t border-line">
                  <span className="absolute inset-y-0 right-0 bg-em/10" style={{ width: (q / maxQ) * 100 + "%" }} aria-hidden="true" />
                  <span className="relative text-muted">{q}</span><span className="relative font-semibold text-em">{p.toLocaleString("es-PY", { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="px-4 py-2 text-[11px] uppercase tracking-wider text-danger bg-dangersoft">Venta (puntas vendedoras)</p>
              {BOOK.asks.map(([p, q]) => (
                <div key={p} className="relative px-4 py-2 flex justify-between border-t border-line">
                  <span className="absolute inset-y-0 left-0 bg-danger/10" style={{ width: (q / maxQ) * 100 + "%" }} aria-hidden="true" />
                  <span className="relative font-semibold text-danger">{p.toLocaleString("es-PY", { minimumFractionDigits: 2 })}</span><span className="relative text-muted">{q}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-line p-4 text-sm text-ink space-y-1.5">
            <p><span className="font-semibold">Mejor compra:</span> <span className="font-mono">99,80 %</span> · <span className="font-semibold">Mejor venta:</span> <span className="font-mono">100,10 %</span></p>
            <p><span className="font-semibold">Diferencial (spread):</span> <span className="font-mono">0,30 %</span>. Cuanto más chico, más líquido es el título.</p>
            <p className="text-xs text-muted">Precios en % del valor nominal; cantidades en títulos. Si querés comprar ya, pagás 100,10 %; si querés vender ya, recibís 99,80 %.</p>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ---------- 2. precio de un bono ---------- */
const bondPrice = (N, cpn, f, years, ytm) => {
  const n = Math.max(1, Math.round(years * f)); const c = (N * cpn) / 100 / f; const y = ytm / 100 / f;
  let p = 0; for (let k = 1; k <= n; k++) p += c / Math.pow(1 + y, k);
  return p + N / Math.pow(1 + y, n);
};
function Precios() {
  const [N, setN] = useState(10000000);
  const [cpn, setCpn] = useState(9);
  const [f, setF] = useState(2);
  const [years, setYears] = useState(4);
  const [ytm, setYtm] = useState(10);
  const [days, setDays] = useState(60);
  const price = bondPrice(toNum(N), toNum(cpn), f, Math.max(0.5, toNum(years)), toNum(ytm));
  const pctPar = toNum(N) > 0 ? (price / toNum(N)) * 100 : 0;
  const state = pctPar < 99.95 ? ["Bajo la par", "bg-ambersoft text-amber", "La tasa del mercado es mayor que el cupón: el bono se vende con descuento."] : pctPar > 100.05 ? ["Sobre la par", "bg-emsoft text-em", "La tasa del mercado es menor que el cupón: el bono vale más que su valor nominal."] : ["A la par", "bg-soft text-ink", "La tasa del mercado es igual al cupón: el bono vale su valor nominal."];
  const maxDays = Math.round(365 / f);
  const accrued = (toNum(N) * toNum(cpn)) / 100 * (Math.min(toNum(days), maxDays) / 365);
  const curve = Array.from({ length: 27 }, (_, k) => { const r = 3 + k * 0.5; return { r, p: (bondPrice(100, toNum(cpn), f, Math.max(0.5, toNum(years)), r)) }; });
  const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, ReferenceDot } = RC || {};
  return (
    <Section id="precios" eyebrow="Mercado secundario" title="Cómo se mueve el precio de un bono"
      intro="Si vendés un bono antes del vencimiento, su precio depende de las tasas del mercado en ese momento. Mové la tasa y mirá qué pasa.">
      <div className="grid md:grid-cols-3 gap-3">
        {[["TrendingUp", "Suben las tasas → baja el precio", "Si el mercado paga más que tu bono, nadie pagará el 100 % por él."], ["TrendingDown", "Bajan las tasas → sube el precio", "Si tu bono paga más que el mercado, otros pagarán más del 100 % por él."], ["Flag", "Al vencimiento, siempre 100 %", "Si lo mantenés hasta el final, cobrás el capital completo sin importar el precio intermedio."]].map(([ic, t, d]) => (
          <div key={t} className="rounded-2xl border border-line bg-card p-4"><Icon name={ic} className="w-5 h-5 text-em" /><p className="mt-2 font-bold text-ink text-sm">{t}</p><p className="mt-1 text-sm text-muted">{d}</p></div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl border border-line bg-card p-5 sm:p-7">
        <h3 className="text-xl font-bold text-ink">Calculadora de precio de un bono</h3>
        <div className="mt-5 grid lg:grid-cols-[320px_1fr] gap-6">
          <div className="grid gap-4 content-start">
            <NumField id="pr-n" label="Valor nominal (Gs.)" value={N} onChange={setN} cur="PYG" step={1000000} />
            <div className="grid grid-cols-2 gap-3">
              <NumField id="pr-cpn" label="Tasa del cupón" value={cpn} onChange={setCpn} suffix="%" step={0.1} />
              <NumField id="pr-years" label="Años restantes" value={years} onChange={setYears} suffix="años" min={0.5} max={30} step={0.5} />
            </div>
            <div>
              <label htmlFor="pr-f" className="text-sm font-semibold text-ink block mb-1.5">Pago de cupones</label>
              <select id="pr-f" value={f} onChange={(e) => setF(Number(e.target.value))} className={FIELD}>
                <option value={12}>Mensual</option><option value={4}>Trimestral</option><option value={2}>Semestral</option><option value={1}>Anual</option>
              </select>
            </div>
            <div>
              <label htmlFor="pr-ytm" className="flex justify-between text-sm font-semibold text-ink">Tasa del mercado hoy (TIR) <span className="font-mono text-em">{pct(ytm)}</span></label>
              <input id="pr-ytm" type="range" min="3" max="16" step="0.25" value={ytm} onChange={(e) => setYtm(e.target.value)} className="w-full mt-2" />
            </div>
          </div>
          <div className="min-w-0 space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <Stat tone="navy" label="Precio del bono" value={fmtMoney(price, "PYG")} sub={pct(pctPar, 2) + " del nominal"} />
              <div className="rounded-2xl p-4 sm:p-5 border border-line bg-bg min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted">Situación</p>
                <Pill className={"mt-2 " + state[1]}>{state[0]}</Pill>
                <p className="mt-2 text-xs text-muted">{state[2]}</p>
              </div>
              <Stat tone={price >= toNum(N) ? "em" : "danger"} label={price >= toNum(N) ? "Ganancia si vendés hoy" : "Pérdida si vendés hoy"} value={fmtMoney(Math.abs(price - toNum(N)), "PYG")} sub="Frente al valor nominal" />
            </div>
            <div className="h-56 rounded-xl border border-line bg-bg p-3">
              {ResponsiveContainer && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={curve} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="r" type="number" domain={[3, 16]} tickLine={false} axisLine={false} tickFormatter={(v) => v + " %"} />
                    <YAxis tickLine={false} axisLine={false} width={48} tickFormatter={(v) => Math.round(v) + "%"} domain={["auto", "auto"]} />
                    <Tooltip formatter={(v) => [pct(v, 2) + " del nominal", "Precio"]} labelFormatter={(l) => "Tasa de mercado " + pct(l)} contentStyle={TOOLTIP_STYLE} />
                    <ReferenceLine y={100} stroke="rgb(var(--muted))" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="p" stroke="rgb(var(--em))" strokeWidth={3} dot={false} />
                    <ReferenceDot x={toNum(ytm)} y={pctPar} r={6} fill="rgb(var(--navy))" stroke="rgb(var(--card))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <p className="text-xs text-muted">Curva precio-tasa de este bono. La línea punteada marca el 100 % (a la par).</p>
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-line bg-bg p-5 grid md:grid-cols-[1fr_1fr] gap-5 items-center">
          <div>
            <h4 className="font-bold text-ink flex items-center gap-2"><Icon name="CalendarClock" className="w-5 h-5 text-em" /> Intereses corridos</h4>
            <p className="mt-1 text-sm text-muted">Si comprás un bono entre dos fechas de pago, le pagás al vendedor los intereses que ya acumuló desde el último cupón. Después vos cobrás el cupón completo.</p>
            <div className="mt-3 max-w-xs"><NumField id="pr-days" label={"Días desde el último cupón (máx. " + maxDays + ")"} value={days} onChange={setDays} min={0} max={maxDays} step={1} /></div>
          </div>
          <div className="grid gap-3">
            <Stat label="Intereses corridos" value={fmtMoney(accrued, "PYG")} />
            <Stat tone="navy" label="Pagás en total (precio + corridos)" value={fmtMoney(price + accrued, "PYG")} />
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ---------- 4. riesgos ---------- */
const RISKS = [
  ["ShieldAlert", "Crédito", "Que el emisor no pague los intereses o el capital a tiempo.", "Una empresa con problemas financieros se atrasa en el pago de un cupón.", "Revisá la calificación (preferí AApy o superior), diversificá y no pongas más del 20 % en un solo emisor.", "Bonos, CDA, acciones preferidas"],
  ["Droplets", "Liquidez", "Que no encuentres comprador rápido si querés vender antes del vencimiento.", "Necesitás el dinero de un bono a 5 años y no aparece comprador al precio que esperás.", "Usá fondos mutuos para el dinero que podrías necesitar y hacé coincidir plazos con tus metas.", "Acciones, fondos de inversión, bonos largos"],
  ["Percent", "Tasa de interés", "Que suban las tasas del mercado y baje el precio de tus bonos.", "Compraste un bono al 8 % y el mercado pasa a pagar 10 %: si vendés antes, tu bono vale menos.", "Mantenelo hasta el vencimiento o armá una escalera de vencimientos.", "Bonos de largo plazo"],
  ["ArrowLeftRight", "Cambiario", "Que el tipo de cambio se mueva en contra de la moneda en que vas a gastar.", "Ahorrás en guaraníes para pagar algo en dólares y el dólar sube.", "Invertí en la moneda de tus gastos futuros. Las empresas pueden usar futuros de divisas.", "Inversiones en otra moneda"],
  ["TrendingDown", "Inflación", "Que tu rendimiento quede por debajo de la inflación.", "Un depósito al 3 % con inflación de 4 % te hace perder poder de compra.", "Buscá un rendimiento real positivo: compará con la calculadora de ahorro vs. invertir.", "Caja de ahorro e instrumentos de baja tasa"],
  ["PieChart", "Concentración", "Tener demasiado en un solo emisor, sector o moneda.", "Todo tu dinero en bonos del agro en un año de sequía.", "Diversificá por emisor, sector, plazo y moneda.", "Cualquier cartera"],
];
function Riesgos() {
  const [sel, setSel] = useState(0);
  const r = RISKS[sel];
  return (
    <Section id="riesgos" eyebrow="Conocé los riesgos" title="Los 6 riesgos de invertir y cómo cubrirte"
      intro="Toda inversión tiene riesgos. Conocerlos te permite elegir mejor y protegerte. Elegí uno para ver un ejemplo y cómo cubrirte.">
      <div className="grid lg:grid-cols-[1fr_1.1fr] gap-5 items-start">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {RISKS.map(([ic, t, d], k) => (
            <button key={t} id={"riesgo-" + k} onClick={() => setSel(k)} aria-pressed={sel === k}
              className={"text-left rounded-2xl border p-4 transition " + (sel === k ? "border-navy bg-navy text-navyfg" : "border-line bg-card text-ink hover:border-em/50")}>
              <Icon name={ic} className={"w-6 h-6 " + (sel === k ? "text-up" : "text-amber")} />
              <p className="mt-2 font-bold text-sm">Riesgo de {t.toLowerCase()}</p>
              <p className={"mt-1 text-xs " + (sel === k ? "opacity-80" : "text-muted")}>{d}</p>
            </button>
          ))}
        </div>
        <article key={sel} className="fade-in rounded-2xl border border-line bg-card p-6">
          <p className="eyebrow">Riesgo de {r[1].toLowerCase()}</p>
          <h3 className="mt-1 text-2xl font-bold text-ink">{r[2]}</h3>
          <div className="mt-5 grid gap-3">
            <div className="rounded-xl bg-ambersoft border border-amber/30 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-amber">Ejemplo</p><p className="mt-1 text-sm text-ink">{r[3]}</p></div>
            <div className="rounded-xl bg-emsoft border border-em/30 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-em">Cómo cubrirte</p><p className="mt-1 text-sm text-ink">{r[4]}</p></div>
            <p className="text-sm"><span className="text-muted">Afecta más a: </span><span className="font-semibold text-ink">{r[5]}</span></p>
          </div>
        </article>
      </div>
    </Section>
  );
}

/* ---------- 5. estrategias ---------- */
function Estrategias() {
  const [tab, setTab] = useState("escalera");
  const [amount, setAmount] = useState(50000000);
  const [steps, setSteps] = useState(5);
  const [base, setBase] = useState(7);
  const [prem, setPrem] = useState(0.5);
  const [target, setTarget] = useState(70);
  const [fixed, setFixed] = useState(28000000);
  const [variable, setVariable] = useState(22000000);
  const ladder = Array.from({ length: steps }, (_, k) => { const r = toNum(base) + k * toNum(prem); const a = toNum(amount) / steps; return { k: k + 1, a, r, i: (a * r) / 100 }; });
  const ladderRate = ladder.reduce((s, x) => s + x.r, 0) / steps;
  const total = toNum(fixed) + toNum(variable);
  const curFixed = total > 0 ? (toNum(fixed) / total) * 100 : 0;
  const move = (total * toNum(target)) / 100 - toNum(fixed);
  const vcs = [1000, 950, 900, 980, 1050, 1100];
  const dca = vcs.map((vc, k) => ({ m: k + 1, vc, q: 500000 / vc }));
  const units = dca.reduce((s, x) => s + x.q, 0);
  const avgCost = (500000 * vcs.length) / units;
  const avgPrice = vcs.reduce((s, v) => s + v, 0) / vcs.length;
  return (
    <Section id="estrategias" eyebrow="Armá tu cartera" title="Estrategias para invertir mejor"
      intro="Cuatro estrategias simples que usan los inversores profesionales y que podés aplicar desde el primer día.">
      <TabBar idBase="estr" label="Estrategias" value={tab} onChange={setTab} tabs={[["escalera", "Escalera de vencimientos", "Layers"], ["diversificar", "Diversificación", "PieChart"], ["rebalanceo", "Rebalanceo", "Scale"], ["aportes", "Aportes periódicos", "CalendarClock"]]} />
      <div key={tab} className="fade-in mt-5 rounded-2xl border border-line bg-card p-5 sm:p-7">
        {tab === "escalera" && (
          <div className="grid lg:grid-cols-[320px_1fr] gap-6">
            <div className="space-y-4">
              <p className="text-ink">Dividís tu dinero en partes iguales con vencimientos escalonados. Cada año vence una parte: si la necesitás, la usás; si no, la reinvertís al plazo más largo. Así tenés liquidez periódica y aprovechás las tasas de largo plazo.</p>
              <NumField id="esc-amount" label="Monto total (Gs.)" value={amount} onChange={setAmount} cur="PYG" step={1000000} />
              <div className="grid grid-cols-3 gap-3">
                <div><label htmlFor="esc-steps" className="text-sm font-semibold text-ink block mb-1.5">Peldaños</label>
                  <select id="esc-steps" value={steps} onChange={(e) => setSteps(Number(e.target.value))} className={FIELD}>{[3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}</select></div>
                <NumField id="esc-base" label="Tasa 1 año" value={base} onChange={setBase} suffix="%" step={0.1} />
                <NumField id="esc-prem" label="+ por año" value={prem} onChange={setPrem} suffix="%" step={0.1} />
              </div>
            </div>
            <div className="min-w-0 space-y-3">
              {ladder.map((x) => (
                <div key={x.k} className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted w-14 shrink-0">Año {x.k}</span>
                  <div className="flex-1 h-9 rounded-lg bg-soft overflow-hidden"><div className="h-full rounded-lg bg-navy text-navyfg flex items-center px-3 text-xs font-mono whitespace-nowrap" style={{ width: (35 + (x.k / steps) * 65) + "%" }}>{fmtMoney(x.a, "PYG")} · {pct(x.r)}</div></div>
                </div>
              ))}
              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <Stat tone="em" label="Tasa promedio de la escalera" value={pct(ladderRate, 2)} />
                <Stat label="Intereses por año" value={fmtMoney(ladder.reduce((s, x) => s + x.i, 0), "PYG")} />
              </div>
            </div>
          </div>
        )}
        {tab === "diversificar" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-ink">No pongas todos los huevos en la misma canasta. Repartí tu dinero en cuatro dimensiones para que un problema puntual no afecte a toda tu cartera.</p>
              <ul className="mt-4 space-y-3">
                <Bullet><strong>Por emisor:</strong> ningún emisor debería superar el 15 % a 20 % de tu cartera.</Bullet>
                <Bullet><strong>Por sector:</strong> combiná bancos, Estado, agro, comercio y servicios.</Bullet>
                <Bullet><strong>Por plazo:</strong> mezclá vencimientos cortos, medianos y largos.</Bullet>
                <Bullet><strong>Por moneda:</strong> guaraníes y dólares según tus gastos futuros.</Bullet>
              </ul>
            </div>
            <div className="rounded-xl bg-bg border border-line p-5">
              <p className="text-sm font-semibold text-ink">Ejemplo de cartera diversificada</p>
              {[["Bonos del Tesoro (Estado)", 25], ["CDA de 2 bancos", 25], ["Bonos corporativos de 3 sectores", 30], ["Fondo mutuo", 15], ["Acciones preferidas", 5]].map(([n, w]) => (
                <div key={n} className="mt-3"><div className="flex justify-between text-sm"><span className="text-ink">{n}</span><span className="font-mono text-muted">{w} %</span></div><div className="mt-1 h-2 rounded-full bg-soft"><div className="h-full rounded-full bg-em" style={{ width: w * 2.5 + "%" }} /></div></div>
              ))}
              <p className="mt-4 text-xs text-muted">Ejemplo educativo, no es una recomendación.</p>
            </div>
          </div>
        )}
        {tab === "rebalanceo" && (
          <div className="grid lg:grid-cols-[320px_1fr] gap-6">
            <div className="space-y-4">
              <p className="text-ink">Con el tiempo, lo que más sube ocupa más lugar en tu cartera y cambia tu nivel de riesgo. Una vez al año volvé a tu distribución objetivo.</p>
              <NumField id="reb-target" label="Objetivo en renta fija" value={target} onChange={setTarget} suffix="%" min={0} max={100} step={5} />
              <NumField id="reb-fixed" label="Tenés hoy en renta fija (Gs.)" value={fixed} onChange={setFixed} cur="PYG" step={1000000} />
              <NumField id="reb-var" label="Tenés hoy en renta variable (Gs.)" value={variable} onChange={setVariable} cur="PYG" step={1000000} />
            </div>
            <div className="min-w-0 space-y-4">
              <div>
                <p className="text-sm text-muted mb-1">Hoy</p>
                <div className="flex h-8 rounded-lg overflow-hidden font-mono text-xs"><div className="bg-navy text-navyfg grid place-items-center" style={{ width: curFixed + "%" }}>{Math.round(curFixed)} %</div><div className="bg-amber text-white grid place-items-center flex-1">{Math.round(100 - curFixed)} %</div></div>
                <p className="text-sm text-muted mt-3 mb-1">Objetivo</p>
                <div className="flex h-8 rounded-lg overflow-hidden font-mono text-xs"><div className="bg-navy text-navyfg grid place-items-center" style={{ width: toNum(target) + "%" }}>{toNum(target)} %</div><div className="bg-amber text-white grid place-items-center flex-1">{100 - toNum(target)} %</div></div>
                <div className="flex gap-4 mt-2 text-xs text-muted"><span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-navy" />Renta fija</span><span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-amber" />Renta variable</span></div>
              </div>
              <div className="rounded-2xl bg-navy text-navyfg p-5">
                <p className="font-mono text-xs uppercase tracking-widest opacity-70">Para rebalancear</p>
                {Math.abs(move) < 1 ? <p className="mt-1 text-lg font-semibold">Tu cartera ya está en su objetivo.</p> : (
                  <p className="mt-1 text-lg">Pasá <span className="font-mono font-semibold text-up">{fmtMoney(Math.abs(move), "PYG")}</span> de {move > 0 ? "renta variable a renta fija" : "renta fija a renta variable"}.</p>
                )}
              </div>
            </div>
          </div>
        )}
        {tab === "aportes" && (
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
            <div>
              <p className="text-ink">Invertir un monto fijo cada mes, sin intentar adivinar el mejor momento, se llama <strong>promediar el costo</strong>. Cuando el precio baja comprás más cuotas, y cuando sube, menos. Al final tu costo promedio queda por debajo del precio promedio.</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Stat tone="em" label="Tu costo promedio" value={"Gs. " + Math.round(avgCost).toLocaleString("es-PY")} sub="por cuota" />
                <Stat label="Precio promedio" value={"Gs. " + Math.round(avgPrice).toLocaleString("es-PY")} sub="por cuota" />
              </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full text-sm min-w-[360px]">
                <thead className="bg-soft text-left text-muted"><tr><th className="p-2.5">Mes</th><th className="p-2.5 text-right">Aporte</th><th className="p-2.5 text-right">Valor cuota</th><th className="p-2.5 text-right">Cuotas</th></tr></thead>
                <tbody className="divide-y divide-line font-mono">
                  {dca.map((x) => <tr key={x.m}><td className="p-2.5 text-muted">{x.m}</td><td className="p-2.5 text-right text-ink">Gs. 500.000</td><td className="p-2.5 text-right text-ink">{x.vc.toLocaleString("es-PY")}</td><td className="p-2.5 text-right text-em">{x.q.toLocaleString("es-PY", { maximumFractionDigits: 1 })}</td></tr>)}
                  <tr className="bg-emsoft font-semibold"><td className="p-2.5 text-ink">Total</td><td className="p-2.5 text-right text-ink">Gs. 3.000.000</td><td className="p-2.5" /><td className="p-2.5 text-right text-em">{units.toLocaleString("es-PY", { maximumFractionDigits: 1 })}</td></tr>
                </tbody>
              </table>
              <p className="p-3 text-xs text-muted">Valores cuota ficticios para ilustrar el mecanismo.</p>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

/* ---------- 7. fondos en profundidad ---------- */
function Fondos() {
  const [amount, setAmount] = useState(5000000);
  const [vc0, setVc0] = useState(12500);
  const [vc1, setVc1] = useState(13100);
  const [days, setDays] = useState(180);
  const units = toNum(vc0) > 0 ? toNum(amount) / toNum(vc0) : 0;
  const now = units * toNum(vc1);
  const r = toNum(vc0) > 0 ? toNum(vc1) / toNum(vc0) - 1 : 0;
  const annual = toNum(days) > 0 ? (Math.pow(1 + r, 365 / toNum(days)) - 1) * 100 : 0;
  return (
    <Section id="fondos" eyebrow="Fondos en profundidad" title="Cómo funciona un fondo por dentro"
      intro="Antes de elegir un fondo, entendé cómo se calcula su valor, cuánto cobra y cómo comparar su rendimiento.">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[["Coins", "Valor cuota", "Es el patrimonio del fondo dividido por la cantidad de cuotas. Se publica todos los días y refleja cuánto vale cada cuota."], ["Receipt", "Comisión de administración", "Porcentaje anual que cobra la administradora. Ya está descontado del valor cuota, por eso el rendimiento publicado es neto."], ["ScrollText", "Reglamento interno", "Define en qué invierte el fondo, sus límites, plazos de rescate, comisiones y riesgos. Leelo antes de entrar."], ["LineChart", "Rentabilidad histórica", "Muestra cómo le fue al fondo. Es útil para comparar, pero no garantiza resultados futuros."]].map(([ic, t, d]) => (
          <div key={t} className="rounded-2xl border border-line bg-card p-4"><span className="grid place-items-center w-10 h-10 rounded-xl bg-emsoft text-em"><Icon name={ic} className="w-5 h-5" /></span><p className="mt-3 font-bold text-ink">{t}</p><p className="mt-1 text-sm text-muted">{d}</p></div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl border border-line bg-card p-5 sm:p-7 grid lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-ink">Calculá el rendimiento de tu fondo</h3>
          <NumField id="fd-amount" label="Monto invertido (Gs.)" value={amount} onChange={setAmount} cur="PYG" step={100000} />
          <div className="grid grid-cols-2 gap-3">
            <NumField id="fd-vc0" label="Valor cuota al entrar" value={vc0} onChange={setVc0} step={1} />
            <NumField id="fd-vc1" label="Valor cuota hoy" value={vc1} onChange={setVc1} step={1} />
          </div>
          <NumField id="fd-days" label="Días transcurridos" value={days} onChange={setDays} min={1} step={1} />
        </div>
        <div className="min-w-0 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Stat label="Cuotas que compraste" value={units.toLocaleString("es-PY", { maximumFractionDigits: 2 })} />
            <Stat tone="navy" label="Tu inversión vale hoy" value={fmtMoney(now, "PYG")} />
            <Stat tone={r >= 0 ? "em" : "danger"} label="Rendimiento del período" value={(r >= 0 ? "+" : "") + pct(r * 100, 2)} sub={fmtMoney(now - toNum(amount), "PYG")} />
            <Stat tone={annual >= 0 ? "em" : "danger"} label="Equivale por año" value={(annual >= 0 ? "+" : "") + pct(annual, 2)} sub="Rendimiento anualizado" />
          </div>
          <div className="rounded-xl bg-bg border border-line p-4">
            <p className="font-semibold text-ink text-sm">Para comparar fondos, mirá:</p>
            <ul className="mt-2 grid sm:grid-cols-2 gap-2">
              <Bullet>Rendimiento anualizado del mismo período.</Bullet><Bullet>Moneda y tipo de activos en que invierte.</Bullet>
              <Bullet>Plazo de rescate (24, 48 o 72 horas).</Bullet><Bullet>Comisiones y monto mínimo.</Bullet>
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ---------- 6, 8, 9, 10. nivel experto ---------- */
function Indicador({ label, value, fmt, good, warn, higherIsBetter = true, note }) {
  const ok = higherIsBetter ? value >= good : value <= good;
  const mid = higherIsBetter ? value >= warn : value <= warn;
  const tone = !isFinite(value) ? ["—", "bg-soft text-muted"] : ok ? ["Sólido", "bg-emsoft text-em"] : mid ? ["Atención", "bg-ambersoft text-amber"] : ["Débil", "bg-dangersoft text-danger"];
  return (
    <div className="rounded-xl border border-line bg-bg p-4 min-w-0">
      <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-ink">{label}</p><Pill className={tone[1]}>{tone[0]}</Pill></div>
      <p className="mt-1 font-mono text-2xl font-semibold text-ink">{isFinite(value) ? fmt(value) : "—"}</p>
      <p className="mt-1 text-xs text-muted">{note}</p>
    </div>
  );
}

function ExpEmisor() {
  const [d, setD] = useState({ ac: 180000, pc: 120000, pt: 300000, pat: 200000, un: 26000, ebitda: 60000, gf: 15000 });
  const [px, setPx] = useState(1200000);
  const [div, setDiv] = useState(84000);
  const [upa, setUpa] = useState(150000);
  const set = (k) => (v) => setD({ ...d, [k]: v });
  const n = (k) => toNum(d[k]);
  return (
    <div className="space-y-6">
      <p className="text-ink prose-w">Antes de comprar un bono o una acción, mirá la salud financiera del emisor. Estos cuatro indicadores se calculan con su balance y su estado de resultados, que se publican junto con el prospecto y en los informes de las calificadoras.</p>
      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <div className="grid grid-cols-2 gap-3 content-start">
          <p className="col-span-2 text-xs text-muted">Empresa de ejemplo, en millones de guaraníes:</p>
          <NumField id="em-ac" label="Activo corriente" value={d.ac} onChange={set("ac")} step={1000} />
          <NumField id="em-pc" label="Pasivo corriente" value={d.pc} onChange={set("pc")} step={1000} />
          <NumField id="em-pt" label="Pasivo total" value={d.pt} onChange={set("pt")} step={1000} />
          <NumField id="em-pat" label="Patrimonio" value={d.pat} onChange={set("pat")} step={1000} />
          <NumField id="em-un" label="Utilidad neta" value={d.un} onChange={set("un")} step={1000} min={-1e12} />
          <NumField id="em-ebitda" label="EBITDA" value={d.ebitda} onChange={set("ebitda")} step={1000} min={-1e12} />
          <div className="col-span-2"><NumField id="em-gf" label="Gastos financieros (intereses)" value={d.gf} onChange={set("gf")} step={1000} /></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 content-start">
          <Indicador label="Liquidez corriente" value={n("ac") / n("pc")} fmt={(v) => v.toLocaleString("es-PY", { maximumFractionDigits: 2 }) + "x"} good={1.2} warn={1} note="Activo corriente ÷ pasivo corriente. Mide si puede pagar sus deudas de corto plazo." />
          <Indicador label="Endeudamiento" value={n("pt") / n("pat")} fmt={(v) => v.toLocaleString("es-PY", { maximumFractionDigits: 2 }) + "x"} good={2} warn={3} higherIsBetter={false} note="Pasivo total ÷ patrimonio. Cuánto debe por cada guaraní propio." />
          <Indicador label="Rentabilidad (ROE)" value={(n("un") / n("pat")) * 100} fmt={(v) => pct(v)} good={10} warn={5} note="Utilidad neta ÷ patrimonio. Cuánto gana con el capital de sus dueños." />
          <Indicador label="Cobertura de intereses" value={n("ebitda") / n("gf")} fmt={(v) => v.toLocaleString("es-PY", { maximumFractionDigits: 1 }) + "x"} good={3} warn={1.5} note="EBITDA ÷ gastos financieros. Cuántas veces cubre los intereses que paga." />
          <p className="sm:col-span-2 text-xs text-muted">Referencias orientativas para empresas no financieras. Los bancos y financieras se analizan con otros indicadores (morosidad, solvencia, liquidez regulatoria).</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="rounded-xl border border-line bg-bg p-5">
          <h4 className="font-bold text-ink flex items-center gap-2"><Icon name="Bell" className="w-5 h-5 text-em" /> Hechos relevantes</h4>
          <p className="mt-2 text-sm text-muted">Son los hechos que un emisor está obligado a comunicar porque pueden afectar el valor de sus títulos: cambios de calificación, pagos, cambios de directorio, juicios importantes o nuevas emisiones. Se publican en el sitio de la BVA. Revisalos de vez en cuando si tenés títulos de ese emisor.</p>
        </div>
        <div className="rounded-xl border border-line bg-bg p-5">
          <h4 className="font-bold text-ink flex items-center gap-2"><Icon name="TrendingUp" className="w-5 h-5 text-em" /> Para acciones</h4>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <NumField id="ac-px" label="Precio (Gs.)" value={px} onChange={setPx} step={1000} />
            <NumField id="ac-div" label="Dividendo anual" value={div} onChange={setDiv} step={1000} />
            <NumField id="ac-upa" label="Utilidad por acción" value={upa} onChange={setUpa} step={1000} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Stat tone="em" label="Rendimiento por dividendo" value={toNum(px) > 0 ? pct((toNum(div) / toNum(px)) * 100, 2) : "—"} sub="Dividendo ÷ precio" />
            <Stat label="Precio / utilidad" value={toNum(upa) > 0 ? (toNum(px) / toNum(upa)).toLocaleString("es-PY", { maximumFractionDigits: 1 }) + " veces" : "—"} sub="Años de utilidades que pagás" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpDerechos() {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div>
        <p className="text-ink">El mercado de valores paraguayo se rige por la <strong>Ley N.º 5.810/2017 de Mercado de Valores</strong> y por las normas de la Superintendencia de Valores del BCP. Como inversor tenés estos derechos:</p>
        <ul className="mt-4 space-y-3">
          <Bullet icon="ShieldCheck">Recibir información clara y completa: prospecto, riesgos, condiciones y calificación antes de invertir.</Bullet>
          <Bullet icon="ShieldCheck">Conocer de antemano todas las comisiones y costos.</Bullet>
          <Bullet icon="ShieldCheck">Que tus órdenes se ejecuten según tus instrucciones y en tu mejor interés.</Bullet>
          <Bullet icon="ShieldCheck">Recibir comprobantes de cada operación y estados de cuenta periódicos.</Bullet>
          <Bullet icon="ShieldCheck">Que tus títulos y tu dinero estén separados del patrimonio de la Casa de Bolsa.</Bullet>
          <Bullet icon="ShieldCheck">Que se ofrezcan productos acordes a tu perfil de inversionista.</Bullet>
          <Bullet icon="ShieldCheck">Confidencialidad de tus datos y operaciones.</Bullet>
        </ul>
      </div>
      <div className="board-bg rounded-2xl bg-navy text-navyfg p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-up">Cómo hacer un reclamo</p>
        <ol className="mt-4 space-y-4">
          {[["Reuní la documentación", "Comprobantes, estados de cuenta, correos y contratos relacionados con el problema."], ["Reclamá por escrito a tu Casa de Bolsa", "Describí el problema, adjuntá la documentación y pedí una respuesta formal con fecha."], ["Si no hay solución, acudí al regulador", "Presentá tu denuncia ante la Superintendencia de Valores del Banco Central del Paraguay."], ["Guardá constancia de todo", "Números de nota, fechas y nombres de quienes te atendieron."]].map(([t, dd], k) => (
            <li key={t} className="flex gap-3"><span className="grid place-items-center w-7 h-7 shrink-0 rounded-full bg-em text-white font-mono text-sm">{k + 1}</span><div><p className="font-bold">{t}</p><p className="text-sm opacity-80">{dd}</p></div></li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function ExpImpuestos() {
  const rows = [
    ["Intereses de un bono", "Cupones por Gs. 900.000 en el año", "IRP – rentas de capital, 8 %, salvo que aplique una exención", "Gs. 72.000"],
    ["Dividendos de acciones", "Dividendo de Gs. 1.000.000", "Retención de IDU del 8 % para residentes (15 % para no residentes)", "Gs. 80.000 retenidos"],
    ["Ganancia por vender un título", "Compraste a Gs. 10.000.000 y vendiste a Gs. 10.500.000", "IRP – ganancias de capital, 8 % sobre la ganancia neta", "Gs. 40.000"],
    ["Rescate de un fondo mutuo", "Ganancia de Gs. 300.000 al rescatar", "Depende del tratamiento del fondo y de tu situación", "Consultá a la administradora"],
  ];
  return (
    <div className="space-y-5">
      <p className="text-ink prose-w">En Paraguay, las rentas de las inversiones de personas físicas se rigen por la Ley N.º 6.380/2019. En general están alcanzadas por el Impuesto a la Renta Personal (IRP) sobre rentas y ganancias de capital, a una tasa del 8 %, y los dividendos tienen su propio impuesto (IDU). Hay exenciones para algunos instrumentos.</p>
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-soft text-left text-muted"><tr><th className="p-3">Situación</th><th className="p-3">Ejemplo</th><th className="p-3">Tratamiento general</th><th className="p-3 text-right">Impuesto estimado</th></tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map(([a, b, c, dd]) => <tr key={a}><td className="p-3 font-semibold text-ink">{a}</td><td className="p-3 text-ink">{b}</td><td className="p-3 text-muted">{c}</td><td className="p-3 text-right font-mono text-ink">{dd}</td></tr>)}
          </tbody>
        </table>
      </div>
      <Notice>Información general con fines educativos. Las exenciones, los mínimos y las formas de declarar cambian y dependen de tu situación. Confirmá tu caso con un contador o en la DNIT antes de invertir.</Notice>
    </div>
  );
}

function ExpPanorama() {
  const vol = [["Julio", 6.34], ["Agosto", 4.24], ["Septiembre", 5.19]];
  const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LabelList } = RC || {};
  const compare = [
    ["Supervisión", "Superintendencia de Valores del BCP", "Regulador del país del mercado (por ejemplo, la SEC en EE. UU.)"],
    ["Moneda", "Guaraníes y dólares", "Mayormente dólares"],
    ["Instrumentos", "Bonos, CDA, fondos y algunas acciones", "Miles de acciones, ETF y bonos"],
    ["Liquidez", "Menor: puede costar vender rápido", "Muy alta en los mercados grandes"],
    ["Rendimiento de renta fija", "Tasas locales más altas", "Tasas en USD generalmente más bajas"],
    ["Riesgos extra", "Concentración en pocos emisores", "Tipo de cambio, impuestos de otro país, transferencias al exterior"],
  ];
  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6 items-start">
        <div className="space-y-3">
          <p className="text-ink">Según el informe mensual de la BVA de <strong>septiembre de 2026</strong>:</p>
          <div className="grid grid-cols-2 gap-3">
            <Stat tone="navy" label="Volumen del mes" value="Gs. 5,19 billones" sub="+22,4 % frente a agosto" />
            <Stat label="En guaraníes" value="71 %" sub="29 % en dólares" />
            <Stat tone="em" label="Renta fija en PYG" value="8,45 %" sub="Tasa promedio · plazo 5,7 años" />
            <Stat tone="em" label="Renta fija en USD" value="6 %" sub="Tasa promedio · plazo 7,2 años" />
          </div>
          <p className="text-xs text-muted">Fuente: informe mensual de la BVA citado por InfoNegocios (6/10/2026). Para datos actualizados, consultá «Datos de mercado» en el sitio de la BVA.</p>
        </div>
        <div className="rounded-xl border border-line bg-bg p-4">
          <p className="text-sm font-semibold text-ink">Volumen negociado en la BVA, 2026 (billones de Gs.)</p>
          <div className="h-56 mt-2">
            {ResponsiveContainer && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vol.map(([m, v]) => ({ m, v }))} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="m" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} width={32} />
                  <Tooltip formatter={(v) => ["Gs. " + v.toLocaleString("es-PY") + " billones", "Volumen"]} contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgb(var(--soft))" }} />
                  <Bar dataKey="v" fill="rgb(var(--navy))" radius={[6, 6, 0, 0]}><LabelList dataKey="v" position="top" formatter={(v) => v.toLocaleString("es-PY")} style={{ fill: "rgb(var(--ink))", fontSize: 12 }} /></Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
      <div>
        <h4 className="text-lg font-bold text-ink">Mercado local vs. invertir en el exterior</h4>
        <div className="mt-3 overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-soft text-left text-muted"><tr><th className="p-3 w-40"></th><th className="p-3">Bolsa paraguaya</th><th className="p-3">Mercados del exterior</th></tr></thead>
            <tbody className="divide-y divide-line">{compare.map(([a, b, c]) => <tr key={a}><th scope="row" className="p-3 text-left font-semibold text-ink">{a}</th><td className="p-3 text-ink">{b}</td><td className="p-3 text-ink">{c}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted">Algunas Casas de Bolsa locales ofrecen acceso a mercados del exterior. Preguntá por costos, custodia y tratamiento impositivo antes de invertir afuera.</p>
      </div>
    </div>
  );
}

function Experto() {
  const [tab, setTab] = useState("emisor");
  const titles = { emisor: "Analizar a un emisor", derechos: "Tus derechos como inversor", impuestos: "Impuestos con ejemplos", panorama: "El mercado en cifras y el exterior" };
  return (
    <Section id="experto" eyebrow="Nivel experto" title="Para entender el mercado a fondo"
      intro="Cuatro temas para dar el salto: leer los números de una empresa, conocer tus derechos, calcular impuestos y ver el mercado en perspectiva.">
      <TabBar idBase="exp" label="Temas avanzados" value={tab} onChange={setTab} tabs={[["emisor", "Analizar un emisor", "Search"], ["derechos", "Tus derechos", "ShieldCheck"], ["impuestos", "Impuestos", "Receipt"], ["panorama", "Mercado en cifras", "BarChart3"]]} />
      <div key={tab} className="fade-in mt-5 rounded-2xl border border-line bg-card p-5 sm:p-7">
        <h3 className="text-2xl font-bold text-ink mb-5">{titles[tab]}</h3>
        {tab === "emisor" && <ExpEmisor />}
        {tab === "derechos" && <ExpDerechos />}
        {tab === "impuestos" && <ExpImpuestos />}
        {tab === "panorama" && <ExpPanorama />}
      </div>
    </Section>
  );
}

/* =====================================================================
   NIVEL PROFESIONAL (v6): renta fija avanzada, crédito, valuación,
   carteras, macro, derivados, microestructura, psicología y práctica.
   ===================================================================== */
const goTo = (id) => {
  if (id.startsWith("pro-")) { scrollTo("profesional"); setTimeout(() => window.dispatchEvent(new CustomEvent("bpy-pro", { detail: id.slice(4) })), 120); }
  else scrollTo(id);
};
const Card = ({ icon, title, children, tone = "em" }) => (
  <div className="rounded-2xl border border-line bg-bg p-5 min-w-0">
    {icon && <span className={"grid place-items-center w-10 h-10 rounded-xl " + (tone === "em" ? "bg-emsoft text-em" : tone === "amber" ? "bg-ambersoft text-amber" : tone === "danger" ? "bg-dangersoft text-danger" : "bg-navy text-up")}><Icon name={icon} className="w-5 h-5" /></span>}
    <p className="mt-3 font-bold text-ink">{title}</p>
    <div className="mt-1 text-sm text-muted space-y-2">{children}</div>
  </div>
);
const Slider = ({ id, label, value, onChange, min, max, step, fmt }) => (
  <div>
    <label htmlFor={id} className="flex justify-between text-sm font-semibold text-ink">{label} <span className="font-mono text-em">{fmt ? fmt(value) : value}</span></label>
    <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full mt-2" />
  </div>
);
const fmtNum = (v, d = 2) => toNum(v).toLocaleString("es-PY", { maximumFractionDigits: d, minimumFractionDigits: d });

/* ---------- 1. renta fija avanzada ---------- */
const bondMetrics = (cpn, f, years, ytm) => {
  const n = Math.max(1, Math.round(years * f)); const c = cpn / 100 / f * 100; const y = ytm / 100 / f;
  let p = 0, t = 0, cx = 0;
  for (let k = 1; k <= n; k++) { const cf = c + (k === n ? 100 : 0); const pv = cf / Math.pow(1 + y, k); p += pv; t += (k / f) * pv; cx += (k * (k + 1)) * pv / Math.pow(1 + y, 2) / (f * f); }
  const mac = t / p; const mod = mac / (1 + y); const conv = cx / p;
  return { p, mac, mod, conv };
};
function ProRentaFija() {
  const [cpn, setCpn] = useState(8.5);
  const [years, setYears] = useState(6);
  const [f, setF] = useState(2);
  const [ytm, setYtm] = useState(8.5);
  const [dy, setDy] = useState(1);
  const [shape, setShape] = useState("normal");
  const m = bondMetrics(toNum(cpn), f, Math.max(0.5, toNum(years)), toNum(ytm));
  const pNew = bondMetrics(toNum(cpn), f, Math.max(0.5, toNum(years)), toNum(ytm) + dy).p;
  const approx = (-m.mod * dy / 100 + 0.5 * m.conv * Math.pow(dy / 100, 2)) * 100;
  const real = (pNew / m.p - 1) * 100;
  const plazos = [1, 2, 3, 5, 7, 10];
  const shapes = { normal: [6.2, 6.8, 7.3, 8.0, 8.5, 9.0], plana: [7.6, 7.7, 7.7, 7.8, 7.8, 7.9], invertida: [9.0, 8.6, 8.2, 7.6, 7.2, 6.9] };
  const curve = plazos.map((pl, i) => ({ pl, t: shapes[shape][i] }));
  const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceDot } = RC || {};
  return (
    <div className="space-y-8">
      <div>
        <h4 className="text-lg font-bold text-ink">Duración y convexidad</h4>
        <p className="mt-1 text-sm text-muted prose-w">La <strong>duración modificada</strong> te dice cuánto cae (en %) el precio de un bono si la tasa de mercado sube 1 punto. La <strong>convexidad</strong> corrige esa estimación cuando el cambio de tasa es grande. Cuanto más largo el plazo y menor el cupón, mayor la duración y el riesgo de tasa.</p>
        <div className="mt-4 grid lg:grid-cols-[320px_1fr] gap-6">
          <div className="grid gap-4 content-start">
            <div className="grid grid-cols-2 gap-3">
              <NumField id="dur-cpn" label="Cupón" value={cpn} onChange={setCpn} suffix="%" step={0.1} />
              <NumField id="dur-years" label="Plazo" value={years} onChange={setYears} suffix="años" min={0.5} max={30} step={0.5} />
              <NumField id="dur-ytm" label="TIR actual" value={ytm} onChange={setYtm} suffix="%" step={0.1} />
              <div><label htmlFor="dur-f" className="text-sm font-semibold text-ink block mb-1.5">Cupones</label>
                <select id="dur-f" value={f} onChange={(e) => setF(Number(e.target.value))} className={FIELD}><option value={12}>Mensual</option><option value={4}>Trimestral</option><option value={2}>Semestral</option><option value={1}>Anual</option></select></div>
            </div>
            <Slider id="dur-dy" label="Cambio en la tasa de mercado" value={dy} onChange={setDy} min={-3} max={3} step={0.25} fmt={(v) => (v > 0 ? "+" : "") + fmtNum(v) + " pp"} />
          </div>
          <div className="min-w-0 grid sm:grid-cols-2 gap-3 content-start">
            <Stat tone="navy" label="Duración modificada" value={fmtNum(m.mod) + " años"} sub={"Macaulay: " + fmtNum(m.mac) + " años"} />
            <Stat label="Convexidad" value={fmtNum(m.conv, 1)} />
            <Stat tone={real >= 0 ? "em" : "danger"} label="Cambio real del precio" value={(real >= 0 ? "+" : "") + fmtNum(real) + " %"} sub={"Precio: " + fmtNum(m.p) + " % → " + fmtNum(pNew) + " %"} />
            <Stat label="Estimación duración + convexidad" value={(approx >= 0 ? "+" : "") + fmtNum(approx) + " %"} sub={"Solo duración: " + fmtNum(-m.mod * dy) + " %"} />
          </div>
        </div>
      </div>
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6 items-start">
        <div className="min-w-0">
          <h4 className="text-lg font-bold text-ink">Curva de rendimientos</h4>
          <p className="mt-1 text-sm text-muted">Muestra cuánto paga el mercado según el plazo. Su forma anticipa qué espera el mercado:</p>
          <ul className="mt-3 space-y-2">
            <Bullet><strong>Normal (creciente):</strong> más plazo, más tasa. Es lo habitual.</Bullet>
            <Bullet><strong>Plana:</strong> el mercado espera pocos cambios.</Bullet>
            <Bullet><strong>Invertida:</strong> los plazos cortos pagan más; suele anticipar bajas de tasas o desaceleración.</Bullet>
          </ul>
          <div className="mt-4"><TabBar idBase="curva" label="Forma de la curva" value={shape} onChange={setShape} tabs={[["normal", "Normal"], ["plana", "Plana"], ["invertida", "Invertida"]]} /></div>
          <p className="mt-3 text-xs text-muted">Curvas ilustrativas. El punto azul es un dato real: en septiembre de 2026 la renta fija en guaraníes se negoció en la BVA a una tasa promedio de 8,45 % con un plazo promedio de 5,7 años.</p>
        </div>
        <div className="h-64 rounded-xl border border-line bg-bg p-3">
          {ResponsiveContainer && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curve} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="pl" type="number" domain={[0, 10]} ticks={[1, 2, 3, 5, 7, 10]} tickLine={false} axisLine={false} tickFormatter={(v) => v + " a"} />
                <YAxis tickLine={false} axisLine={false} width={44} domain={[5.5, 9.5]} tickFormatter={(v) => v + "%"} />
                <Tooltip formatter={(v) => [pct(v, 2), "Tasa"]} labelFormatter={(l) => l + " años"} contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="t" stroke="rgb(var(--em))" strokeWidth={3} dot={{ r: 3, fill: "rgb(var(--em))" }} isAnimationActive={false} />
                <ReferenceDot x={5.74} y={8.45} r={6} fill="rgb(var(--navy))" stroke="rgb(var(--card))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card icon="CalendarRange" title="Bonos amortizables">Devuelven el capital en cuotas durante su vida, no todo al final. Tienen menor duración y menor riesgo de tasa que un bono «bullet» del mismo plazo.</Card>
        <Card icon="Layers" title="Bonos subordinados">En caso de quiebra cobran después de los demás acreedores. Por eso pagan más tasa. Son comunes en bancos.</Card>
        <Card icon="Undo2" title="Con rescate anticipado">El emisor puede devolverte el capital antes. Suele hacerlo cuando bajan las tasas, justo cuando a vos te convenía seguir cobrando.</Card>
        <Card icon="ShieldCheck" title="Con garantía o fideicomiso">Están respaldados por bienes o flujos específicos (hipotecas, cobranzas). Bajan el riesgo de crédito, pero leé bien qué cubre la garantía.</Card>
      </div>
    </div>
  );
}

/* ---------- 2. análisis de crédito ---------- */
const ISSUERS = [["Tesoro (Estado)", "Soberano", 7.8], ["Emisor A", "AAApy", 8.4], ["Emisor B", "AApy", 9.0], ["Emisor C", "Apy", 9.9], ["Emisor D", "BBBpy", 11.2]];
function ProCredito() {
  const [corp, setCorp] = useState(9.5);
  const [gov, setGov] = useState(7.8);
  const spread = (toNum(corp) - toNum(gov)) * 100;
  const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, LabelList } = RC || {};
  const data = ISSUERS.map(([n, r, t]) => ({ n: n + " · " + r, s: Math.round((t - ISSUERS[0][2]) * 100) }));
  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6 items-start">
        <div>
          <h4 className="text-lg font-bold text-ink">Spread de crédito</h4>
          <p className="mt-1 text-sm text-muted">Es la tasa extra que paga un bono corporativo frente a un bono del Tesoro del mismo plazo y moneda. Se mide en puntos básicos (100 pb = 1 %). Es el «premio» por asumir el riesgo de ese emisor.</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <NumField id="sp-corp" label="Tasa bono corporativo" value={corp} onChange={setCorp} suffix="%" step={0.05} />
            <NumField id="sp-gov" label="Tasa Tesoro mismo plazo" value={gov} onChange={setGov} suffix="%" step={0.05} />
          </div>
          <div className="mt-3"><Stat tone="navy" label="Spread" value={Math.round(spread) + " pb"} sub={spread <= 0 ? "No paga premio: revisá los datos" : "Comparalo con emisores de la misma calificación y plazo"} /></div>
        </div>
        <div className="rounded-xl border border-line bg-bg p-4">
          <p className="text-sm font-semibold text-ink">Spread según calificación (ejemplo ficticio)</p>
          <div className="h-56 mt-2">
            {ResponsiveContainer && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.slice(1)} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v) => v + " pb"} />
                  <YAxis type="category" dataKey="n" tickLine={false} axisLine={false} width={120} />
                  <Tooltip formatter={(v) => [v + " pb", "Spread sobre el Tesoro"]} contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgb(var(--soft))" }} />
                  <Bar dataKey="s" radius={[0, 6, 6, 0]}>{data.slice(1).map((d, i) => <Cell key={d.n} fill={["rgb(var(--em))", "rgb(var(--em))", "rgb(var(--amber))", "rgb(var(--red))"][i]} />)}<LabelList dataKey="s" position="right" formatter={(v) => v + " pb"} style={{ fill: "rgb(var(--ink))", fontSize: 12 }} /></Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-xs text-muted">A menor calificación, mayor spread. Si un emisor paga mucho más que otros de su misma nota, preguntate por qué.</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card icon="FileSearch" title="Leer un informe de calificación">Buscá tres cosas: los <strong>fundamentos</strong> (fortalezas y debilidades), la <strong>tendencia</strong> (fuerte, estable, sensible) y los <strong>factores</strong> que podrían subir o bajar la nota.</Card>
        <Card icon="Lock" title="Resguardos (covenants)">Compromisos del emisor en el prospecto: no superar cierto endeudamiento, mantener liquidez mínima, no repartir dividendos si incumple. Si los rompe, los bonistas pueden exigir medidas.</Card>
        <Card icon="Landmark" title="Bancos y financieras">Se analizan distinto: <strong>morosidad</strong> de la cartera, <strong>solvencia</strong> (capital frente a riesgos), <strong>liquidez</strong> y <strong>rentabilidad</strong>. El BCP publica estos datos de cada entidad.</Card>
        <Card icon="Banknote" title="Flujo de caja (NIIF)">Una empresa puede tener ganancias contables y quedarse sin efectivo. Mirá el <strong>flujo de caja operativo</strong>: si es negativo varios años, la empresa depende de deuda nueva para pagar la vieja.</Card>
      </div>
    </div>
  );
}

/* ---------- 3. valuación de acciones ---------- */
function ProValuacion() {
  const [d1, setD1] = useState(90000);
  const [k, setK] = useState(12);
  const [g, setG] = useState(3);
  const [price, setPrice] = useState(1000000);
  const [fcf, setFcf] = useState(10000);
  const [gr, setGr] = useState(6);
  const [wacc, setWacc] = useState(12);
  const [tg, setTg] = useState(3);
  const [shares, setShares] = useState(100);
  const [debt, setDebt] = useState(20000);
  const gordon = toNum(k) > toNum(g) ? toNum(d1) / ((toNum(k) - toNum(g)) / 100) : NaN;
  let pv = 0, cf = toNum(fcf);
  const rows = [];
  for (let y = 1; y <= 5; y++) { cf = cf * (1 + toNum(gr) / 100); const v = cf / Math.pow(1 + toNum(wacc) / 100, y); pv += v; rows.push([y, cf, v]); }
  const tv = toNum(wacc) > toNum(tg) ? (cf * (1 + toNum(tg) / 100)) / ((toNum(wacc) - toNum(tg)) / 100) : NaN;
  const pvTv = tv / Math.pow(1 + toNum(wacc) / 100, 5);
  const ev = pv + pvTv; const eq = ev - toNum(debt); const perShare = toNum(shares) > 0 ? (eq * 1e6) / (toNum(shares) * 1e3) : NaN;
  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-line bg-bg p-5">
          <h4 className="text-lg font-bold text-ink">Modelo de dividendos (Gordon)</h4>
          <p className="mt-1 text-sm text-muted">Útil para acciones que pagan dividendos estables, como muchas preferidas locales. Valor = dividendo próximo ÷ (rendimiento exigido − crecimiento).</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <NumField id="gd-d1" label="Dividendo próximo (Gs.)" value={d1} onChange={setD1} step={1000} />
            <NumField id="gd-price" label="Precio de mercado (Gs.)" value={price} onChange={setPrice} step={10000} />
            <NumField id="gd-k" label="Rendimiento exigido" value={k} onChange={setK} suffix="%" step={0.5} />
            <NumField id="gd-g" label="Crecimiento anual" value={g} onChange={setG} suffix="%" step={0.5} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat tone="navy" label="Valor estimado" value={isFinite(gordon) ? fmtMoney(gordon, "PYG") : "—"} sub={isFinite(gordon) ? "" : "El rendimiento exigido debe superar al crecimiento"} />
            <Stat tone={isFinite(gordon) && gordon >= toNum(price) ? "em" : "danger"} label={isFinite(gordon) && gordon >= toNum(price) ? "Margen a favor" : "Cotiza por encima"} value={isFinite(gordon) ? pct(((gordon / toNum(price)) - 1) * 100) : "—"} />
          </div>
        </div>
        <div className="rounded-xl border border-line bg-bg p-5">
          <h4 className="text-lg font-bold text-ink">Flujo de caja descontado (simplificado)</h4>
          <p className="mt-1 text-sm text-muted">Proyecta el flujo de caja libre 5 años, le suma un valor terminal y trae todo a valor de hoy. Cifras en millones de Gs.</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <NumField id="dcf-fcf" label="Flujo hoy" value={fcf} onChange={setFcf} step={500} />
            <NumField id="dcf-gr" label="Crece 5 años" value={gr} onChange={setGr} suffix="%" step={0.5} />
            <NumField id="dcf-wacc" label="Tasa descuento" value={wacc} onChange={setWacc} suffix="%" step={0.5} />
            <NumField id="dcf-tg" label="Crec. perpetuo" value={tg} onChange={setTg} suffix="%" step={0.5} />
            <NumField id="dcf-debt" label="Deuda neta" value={debt} onChange={setDebt} step={1000} />
            <NumField id="dcf-shares" label="Acciones (miles)" value={shares} onChange={setShares} step={10} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Valor de la empresa" value={isFinite(ev) ? "Gs. " + Math.round(ev).toLocaleString("es-PY") + " M" : "—"} sub={isFinite(pvTv) && ev > 0 ? "Valor terminal: " + pct((pvTv / ev) * 100, 0) + " del total" : ""} />
            <Stat tone="navy" label="Valor por acción" value={isFinite(perShare) && perShare > 0 ? fmtMoney(perShare, "PYG") : "—"} />
          </div>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <Card icon="Scale" title="Comparables">Compará el <strong>precio/utilidad</strong>, <strong>precio/valor libro</strong> y <strong>rendimiento por dividendo</strong> con empresas similares del mismo sector. Un múltiplo mucho menor puede ser una oportunidad… o una señal de problemas.</Card>
        <Card icon="AlertTriangle" title="Sensibilidad" tone="amber">Pequeños cambios en la tasa de descuento o el crecimiento mueven mucho el resultado. Un buen analista prueba varios escenarios y nunca confía en un único número.</Card>
        <Card icon="Droplets" title="En Paraguay" tone="amber">El mercado de acciones local es poco líquido: aunque calcules un buen valor, puede costar comprar o vender al precio que querés.</Card>
      </div>
    </div>
  );
}

/* ---------- 4. carteras y riesgo ---------- */
function ProCarteras() {
  const [w, setW] = useState(60);
  const [rA, setRA] = useState(8.5);
  const [vA, setVA] = useState(4);
  const [rB, setRB] = useState(12);
  const [vB, setVB] = useState(20);
  const [rho, setRho] = useState(0.2);
  const [rf, setRf] = useState(6);
  const a = w / 100, b = 1 - a;
  const ret = a * toNum(rA) + b * toNum(rB);
  const vol = Math.sqrt(a * a * toNum(vA) ** 2 + b * b * toNum(vB) ** 2 + 2 * a * b * rho * toNum(vA) * toNum(vB));
  const sharpe = vol > 0 ? (ret - toNum(rf)) / vol : 0;
  const front = Array.from({ length: 11 }, (_, i) => { const x = i / 10, y = 1 - x; return { v: Math.sqrt(x * x * toNum(vA) ** 2 + y * y * toNum(vB) ** 2 + 2 * x * y * rho * toNum(vA) * toNum(vB)), r: x * toNum(rA) + y * toNum(rB), w: i * 10 }; });
  const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceDot } = RC || {};
  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <div className="grid gap-4 content-start">
          <p className="text-sm text-muted">Combiná un activo de <strong>renta fija</strong> (A) y uno de <strong>renta variable</strong> (B). La <strong>volatilidad</strong> mide cuánto varía el rendimiento; la <strong>correlación</strong>, si se mueven juntos.</p>
          <Slider id="pf-w" label="Peso en renta fija (A)" value={w} onChange={setW} min={0} max={100} step={5} fmt={(v) => v + " %"} />
          <div className="grid grid-cols-2 gap-3">
            <NumField id="pf-ra" label="Rend. A" value={rA} onChange={setRA} suffix="%" step={0.5} />
            <NumField id="pf-va" label="Volatilidad A" value={vA} onChange={setVA} suffix="%" step={0.5} />
            <NumField id="pf-rb" label="Rend. B" value={rB} onChange={setRB} suffix="%" step={0.5} />
            <NumField id="pf-vb" label="Volatilidad B" value={vB} onChange={setVB} suffix="%" step={0.5} />
          </div>
          <Slider id="pf-rho" label="Correlación A-B" value={rho} onChange={setRho} min={-1} max={1} step={0.1} fmt={(v) => fmtNum(v, 1)} />
          <NumField id="pf-rf" label="Tasa libre de riesgo (ref.)" value={rf} onChange={setRf} suffix="%" step={0.25} hint="Por ejemplo, la de un instrumento del Tesoro de corto plazo." />
        </div>
        <div className="min-w-0 space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <Stat tone="em" label="Rendimiento esperado" value={pct(ret, 2)} />
            <Stat label="Volatilidad de la cartera" value={pct(vol, 2)} sub={"Promedio simple: " + pct(a * toNum(vA) + b * toNum(vB), 2)} />
            <Stat tone="navy" label="Índice de Sharpe" value={fmtNum(sharpe)} sub="Rendimiento extra por unidad de riesgo" />
          </div>
          <div className="h-60 rounded-xl border border-line bg-bg p-3">
            {ResponsiveContainer && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={front} margin={{ top: 10, right: 16, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="v" type="number" domain={["auto", "auto"]} tickLine={false} axisLine={false} tickFormatter={(v) => fmtNum(v, 0) + "%"} />
                  <YAxis dataKey="r" type="number" domain={["auto", "auto"]} tickLine={false} axisLine={false} width={44} tickFormatter={(v) => fmtNum(v, 1) + "%"} />
                  <Tooltip formatter={(v, n) => [pct(v, 2), n === "r" ? "Rendimiento" : "Volatilidad"]} labelFormatter={() => ""} contentStyle={TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="r" stroke="rgb(var(--em))" strokeWidth={3} dot={{ r: 2 }} isAnimationActive={false} />
                  <ReferenceDot x={vol} y={ret} r={7} fill="rgb(var(--navy))" stroke="rgb(var(--card))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="text-xs text-muted">Cada punto es una mezcla de A y B (eje horizontal: volatilidad; vertical: rendimiento). Con correlación baja, la volatilidad de la mezcla es menor que el promedio: ese es el beneficio de diversificar.</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <Card icon="TrendingDown" title="Caída máxima (drawdown)" tone="danger">La mayor pérdida desde un pico hasta el punto más bajo. Preguntate: ¿soportaría ver mi cartera caer un 20 % sin vender? Si no, tenés demasiado riesgo.</Card>
        <Card icon="PieChart" title="Asignación de activos">Más del 80 % del resultado de largo plazo depende de cuánto pusiste en cada tipo de activo, no de qué título puntual elegiste.</Card>
        <Card icon="Target" title="Compará contra una referencia">Medí tu cartera contra algo simple, por ejemplo la tasa promedio de renta fija de la BVA. Si después de costos no la superás, simplificá.</Card>
      </div>
    </div>
  );
}

/* ---------- 5. macroeconomía ---------- */
const MACRO = [
  ["Percent", "Tasa de política monetaria", "5,50 %", "Mantenida por el BCP en su reunión del 23 de octubre de 2026, tras dos recortes a comienzos de año.", "Si el BCP sube la tasa, suben las tasas de los bonos y CDA nuevos y bajan los precios de los bonos que ya existen. Si la baja, ocurre lo contrario."],
  ["TrendingUp", "Inflación", "1,7 %", "Interanual a octubre de 2026. La meta del BCP es 3,5 % (con un rango de tolerancia).", "Es el piso que tu inversión debe superar. Con inflación baja, una tasa de 8 % en guaraníes deja un rendimiento real alto."],
  ["Award", "Calificación del país", "Grado de inversión", "Moody's (Baa3) y S&P (BBB-) otorgan grado de inversión; Fitch está un escalón abajo (BB+).", "Mejora el acceso del Estado y las empresas al financiamiento, baja sus costos y atrae inversores del exterior al mercado local."],
  ["ArrowLeftRight", "Tipo de cambio", "Guaraní / dólar", "Lo determina el mercado; el BCP interviene para moderar movimientos bruscos.", "Afecta a quien invierte en otra moneda y a las empresas con deudas o ventas en dólares."],
  ["Wheat", "Exportaciones", "Soja, carne, energía", "Gran parte de la economía depende del agro y de la energía de las binacionales.", "Una mala cosecha o precios bajos golpean a emisores del agro y a toda la cadena: transporte, comercio y bancos."],
  ["Building2", "Finanzas públicas", "Deuda y déficit", "El Ministerio de Economía es el mayor emisor de la BVA.", "Un déficit alto obliga al Estado a emitir más deuda, lo que puede subir las tasas para todos."],
];
function ProMacro() {
  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {MACRO.map(([ic, t, v, now, eff]) => (
          <div key={t} className="rounded-2xl border border-line bg-bg p-5 flex flex-col">
            <div className="flex items-center gap-3"><span className="grid place-items-center w-10 h-10 rounded-xl bg-navy text-up"><Icon name={ic} className="w-5 h-5" /></span><p className="font-bold text-ink">{t}</p></div>
            <p className="mt-3 font-mono text-2xl font-semibold text-em">{v}</p>
            <p className="mt-1 text-xs text-muted">{now}</p>
            <div className="mt-3 pt-3 border-t border-line text-sm text-ink"><span className="font-semibold">Cómo te afecta: </span>{eff}</div>
          </div>
        ))}
      </div>
      <Notice tone="em">Datos a noviembre de 2026, según el Banco Central del Paraguay y comunicados de las calificadoras citados por la prensa. Consultá los valores vigentes en <a className="underline" href="https://www.bcp.gov.py" target="_blank" rel="noopener">bcp.gov.py</a>.</Notice>
    </div>
  );
}

/* ---------- 6. derivados ---------- */
function ProDerivados() {
  const [usd, setUsd] = useState(10000);
  const [fut, setFut] = useState(7550);
  const [spotEnd, setSpotEnd] = useState(7900);
  const [opt, setOpt] = useState("call");
  const noHedge = toNum(usd) * toNum(spotEnd);
  const hedge = toNum(usd) * toNum(fut);
  const strike = 100, prem = 5;
  const payoff = Array.from({ length: 13 }, (_, i) => { const S = 70 + i * 5; return { S, v: opt === "call" ? Math.max(S - strike, 0) - prem : Math.max(strike - S, 0) - prem }; });
  const { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } = RC || {};
  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <div className="grid gap-4 content-start">
          <h4 className="text-lg font-bold text-ink">Cobertura con futuro de divisas</h4>
          <p className="text-sm text-muted">Un importador debe pagar dólares en 3 meses. Con un futuro fija hoy el tipo de cambio y elimina la incertidumbre.</p>
          <NumField id="fx-usd" label="Dólares a pagar" value={usd} onChange={setUsd} step={1000} />
          <NumField id="fx-fut" label="Tipo de cambio del futuro (Gs.)" value={fut} onChange={setFut} step={10} />
          <Slider id="fx-end" label="Tipo de cambio al vencimiento" value={spotEnd} onChange={setSpotEnd} min={6800} max={8400} step={25} fmt={(v) => "Gs. " + v.toLocaleString("es-PY")} />
        </div>
        <div className="min-w-0 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Stat label="Sin cobertura pagaría" value={fmtMoney(noHedge, "PYG")} />
            <Stat tone="navy" label="Con futuro paga" value={fmtMoney(hedge, "PYG")} sub="Fijo, pase lo que pase" />
          </div>
          <div className={"rounded-xl p-4 text-sm " + (noHedge > hedge ? "bg-emsoft text-ink" : "bg-ambersoft text-ink")}>
            {noHedge > hedge ? <>El dólar subió: la cobertura le <strong>ahorró {fmtMoney(noHedge - hedge, "PYG")}</strong>.</> : <>El dólar bajó: sin cobertura habría pagado <strong>{fmtMoney(hedge - noHedge, "PYG")} menos</strong>. Es el costo de la tranquilidad: la cobertura no busca ganar, busca no sorprenderse.</>}
          </div>
        </div>
      </div>
      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-6 items-start">
        <div className="min-w-0">
          <h4 className="text-lg font-bold text-ink">Opciones</h4>
          <p className="mt-1 text-sm text-muted">Dan el <strong>derecho, pero no la obligación</strong>, de comprar (call) o vender (put) un activo a un precio fijado (precio de ejercicio), pagando una prima. Casi no se negocian en Paraguay, pero son centrales en los mercados del exterior.</p>
          <div className="mt-4"><TabBar idBase="opt" label="Tipo de opción" value={opt} onChange={setOpt} tabs={[["call", "Opción de compra (call)"], ["put", "Opción de venta (put)"]]} /></div>
          <p className="mt-3 text-xs text-muted">Ejemplo: precio de ejercicio 100, prima 5. La pérdida máxima del comprador es la prima.</p>
        </div>
        <div className="h-56 rounded-xl border border-line bg-bg p-3">
          {ResponsiveContainer && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={payoff} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="S" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} width={36} />
                <Tooltip formatter={(v) => [v, "Resultado"]} labelFormatter={(l) => "Precio del activo: " + l} contentStyle={TOOLTIP_STYLE} />
                <ReferenceLine y={0} stroke="rgb(var(--muted))" />
                <Line type="linear" dataKey="v" stroke="rgb(var(--em))" strokeWidth={3} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Card icon="Repeat" title="Forwards">Como un futuro, pero es un contrato privado a medida entre dos partes (por ejemplo, con tu banco). Más flexible, pero con riesgo de que la contraparte no cumpla.</Card>
        <Card icon="Package" title="Titularización y fideicomisos">Se agrupan activos que generan flujos (préstamos, alquileres, cobranzas) en un fideicomiso que emite títulos en bolsa. Quien invierte cobra de esos flujos, no del patrimonio general de la empresa.</Card>
      </div>
    </div>
  );
}

/* ---------- 7. cómo funciona por dentro ---------- */
const BIDS = [[8.6, 3000], [8.8, 2500], [9.0, 4000], [9.2, 3500], [9.5, 2000]];
function ProMicro() {
  const [amount, setAmount] = useState(10000);
  let acc = 0, cut = null; const rows = BIDS.map(([t, m]) => { const before = acc; acc += m; const ok = before < toNum(amount); if (ok && cut === null && acc >= toNum(amount)) cut = t; return { t, m, acc, ok }; });
  const covered = acc >= toNum(amount);
  if (cut === null && covered) cut = BIDS[BIDS.length - 1][0];
  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        <div className="space-y-4">
          <h4 className="text-lg font-bold text-ink">Subasta de una emisión nueva</h4>
          <p className="text-sm text-muted">En una colocación por subasta, los inversores ofrecen montos a distintas tasas. El emisor acepta primero las ofertas de menor tasa hasta cubrir lo que necesita: la última aceptada es la <strong>tasa de corte</strong>.</p>
          <Slider id="sub-amount" label="Monto a colocar" value={amount} onChange={setAmount} min={2000} max={15000} step={500} fmt={(v) => "Gs. " + v.toLocaleString("es-PY") + " M"} />
          <Stat tone="navy" label="Tasa de corte" value={covered ? pct(cut, 2) : "Sin cubrir"} sub={covered ? "Todas las ofertas aceptadas cobran esta tasa (subasta de precio único)" : "La demanda no alcanza: el emisor coloca menos o declara desierta la subasta"} />
        </div>
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-sm min-w-[380px]">
            <thead className="bg-soft text-left text-muted"><tr><th className="p-3">Tasa ofrecida</th><th className="p-3 text-right">Monto (Gs. M)</th><th className="p-3 text-right">Acumulado</th><th className="p-3 text-right">Resultado</th></tr></thead>
            <tbody className="divide-y divide-line font-mono">
              {rows.map((r) => <tr key={r.t} className={r.ok ? "bg-emsoft" : ""}><td className="p-3 text-ink">{pct(r.t, 2)}</td><td className="p-3 text-right text-ink">{r.m.toLocaleString("es-PY")}</td><td className="p-3 text-right text-muted">{r.acc.toLocaleString("es-PY")}</td><td className={"p-3 text-right font-sans font-semibold " + (r.ok ? "text-em" : "text-muted")}>{r.ok ? "Aceptada" : "Rechazada"}</td></tr>)}
            </tbody>
          </table>
          <p className="p-3 text-xs text-muted">Ofertas ficticias. El mecanismo exacto de cada colocación figura en su prospecto.</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card icon="ArrowLeftRight" title="Formadores de mercado">Entidades que publican precios de compra y venta de forma continua para un título. Le dan liquidez y achican el spread.</Card>
        <Card icon="Repeat" title="Reportos, lado profesional">Las Casas de Bolsa y empresas los usan para financiarse o colocar liquidez por días. La tasa refleja el plazo y la calidad del título en garantía, al que se le aplica un descuento (aforo).</Card>
        <Card icon="EyeOff" title="Información privilegiada" tone="danger">Está prohibido operar con información que no es pública y que puede mover el precio (por ejemplo, saber antes que una empresa va a incumplir). Es una infracción grave.</Card>
        <Card icon="Ban" title="Manipulación de mercado" tone="danger">Crear precios o volumen artificiales, difundir rumores falsos o pactar operaciones ficticias está prohibido y es sancionado por la Superintendencia de Valores.</Card>
      </div>
    </div>
  );
}

/* ---------- 8. psicología del inversor ---------- */
const BIASES = [
  ["Exceso de confianza", "Creer que sabés más que el mercado y operar de más.", "Llevá registro de tus decisiones y comparalas con una estrategia simple."],
  ["Aversión a las pérdidas", "Una pérdida duele el doble de lo que alegra una ganancia: te aferrás a lo que pierde.", "Antes de comprar, definí en qué caso venderías."],
  ["Efecto manada", "Comprar porque «todos compran» y vender en pánico cuando todos venden.", "Si te enterás por un grupo de WhatsApp, probablemente ya es tarde."],
  ["Anclaje", "Quedarte fijo en un número: «lo compré a 100, no vendo a menos».", "El precio de compra no le importa al mercado: evaluá la inversión hoy."],
  ["Sesgo de confirmación", "Buscar solo lo que confirma lo que ya pensás.", "Antes de decidir, escribí tres argumentos en contra."],
  ["Sesgo de lo reciente", "Pensar que lo que pasó el último mes seguirá pasando.", "Mirá datos de varios años, no de semanas."],
];
const RULES = ["Tengo un objetivo y un plazo escritos para esta inversión.", "Sé cuánto estoy dispuesto a perder antes de vender.", "No invierto más del 20 % en un solo emisor.", "Reviso mi cartera en fechas fijas, no cada vez que leo una noticia.", "Si algo suena demasiado bueno, verifico antes de invertir.", "No tomo decisiones el mismo día que leo una noticia alarmante."];
function ProPsico() {
  const [rules, setRules] = usePersisted("bpy-reglas", {});
  return (
    <div className="space-y-6">
      <p className="text-ink prose-w">La mayoría de los errores no vienen de no saber, sino de las emociones. Conocer tus sesgos es la mejor protección.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {BIASES.map(([t, d, fix]) => (
          <div key={t} className="rounded-2xl border border-line bg-bg p-5">
            <p className="font-bold text-ink flex items-center gap-2"><Icon name="Brain" className="w-4 h-4 text-amber" />{t}</p>
            <p className="mt-1 text-sm text-muted">{d}</p>
            <p className="mt-3 text-sm text-ink"><span className="font-semibold text-em">Antídoto: </span>{fix}</p>
          </div>
        ))}
      </div>
      <div className="rounded-2xl board-bg bg-navy text-navyfg p-6">
        <p className="font-mono text-xs uppercase tracking-widest text-up">Mis reglas de inversión</p>
        <p className="mt-1 text-sm opacity-80">Marcá las que ya cumplís. Se guardan en tu navegador.</p>
        <ul className="mt-4 grid sm:grid-cols-2 gap-2">
          {RULES.map((r, k) => (
            <li key={k}><label htmlFor={"regla-" + k} className="flex gap-3 cursor-pointer rounded-lg p-2 hover:bg-navyfg/10">
              <input id={"regla-" + k} type="checkbox" checked={!!rules[k]} onChange={(e) => setRules((o) => ({ ...o, [k]: e.target.checked }))} className="mt-1 w-4 h-4 accent-[rgb(var(--em))] shrink-0" />
              <span className="text-sm">{r}</span>
            </label></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------- 9. práctica: rutina, cartera de práctica, diario y quiz ---------- */
const PRACTICE = [
  ["fm", "Fondo mutuo", 6, 0.2, 0, 0],
  ["cda", "CDA", 7.5, 1.5, -1, 0],
  ["bc", "Bonos corporativos", 9.5, 3.5, -5, 0],
  ["bt", "Bonos del Tesoro", 8.5, 5, 0, 0],
  ["usd", "Bonos en USD", 6, 4, -3, 1],
  ["ap", "Acciones preferidas", 9.5, 0, -10, 0],
  ["ao", "Acciones ordinarias", 11, 0, -25, 0],
];
const SCEN = [["base", "Escenario base"], ["tasas", "Tasas +2 pp"], ["baja", "Tasas −1 pp"], ["credito", "Crisis de crédito"], ["dolar", "Dólar +10 %"]];
const QUIZ_PRO = [
  ["Un bono tiene duración modificada de 5. Si la tasa de mercado sube 1 punto, su precio aproximadamente…", ["Sube 5 %", "Baja 5 %", "No cambia"], 1, "La duración modificada estima el cambio porcentual del precio por cada punto de tasa, con signo opuesto."],
  ["La curva de rendimientos invertida suele anticipar…", ["Subas fuertes de tasas", "Bajas de tasas o desaceleración", "Más inflación segura"], 1, "Cuando los plazos cortos pagan más que los largos, el mercado espera tasas más bajas en el futuro."],
  ["Un bono AApy paga 9 % y el Tesoro al mismo plazo 7,8 %. El spread es…", ["120 pb", "12 pb", "1.200 pb"], 0, "9 − 7,8 = 1,2 puntos porcentuales = 120 puntos básicos."],
  ["En el modelo de Gordon, si el rendimiento exigido baja, el valor estimado de la acción…", ["Baja", "Sube", "No cambia"], 1, "El denominador (k − g) se achica, por lo que el valor sube."],
  ["Dos activos con correlación negativa en una cartera…", ["Suman su riesgo", "Reducen la volatilidad total", "No tienen efecto"], 1, "Cuando uno baja el otro tiende a subir, y la volatilidad conjunta cae."],
  ["Si el BCP sube la tasa de política monetaria, los bonos que ya tenés…", ["Suben de precio", "Bajan de precio", "No se afectan"], 1, "Los bonos nuevos pagarán más, así que los existentes valen menos en el mercado secundario."],
  ["Un importador compra un futuro de dólar. Si el dólar baja al vencimiento…", ["Igual paga el tipo de cambio pactado", "Paga el tipo de cambio nuevo", "Se cancela el contrato"], 0, "La cobertura fija el precio pase lo que pase: pierde el ahorro posible, pero elimina la incertidumbre."],
  ["Operar con información no pública que puede mover el precio es…", ["Una ventaja legítima", "Uso de información privilegiada, prohibido", "Permitido si el monto es chico"], 1, "Es una infracción grave sancionada por el regulador."],
];

function ProPractica() {
  const [mix, setMix] = usePersisted("bpy-cartera", { fm: 20, cda: 25, bc: 25, bt: 20, usd: 0, ap: 10, ao: 0 });
  const [amount, setAmount] = usePersisted("bpy-cartera-monto", 50000000);
  const [scen, setScen] = useState("base");
  const [routine, setRoutine] = usePersisted("bpy-rutina", {});
  const [journal, setJournal] = usePersisted("bpy-diario", []);
  const [draft, setDraft] = useState({ inst: "", why: "", expect: "" });
  const [qi, setQi] = useState(0); const [qa, setQa] = useState([]); const [qp, setQp] = useState(null);
  const total = PRACTICE.reduce((s, [id]) => s + toNum(mix[id]), 0);
  const w = (id) => (total > 0 ? toNum(mix[id]) / total : 0);
  const rate = PRACTICE.reduce((s, [id, , r]) => s + w(id) * r, 0);
  const dur = PRACTICE.reduce((s, [id, , , d]) => s + w(id) * d, 0);
  const impact = PRACTICE.reduce((s, [id, , , d, cr, fx]) => {
    const x = w(id); if (scen === "tasas") return s + x * (-d * 2); if (scen === "baja") return s + x * (d * 1);
    if (scen === "credito") return s + x * cr; if (scen === "dolar") return s + x * (fx * 10); return s;
  }, 0);
  const riskScore = PRACTICE.reduce((s, [id], i) => s + w(id) * [1, 1, 2, 1, 2, 3, 4][i], 0);
  const addEntry = () => { if (!draft.inst.trim()) return; setJournal((j) => [{ ...draft, date: new Date().toLocaleDateString("es-PY") }, ...j].slice(0, 20)); setDraft({ inst: "", why: "", expect: "" }); };
  const qDone = qa.length === QUIZ_PRO.length; const qScore = qa.filter((a, k) => a === QUIZ_PRO[k][2]).length;
  return (
    <div className="space-y-10">
      <div>
        <h4 className="text-lg font-bold text-ink">Cartera de práctica</h4>
        <p className="mt-1 text-sm text-muted">Armá una cartera ficticia, mirá su rendimiento y su riesgo, y probá cómo le iría en distintos escenarios. Se guarda en tu navegador.</p>
        <div className="mt-4 grid lg:grid-cols-[340px_1fr] gap-6">
          <div className="space-y-3">
            <NumField id="pc-amount" label="Monto de práctica (Gs.)" value={amount} onChange={setAmount} cur="PYG" step={1000000} />
            {PRACTICE.map(([id, name]) => (
              <div key={id}>
                <label htmlFor={"pc-" + id} className="flex justify-between text-sm text-ink"><span>{name}</span><span className="font-mono text-muted">{Math.round(w(id) * 100)} %</span></label>
                <input id={"pc-" + id} type="range" min="0" max="100" step="5" value={toNum(mix[id])} onChange={(e) => { const v = Number(e.target.value); setMix((m) => ({ ...m, [id]: v })); }} className="w-full" />
              </div>
            ))}
            <p className="text-xs text-muted">Los porcentajes se ajustan solos para sumar 100 %.</p>
          </div>
          <div className="min-w-0 space-y-4">
            <div className="grid sm:grid-cols-3 gap-3">
              <Stat tone="em" label="Rendimiento esperado" value={pct(rate, 2)} sub={fmtMoney(toNum(amount) * rate / 100, "PYG") + " por año"} />
              <Stat label="Duración aprox. (renta fija)" value={fmtNum(dur, 1) + " años"} />
              <Stat tone="navy" label="Nivel de riesgo" value={riskScore < 1.5 ? "Conservador" : riskScore < 2.3 ? "Moderado" : "Dinámico"} sub={"Puntaje " + fmtNum(riskScore, 1) + " de 4"} />
            </div>
            <TabBar idBase="esc" label="Escenarios" value={scen} onChange={setScen} tabs={SCEN} />
            <div className={"rounded-2xl p-5 " + (impact < 0 ? "bg-dangersoft" : impact > 0 ? "bg-emsoft" : "bg-soft")}>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">Impacto inmediato estimado</p>
              <p className={"mt-1 font-mono text-3xl font-semibold " + (impact < 0 ? "text-danger" : impact > 0 ? "text-em" : "text-ink")}>{impact > 0 ? "+" : ""}{fmtNum(impact)} %</p>
              <p className="text-sm text-ink">{scen === "base" ? "Sin cambios en el mercado: tu cartera rinde lo esperado." : fmtMoney(toNum(amount) * impact / 100, "PYG") + " sobre el valor de tu cartera."}</p>
            </div>
            <p className="text-xs text-muted">Simulación muy simplificada: usa duraciones aproximadas y caídas ilustrativas para crédito y acciones. Sirve para entender sensibilidades, no para predecir.</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="rounded-2xl border border-line bg-bg p-5">
          <h4 className="text-lg font-bold text-ink flex items-center gap-2"><Icon name="CalendarCheck" className="w-5 h-5 text-em" /> Rutina del inversor</h4>
          <ul className="mt-3 space-y-1">
            {["Semanal: leer el boletín y las emisiones nuevas de la BVA.", "Mensual: revisar el estado de cuenta de tu Casa de Bolsa.", "Mensual: mirar inflación y decisiones de tasa del BCP.", "Trimestral: revisar hechos relevantes de tus emisores.", "Anual: rebalancear y revisar tus metas."].map((r, k) => (
              <li key={k}><label htmlFor={"rut-" + k} className="flex gap-3 cursor-pointer rounded-lg p-2 hover:bg-soft">
                <input id={"rut-" + k} type="checkbox" checked={!!routine[k]} onChange={(e) => setRoutine((o) => ({ ...o, [k]: e.target.checked }))} className="mt-1 w-4 h-4 accent-[rgb(var(--em))] shrink-0" /><span className="text-sm text-ink">{r}</span>
              </label></li>
            ))}
          </ul>
          <div className="mt-4 pt-4 border-t border-line">
            <p className="font-semibold text-ink text-sm">Formación</p>
            <ul className="mt-2 space-y-2">
              <Bullet>Material educativo de la <a className="text-em underline" href="https://www.bolsadevalores.com.py" target="_blank" rel="noopener">BVA</a> y cursos de las Casas de Bolsa.</Bullet>
              <Bullet>Certificación internacional <a className="text-em underline" href="https://www.cfainstitute.org" target="_blank" rel="noopener">CFA</a> para quien quiera dedicarse profesionalmente.</Bullet>
            </ul>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-bg p-5">
          <h4 className="text-lg font-bold text-ink flex items-center gap-2"><Icon name="NotebookPen" className="w-5 h-5 text-em" /> Diario de inversiones</h4>
          <p className="mt-1 text-sm text-muted">Anotá por qué invertís y qué esperás. Al revisarlo, vas a aprender de tus aciertos y errores. Se guarda solo en tu navegador.</p>
          <div className="mt-3 grid gap-2">
            <input id="dia-inst" value={draft.inst} onChange={(e) => setDraft({ ...draft, inst: e.target.value })} placeholder="Instrumento (por ejemplo: bono AApy 9 % a 3 años)" className={FIELD + " font-sans"} />
            <input id="dia-why" value={draft.why} onChange={(e) => setDraft({ ...draft, why: e.target.value })} placeholder="¿Por qué lo elegís?" className={FIELD + " font-sans"} />
            <input id="dia-exp" value={draft.expect} onChange={(e) => setDraft({ ...draft, expect: e.target.value })} placeholder="¿Qué esperás que pase?" className={FIELD + " font-sans"} />
            <button onClick={addEntry} className="justify-self-start inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-em text-white font-semibold hover:brightness-110"><Icon name="Plus" className="w-4 h-4" /> Agregar al diario</button>
          </div>
          {journal.length > 0 && (
            <ul className="mt-4 space-y-2 max-h-60 overflow-y-auto">
              {journal.map((j, k) => (
                <li key={k} className="rounded-lg border border-line bg-card p-3 text-sm">
                  <div className="flex justify-between gap-2"><p className="font-semibold text-ink">{j.inst}</p><button onClick={() => setJournal((x) => x.filter((_, i) => i !== k))} className="text-muted hover:text-danger shrink-0" aria-label="Borrar entrada"><Icon name="X" className="w-4 h-4" /></button></div>
                  <p className="text-xs text-muted font-mono">{j.date}</p>
                  {j.why && <p className="mt-1 text-ink"><span className="text-muted">Por qué: </span>{j.why}</p>}
                  {j.expect && <p className="text-ink"><span className="text-muted">Espero: </span>{j.expect}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-bg p-5 sm:p-6 max-w-3xl">
        <h4 className="text-lg font-bold text-ink flex items-center gap-2"><Icon name="Trophy" className="w-5 h-5 text-amber" /> Quiz nivel profesional</h4>
        {!qDone ? (
          <div key={qi} className="fade-in mt-3">
            <p className="font-mono text-xs text-em">PREGUNTA {qi + 1} DE {QUIZ_PRO.length}</p>
            <p className="mt-2 font-bold text-ink">{QUIZ_PRO[qi][0]}</p>
            <div className="mt-3 grid gap-2">
              {QUIZ_PRO[qi][1].map((o, k) => {
                const right = k === QUIZ_PRO[qi][2];
                const cls = qp === null ? "border-line hover:border-em hover:bg-soft" : right ? "border-em bg-emsoft" : qp === k ? "border-danger bg-dangersoft" : "border-line opacity-60";
                return <button key={k} id={"qpro-" + qi + "-" + k} disabled={qp !== null} onClick={() => setQp(k)} className={"text-left rounded-xl border px-4 py-3 text-sm font-medium text-ink transition " + cls}>{o}</button>;
              })}
            </div>
            {qp !== null && (
              <div className="fade-in mt-3 rounded-xl bg-soft p-3 text-sm">
                <p className={"font-bold " + (qp === QUIZ_PRO[qi][2] ? "text-em" : "text-danger")}>{qp === QUIZ_PRO[qi][2] ? "¡Correcto!" : "Incorrecto"}</p>
                <p className="mt-1 text-ink">{QUIZ_PRO[qi][3]}</p>
                <button onClick={() => { const na = [...qa, qp]; setQa(na); setQp(null); setQi(qi + 1); if (na.length === QUIZ_PRO.length && na.filter((a, k) => a === QUIZ_PRO[k][2]).length >= 7) setTimeout(() => celebrate(), 150); }} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-em text-white font-semibold">{qi === QUIZ_PRO.length - 1 ? "Ver resultado" : "Siguiente"} <Icon name="ArrowRight" className="w-4 h-4" /></button>
              </div>
            )}
          </div>
        ) : (
          <div className="fade-in mt-3">
            <p className="font-mono text-4xl font-semibold text-ink">{qScore}/{QUIZ_PRO.length}</p>
            <p className="mt-1 font-bold text-em">{qScore >= 7 ? "¡Nivel profesional!" : qScore >= 5 ? "Muy bien, casi experto" : "Repasá los temas de este nivel"}</p>
            <div className="mt-4 flex flex-wrap gap-3 items-start">
              <button onClick={() => { setQi(0); setQa([]); setQp(null); }} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-line font-semibold text-ink hover:bg-soft"><Icon name="RotateCcw" className="w-4 h-4" /> Repetir</button>
              <ShareButtons text={"Saqué " + qScore + "/" + QUIZ_PRO.length + " en el quiz de nivel profesional sobre la Bolsa de Paraguay."} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const PRO_TABS = [
  ["rf", "Renta fija avanzada", "LineChart"], ["credito", "Análisis de crédito", "FileSearch"], ["valuacion", "Valuación de acciones", "Calculator"],
  ["carteras", "Carteras y riesgo", "PieChart"], ["macro", "Macroeconomía", "Globe"], ["derivados", "Derivados", "ArrowLeftRight"],
  ["micro", "El mercado por dentro", "Building2"], ["psico", "Psicología", "Brain"], ["practica", "Práctica y quiz", "Trophy"],
];
function Profesional() {
  const [tab, setTab] = useState("rf");
  useEffect(() => { const on = (e) => setTab(e.detail); window.addEventListener("bpy-pro", on); return () => window.removeEventListener("bpy-pro", on); }, []);
  const firstPro = React.useRef(true);
  useEffect(() => { if (firstPro.current) { firstPro.current = false; return; } markSeen("pro-" + tab); }, [tab]);
  const t = PRO_TABS.find((x) => x[0] === tab);
  const i = PRO_TABS.findIndex((x) => x[0] === tab);
  return (
    <Section id="profesional" eyebrow="Nivel 5 · Profesional" title="Lo que sabe un experto en la bolsa"
      intro="Nueve temas avanzados, con herramientas para practicar. Recorrelos en orden o elegí el que te interese.">
      <TabBar idBase="pro" label="Temas profesionales" value={tab} onChange={setTab} tabs={PRO_TABS.map(([id, l, ic], k) => [id, (k + 1) + ". " + l, ic])} />
      <div key={tab} className="fade-in mt-5 rounded-2xl border border-line bg-card p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
          <h3 className="text-2xl font-bold text-ink flex items-center gap-3"><span className="font-mono text-sm rounded-md bg-navy text-up px-2 py-0.5">{String(i + 1).padStart(2, "0")}</span>{t[1]}</h3>
          <div className="flex gap-2">
            <button disabled={i === 0} onClick={() => setTab(PRO_TABS[i - 1][0])} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-line text-sm text-ink disabled:opacity-40 hover:bg-soft"><Icon name="ChevronLeft" className="w-4 h-4" /> Anterior</button>
            <button disabled={i === PRO_TABS.length - 1} onClick={() => setTab(PRO_TABS[i + 1][0])} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-line text-sm text-ink disabled:opacity-40 hover:bg-soft">Siguiente <Icon name="ChevronRight" className="w-4 h-4" /></button>
          </div>
        </div>
        {tab === "rf" && <ProRentaFija />}
        {tab === "credito" && <ProCredito />}
        {tab === "valuacion" && <ProValuacion />}
        {tab === "carteras" && <ProCarteras />}
        {tab === "macro" && <ProMacro />}
        {tab === "derivados" && <ProDerivados />}
        {tab === "micro" && <ProMicro />}
        {tab === "psico" && <ProPsico />}
        {tab === "practica" && <ProPractica />}
      </div>
    </Section>
  );
}

/* =====================================================================
   EXPERIENCIA (v7): animaciones al desplazarse, progreso e insignias,
   buscador, celebraciones, avisos y portada interactiva.
   ===================================================================== */
const reduceMotion = () => !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

/* ---------- celebración (confeti) ---------- */
function celebrate(x, y) {
  if (reduceMotion() || !document.body) return;
  const colors = ["#059669", "#34D399", "#FBBF24", "#F8FAFC", "#B45309", "#38BDF8"];
  const box = document.createElement("div");
  box.className = "confetti";
  box.setAttribute("aria-hidden", "true");
  const cx = x == null ? window.innerWidth / 2 : x, cy = y == null ? window.innerHeight * 0.35 : y;
  for (let k = 0; k < 80; k++) {
    const p = document.createElement("i");
    const a = Math.random() * Math.PI * 2, d = 90 + Math.random() * 240;
    p.style.left = cx + "px"; p.style.top = cy + "px"; p.style.background = colors[k % colors.length];
    p.style.setProperty("--dx", Math.round(Math.cos(a) * d) + "px");
    p.style.setProperty("--dy", Math.round(Math.sin(a) * d * 0.7 - 80) + "px");
    p.style.setProperty("--r", Math.round(Math.random() * 900 - 450) + "deg");
    p.style.animationDelay = Math.round(Math.random() * 90) + "ms";
    if (k % 3 === 0) p.style.borderRadius = "50%";
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 1900);
}

/* ---------- avisos flotantes ---------- */
const toast = (title, body, icon) => window.dispatchEvent(new CustomEvent("bpy-toast", { detail: { title, body, icon: icon || "Award", id: Date.now() + Math.random() } }));
function Toasts() {
  const [list, setList] = useState([]);
  useEffect(() => {
    const on = (e) => {
      const t = e.detail;
      setList((l) => [...l, t].slice(-3));
      setTimeout(() => setList((l) => l.filter((x) => x.id !== t.id)), 5000);
    };
    window.addEventListener("bpy-toast", on);
    return () => window.removeEventListener("bpy-toast", on);
  }, []);
  return (
    <div className="fixed z-[96] left-1/2 -translate-x-1/2 flex flex-col gap-2 w-[min(92vw,380px)] pointer-events-none" style={{ bottom: "calc(76px + env(safe-area-inset-bottom, 0px))" }} aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className="toast-in flex gap-3 items-start rounded-2xl bg-navy text-navyfg p-4 shadow-2xl border border-navyfg/15">
          <span className="grid place-items-center w-10 h-10 rounded-xl bg-gold/20 text-gold shrink-0"><Icon name={t.icon} className="w-5 h-5" /></span>
          <div className="min-w-0"><p className="font-bold">{t.title}</p>{t.body && <p className="text-sm opacity-80">{t.body}</p>}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- progreso e insignias ---------- */
const TRACKED = VIEWS.filter((v) => v.id !== "inicio").flatMap((v) => v.sections.map(([id]) => id));
let SEEN = store.get("bpy-seen", {});
if (!SEEN || typeof SEEN !== "object") SEEN = {};
const viewDone = (vid, s) => VIEWS.find((v) => v.id === vid).sections.every(([id]) => s[id]);
const BADGES = [
  { id: "empezar", name: "Primeros pasos", icon: "Rocket", desc: "Recorriste toda la sección Empezar." },
  { id: "instrumentos", name: "Conocedor", icon: "Layers", desc: "Viste los instrumentos, los fondos y los riesgos." },
  { id: "invertir", name: "Estratega", icon: "Target", desc: "Recorriste Dónde invertir de punta a punta." },
  { id: "mercado", name: "Experto del mercado", icon: "Landmark", desc: "Entendés cómo funciona el mercado por dentro." },
  { id: "herramientas", name: "Calculista", icon: "Calculator", desc: "Usaste al menos 3 calculadoras.", test: (s) => TOOLS.filter(([id]) => (id === "sim" ? s.simulador : s["tool-" + id])).length >= 3 },
  { id: "aprender", name: "Estudiante", icon: "GraduationCap", desc: "Recorriste toda la sección Aprender." },
  { id: "quiz", name: "Quiz aprobado", icon: "Award", desc: "Sacaste 7 o más en el quiz general.", test: (s) => !!s["quiz-ok"] },
  { id: "pro", name: "Mente profesional", icon: "Brain", desc: "Abriste los 9 temas del nivel profesional.", test: (s) => PRO_TABS.every(([id]) => (id === "rf" ? s.profesional : s["pro-" + id])) },
  { id: "all", name: "Inversor informado", icon: "Trophy", desc: "Viste todos los temas de la guía.", test: (s) => TRACKED.every((id) => s[id]) },
].map((b) => ({ ...b, test: b.test || ((s) => viewDone(b.id, s)) }));

function markSeen(id) {
  if (SEEN[id]) return;
  const before = BADGES.filter((b) => b.test(SEEN)).map((b) => b.id);
  SEEN = { ...SEEN, [id]: true };
  store.set("bpy-seen", SEEN);
  window.dispatchEvent(new CustomEvent("bpy-seen"));
  BADGES.filter((b) => b.test(SEEN) && !before.includes(b.id)).forEach((b, k) => setTimeout(() => {
    toast("¡Insignia desbloqueada!", b.name + ": " + b.desc, b.icon);
    celebrate();
  }, 300 + k * 700));
}
function resetSeen() {
  SEEN = {};
  store.set("bpy-seen", SEEN);
  window.dispatchEvent(new CustomEvent("bpy-seen"));
}
function useSeen() {
  const [s, setS] = useState(SEEN);
  useEffect(() => {
    const on = () => setS(SEEN);
    window.addEventListener("bpy-seen", on);
    return () => window.removeEventListener("bpy-seen", on);
  }, []);
  return s;
}

/* Marca un tema como visto después de leerlo unos segundos y anima el contenido al aparecer */
function useExperience(view) {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const timers = new Map();
    const io = new IntersectionObserver((ents) => ents.forEach((e) => {
      const id = e.target.id;
      if (e.isIntersecting) { if (!timers.has(id)) timers.set(id, setTimeout(() => markSeen(id), 1500)); }
      else { clearTimeout(timers.get(id)); timers.delete(id); }
    }), { rootMargin: "-35% 0px -45% 0px" });
    document.querySelectorAll("main section[id]").forEach((s) => { if (TRACKED.includes(s.id)) io.observe(s); });

    let rio = null;
    if (!reduceMotion()) {
      rio = new IntersectionObserver((ents) => ents.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.setAttribute("data-reveal", "in");
        rio.unobserve(el);
        setTimeout(() => { el.removeAttribute("data-reveal"); el.style.removeProperty("--rd"); }, 1100);
      }), { rootMargin: "0px 0px -6% 0px" });
      const targets = [];
      document.querySelectorAll("main section .wrap").forEach((w) => Array.from(w.children).forEach((c) => {
        const kids = c.children;
        if (c.classList.contains("grid") && kids.length > 1 && kids.length <= 12) {
          Array.from(kids).forEach((k, i) => { k.style.setProperty("--rd", (i % 4) * 80 + "ms"); targets.push(k); });
        } else targets.push(c);
      }));
      const vh = window.innerHeight;
      targets.forEach((el) => {
        if (el.getBoundingClientRect().top > vh * 0.92) { el.setAttribute("data-reveal", ""); rio.observe(el); }
        else el.style.removeProperty("--rd");
      });
    }
    return () => { io.disconnect(); if (rio) rio.disconnect(); timers.forEach((t) => clearTimeout(t)); };
  }, [view]);
}

function Ring({ value, size = 36, stroke = 4, track = "rgb(var(--line))", color = "rgb(var(--em))", children }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <span className="relative inline-grid place-items-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))} style={{ transition: "stroke-dashoffset .7s ease" }} />
      </svg>
      <span className="absolute inset-0 grid place-items-center">{children}</span>
    </span>
  );
}

function useEscape(onClose) {
  useEffect(() => {
    const on = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", on);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", on); document.body.style.overflow = prev; };
  }, []);
}

function ProgressPanel({ onClose }) {
  const s = useSeen();
  const [confirm, setConfirm] = useState(false);
  useEscape(onClose);
  const n = TRACKED.filter((id) => s[id]).length, p = n / TRACKED.length;
  const earned = BADGES.filter((b) => b.test(s)).length;
  const go = (id) => { onClose(); setTimeout(() => scrollTo(id), 40); };
  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-labelledby="prog-title">
      <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm fade-in" onClick={onClose} />
      <div className="slide-in absolute right-0 top-0 h-full w-full max-w-md bg-card shadow-2xl overflow-y-auto border-l border-line">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 bg-card/95 backdrop-blur border-b border-line">
          <h2 id="prog-title" className="text-lg font-bold text-ink flex items-center gap-2"><Icon name="Award" className="w-5 h-5 text-amber" /> Tu progreso</h2>
          <button onClick={onClose} autoFocus aria-label="Cerrar" className="grid place-items-center w-9 h-9 rounded-lg border border-line text-ink hover:bg-soft"><Icon name="X" className="w-4 h-4" /></button>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-5 rounded-2xl bg-navy text-navyfg p-5 board-bg">
            <Ring value={p} size={92} stroke={8} track="rgb(var(--navy-fg) / .15)" color="rgb(var(--up))">
              <span className="font-mono text-xl font-semibold text-up num">{Math.round(p * 100)}%</span>
            </Ring>
            <div className="min-w-0">
              <p className="font-display text-xl font-bold">{n} de {TRACKED.length} temas</p>
              <p className="text-sm opacity-80 mt-1">{earned} de {BADGES.length} insignias. Los temas se marcan solos cuando los leés unos segundos.</p>
            </div>
          </div>

          <h3 className="mt-7 font-mono text-xs uppercase tracking-widest text-muted">Insignias</h3>
          <ul className="mt-3 grid grid-cols-3 gap-2">
            {BADGES.map((b) => {
              const ok = b.test(s);
              return (
                <li key={b.id} title={b.desc} className={"rounded-xl border p-3 text-center " + (ok ? "border-amber/40 bg-ambersoft" : "border-line bg-soft")}>
                  <span className={"mx-auto grid place-items-center w-10 h-10 rounded-full " + (ok ? "bg-gold text-navy shadow-md" : "bg-line text-muted")}>
                    <Icon name={ok ? b.icon : "Lock"} className="w-5 h-5" />
                  </span>
                  <p className={"mt-2 text-xs font-semibold leading-tight " + (ok ? "text-ink" : "text-muted")}>{b.name}</p>
                  <p className="sr-only">{ok ? "Obtenida. " : "Bloqueada. "}{b.desc}</p>
                </li>
              );
            })}
          </ul>

          <h3 className="mt-7 font-mono text-xs uppercase tracking-widest text-muted">Temas por sección</h3>
          <ul className="mt-3 space-y-3">
            {VIEWS.filter((v) => v.id !== "inicio").map((v) => {
              const d = v.sections.filter(([id]) => s[id]).length;
              return (
                <li key={v.id} className="rounded-xl border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <a href={"#" + v.id} onClick={onClose} className="flex items-center gap-2 font-semibold text-ink hover:text-em"><Icon name={v.icon} className="w-4 h-4 text-em" />{v.label}</a>
                    <span className="num text-xs font-semibold text-muted">{d}/{v.sections.length}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-soft overflow-hidden"><div className="h-full rounded-full bg-em transition-all duration-700" style={{ width: (d / v.sections.length) * 100 + "%" }} /></div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {v.sections.map(([id, l]) => (
                      <button key={id} onClick={() => go(id)} className={"inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs border transition " + (s[id] ? "border-em/40 bg-emsoft text-em" : "border-line text-muted hover:text-ink hover:border-em/50")}>
                        {s[id] && <Icon name="Check" className="w-3 h-3" />}{l}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-7 border-t border-line pt-5">
            {!confirm ? (
              <button onClick={() => setConfirm(true)} className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-danger"><Icon name="RotateCcw" className="w-4 h-4" /> Reiniciar mi progreso</button>
            ) : (
              <div className="rounded-xl border border-danger/30 bg-dangersoft p-3 text-sm text-ink">
                <p>¿Borrar los temas vistos y las insignias de este navegador?</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => { resetSeen(); setConfirm(false); }} className="px-3 py-1.5 rounded-lg bg-danger text-white font-semibold">Sí, borrar</button>
                  <button onClick={() => setConfirm(false)} className="px-3 py-1.5 rounded-lg border border-line font-semibold">Cancelar</button>
                </div>
              </div>
            )}
            <p className="mt-3 text-xs text-muted">Tu progreso se guarda solo en este navegador. No lo enviamos a ningún lado.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressButton() {
  const s = useSeen();
  const [open, setOpen] = useState(false);
  const n = TRACKED.filter((id) => s[id]).length, p = n / TRACKED.length;
  const earned = BADGES.filter((b) => b.test(s)).length;
  return (
    <>
      <button onClick={() => setOpen(true)} title="Tu progreso e insignias"
        aria-label={"Tu progreso: " + Math.round(p * 100) + " por ciento, " + earned + (earned === 1 ? " insignia" : " insignias")}
        className="inline-flex items-center gap-1.5 h-9 rounded-lg border border-line pl-1 pr-2 text-ink hover:bg-soft transition shrink-0">
        <Ring value={p} size={28} stroke={3}><span className="text-[9px] font-bold num text-ink">{Math.round(p * 100)}</span></Ring>
        <Icon name="Award" className="w-4 h-4 text-amber" /><span className="text-sm font-semibold num">{earned}</span>
      </button>
      {open && ReactDOM.createPortal(<ProgressPanel onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

/* ---------- buscador (Ctrl + K) ---------- */
const PENDING = {};
const openTool = (id) => {
  PENDING.tool = id;
  scrollTo("simulador");
  setTimeout(() => window.dispatchEvent(new CustomEvent("bpy-tool", { detail: id })), 160);
};
const openGlossary = (term) => {
  PENDING.glos = term;
  scrollTo("glosario");
  setTimeout(() => window.dispatchEvent(new CustomEvent("bpy-glos", { detail: term })), 160);
};
let SEARCH_INDEX = null;
function searchIndex() {
  if (SEARCH_INDEX) return SEARCH_INDEX;
  const out = [];
  VIEWS.forEach((v) => {
    if (v.id !== "inicio") out.push({ k: "Sección", icon: v.icon, label: v.title, sub: v.desc, go: () => { window.location.hash = v.id; } });
    v.sections.forEach(([id, l]) => out.push({ k: "Tema", icon: v.icon, label: l, sub: v.label, go: () => scrollTo(id) }));
  });
  TOOLS.forEach(([id, l, ic]) => out.push({ k: "Calculadora", icon: ic, label: l, sub: "Calculadoras", go: () => openTool(id) }));
  PRO_TABS.forEach(([id, l, ic]) => out.push({ k: "Nivel profesional", icon: ic, label: l, sub: "Aprender · Nivel profesional", go: () => goTo("pro-" + id) }));
  INSTRUMENTS.forEach((x) => out.push({ k: "Instrumento", icon: x.icon, label: x.name, sub: x.summary, go: () => scrollTo("instrumentos") }));
  GLOSSARY.forEach(([t, d]) => out.push({ k: "Glosario", icon: "BookOpen", label: t, sub: d, def: true, go: () => openGlossary(t) }));
  FAQ.forEach(([q, a]) => out.push({ k: "Pregunta", icon: "MessageCircle", label: q, sub: a, def: true, go: () => scrollTo("glosario") }));
  SEARCH_INDEX = out.map((o, i) => ({ ...o, i, nl: norm(o.label + " " + o.k), ns: norm(o.sub || "") }));
  return SEARCH_INDEX;
}
const SEARCH_SUGGEST = ["Simulador", "Paso a paso", "Señales de estafa", "Tu perfil", "Según tu objetivo", "CDA", "Cupón", "Casas de Bolsa"];

function Buscador({ onClose }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [exp, setExp] = useState(-1);
  useEscape(onClose);
  const idx = searchIndex();
  const res = useMemo(() => {
    const words = norm(q.trim()).split(/\s+/).filter(Boolean);
    if (!words.length) return SEARCH_SUGGEST.map((l) => idx.find((r) => r.label === l)).filter(Boolean);
    return idx
      .map((r) => {
        if (!words.every((w) => r.nl.includes(w) || r.ns.includes(w))) return null;
        const sc = words.reduce((a, w) => a + (r.nl.startsWith(w) ? 4 : r.nl.includes(w) ? 2 : 0.5), 0) + (r.k === "Tema" || r.k === "Calculadora" ? 0.6 : 0);
        return [sc, r];
      })
      .filter(Boolean).sort((a, b) => b[0] - a[0]).slice(0, 30).map((x) => x[1]);
  }, [q]);
  useEffect(() => { setSel(0); setExp(-1); }, [q]);
  useEffect(() => { const el = document.getElementById("bus-" + sel); if (el) el.scrollIntoView({ block: "nearest" }); }, [sel]);
  const pick = (r) => {
    if (r.def && exp !== r.i) { setExp(r.i); return; }
    onClose();
    setTimeout(r.go, 40);
  };
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((x) => Math.min(res.length - 1, x + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((x) => Math.max(0, x - 1)); }
    else if (e.key === "Enter" && res[sel]) { e.preventDefault(); pick(res[sel]); }
  };
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Buscar en la guía">
      <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm fade-in" onClick={onClose} />
      <div className="pop-in relative w-full max-w-2xl mt-[6vh] rounded-2xl bg-card border border-line shadow-2xl overflow-hidden flex flex-col max-h-[82vh]">
        <div className="flex items-center gap-3 px-4 border-b border-line">
          <Icon name="Search" className="w-5 h-5 text-em shrink-0" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Buscá un tema, instrumento o palabra"
            role="combobox" aria-expanded="true" aria-controls="bus-list" aria-activedescendant={res[sel] ? "bus-" + sel : undefined} aria-label="Buscar en la guía"
            style={{ outline: "none" }} className="flex-1 min-w-0 bg-transparent py-4 text-base text-ink placeholder:text-muted" />
          <button onClick={onClose} className="shrink-0 rounded-md border border-line px-2 py-0.5 font-mono text-xs text-muted hover:text-ink">Esc</button>
        </div>
        {!q.trim() && <p className="px-5 pt-3 font-mono text-[11px] uppercase tracking-widest text-muted">Sugerencias</p>}
        <ul id="bus-list" role="listbox" className="overflow-y-auto p-2">
          {res.length === 0 && <li className="px-3 py-10 text-center text-muted">No encontramos «{q}». Probá con otra palabra, por ejemplo «bono» o «riesgo».</li>}
          {res.map((r, i) => (
            <li key={r.i} id={"bus-" + i} role="option" aria-selected={i === sel}>
              <button type="button" onMouseMove={() => setSel(i)} onClick={() => pick(r)}
                className={"w-full text-left flex gap-3 items-start rounded-xl px-3 py-2.5 transition " + (i === sel ? "bg-emsoft" : "")}>
                <span className={"grid place-items-center w-9 h-9 rounded-lg shrink-0 " + (i === sel ? "bg-em text-white" : "bg-soft text-em")}><Icon name={r.icon} className="w-4 h-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 flex-wrap"><span className="font-semibold text-ink">{r.label}</span><span className="text-[10px] font-mono uppercase tracking-wider text-muted">{r.k}</span></span>
                  <span className={"text-sm text-muted " + (exp === r.i ? "block" : "line-clamp-2")}>{r.sub}</span>
                  {exp === r.i && <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-em">{r.k === "Glosario" ? "Ver en el glosario" : "Ver todas las preguntas"} <Icon name="ArrowRight" className="w-3 h-3" /></span>}
                </span>
                {i === sel && <Icon name="CornerDownLeft" className="w-4 h-4 text-em shrink-0 mt-2.5 hidden sm:block" />}
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-line px-4 py-2 text-xs text-muted flex gap-4 flex-wrap">
          <span><kbd className="font-mono">↑ ↓</kbd> moverte</span><span><kbd className="font-mono">Enter</kbd> abrir</span><span className="hidden sm:inline"><kbd className="font-mono">Ctrl K</kbd> o <kbd className="font-mono">/</kbd> abre el buscador</span>
        </div>
      </div>
    </div>
  );
}
function useSearchShortcut(setOpen) {
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target, typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); setOpen(true); }
      else if (e.key === "/" && !typing) { e.preventDefault(); setOpen(true); }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("bpy-search", onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("bpy-search", onOpen); };
  }, []);
}

/* ---------- portada: palabra que rota, contador animado y caminos ---------- */
function useCountUp(target, ms = 700, from) {
  const [v, setV] = useState(from == null ? target : from);
  const ref = React.useRef(from == null ? target : from);
  useEffect(() => {
    if (reduceMotion()) { ref.current = target; setV(target); return; }
    const a = ref.current, t0 = performance.now();
    let raf = 0;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3), val = a + (target - a) * e;
      ref.current = val; setV(val);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}
const CountUp = ({ to }) => <>{Math.round(useCountUp(to, 1200, 0))}</>;

const HERO_WORDS = ["desde cero", "con poco dinero", "paso a paso", "en PYG o USD"];
function Rotator() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduceMotion()) return;
    const t = setInterval(() => setI((k) => (k + 1) % HERO_WORDS.length), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="block">
      <span className="sr-only">desde cero</span>
      <span key={i} aria-hidden="true" className="word-in inline-block text-up hero-grad">{HERO_WORDS[i]}</span>
    </span>
  );
}

const GOAL_PATHS = [
  ["Sprout", "Empezar de cero", "Los 5 pasos para tu primera inversión.", () => scrollTo("guia"), "bg-emsoft text-em"],
  ["CalendarClock", "Cobrar intereses", "Calculá cuánto invertir para un ingreso mensual.", () => openTool("bono"), "bg-ambersoft text-amber"],
  ["ShieldCheck", "Proteger mis ahorros", "Qué conviene según tu objetivo y tu moneda.", () => scrollTo("donde"), "bg-navy text-up"],
  ["Compass", "Conocer mi perfil", "Test de un minuto con una cartera de ejemplo.", () => scrollTo("perfil"), "bg-emsoft text-em"],
];
function Caminos() {
  return (
    <div className="caminos-wrap relative z-10 -mt-12 sm:-mt-14 pb-2">
      <div className="wrap">
        <div className="rounded-3xl border border-line bg-card shadow-xl p-3 sm:p-4 caminos">
          <p className="px-2 pt-1 pb-3 font-mono text-[11px] uppercase tracking-widest text-muted flex items-center gap-2"><Icon name="Sparkles" className="w-3.5 h-3.5 text-amber" />¿Qué querés lograr hoy?</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-2">
            {GOAL_PATHS.map(([ic, t, d, go, tone]) => (
              <button key={t} type="button" onClick={go} className="group text-left flex gap-3 items-start rounded-2xl p-3 sm:p-3.5 hover:bg-soft transition">
                <span className={"grid place-items-center w-11 h-11 rounded-xl shrink-0 transition group-hover:scale-110 group-hover:-rotate-6 " + tone}><Icon name={ic} /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 font-bold text-ink">{t}<Icon name="ArrowRight" className="w-4 h-4 text-em opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition" /></span>
                  <span className="block text-sm text-muted leading-snug mt-0.5">{d}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- beneficios con ejemplo ---------- */
const BEN_EX = [
  "Con Gs. 10.000.000 en una caja de ahorro al 1 % ganás unos Gs. 100.000 en un año; en un CDA al 7,5 %, unos Gs. 750.000.",
  "Un bono de Gs. 50.000.000 al 9 % anual con cupón mensual paga unos Gs. 375.000 por mes, antes de impuestos.",
  "Podés entrar a un fondo mutuo con montos desde unos Gs. 100.000 y sumar, por ejemplo, Gs. 200.000 cada mes.",
  "Si ahorrás para un viaje o para algo que se paga en dólares, invertir en USD te protege si sube el tipo de cambio.",
  "Antes de operar, verificá que tu Casa de Bolsa figure en la lista oficial de la BVA y del BCP.",
  "En vez de poner Gs. 30.000.000 en un solo bono, podés repartirlos entre un fondo, un CDA y dos bonos de emisores distintos.",
  "Si compraste un bono a 5 años y necesitás el dinero al segundo año, tu Casa de Bolsa puede ofrecerlo a otro inversor.",
  "Cuando comprás el bono de una empresa, ese dinero puede financiar, por ejemplo, una planta nueva o maquinaria.",
];
function BenefitCard({ ic, t, d, ex }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={"group rounded-2xl border bg-card p-5 transition flex flex-col " + (open ? "border-em" : "border-line hover:border-em/50")}>
      <span className="grid place-items-center w-11 h-11 rounded-xl bg-emsoft text-em group-hover:bg-em group-hover:text-white group-hover:-rotate-6 transition"><Icon name={ic} /></span>
      <h3 className="mt-4 font-bold text-ink">{t}</h3>
      <p className="mt-1 text-sm text-muted">{d}</p>
      {open && <p className="fade-in mt-3 rounded-xl bg-emsoft p-3 text-sm text-ink"><span className="font-semibold text-em">Ejemplo: </span>{ex}</p>}
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
        className="mt-3 self-start inline-flex items-center gap-1 text-sm font-semibold text-em hover:underline underline-offset-2">
        {open ? "Ocultar ejemplo" : "Ver un ejemplo"}<Icon name="ChevronDown" className={"w-4 h-4 transition " + (open ? "rotate-180" : "")} />
      </button>
    </article>
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
  useExperience(view);
  const [busca, setBusca] = useState(false);
  useSearchShortcut(setBusca);
  currentView = view;
  const v = VIEWS.find((x) => x.id === view);
  const pages = {
    instrumentos: [<Instrumentos key="i" />, <Fondos key="f" />, <Riesgos key="r" />],
    invertir: [<DondeInvertir key="d" />, <Casos key="c" />, <Estrategias key="es" />, <Casas key="cb" />],
    mercado: [<Ecosistema key="e" />, <Mapa key="m" />, <Negociacion key="n" />, <Precios key="pr" />, <Prospecto key="p" />, <LineaTiempo key="l" />],
    empezar: [<Mitos key="mi" />, <Stepper key="s" />, <Estafas key="es" />, <ChecklistPre key="ch" />, <Perfil key="pf" />],
    herramientas: [<Herramientas key="h" />],
    aprender: [<Aprender key="a" />, <Experto key="x" />, <Profesional key="pro" />, <Quiz key="q" />, <GlosarioFAQ key="g" />, <DatosOficiales key="o" />, <Acerca key="ac" />],
  };
  return (
    <>
      <Nav view={view} />
      {view === "inicio" ? (
        <main key="inicio">
          <Hero />
          <Caminos />
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
      <BackToTop />
      <Toasts />
      {busca && <Buscador onClose={() => setBusca(false)} />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

