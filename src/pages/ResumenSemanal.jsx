import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart3, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const fmtCLP = (v) => `$${Number(v || 0).toLocaleString("es-CL")}`;
const fmtM = (v) => `$${(Number(v || 0) / 1_000_000).toFixed(1)}M`;

export default function ResumenSemanal() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const rows = await base44.entities.KPISemanal.list("fecha_inicio", 52);
      setData(
        rows.map((r) => ({
          semana: r.semana,
          B2C: r.ventas_web_clp || 0,
          B2B: r.pedidos_b2b_total_clp || 0,
        }))
      );
      setLoading(false);
    })();
  }, []);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-poppins font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" style={{ color: "#0F8B6C" }} />
          Resumen Semanal
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Ventas web B2C vs Pedidos B2B por semana
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border p-5">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Sin datos semanales aún</p>
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