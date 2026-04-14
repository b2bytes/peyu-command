import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, CheckCircle2, XCircle, AlertTriangle, FileText, Users, ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";

// Mapeo de industria CSV → segmento entidad Cliente
const INDUSTRIA_MAP = {
  MINERIA: "Otro",
  CONSTRUCCION: "Retail",
  TECNOLOGIA: "Tecnología",
  MANUFACTURA: "Retail",
  LOGISTICA: "Otro",
  SALUD: "Salud",
  EDUCACION: "Educación",
  RETAIL: "Retail",
  FINANZAS: "Finanzas",
  GOBIERNO: "Gobierno",
  HORECA: "Horeca",
};

const ESTADO_MAP = {
  CUSTOMER: "Activo",
  PROSPECT: "Inactivo",
  LEAD: "Inactivo",
  VIP: "VIP",
  BLOCKED: "Bloqueado",
};

const SEGMENTOS_VALIDOS = ["Tecnología", "Retail", "Educación", "Salud", "Finanzas", "Gobierno", "Horeca", "Otro"];

function mapRow(row) {
  const industria = (row["Industria"] || "").toUpperCase().trim();
  const estadoCsv = (row["Estado"] || "PROSPECT").toUpperCase().trim();

  // Determinar segmento
  let segmento = INDUSTRIA_MAP[industria] || "Otro";
  if (!SEGMENTOS_VALIDOS.includes(segmento)) segmento = "Otro";

  // Tomar primer email si hay múltiples separados por ;
  const emailRaw = (row["Email"] || "").trim();
  const email = emailRaw.split(";")[0].trim();

  return {
    empresa: (row["Empresa"] || "").trim(),
    contacto: (row["Contacto"] || "").trim(),
    email,
    telefono: (row["Teléfono"] || "").trim(),
    rut: "",
    tipo: "B2B Corporativo",
    segmento,
    estado: ESTADO_MAP[estadoCsv] || "Inactivo",
    pagos_al_dia: true,
    personalizacion_habitual: false,
    canal_preferido: "Email",
    notas: [
      row["Cargo"] ? `Cargo: ${row["Cargo"]}` : "",
      row["Ciudad"] ? `Ciudad: ${row["Ciudad"]}` : "",
      row["Región"] ? `Región: ${row["Región"]}` : "",
      row["Industria"] ? `Industria: ${row["Industria"]}` : "",
      row["Tags"] ? `Tags: ${row["Tags"]}` : "",
    ].filter(Boolean).join(" | "),
  };
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
  const rows = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Handle quoted fields with commas inside
    const fields = [];
    let current = "";
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      if (line[c] === '"') {
        inQuotes = !inQuotes;
      } else if (line[c] === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += line[c];
      }
    }
    fields.push(current.trim());

    if (fields.length >= headers.length) {
      const row = {};
      headers.forEach((h, idx) => { row[h] = fields[idx] || ""; });
      rows.push(row);
    }
  }
  return rows;
}

