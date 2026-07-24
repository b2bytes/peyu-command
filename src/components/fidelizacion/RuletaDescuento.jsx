import { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { X, Gift, Loader2, Copy, Check, Mail } from 'lucide-react';
import RuletaWheel from '@/components/fidelizacion/RuletaWheel';

// ════════════════════════════════════════════════════════════════════════
// RuletaDescuento — Widget flotante "Gira y gana" (home Shop v2).
// Flujo: botón flotante → modal con email+nombre → gira (premio decidido en
// el backend) → muestra el código con copiar + aviso de email. 1 giro por
// email (lo controla el backend) y el botón se oculta tras jugar (localStorage).
// No toca el flujo de compra: el cupón se aplica en el carrito como siempre.
// ════════════════════════════════════════════════════════════════════════
const LS_KEY = 'peyu_ruleta_jugada';

export default function RuletaDescuento() {
  const [open, setOpen] = useState(false);
  const [jugada, setJugada] = useState(() => {
    try { return !!localStorage.getItem(LS_KEY); } catch { return false; }
  });
  const [form, setForm] = useState({ email: '', nombre: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [resultado, setResultado] = useState(null); // respuesta backend
  const [revelado, setRevelado] = useState(false);  // rueda ya se detuvo
  const [copiado, setCopiado] = useState(false);

  const girar = async () => {
    const email = form.email.trim().toLowerCase();
    if (!/\S+@\S+\.\S{2,}/.test(email)) { setError('Escribe un email válido'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await base44.functions.invoke('ruletaGirar', {
        email, nombre: form.nombre.trim(), page_path: window.location.pathname,
      });
      const data = res?.data;
      if (!data?.ok) throw new Error(data?.error || 'No pudimos girar la ruleta');
      setResultado(data);
      if (data.ya_jugado) {
        // Ya tenía premio: lo mostramos directo, sin animación
        setRevelado(true);
      } else {
        setSpinning(true);
      }
      try { localStorage.setItem(LS_KEY, '1'); } catch {}
      setJugada(true);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Intenta de nuevo');
    } finally {
      setLoading(false);
    }
  };

  const onSpinEnd = useCallback(() => setRevelado(true), []);

  const copiar = () => {
    navigator.clipboard?.writeText(resultado.codigo).catch(() => {});
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  if (jugada && !open) return null;

  return (
    <>
      {/* Botón flotante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed left-4 bottom-20 lg:bottom-6 z-[80] flex items-center gap-2 px-4 py-3 rounded-full text-white font-bold text-sm shadow-xl transition-all hover:-translate-y-0.5 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)' }}
          aria-label="Gira y gana un descuento"
        >
          <Gift className="w-4 h-4" /> Gira y gana 🎡
        </button>
      )}

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" style={{ background: 'rgba(44,24,16,.55)' }}>
          <div className="w-full max-w-sm rounded-3xl p-5 relative" style={{ background: '#F8F3ED', border: '1.5px solid #D4C4B0' }}>
            <button onClick={() => setOpen(false)} className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center bg-white" style={{ border: '1px solid #D4C4B0' }}>
              <X className="w-4 h-4" style={{ color: '#7A6050' }} />
            </button>

            <h3 className="font-fraunces text-xl text-center mb-1" style={{ color: '#2C1810' }}>
              {revelado ? '🎉 ¡Ganaste!' : 'Gira y gana un descuento'}
            </h3>
            {!revelado && (
              <p className="text-xs text-center mb-3" style={{ color: '#7A6050' }}>
                Deja tu email y gira la ruleta — todos los premios son reales 🐢
              </p>
            )}

            <RuletaWheel spinning={spinning} targetIndex={resultado?.segment_index ?? null} onSpinEnd={onSpinEnd} />

            {/* Paso 1: formulario */}
            {!resultado && (
              <div className="mt-4 space-y-2">
                <input
                  type="text" placeholder="Tu nombre (opcional)" value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl text-sm bg-white outline-none"
                  style={{ border: '1.5px solid #D4C4B0', color: '#2C1810' }}
                />
                <input
                  type="email" placeholder="tu@email.cl" value={form.email}
                  onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && girar()}
                  className="w-full h-11 px-4 rounded-xl text-sm bg-white outline-none"
                  style={{ border: '1.5px solid #D4C4B0', color: '#2C1810' }}
                />
                {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
                <button
                  onClick={girar} disabled={loading}
                  className="w-full h-12 rounded-2xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98] transition-all"
                  style={{ background: 'linear-gradient(135deg,#C0785C,#A86440)' }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '🎡 Girar la ruleta'}
                </button>
                <p className="text-[10px] text-center" style={{ color: '#A08070' }}>
                  1 giro por persona · cupón de un solo uso · válido 7 días
                </p>
              </div>
            )}

            {/* Paso 2: girando */}
            {resultado && !revelado && (
              <p className="mt-4 text-center text-sm font-bold animate-pulse" style={{ color: '#C0785C' }}>
                Girando… 🤞
              </p>
            )}

            {/* Paso 3: premio */}
            {resultado && revelado && (
              <div className="mt-4 space-y-2.5">
                <p className="text-center text-sm font-bold" style={{ color: '#2C1810' }}>
                  {resultado.ya_jugado ? 'Ya habías girado — este es tu cupón:' : resultado.premio.label}
                </p>
                <button
                  onClick={copiar}
                  className="w-full rounded-2xl p-3.5 flex items-center justify-center gap-2 bg-white active:scale-[0.98] transition-all"
                  style={{ border: '2px dashed #C0785C' }}
                >
                  <span className="font-mono font-bold text-lg tracking-widest" style={{ color: '#C0785C' }}>{resultado.codigo}</span>
                  {copiado ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" style={{ color: '#A08070' }} />}
                </button>
                <p className="text-[11px] text-center flex items-center justify-center gap-1" style={{ color: '#7A6050' }}>
                  <Mail className="w-3 h-3" /> Te lo enviamos por email · válido hasta {resultado.expira} · aplícalo en el carrito
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="w-full h-11 rounded-2xl text-white font-bold text-sm active:scale-[0.98] transition-all"
                  style={{ background: 'linear-gradient(135deg,#0F8B6C,#0B6E55)' }}
                >
                  Ir a comprar con mi cupón 🛍️
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}