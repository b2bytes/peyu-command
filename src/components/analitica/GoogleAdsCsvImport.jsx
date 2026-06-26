// ============================================================================
// GoogleAdsCsvImport · Importador profesional de rendimiento Google Ads → Analítica.
// Sube un CSV exportado de Google Ads (o usa la plantilla), lo parsea, valida,
// muestra un preview y crea/actualiza registros Campana (la entidad que lee
// la pestaña Marketing de Analítica). Mapea las columnas estándar de Google Ads.
// ============================================================================
import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  Upload, FileSpreadsheet, Download, Loader2, CheckCircle2,
  AlertTriangle, X, ArrowRight,
} from "lucide-react";

// Cabeceras canónicas de la plantilla (lo que esperamos del CSV).
const PLANTILLA_HEADERS = [
  "nombre", "estado", "presupuesto_clp", "gasto_real_clp",
  "impresiones", "clics", "conversiones", "leads_generados", "roas",
];

// Sinónimos de columnas → campo canónico. Cubre los nombres típicos del
// export de Google Ads (en español e inglés) para que el founder no tenga
// que renombrar nada a mano.
const COLUMN_ALIASES = {
  nombre: ["nombre", "campaña", "campaign", "campaign name", "nombre de la campaña"],
  estado: ["estado", "status", "campaign state", "estado de la campaña"],
  presupuesto_clp: ["presupuesto_clp", "presupuesto", "budget", "presupuesto diario", "daily budget"],
  gasto_real_clp: ["gasto_real_clp", "gasto", "costo", "cost", "spend", "coste"],
  impresiones: ["impresiones", "impressions", "impr.", "impr"],
  clics: ["clics", "clicks", "clic", "click"],
  conversiones: ["conversiones", "conversions", "conv.", "conversions"],
  leads_generados: ["leads_generados", "leads", "lead", "clientes potenciales"],
  roas: ["roas", "valor de conv. / costo", "conv. value / cost", "return on ad spend"],
};

const ESTADOS_VALIDOS = ["Activa", "Pausada", "Finalizada", "En revisión", "Planificada"];

// Mapea cualquier estado de Google Ads a uno válido de la entidad Campana.
function normalizarEstado(raw) {
  if (!raw) return "Activa";
  const s = String(raw).toLowerCase().trim();
  if (s.includes("paus") || s.includes("pause")) return "Pausada";
  if (s.includes("final") || s.includes("end") || s.includes("removed") || s.includes("elimin")) return "Finalizada";
  if (s.includes("revis") || s.includes("review") || s.includes("pending")) return "En revisión";
  if (s.includes("plan") || s.includes("draft") || s.includes("borrador")) return "Planificada";
  return "Activa";
}

const toNum = (v) => {
  if (v == null || v === "") return 0;
  // Quita símbolos de moneda, separadores de miles y normaliza decimales.
  const limpio = String(v).replace(/[$\s]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".").replace(/[^0-9.\-]/g, "");
  const n = parseFloat(limpio);
  return isNaN(n) ? 0 : n;
};

// Parser CSV simple que respeta comillas dobles.
function parseCSV(text) {
  const rows = [];
  let row = [], cell = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') { cell += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else cell += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
      else if (c === "\r") { /* skip */ }
      else cell += c;
    }
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function mapHeaders(headerRow) {
  const map = {};
  headerRow.forEach((h, idx) => {
    const norm = h.toLowerCase().trim();
    for (const [campo, alias] of Object.entries(COLUMN_ALIASES)) {
      if (alias.includes(norm)) { map[campo] = idx; break; }
    }
  });
  return map;
}

