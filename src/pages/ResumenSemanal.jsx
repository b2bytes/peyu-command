import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart3, Loader2, TrendingUp, ShoppingBag, Building2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const fmtCLP = (v) => `$${Number(v || 0).toLocaleString("es-CL")}`;
const fmtM = (v) => `$${(Number(v || 0) / 1_000_000).toFixed(1)}M`;

// Lunes de la semana de una fecha dada → clave estable "YYYY-MM-DD"
const lunesDe = (d) => {
  const date = new Date(d);
  const dow = (date.getDay() + 6) % 7; // 0 = lunes
  date.setDate(date.getDate() - dow);
  date.setHours(0, 0, 0, 0);
  return date;
};
const claveSemana = (d) => lunesDe(d).toISOString().slice(0, 10);
const etiquetaSemana = (clave) => {
  const d = new Date(clave + "T12:00:00");
  return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
};

// Pedidos B2C que cuentan como venta (pagado / despachado / entregado, no cancelados)
const ESTADOS_VALIDOS = ["Confirmado", "En Producción", "Listo para Despacho", "Despachado", "Entregado"];

export default function ResumenSemanal() {
  const [data, setData] = useState([]);
  const [totales, setTotales] = useState({ b2c: 0, b2b: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);

      const [pedidos, propuestas] = await Promise.all([
        base44.entities.PedidoWeb.list("-fecha", 500),
        base44.entities.CorporateProposal.filter({ status: "Aceptada" }, "-created_date", 500),
      ]);

      // Acumular por semana (lunes)
      const mapa = {}; // clave → { b2c, b2b }
      const sumar = (clave, canal, monto) => {
        if (!mapa[clave]) mapa[clave] = { b2c: 0, b2b: 0 };
        mapa[clave][canal] += monto || 0;
      };

      let totalB2C = 0, totalB2B = 0;

      pedidos.forEach((p) => {
        const pagado = p.payment_status === "paid" || ESTADOS_VALIDOS.includes(p.estado);
        if (!pagado) return;
        const fecha = p.fecha || p.created_date;
        if (!fecha) return;
        sumar(claveSemana(fecha), "b2c", p.total);
        totalB2C += p.total || 0;
      });

      propuestas.forEach((pr) => {
        const fecha = pr.fecha_envio || pr.created_date;
        if (!fecha) return;
        sumar(claveSemana(fecha), "b2b", pr.total);
        totalB2B += pr.total || 0;
      });

      // Últimas 12 semanas, ordenadas cronológicamente
      const filas = Object.keys(mapa)
        .sort()
        .slice(-12)
        .map((clave) => ({
          semana: etiquetaSemana(clave),
          B2C: mapa[clave].b2c,
          B2B: mapa[clave].b2b,
        }));

      setData(filas);
      setTotales({ b2c: totalB2C, b2b: totalB2B });
      setLoading(false);
    })();
  }, []);

  const totalGeneral = totales.b2c + totales.b2b;

  const kpis = [
    { label: "Ventas web B2C", value: fmtCLP(totales.b2c), icon: ShoppingBag, color: "#0F8B6C" },
    { label: "Pedidos B2B aceptados", value: fmtCLP(totales.b2b), icon: Building2, color: "#D96B4D" },
    { label: "Total general", value: fmtCLP(totalGeneral), icon: TrendingUp, color: "#4B4F54" },
  ];

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-poppins font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" style={{ color: "#0F8B6C" }} />
          Resumen Semanal
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ventas web B2C vs Pedidos B2B aceptados · últimas 12 semanas
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-border flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${k.color}15` }}>
                <Icon className="w-5 h-5" style={{ color: k.color }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="font-poppins font-bold text-xl" style={{ color: k.color }}>{k.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border p-5">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Sin ventas registradas aún</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f2" vertical={false} />
              <XAxis dataKey="semana" tick={{ fontSize: 12 }} tickLine={false} />
              <YAxis tickFormatter={fmtM} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={60} />
              <Tooltip
                formatter={(v, name) => [fmtCLP(v), name]}
                contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 13 }}
              />
              <Legend />
              <Bar dataKey="B2C" name="Ventas web (B2C)" fill="#0F8B6C" radius={[6, 6, 0, 0]} />
              <Bar dataKey="B2B" name="Pedidos B2B" fill="#D96B4D" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}