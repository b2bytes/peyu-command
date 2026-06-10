import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Save, MapPin, Check } from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// EtiquetaFixForms — Formularios inline del asistente de etiqueta Bluex.
// Permiten CORREGIR los datos faltantes (dirección, comuna) dentro del
// mismo modal, sin salir a otro módulo, hasta poder emitir la etiqueta.
// La comuna se autocompleta contra el tarifario oficial Bluex (346 comunas)
// para garantizar cobertura y evitar errores de tipeo.
// ════════════════════════════════════════════════════════════════════════

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

// Cache módulo: las comunas del tarifario se cargan UNA vez por sesión.
let comunasCache = null;
async function loadComunas() {
  if (comunasCache) return comunasCache;
  const rows = await base44.entities.TarifaBluex.list('comuna', 1000).catch(() => []);
  comunasCache = [...new Set((rows || []).map((r) => r.comuna).filter(Boolean))].sort();
  return comunasCache;
}

// Input de comuna con sugerencias del tarifario oficial.
function ComunaInput({ value, onChange }) {
  const [sugerencias, setSugerencias] = useState([]);
  const [focus, setFocus] = useState(false);

  const buscar = async (q) => {
    onChange(q);
    if (q.length < 2) { setSugerencias([]); return; }
    const comunas = await loadComunas();
    const nq = norm(q);
    setSugerencias(comunas.filter((c) => norm(c).includes(nq)).slice(0, 5));
  };

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => buscar(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setTimeout(() => setFocus(false), 150)}
        placeholder="Comuna (ej: Providencia)"
        className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-emerald-500"
      />
      {focus && sugerencias.length > 0 && (
        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {sugerencias.map((c) => (
            <button
              key={c}
              type="button"
              onMouseDown={() => { onChange(c); setSugerencias([]); }}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 flex items-center gap-1.5"
            >
              <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" /> {c}
              <span className="ml-auto text-[9px] text-emerald-600 font-bold">✓ cobertura Bluex</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Corrige dirección + comuna (+ teléfono opcional) y guarda en el pedido.
export function FixDireccionForm({ pedido, onSaved }) {
  const [direccion, setDireccion] = useState(pedido.direccion_envio || '');
  const [comuna, setComuna] = useState(pedido.ciudad || '');
  const [telefono, setTelefono] = useState(pedido.cliente_telefono || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const guardar = async () => {
    if (!direccion.trim() || !comuna.trim()) { setErr('Completa dirección y comuna para continuar.'); return; }
    setSaving(true); setErr('');
    try {
      const data = { direccion_envio: direccion.trim(), ciudad: comuna.trim() };
      if (telefono.trim()) data.cliente_telefono = telefono.trim();
      await base44.entities.PedidoWeb.update(pedido.id, data);
      onSaved({ ...pedido, ...data });
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        value={direccion}
        onChange={(e) => setDireccion(e.target.value)}
        placeholder="Dirección (calle y número, depto/oficina)"
        className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-emerald-500"
      />
      <ComunaInput value={comuna} onChange={setComuna} />
      <input
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
        placeholder="Teléfono del cliente (opcional)"
        className="w-full h-9 px-3 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:border-emerald-500"
      />
      {err && <p className="text-[10px] font-bold text-red-600">{err}</p>}
      <button
        onClick={guardar}
        disabled={saving}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
        Guardar y continuar
      </button>
    </div>
  );
}

// Corrige SOLO la comuna (cuando no tiene cobertura/tarifa) y guarda.
export function FixComunaPicker({ pedido, onSaved }) {
  const [comuna, setComuna] = useState('');
  const [saving, setSaving] = useState(false);

  const guardar = async () => {
    if (!comuna.trim()) return;
    setSaving(true);
    try {
      await base44.entities.PedidoWeb.update(pedido.id, { ciudad: comuna.trim() });
      onSaved({ ...pedido, ciudad: comuna.trim() });
    } catch (_) {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-bold text-slate-600">Corrige la comuna aquí mismo (sugerencias con cobertura verificada):</p>
      <div className="flex gap-2">
        <div className="flex-1"><ComunaInput value={comuna} onChange={setComuna} /></div>
        <button
          onClick={guardar}
          disabled={saving || !comuna.trim()}
          className="flex-shrink-0 inline-flex items-center gap-1 px-3 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          Usar
        </button>
      </div>
    </div>
  );
}