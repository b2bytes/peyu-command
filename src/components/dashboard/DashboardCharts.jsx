import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';

const COLORS = ['#0F8B6C', '#D96B4D', '#A7D9C9', '#4B4F54'];

// ── Gráficos del Dashboard: ingresos 6 meses, mix por canal y actividad
//    comercial semanal. Recibe las series ya calculadas por la página. ──
export default function DashboardCharts({ ingresosMensuales, canalMix, kpiSemanal }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ingresos mensuales */}
        <div className="lg:col-span-2 ld-card p-5">
          <h3 className="font-jakarta font-bold text-ld-fg">Ingresos mensuales (CLP K)</h3>
          <p className="text-xs text-ld-fg-muted mb-4">B2B + B2C · últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={ingresosMensuales}>
              <defs>
                <linearGradient id="dash-b2b" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0F8B6C" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0F8B6C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="dash-b2c" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D96B4D" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#D96B4D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ld-border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`$${v.toLocaleString('es-CL')}K`, '']} />
              <Area type="monotone" dataKey="b2b" stroke="#0F8B6C" fill="url(#dash-b2b)" strokeWidth={2} name="B2B" />
              <Area type="monotone" dataKey="b2c" stroke="#D96B4D" fill="url(#dash-b2c)" strokeWidth={2} name="B2C" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Mix por canal */}
        <div className="ld-card p-5">
          <h3 className="font-jakarta font-bold text-ld-fg">Mix de ingresos</h3>
          <p className="text-xs text-ld-fg-muted mb-4">Por canal (CLP K)</p>
          {canalMix.length === 0 ? (
            <p className="text-xs text-ld-fg-muted text-center py-10">Sin datos aún</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={canalMix} cx="50%" cy="50%" innerRadius={42} outerRadius={65} dataKey="value">
                    {canalMix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`$${v}K`]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {canalMix.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-ld-fg-muted">{item.name}</span>
                    </div>
                    <span className="font-bold text-ld-fg">${item.value}K</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Actividad comercial semanal */}
      <div className="ld-card p-5">
        <h3 className="font-jakarta font-bold text-ld-fg">Actividad comercial semanal</h3>
        <p className="text-xs text-ld-fg-muted mb-4">Leads → Cotizaciones → Pedidos · últimas 4 semanas</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={kpiSemanal} barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ld-border)" />
            <XAxis dataKey="sem" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="leads" fill="#A7D9C9" name="Leads" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cotizaciones" fill="#0F8B6C" name="Cotizaciones" radius={[4, 4, 0, 0]} />
            <Bar dataKey="pedidos" fill="#D96B4D" name="Pedidos" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}