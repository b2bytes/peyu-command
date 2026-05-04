import { useMemo } from 'react';
import { Mail, Clock, Bell, AlertCircle } from 'lucide-react';
import { SECUENCIAS, TRIGGERS_TRANSVERSALES, TIPOS_EMAIL_LABELS } from '@/lib/bluex-secuencias';

/**
 * Panel transparente de secuencias inteligentes.
 * Muestra las 5 secuencias activas, qué envíos están en cada una,
 * cuántos emails se han enviado y los triggers transversales.
 */
export default function BluexSecuenciasPanel({ envios }) {
  const stats = useMemo(() => {
    const map = {};
    SECUENCIAS.forEach(s => { map[s.key] = { envios: 0, activos: 0, emails: 0 }; });

    envios.forEach(e => {
      const key = e.secuencia_activa || 'estandar_urbano';
      if (!map[key]) return;
      map[key].envios++;
      if (!['Entregado', 'Anulado', 'Devuelto'].includes(e.estado)) map[key].activos++;
      map[key].emails += (e.notificaciones_enviadas || []).length;
    });

    return map;
  }, [envios]);

  // Últimos 5 emails enviados (cualquier envío)
  const ultimosEmails = useMemo(() => {
    const all = [];
    envios.forEach(e => {
      (e.notificaciones_enviadas || []).forEach(n => {
        all.push({ ...n, numero_pedido: e.numero_pedido, cliente: e.cliente_nombre, comuna: e.comuna_destino });
      });
    });
    return all.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 6);
  }, [envios]);

  return (
    <div className="space-y-5">
      {/* Cómo se activan */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-white/60">Cómo se activan</p>
            <p className="font-poppins font-bold">Lógica del agente Logística IA</p>
          </div>
        </div>
        <ol className="text-sm text-white/85 space-y-1.5 mt-3 list-decimal list-inside leading-relaxed">
          <li>El CRON corre <strong className="text-cyan-300">cada 6 horas</strong> y consulta tracking en vivo a Bluex.</li>
          <li>Detecta el <strong className="text-cyan-300">cambio de estado</strong> respecto a la última revisión.</li>
          <li>Clasifica al envío en <strong className="text-cyan-300">una secuencia</strong> según comuna, tipo destino y valor.</li>
          <li>Dispara <strong className="text-cyan-300">solo los emails nuevos</strong> que aún no se han enviado.</li>
        </ol>
      </div>

      {/* Las 5 secuencias */}
      <div>
        <h3 className="font-poppins font-bold text-foreground text-sm mb-3 flex items-center gap-2">
          <Mail className="w-4 h-4 text-cyan-600" /> Secuencias activas (5)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SECUENCIAS.map(s => {
            const st = stats[s.key];
            return (
              <div key={s.key} className={`bg-gradient-to-br ${s.bg} border ${s.border} rounded-2xl p-4`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xl">{s.icon}</span>
                    <div className="min-w-0">
                      <p className="font-poppins font-bold text-foreground truncate">{s.label}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{s.descripcion}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className={`font-poppins font-extrabold text-2xl bg-gradient-to-br ${s.color} bg-clip-text text-transparent tabular-nums leading-none`}>
                      {st.activos}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">activos</p>
                  </div>
                </div>

                <div className="bg-white/60 rounded-lg p-2 mt-2">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Criterio</p>
                  <p className="text-[11px] text-foreground leading-relaxed">{s.criterio}</p>
                </div>

                <div className="mt-2.5">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">Emails que dispara</p>
                  <div className="flex flex-wrap gap-1">
                    {s.emails.map((tipo, i) => (
                      <span key={tipo} className="inline-flex items-center gap-1 text-[10px] bg-white border border-border rounded-full px-2 py-0.5 font-medium">
                        {i > 0 && <span className="text-muted-foreground/50">→</span>}
                        {TIPOS_EMAIL_LABELS[tipo] || tipo}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-white/60 text-[10px] text-muted-foreground">
                  <span><strong className="text-foreground tabular-nums">{st.envios}</strong> envíos totales</span>
                  <span><strong className="text-foreground tabular-nums">{st.emails}</strong> emails enviados</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Triggers transversales */}
      <div>
        <h3 className="font-poppins font-bold text-foreground text-sm mb-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" /> Triggers transversales
        </h3>
        <p className="text-xs text-muted-foreground mb-3">Aplican <em>en cualquier secuencia</em> cuando se cumplen las condiciones.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {TRIGGERS_TRANSVERSALES.map(t => (
            <div key={t.key} className="bg-amber-50/40 border border-amber-200 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{t.icon}</span>
                <p className="font-bold text-sm text-foreground">{t.label}</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{t.descripcion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Últimos emails enviados */}
      <div>
        <h3 className="font-poppins font-bold text-foreground text-sm mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-600" /> Últimos emails enviados por el agente
        </h3>
        {ultimosEmails.length === 0 ? (
          <div className="text-center py-8 bg-muted/30 rounded-2xl border border-dashed border-border">
            <Mail className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">El agente aún no ha disparado emails. Apenas haya cambios de estado en Bluex, aparecerán acá.</p>
          </div>
        ) : (
          <div className="bg-white border border-border rounded-2xl divide-y divide-border overflow-hidden">
            {ultimosEmails.map((n, i) => (
              <div key={i} className="flex items-start gap-3 p-3 hover:bg-muted/30 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-3.5 h-3.5 text-cyan-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground line-clamp-1">{n.subject}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {n.numero_pedido} · {n.cliente} · {n.comuna} · <span className="text-cyan-600 font-semibold">{TIPOS_EMAIL_LABELS[n.tipo] || n.tipo}</span>
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap flex-shrink-0">
                  {new Date(n.at).toLocaleString('es-CL', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}