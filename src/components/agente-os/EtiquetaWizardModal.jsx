import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getPagoStatus } from '@/lib/pago-status';
import {
  X, CheckCircle2, AlertTriangle, Loader2, Tag, Printer, BadgeCheck, Truck, ExternalLink,
} from 'lucide-react';
import { FixDireccionForm, FixComunaPicker } from '@/components/agente-os/EtiquetaFixForms';

// ════════════════════════════════════════════════════════════════════════
// EtiquetaWizardModal — Asistente INTELIGENTE de etiqueta BlueExpress.
// Antes de emitir la OT, revisa cada requisito con burbujas paso a paso:
//   1. Pago confirmado (puede marcarse pagado ahí mismo)
//   2. Dirección y comuna de destino
//   3. Cobertura Bluex de la comuna (tarifario oficial — advertencia)
//   4. Sin OT previa (anti-duplicados)
// Cada paso que falla EXPLICA qué falta y CÓMO resolverlo (botón o link al
// módulo). Al pasar todo, genera la etiqueta y muestra OT + PDF. Educativo:
// el equipo aprende el proceso completo mientras lo ejecuta.
// ════════════════════════════════════════════════════════════════════════

const normalize = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ⚠️ Colores con valores arbitrarios (no slate/gray/emerald-50 de Tailwind):
// la capa admin-unify remapea esas clases a tokens día/noche y dejaba texto
// blanco sobre burbujas claras en modo noche. Este modal es SIEMPRE claro.
const STATUS_UI = {
  running: { Icon: Loader2, cls: 'text-[#94a3b8] animate-spin', bg: 'bg-[#ffffff] border-[#e2e8f0]' },
  ok: { Icon: CheckCircle2, cls: 'text-[#059669]', bg: 'bg-[#ecfdf5] border-[#a7f3d0]' },
  warn: { Icon: AlertTriangle, cls: 'text-[#d97706]', bg: 'bg-[#fffbeb] border-[#fde68a]' },
  fail: { Icon: AlertTriangle, cls: 'text-[#dc2626]', bg: 'bg-[#fef2f2] border-[#fecaca]' },
};

