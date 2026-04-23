// ============================================================================
// DriveTester — Playground para Drive + Docs
// ============================================================================
// Dos sub-acciones:
//   1. Inicializar carpetas estándar (propuestas_b2b, contratos, informes)
//   2. Crear un Google Doc dinámico de prueba
// ----------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  FolderPlus, FileText, Loader2, CheckCircle2, XCircle,
  ExternalLink, FolderOpen
} from 'lucide-react';

const FOLDER_KEYS = [
  { key: 'propuestas_b2b', label: 'Propuestas B2B' },
  { key: 'contratos', label: 'Contratos' },
  { key: 'informes', label: 'Informes' },
  { key: 'mockups', label: 'Mockups' },
];

export default function DriveTester() {
  const [folders, setFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  // Cargar estado actual de carpetas
  const loadFolders = async () => {
    setLoadingFolders(true);
    try {
      const data = await base44.entities.DriveFolder.list();
      setFolders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFolders(false);
    }
  };

  useEffect(() => { loadFolders(); }, []);

  const ensureFolder = async (key) => {
    setLoadingFolders(true);
    try {
      await base44.functions.invoke('driveEnsureFolder', { key });
      await loadFolders();
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setLoadingFolders(false);
    }
  };

  // --- Crear Doc de prueba ---
  const [docTitle, setDocTitle] = useState('Informe PEYU — Abril 2026');
  const [docFolder, setDocFolder] = useState('informes');
  const [docContent, setDocContent] = useState(
    'Resumen ejecutivo del trimestre.\n\nVentas B2B crecieron 34% vs Q1 2026.\nNuevos clientes: 12 empresas.\n\nConclusión: plan de expansión aprobado.'
  );
  const [docPublic, setDocPublic] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [docResult, setDocResult] = useState(null);

  const handleCreateDoc = async () => {
    setDocLoading(true);
    setDocResult(null);
    try {
      // Convertir el textarea en bloques: líneas vacías = separador de párrafos
      const blocks = [
        { type: 'heading', text: docTitle },
        ...docContent
          .split('\n')
          .filter((l) => l.trim())
          .map((line) => ({ type: 'paragraph', text: line })),
      ];
      const res = await base44.functions.invoke('docsCreateFromTemplate', {
        title: docTitle,
        folder_key: docFolder,
        content_blocks: blocks,
        make_public: docPublic,
      });
      setDocResult({ ok: true, data: res?.data });
    } catch (e) {
      setDocResult({ ok: false, error: e.message });
    } finally {
      setDocLoading(false);
    }
  };

  const folderByKey = (key) => folders.find((f) => f.key === key);

  return (
    <div className="space-y-6">
      {/* Sección 1: Carpetas */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
          <FolderPlus className="w-4 h-4 text-teal-600" />
          Carpetas en Drive
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Inicializa las carpetas estándar. Una vez creadas quedan persistidas y reutilizables.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FOLDER_KEYS.map(({ key, label }) => {
            const f = folderByKey(key);
            return (
              <div key={key} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                <FolderOpen className={`w-4 h-4 ${f ? 'text-emerald-600' : 'text-slate-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{label}</p>
                  {f ? (
                    <a href={f.web_view_link} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline inline-flex items-center gap-0.5">
                      Abrir <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ) : (
                    <span className="text-[10px] text-slate-400">No creada</span>
                  )}
                </div>
                {!f && (
                  <Button size="sm" variant="outline" onClick={() => ensureFolder(key)} disabled={loadingFolders} className="text-xs h-7">
                    Crear
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sección 2: Crear Google Doc */}
      <div className="pt-4 border-t border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          Crear Google Doc dinámico
        </h3>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Título</Label>
            <Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Carpeta destino</Label>
            <select
              value={docFolder}
              onChange={(e) => setDocFolder(e.target.value)}
              className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            >
              {FOLDER_KEYS.map(({ key, label }) => (
                <option key={key} value={key} disabled={!folderByKey(key)}>
                  {label} {!folderByKey(key) && '(no creada)'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Contenido (cada línea = un párrafo)</Label>
            <Textarea value={docContent} onChange={(e) => setDocContent(e.target.value)} rows={5} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={docPublic} onChange={(e) => setDocPublic(e.target.checked)} className="rounded border-slate-300" />
            Hacer público (anyone con el link)
          </label>

          <Button onClick={handleCreateDoc} disabled={docLoading || !docTitle || !folderByKey(docFolder)} className="gap-2 w-full">
            {docLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Crear Google Doc
          </Button>

          {docResult && (
            <div className={`p-3 rounded-lg border text-xs ${
              docResult.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {docResult.ok ? (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Documento creado ✓</p>
                    <a
                      href={docResult.data?.web_view_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 hover:underline mt-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Abrir en Google Docs
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{docResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}