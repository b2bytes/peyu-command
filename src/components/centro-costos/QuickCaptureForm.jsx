import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Receipt, Camera, Loader2, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIAS = [
  'Viaje / Transporte', 'Materiales menores', 'Herramientas',
  'Comida cliente / Reunión', 'Software / Suscripción', 'Bencina / Estacionamiento',
  'Envío / Courier', 'Imprenta / Impresión', 'Limpieza taller',
  'Repuestos máquina', 'Empaque / Cinta / Pegamento', 'Boleta proveedor pequeño',
  'Marketing menor (regalos, muestras)', 'Mantención', 'Otro',
];

const ASIGNACIONES = [
  'Indirecto general (todos)', 'Producto específico', 'Categoría producto',
  'B2B exclusivo', 'B2C exclusivo', 'Marketing', 'Operación general',
];

/**
 * Formulario de captura rápida de costos fantasma.
 * Soporta foto de boleta (OCR opcional con IA).
 */
export default function QuickCaptureForm({ onCreated }) {
  const [form, setForm] = useState({
    descripcion: '',
    monto_clp: '',
    categoria: 'Materiales menores',
    metodo_pago: 'Efectivo',
    proveedor: '',
    fecha: new Date().toISOString().slice(0, 10),
    asignacion_tipo: 'Indirecto general (todos)',
    notas: '',
  });
  const [boleta, setBoleta] = useState(null);
  const [boletaUrl, setBoletaUrl] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleOCR = async (file) => {
    setOcrLoading(true);
    setBoleta(file);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setBoletaUrl(file_url);

      // Extraer datos con IA
      const data = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            monto_clp: { type: 'number' },
            proveedor: { type: 'string' },
            fecha: { type: 'string' },
            descripcion: { type: 'string' },
          },
        },
      });

      if (data?.status === 'success' && data.output) {
        const out = Array.isArray(data.output) ? data.output[0] : data.output;
        setForm(f => ({
          ...f,
          monto_clp: out.monto_clp || f.monto_clp,
          proveedor: out.proveedor || f.proveedor,
          descripcion: out.descripcion || f.descripcion,
          fecha: out.fecha || f.fecha,
        }));
        toast.success('✨ Boleta leída por IA');
      }
    } catch (e) {
      toast.error('No se pudo leer la boleta automáticamente');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.monto_clp || form.monto_clp <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }
    setSaving(true);
    try {
      const mes = form.fecha.slice(0, 7);
      await base44.entities.CostoFantasma.create({
        ...form,
        monto_clp: parseInt(form.monto_clp),
        mes_imputacion: mes,
        boleta_url: boletaUrl,
        registrado_canal: boleta ? 'ocr_boleta' : 'manual_web',
      });
      toast.success('Costo registrado');
      setForm({
        descripcion: '', monto_clp: '', categoria: 'Materiales menores',
        metodo_pago: 'Efectivo', proveedor: '',
        fecha: new Date().toISOString().slice(0, 10),
        asignacion_tipo: 'Indirecto general (todos)', notas: '',
      });
      setBoleta(null);
      setBoletaUrl('');
      onCreated?.();
    } catch {
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-poppins font-bold text-foreground flex items-center gap-2">
            <Receipt className="w-4 h-4 text-teal-600" />
            Captura rápida
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Boleta, viaje o gasto pequeño · OCR con IA</p>
        </div>
        <label className={`cursor-pointer flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
          ocrLoading
            ? 'bg-teal-50 border-teal-300 text-teal-700'
            : 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200 text-teal-700 hover:from-teal-100 hover:to-cyan-100'
        }`}>
          {ocrLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
          {ocrLoading ? 'Leyendo...' : 'Foto boleta'}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            disabled={ocrLoading}
            onChange={e => e.target.files?.[0] && handleOCR(e.target.files[0])}
          />
        </label>
      </div>

      {boletaUrl && (
        <div className="flex items-center gap-2 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Boleta subida y procesada</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Monto CLP *</label>
          <Input
            type="number"
            value={form.monto_clp}
            onChange={e => setForm({ ...form, monto_clp: e.target.value })}
            placeholder="12500"
            className="h-10 mt-1"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fecha</label>
          <Input
            type="date"
            value={form.fecha}
            onChange={e => setForm({ ...form, fecha: e.target.value })}
            className="h-10 mt-1"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Descripción</label>
        <Input
          value={form.descripcion}
          onChange={e => setForm({ ...form, descripcion: e.target.value })}
          placeholder="Bencina viaje a proveedor"
          className="h-10 mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Categoría</label>
          <select
            value={form.categoria}
            onChange={e => setForm({ ...form, categoria: e.target.value })}
            className="w-full h-10 mt-1 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Asignar a</label>
          <select
            value={form.asignacion_tipo}
            onChange={e => setForm({ ...form, asignacion_tipo: e.target.value })}
            className="w-full h-10 mt-1 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            {ASIGNACIONES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Proveedor</label>
          <Input
            value={form.proveedor}
            onChange={e => setForm({ ...form, proveedor: e.target.value })}
            placeholder="Copec, Sodimac..."
            className="h-10 mt-1"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pago</label>
          <select
            value={form.metodo_pago}
            onChange={e => setForm({ ...form, metodo_pago: e.target.value })}
            className="w-full h-10 mt-1 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option>Efectivo</option>
            <option>Tarjeta crédito</option>
            <option>Tarjeta débito</option>
            <option>Transferencia</option>
            <option>App pago</option>
            <option>Crédito proveedor</option>
          </select>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={saving || !form.monto_clp}
        className="w-full h-11 bg-gradient-to-br from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold gap-2"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Registrar costo fantasma
      </Button>
    </div>
  );
}