export default function ImportarClientes() {
  const [step, setStep] = useState("upload"); // upload | preview | importing | done
  const [rawRows, setRawRows] = useState([]);
  const [mappedRows, setMappedRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState({ ok: 0, failed: 0, errors: [] });
  const [tipoDefault, setTipoDefault] = useState("B2B Corporativo");
  const [soloActivos, setSoloActivos] = useState(false);
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsed = parseCSV(text);
      setRawRows(parsed);
      const mapped = parsed
        .filter(r => r["Empresa"]?.trim())
        .map(r => mapRow(r));
      setMappedRows(mapped);
      setStep("preview");
    };
    reader.readAsText(file, "utf-8");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) handleFile(file);
  };

  const getFilteredRows = () => {
    let rows = mappedRows.map(r => ({ ...r, tipo: tipoDefault }));
    if (soloActivos) rows = rows.filter(r => r.estado === "Activo" || r.estado === "VIP");
    return rows;
  };

  const handleImport = async () => {
    const rows = getFilteredRows();
    setImporting(true);
    setStep("importing");
    let ok = 0, failed = 0;
    const errors = [];

    // Import in batches of 50
    const BATCH = 50;
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const batchResults = await Promise.allSettled(
        batch.map(row => base44.entities.Cliente.create(row))
      );
      batchResults.forEach((res, idx) => {
        if (res.status === "fulfilled") ok++;
        else { failed++; errors.push(`${batch[idx].empresa}: ${res.reason?.message || "Error"}`); }
      });
    }

    setResults({ ok, failed, errors });
    setImporting(false);
    setStep("done");
  };

  const reset = () => {
    setStep("upload");
    setRawRows([]);
    setMappedRows([]);
    setFileName("");
    setResults({ ok: 0, failed: 0, errors: [] });
  };

  const filteredRows = step === "preview" ? getFilteredRows() : [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin/clientes">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-poppins font-bold text-foreground">Importar Clientes B2B</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Carga masiva desde CSV · perfil completo automático</p>
        </div>
      </div>

      {/* Step: Upload */}
      {step === "upload" && (
        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed border-border rounded-2xl p-16 text-center cursor-pointer hover:border-primary hover:bg-accent/30 transition-all"
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="font-poppins font-semibold text-lg text-foreground mb-1">Arrastra tu CSV aquí</p>
          <p className="text-muted-foreground text-sm mb-4">o haz clic para seleccionar archivo</p>
          <Button variant="outline" className="gap-2" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
            <FileText className="w-4 h-4" /> Seleccionar CSV
          </Button>
          <div className="mt-8 bg-muted/50 rounded-xl p-4 text-left max-w-md mx-auto">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Columnas esperadas en el CSV:</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              {["Empresa", "Email", "Contacto", "Cargo", "Teléfono", "Industria", "Segmento", "Estado", "Ciudad", "Región", "Tags"].map(c => (
                <span key={c} className="font-mono bg-background px-1.5 py-0.5 rounded border border-border">{c}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === "preview" && (
        <div className="space-y-4">
          {/* File info */}
          <div className="flex items-center gap-3 bg-accent/40 border border-border rounded-xl px-4 py-3">
            <FileText className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">{fileName}</p>
              <p className="text-xs text-muted-foreground">{rawRows.length} filas detectadas · {mappedRows.length} con empresa válida</p>
            </div>
            <Button variant="ghost" size="sm" onClick={reset} className="gap-1 text-muted-foreground">
              <RefreshCw className="w-3.5 h-3.5" /> Cambiar
            </Button>
          </div>

          {/* Options */}
          <div className="bg-white border border-border rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Opciones de importación</p>
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Tipo de cliente</label>
                <Select value={tipoDefault} onValueChange={setTipoDefault}>
                  <SelectTrigger className="w-48 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="B2B Corporativo">B2B Corporativo</SelectItem>
                    <SelectItem value="B2B Pyme">B2B Pyme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer mt-4">
                <input type="checkbox" checked={soloActivos} onChange={e => setSoloActivos(e.target.checked)} className="w-4 h-4 accent-primary" />
                Solo importar clientes con estado <strong>CUSTOMER</strong>
              </label>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span><strong className="text-foreground">{filteredRows.length}</strong> clientes serán importados</span>
            </div>
          </div>

          {/* Preview table */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Vista previa (primeros 20)</p>
              <span className="text-xs text-muted-foreground">{filteredRows.length} registros</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/40 text-muted-foreground">
                    {["Empresa", "Contacto", "Email", "Teléfono", "Tipo", "Segmento", "Estado", "Notas"].map(h => (
                      <th key={h} className="text-left px-3 py-2 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRows.slice(0, 20).map((r, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="px-3 py-2 font-medium text-foreground max-w-[160px] truncate">{r.empresa}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.contacto || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground max-w-[150px] truncate">{r.email || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{r.telefono || "—"}</td>
                      <td className="px-3 py-2"><span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-medium">{r.tipo}</span></td>
                      <td className="px-3 py-2 text-muted-foreground">{r.segmento}</td>
                      <td className="px-3 py-2">
                        <span className={`px-1.5 py-0.5 rounded-full font-medium ${r.estado === "Activo" || r.estado === "VIP" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {r.estado}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate">{r.notas || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRows.length > 20 && (
                <p className="text-xs text-muted-foreground text-center py-2">… y {filteredRows.length - 20} más</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleImport} disabled={filteredRows.length === 0} style={{ background: '#0F8B6C' }} className="text-white gap-2 flex-1">
              <Upload className="w-4 h-4" /> Importar {filteredRows.length} clientes
            </Button>
            <Button variant="outline" onClick={reset}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Step: Importing */}
      {step === "importing" && (
        <div className="text-center py-20 space-y-4">
          <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-poppins font-semibold text-lg text-foreground">Importando clientes...</p>
          <p className="text-sm text-muted-foreground">No cierres esta ventana</p>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && (
        <div className="space-y-5">
          <div className="bg-white border border-border rounded-2xl p-8 text-center space-y-4">
            {results.failed === 0 ? (
              <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
            ) : (
              <AlertTriangle className="w-14 h-14 text-amber-500 mx-auto" />
            )}
            <h2 className="text-2xl font-poppins font-bold text-foreground">Importación completa</h2>
            <div className="flex justify-center gap-6 mt-2">
              <div className="text-center">
                <p className="text-3xl font-poppins font-black text-green-600">{results.ok}</p>
                <p className="text-sm text-muted-foreground">Importados OK</p>
              </div>
              {results.failed > 0 && (
                <div className="text-center">
                  <p className="text-3xl font-poppins font-black text-red-500">{results.failed}</p>
                  <p className="text-sm text-muted-foreground">Con errores</p>
                </div>
              )}
            </div>
          </div>

          {results.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
              <p className="text-sm font-semibold text-red-700 flex items-center gap-2"><XCircle className="w-4 h-4" />Errores ({results.errors.length})</p>
              <div className="max-h-40 overflow-y-auto space-y-0.5">
                {results.errors.map((e, i) => <p key={i} className="text-xs text-red-600 font-mono">{e}</p>)}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Link to="/admin/clientes" className="flex-1">
              <Button className="w-full gap-2" style={{ background: '#0F8B6C' }} >
                <Users className="w-4 h-4" /> Ver clientes importados
              </Button>
            </Link>
            <Button variant="outline" onClick={reset} className="gap-2">
              <Upload className="w-4 h-4" /> Importar otro CSV
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}