function Bubble({ check }) {
  const ui = STATUS_UI[check.status] || STATUS_UI.running;
  return (
    <div className={`rounded-2xl rounded-tl-sm border px-3.5 py-2.5 ${ui.bg}`}>
      <div className="flex items-start gap-2">
        <ui.Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${ui.cls}`} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-[#1e293b]">{check.title}</p>
          {check.detail && <p className="text-[11px] text-[#475569] mt-0.5 leading-relaxed">{check.detail}</p>}
          {check.fix && <div className="mt-2">{check.fix}</div>}
        </div>
      </div>
    </div>
  );
}

export default function EtiquetaWizardModal({ pedido: pedidoInicial, onClose, onDone, openLabelUrl }) {
  const [pedido, setPedido] = useState(pedidoInicial);
  const [checks, setChecks] = useState([]);
  const [listo, setListo] = useState(false);       // todos los pasos OK → puede generar
  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState(null); // { ok, message, tracking, label_url } | { ok:false, error }
  const [marcandoPago, setMarcandoPago] = useState(false);
  const runRef = useRef(0);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [checks, resultado, generando]);

  // ── Corre el checklist con burbujas progresivas ──────────────────────
  const runChecks = async (p) => {
    const run = ++runRef.current;
    const out = [];
    const push = (c) => { out.push(c); if (run === runRef.current) setChecks([...out]); };
    const upd = (patch) => { Object.assign(out[out.length - 1], patch); if (run === runRef.current) setChecks([...out]); };
    setListo(false);
    setChecks([]);

    // 0. Retiro en tienda → no necesita etiqueta
    if (p.courier === 'Retiro en Tienda') {
      push({ status: 'warn', title: 'Este pedido es Retiro en Tienda', detail: 'No necesita etiqueta BlueExpress: el cliente lo retira presencialmente. Solo cambia el estado a "Listo para Despacho" cuando esté preparado.' });
      return;
    }

    // 1. Pago confirmado
    push({ status: 'running', title: 'Paso 1 · Verificando el pago…' });
    await sleep(350);
    const pago = getPagoStatus(p);
    if (pago.pagado) {
      upd({ status: 'ok', title: 'Paso 1 · Pago confirmado ✓', detail: pago.label });
    } else {
      upd({
        status: 'fail',
        title: 'Paso 1 · El pago NO está confirmado',
        detail: `Estado actual: ${pago.label}. Nunca se despacha sin pago confirmado. Si ya verificaste el abono (ej. transferencia en el banco), confírmalo aquí mismo:`,
        fix: (
          <button
            onClick={handleMarcarPagado}
            disabled={marcandoPago}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold disabled:opacity-50"
          >
            {marcandoPago ? <Loader2 className="w-3 h-3 animate-spin" /> : <BadgeCheck className="w-3 h-3" />}
            Marcar pagado y continuar
          </button>
        ),
      });
      return;
    }

    // 2. Dirección y comuna
    push({ status: 'running', title: 'Paso 2 · Revisando dirección de destino…' });
    await sleep(350);
    if (p.direccion_envio && p.ciudad) {
      upd({ status: 'ok', title: 'Paso 2 · Dirección completa ✓', detail: `${p.direccion_envio} · ${p.ciudad}` });
    } else {
      upd({
        status: 'fail',
        title: 'Paso 2 · Falta la dirección o la comuna',
        detail: 'BlueExpress necesita dirección y comuna de destino para emitir la OT. Complétalas aquí mismo (la comuna se autocompleta con cobertura Bluex verificada):',
        fix: <FixDireccionForm pedido={p} onSaved={handleDatosCorregidos} />,
      });
      return;
    }

    // 3. Cobertura Bluex (tarifario oficial) — advertencia, no bloquea
    push({ status: 'running', title: 'Paso 3 · Consultando cobertura Bluex de la comuna…' });
    let tarifas = await base44.entities.TarifaBluex.filter({ comuna_normalizada: normalize(p.ciudad) }, '-tarifa_base', 3).catch(() => []);
    if (!tarifas?.length) tarifas = await base44.entities.TarifaBluex.filter({ comuna: p.ciudad }, '-tarifa_base', 3).catch(() => []);
    await sleep(250);
    if (tarifas?.length) {
      const t = tarifas[0];
      upd({
        status: 'ok',
        title: 'Paso 3 · Comuna con cobertura Bluex ✓',
        detail: `${t.comuna} · ${t.servicio}${t.tipo_destino ? ` · destino ${t.tipo_destino}` : ''}${t.lead_time_dias ? ` · ~${t.lead_time_dias} días hábiles` : ''}.`,
      });
    } else {
      upd({
        status: 'warn',
        title: 'Paso 3 · Comuna sin tarifa en el sistema',
        detail: `"${p.ciudad}" no aparece en el tarifario cargado (346 comunas). Suele ser un nombre mal escrito. Bluex intentará resolverla igual con su API de geografía, pero lo seguro es corregirla:`,
        fix: (
          <div className="space-y-2">
            <FixComunaPicker pedido={p} onSaved={handleDatosCorregidos} />
            <Link to="/admin/tarifas-envio" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold">
              Revisar Tarifas Bluex <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        ),
      });
    }

    // 4. Anti-duplicados
    push({ status: 'running', title: 'Paso 4 · Verificando que no exista una OT previa…' });
    await sleep(300);
    if (p.tracking) {
      upd({
        status: 'warn',
        title: `Paso 4 · Ya tiene OT: ${p.tracking}`,
        detail: 'Este pedido ya tiene etiqueta emitida — no se genera otra para evitar cobros duplicados. Puedes abrir la existente.',
        fix: (
          <a href={`https://www.bluex.cl/seguimiento?n=${p.tracking}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e293b] text-white text-[11px] font-bold">
            <Printer className="w-3 h-3" /> Ver tracking
          </a>
        ),
      });
      return;
    }
    upd({ status: 'ok', title: 'Paso 4 · Sin OT previa ✓', detail: 'Todo listo para emitir la orden de transporte.' });

    if (run === runRef.current) setListo(true);
  };

  useEffect(() => { runChecks(pedido); /* eslint-disable-next-line */ }, []);

  // ── Acciones ─────────────────────────────────────────────────────────
  // Datos corregidos inline (dirección/comuna): re-corre el checklist con el
  // pedido actualizado — el flujo continúa solo hasta poder emitir la etiqueta.
  function handleDatosCorregidos(actualizado) {
    setPedido(actualizado);
    onDone?.();
    runChecks(actualizado);
  }

  async function handleMarcarPagado() {
    setMarcandoPago(true);
    try {
      await base44.functions.invoke('agentOSAction', { action: 'marcarPedidoPagado', payload: { id: pedido.id } });
      const [fresco] = await base44.entities.PedidoWeb.filter({ id: pedido.id });
      const actualizado = fresco || { ...pedido, payment_status: 'paid', estado: 'Confirmado' };
      setPedido(actualizado);
      onDone?.();
      await runChecks(actualizado);
    } catch (err) {
      setResultado({ ok: false, error: err?.response?.data?.error || err.message });
    }
    setMarcandoPago(false);
  }

  const handleGenerar = async () => {
    setGenerando(true);
    setResultado(null);
    try {
      const res = await base44.functions.invoke('agentOSAction', { action: 'generarEtiqueta', payload: { id: pedido.id } });
      setResultado({ ok: true, ...res?.data });
      onDone?.();
    } catch (err) {
      setResultado({ ok: false, error: err?.response?.data?.error || err.message });
    }
    setGenerando(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/45 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-[#ffffff] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[88vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#f1f5f9] flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <Tag className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[#0f172a] leading-tight">Asistente de etiqueta BlueExpress</p>
            <p className="text-[11px] text-[#64748b] truncate">{pedido.numero_pedido} · {pedido.cliente_nombre} · {pedido.ciudad || 'sin comuna'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-[#f1f5f9] flex items-center justify-center text-[#94a3b8]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Burbujas del checklist */}
        <div className="flex-1 overflow-y-auto peyu-scrollbar px-4 py-3 space-y-2">
          {checks.map((c, i) => <Bubble key={i} check={c} />)}

          {generando && (
            <Bubble check={{ status: 'running', title: 'Emitiendo OT en BlueExpress…', detail: 'Creando la orden de transporte, generando el PDF de la etiqueta y notificando al cliente por email.' }} />
          )}

          {resultado?.ok && (
            <Bubble check={{
              status: 'ok',
              title: `¡Etiqueta lista! OT ${resultado.tracking || ''}`,
              detail: 'El tracking quedó guardado en el pedido y el cliente recibió un email con su número de seguimiento. Imprime la etiqueta y pégala en el paquete.',
              fix: resultado.label_url ? (
                <button onClick={() => openLabelUrl?.(resultado.label_url)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold">
                  <Printer className="w-3 h-3" /> Abrir etiqueta PDF
                </button>
              ) : null,
            }} />
          )}

          {resultado && !resultado.ok && (
            <Bubble check={{
              status: 'fail',
              title: 'BlueExpress devolvió un error',
              detail: `${resultado.error}. Revisa los pasos de arriba; si todo está bien puede ser un problema temporal de la API de Bluex — reintenta en unos segundos.`,
              fix: (
                <button onClick={handleGenerar} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e293b] hover:bg-[#334155] text-white text-[11px] font-bold">
                  Reintentar
                </button>
              ),
            }} />
          )}
          <div ref={bottomRef} />
        </div>

        {/* Footer CTA */}
        <div className="px-4 py-3 border-t border-[#f1f5f9] flex-shrink-0">
          {resultado?.ok ? (
            <button onClick={onClose} className="w-full h-11 rounded-xl bg-[#0f172a] text-white text-sm font-bold">
              Cerrar — pedido listo para despachar 🐢
            </button>
          ) : (
            <button
              onClick={handleGenerar}
              disabled={!listo || generando}
              className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
            >
              {generando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
              {listo ? 'Generar etiqueta BlueExpress' : 'Completa los pasos pendientes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}