export default function GoogleAdsCsvImport({ onImported }) {
  const [open, setOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(null); // {creadas, actualizadas}
  const fileRef = useRef(null);

  const descargarPlantilla = () => {
    const ejemplo = [
      PLANTILLA_HEADERS.join(","),
      "Search AI Max · Regalos Corporativos,Activa,500000,312450,84200,2105,38,38,4.2",
      "Performance Max · Carcasas B2C,Activa,300000,287900,210400,5320,142,0,3.1",
      "Demand Gen · Sostenibilidad,Pausada,200000,95300,401200,3890,21,0,1.8",
    ].join("\n");
    const blob = new Blob([ejemplo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_google_ads_peyu.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (file) => {
    if (!file) return;
    setError(""); setDone(null); setParsing(true); setRows([]);
    try {
      const text = await file.text();
      const matrix = parseCSV(text);
      if (matrix.length < 2) { setError("El archivo no tiene filas de datos."); setParsing(false); return; }
      const headerMap = mapHeaders(matrix[0]);
      if (headerMap.nombre == null) {
        setError("No encontré la columna del nombre de campaña. Usa la plantilla como referencia.");
        setParsing(false); return;
      }
      const parsed = matrix.slice(1).map((r) => {
        const get = (campo) => (headerMap[campo] != null ? r[headerMap[campo]] : "");
        const gasto = toNum(get("gasto_real_clp"));
        const clics = toNum(get("clics"));
        const impresiones = toNum(get("impresiones"));
        const conversiones = toNum(get("conversiones"));
        return {
          nombre: (get("nombre") || "").trim(),
          canal: "Google Search",
          objetivo: "Conversión",
          estado: normalizarEstado(get("estado")),
          presupuesto_clp: toNum(get("presupuesto_clp")),
          gasto_real_clp: gasto,
          impresiones,
          clics,
          conversiones,
          leads_generados: toNum(get("leads_generados")) || conversiones,
          roas: toNum(get("roas")),
          // Derivados
          ctr_pct: impresiones > 0 ? +(clics / impresiones * 100).toFixed(2) : 0,
          cac_clp: conversiones > 0 ? Math.round(gasto / conversiones) : 0,
        };
      }).filter((r) => r.nombre);
      if (!parsed.length) { setError("No hay campañas válidas (falta el nombre)."); setParsing(false); return; }
      setRows(parsed);
    } catch (e) {
      setError("No pude leer el archivo: " + e.message);
    } finally {
      setParsing(false);
    }
  };

  const importar = async () => {
    setImporting(true); setError("");
    try {
      // Trae las campañas existentes de Google para hacer upsert por nombre+canal.
      const existentes = await base44.entities.Campana.list("-created_date", 500);
      const porNombre = {};
      existentes.forEach((c) => { if (c.nombre) porNombre[c.nombre.toLowerCase().trim()] = c; });

      let creadas = 0, actualizadas = 0;
      const nuevas = [];
      for (const r of rows) {
        const match = porNombre[r.nombre.toLowerCase().trim()];
        if (match) {
          await base44.entities.Campana.update(match.id, r);
          actualizadas++;
        } else {
          nuevas.push(r);
        }
      }
      if (nuevas.length) { await base44.entities.Campana.bulkCreate(nuevas); creadas = nuevas.length; }

      setDone({ creadas, actualizadas });
      setRows([]);
      onImported?.();
    } catch (e) {
      setError("Error al importar: " + e.message);
    } finally {
      setImporting(false);
    }
  };

  const cerrar = () => {
    setOpen(false); setRows([]); setError(""); setDone(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-sm transition-colors"
        style={{ background: "#0F8B6C" }}
      >
        <Upload className="w-3.5 h-3.5" />
        Importar Google Ads (CSV)
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={cerrar}>
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-white">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" style={{ color: "#0F8B6C" }} />
                <h3 className="font-poppins font-bold">Importar rendimiento de Google Ads</h3>
              </div>
              <button onClick={cerrar} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Resultado */}
              {done ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: "#0F8B6C" }} />
                  <p className="font-poppins font-bold text-lg">Importación completa</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {done.creadas} campañas nuevas · {done.actualizadas} actualizadas
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Ya aparecen en la pestaña Marketing de Analítica.</p>
                  <button onClick={cerrar} className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: "#0F8B6C" }}>
                    Listo
                  </button>
                </div>
              ) : (
                <>
                  {/* Instrucciones + plantilla */}
                  <div className="rounded-xl bg-muted/40 border border-border p-4 text-sm">
                    <p className="font-medium mb-1">Cómo exportar desde Google Ads</p>
                    <ol className="text-xs text-muted-foreground space-y-0.5 list-decimal ml-4">
                      <li>En Google Ads → Campañas → ícono de descarga → CSV.</li>
                      <li>O usa la plantilla con las columnas exactas que esperamos.</li>
                      <li>Sube el archivo aquí. Detectamos las columnas automáticamente.</li>
                    </ol>
                    <button onClick={descargarPlantilla} className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "#0F8B6C" }}>
                      <Download className="w-3.5 h-3.5" /> Descargar plantilla CSV
                    </button>
                  </div>

                  {/* Dropzone */}
                  <label
                    className="block border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0])}
                    />
                    {parsing ? (
                      <Loader2 className="w-6 h-6 mx-auto animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Arrastra o haz clic para subir tu CSV</p>
                        <p className="text-xs text-muted-foreground mt-1">Columnas detectadas automáticamente</p>
                      </>
                    )}
                  </label>

                  {error && (
                    <div className="flex items-start gap-2 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Preview */}
                  {rows.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        {rows.length} campañas detectadas · revisa antes de importar
                      </p>
                      <div className="border border-border rounded-xl overflow-hidden">
                        <div className="max-h-56 overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-muted/50 sticky top-0">
                              <tr className="text-left">
                                <th className="px-3 py-2 font-medium">Campaña</th>
                                <th className="px-2 py-2 font-medium">Estado</th>
                                <th className="px-2 py-2 font-medium text-right">Gasto</th>
                                <th className="px-2 py-2 font-medium text-right">Conv.</th>
                                <th className="px-2 py-2 font-medium text-right">CTR</th>
                                <th className="px-2 py-2 font-medium text-right">ROAS</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {rows.map((r, i) => (
                                <tr key={i}>
                                  <td className="px-3 py-1.5 truncate max-w-[180px]">{r.nombre}</td>
                                  <td className="px-2 py-1.5 text-muted-foreground">{r.estado}</td>
                                  <td className="px-2 py-1.5 text-right">${r.gasto_real_clp.toLocaleString("es-CL")}</td>
                                  <td className="px-2 py-1.5 text-right">{r.conversiones}</td>
                                  <td className="px-2 py-1.5 text-right">{r.ctr_pct}%</td>
                                  <td className="px-2 py-1.5 text-right">{r.roas || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <button
                        onClick={importar}
                        disabled={importing}
                        className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                        style={{ background: "#0F8B6C" }}
                      >
                        {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                        Importar {rows.length} campañas a Analítica
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}