import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, ExternalLink, Trash2, AlertCircle } from 'lucide-react';

const TIPOS = [
  'Contrato marco','NDA / Confidencialidad','Certificación ISO','Certificado reciclado',
  'Certificado B Corp','Ficha técnica producto','Orden de compra','Factura',
  'Cotización','Evaluación calidad','Informe auditoría','Seguro','Otro'
];

/**
 * Gestor de documentos del proveedor.
 * Usa base44.integrations.Core.UploadFile para subir archivos.
 */
export default function ProveedorDocuments({ proveedor, documentos, onReload }) {
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ tipo: 'Contrato marco', nombre: '', vigente: true });

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.ProveedorDocumento.create({
        ...form,
        nombre: form.nombre || file.name,
        file_url,
        proveedor_id: proveedor.id,
        proveedor_nombre: proveedor.nombre,
      });
      setForm({ tipo: 'Contrato marco', nombre: '', vigente: true });
      onReload?.();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este documento?')) return;
    await base44.entities.ProveedorDocumento.delete(id);
    onReload?.();
  };

  const hoy = new Date().toISOString().slice(0,10);

  return (
    <div>
      <h3 className="font-poppins font-semibold text-sm mb-3">Documentos y certificados</h3>

      {/* Uploader */}
      <div className="bg-white rounded-2xl p-3.5 border border-dashed border-border mb-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-2.5">
          <Select value={form.tipo} onValueChange={v => setForm({...form, tipo: v})}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>{TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Nombre del documento (opcional)" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="h-9" />
        </div>
        <label className="flex items-center justify-center gap-2 h-10 border border-input rounded-lg cursor-pointer hover:bg-muted transition-colors">
          <Upload className="w-4 h-4" />
          <span className="text-sm font-medium">{uploading ? 'Subiendo...' : 'Seleccionar archivo'}</span>
          <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      {/* Lista */}
      {documentos.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-border border-dashed">
          <FileText className="w-10 h-10 mx-auto mb-2 text-muted-foreground opacity-50" />
          <p className="text-sm font-medium">Sin documentos registrados</p>
          <p className="text-xs text-muted-foreground">Sube contratos, certificados, facturas…</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {documentos.map(d => {
            const vencido = d.fecha_vencimiento && d.fecha_vencimiento < hoy;
            return (
              <div key={d.id} className={`bg-white rounded-xl p-2.5 border flex items-center gap-2.5 ${vencido ? 'border-red-200' : 'border-border'}`}>
                <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">{d.nombre}</p>
                    {vencido && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold flex items-center gap-0.5">
                        <AlertCircle className="w-2.5 h-2.5" />Vencido
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {d.tipo}{d.fecha_vencimiento ? ` · vence ${d.fecha_vencimiento}` : ''}
                  </p>
                </div>
                <a href={d.file_url} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-muted rounded-lg"><ExternalLink className="w-3.5 h-3.5" /></a>
                <button onClick={() => handleDelete(d.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}