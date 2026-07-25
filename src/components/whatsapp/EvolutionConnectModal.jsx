import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import {
  X, QrCode, Loader2, CheckCircle2, AlertTriangle, RefreshCw, LogOut, Link2, Server,
} from 'lucide-react';

// ════════════════════════════════════════════════════════════════════════
// EvolutionConnectModal — Vincula el número real de la tienda (+56 9 3504 0242)
// al agente Peyu escaneando un QR, sin salir del panel. Habla con el
// middleware (whatsappEvolutionSetup) que corre sobre Evolution API.
// ════════════════════════════════════════════════════════════════════════
export default function EvolutionConnectModal({ onClose }) {
  const [estado, setEstado] = useState(null);
  const [qr, setQr] = useState('');
  const [cargando, setCargando] = useState(true);
  const [accion, setAccion] = useState('');
  const [error, setError] = useState('');

  const cargarEstado = useCallback(async () => {
    setError('');
    try {
      const r = await base44.functions.invoke('whatsappEvolutionSetup', { action: 'status' });
      setEstado(r?.data || null);
      if (r?.data?.conectado) setQr('');
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'No pudimos consultar el servidor.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarEstado(); }, [cargarEstado]);

  // Mientras hay un QR en pantalla, revisamos si ya se vinculó
  useEffect(() => {
    if (!qr) return;
    const t = setInterval(cargarEstado, 4000);
    return () => clearInterval(t);
  }, [qr, cargarEstado]);

  const ejecutar = async (action) => {
    setAccion(action);
    setError('');
    try {
      const r = await base44.functions.invoke('whatsappEvolutionSetup', { action });
      const d = r?.data || {};
      if (d.qr_base64) setQr(d.qr_base64.startsWith('data:') ? d.qr_base64 : `data:image/png;base64,${d.qr_base64}`);
      if (!d.ok && d.error) setError(d.error);
      await cargarEstado();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'La acción falló.');
    } finally {
      setAccion('');
    }
  };

  const sinConfigurar = estado && estado.configurado === false;
  const conectado = !!estado?.conectado;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: '#0B1224', border: '1px solid rgba(255,255,255,.10)', boxShadow: '0 30px 80px -20px rgba(0,0,0,.8)' }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,.08)', background: 'linear-gradient(135deg, rgba(37,211,102,.14), rgba(18,140,126,.08))' }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-white leading-tight">Conectar el número de la tienda</h2>
            <p className="text-[11px] text-white/50">Vincula WhatsApp al agente Peyu por QR</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {cargando ? (
            <div className="flex items-center justify-center gap-2 py-10 text-white/50 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Consultando el servidor…
            </div>
          ) : sinConfigurar ? (
            <div className="rounded-2xl p-4 flex gap-3" style={{ background: 'rgba(245,158,11,.10)', border: '1px solid rgba(245,158,11,.28)' }}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#FBBF24' }} />
              <div className="min-w-0">
                <p className="text-sm font-bold" style={{ color: '#FBBF24' }}>Falta configurar el servidor</p>
                <p className="text-xs text-white/60 mt-1 leading-relaxed">{estado.mensaje}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Estado de la conexión */}
              <div className="rounded-2xl p-4 space-y-2.5" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
                <Fila
                  icon={conectado ? CheckCircle2 : AlertTriangle}
                  color={conectado ? '#25D366' : '#FBBF24'}
                  label="Sesión de WhatsApp"
                  valor={conectado ? 'Vinculada y en línea' : estado?.existe ? 'Instancia creada, sin vincular' : 'Instancia no creada'}
                />
                <Fila
                  icon={Link2}
                  color={estado?.webhook_registrado ? '#25D366' : '#94A3B8'}
                  label="Webhook"
                  valor={estado?.webhook_registrado ? 'Registrado' : 'Sin registrar'}
                />
                <Fila icon={Server} color="#94A3B8" label="Servidor" valor={`${estado?.servidor || '—'} · ${estado?.instancia || ''}`} />
              </div>

              {/* QR */}
              {qr && !conectado && (
                <div className="rounded-2xl p-4 text-center" style={{ background: '#fff' }}>
                  <img src={qr} alt="Código QR de WhatsApp" className="w-full max-w-[240px] mx-auto" />
                  <p className="text-[11px] text-slate-600 mt-3 leading-relaxed">
                    En WhatsApp: <strong>Ajustes → Dispositivos vinculados → Vincular dispositivo</strong> y escanea este código. El QR expira en ~40 s; si vence, genera otro.
                  </p>
                </div>
              )}

              {conectado && (
                <div className="rounded-2xl p-4 flex gap-3" style={{ background: 'rgba(37,211,102,.10)', border: '1px solid rgba(37,211,102,.28)' }}>
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#25D366' }} />
                  <p className="text-xs text-white/75 leading-relaxed">
                    El número está vinculado. Cada mensaje que llegue aparecerá en la bandeja y Peyu responderá automáticamente, salvo que tomes el control.
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(239,68,68,.10)', border: '1px solid rgba(239,68,68,.28)', color: '#FCA5A5' }}>
                  {error}
                </div>
              )}

              {/* Acciones */}
              <div className="flex flex-wrap gap-2">
                {!conectado && (
                  <button
                    onClick={() => ejecutar('connect')}
                    disabled={!!accion}
                    className="flex-1 min-w-[140px] h-11 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}
                  >
                    {accion === 'connect' ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                    {qr ? 'Generar QR nuevo' : 'Generar QR'}
                  </button>
                )}
                <button
                  onClick={() => ejecutar('set_webhook')}
                  disabled={!!accion}
                  className="h-11 px-4 rounded-xl text-white/80 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:bg-white/10 disabled:opacity-50"
                  style={{ border: '1px solid rgba(255,255,255,.14)' }}
                >
                  {accion === 'set_webhook' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                  Registrar webhook
                </button>
                <button
                  onClick={() => ejecutar('restart')}
                  disabled={!!accion}
                  className="h-11 px-4 rounded-xl text-white/80 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:bg-white/10 disabled:opacity-50"
                  style={{ border: '1px solid rgba(255,255,255,.14)' }}
                >
                  {accion === 'restart' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Reiniciar sesión
                </button>
                {conectado && (
                  <button
                    onClick={() => ejecutar('logout')}
                    disabled={!!accion}
                    className="h-11 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                    style={{ border: '1px solid rgba(239,68,68,.3)', color: '#FCA5A5' }}
                  >
                    {accion === 'logout' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                    Desvincular
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Fila({ icon: Icon, color, label, valor }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color }} />
      <span className="text-[11px] text-white/45 w-28 flex-shrink-0">{label}</span>
      <span className="text-xs font-semibold text-white/85 truncate">{valor}</span>
    </div>
  );
}