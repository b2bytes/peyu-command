import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Download, FileText, BarChart3, TrendingUp, Users, Package,
  Loader2, CheckCircle2, AlertTriangle, DollarSign, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";

const REPORTES = [
  {
    id: "ventas-mensuales",
    titulo: "Ventas Mensuales B2B+B2C",
    desc: "Consolidado de ingresos por canal, cliente y SKU",
    icon: DollarSign,
    color: "#0F8B6C",
  },
  {
    id: "pipeline-clientes",
    titulo: "Pipeline & Clientes",
    desc: "Leads, cotizaciones y estado de cuentas por cobrar",
    icon: Users,
    color: "#3b82f6",
  },
  {
    id: "produccion",
    titulo: "Estado de Producción",
    desc: "Órdenes en progreso, scrap, tiempos y eficiencia",
    icon: Package,
    color: "#9333ea",
  },
  {
    id: "financiero",
    titulo: "Análisis Financiero",
    desc: "Flujo de caja, márgenes, CPC y proyecciones",
    icon: TrendingUp,
    color: "#D96B4D",
  },
  {
    id: "okrs-desempeno",
    titulo: "OKRs & Desempeño",
    desc: "Avance de objetivos, metas de equipo e iniciativas",
    icon: BarChart3,
    color: "#f59e0b",
  },
  {
    id: "sostenibilidad",
    titulo: "Sostenibilidad ESG",
    desc: "Material reciclado, certificaciones y cadena sostenible",
    icon: AlertTriangle,
    color: "#10b981",
  },
];

async function generarReporte(id) {
  try {
    const now = new Date();
    const data = {};

    if (id === "ventas-mensuales") {
      const [pedidos, ventas] = await Promise.all([
        base44.entities.PedidoWeb.filter({}, "-created_date", 1000),
        base44.entities.VentaTienda.filter({}, "-created_date", 1000),
      ]);
      data.titulo = "Ventas Mensuales";
      data.mes = now.toLocaleString("es-CL", { month: "long", year: "numeric" });
      data.pedidosWeb = pedidos.length;
      data.ventasTienda = ventas.length;
      data.totalWeb = pedidos.reduce((s, p) => s + (p.total || 0), 0);
      data.totalTienda = ventas.reduce((s, v) => s + (v.total || 0), 0);
      data.detallePedidos = pedidos.slice(0, 50).map(p => ({
        numero: p.numero_pedido, cliente: p.cliente_nombre, total: p.total, estado: p.estado
      }));
    } else if (id === "pipeline-clientes") {
      const [leads, cotizaciones, clientes] = await Promise.all([
        base44.entities.Lead.filter({}, "-created_date", 500),
        base44.entities.Cotizacion.filter({}, "-created_date", 300),
        base44.entities.Cliente.filter({}, "-created_date", 500),
      ]);
      data.titulo = "Pipeline & Clientes";
      data.totalLeads = leads.length;
      data.leadsPorEstado = {};
      leads.forEach(l => {
        data.leadsPorEstado[l.estado] = (data.leadsPorEstado[l.estado] || 0) + 1;
      });
      data.totalCotizaciones = cotizaciones.length;
      data.cotizacionesPorEstado = {};
      cotizaciones.forEach(c => {
        data.cotizacionesPorEstado[c.estado] = (data.cotizacionesPorEstado[c.estado] || 0) + 1;
      });
      data.totalClientes = clientes.length;
      data.clientesActivos = clientes.filter(c => c.estado === "Activo").length;
    } else if (id === "produccion") {
      const ordenes = await base44.entities.OrdenProduccion.filter({}, "-created_date", 500);
      data.titulo = "Estado de Producción";
      data.totalOrdenes = ordenes.length;
      data.ordenesPorEstado = {};
      ordenes.forEach(o => {
        data.ordenesPorEstado[o.estado] = (data.ordenesPorEstado[o.estado] || 0) + 1;
      });
      data.totalUnidades = ordenes.reduce((s, o) => s + (o.cantidad || 0), 0);
      data.scrapPromedio = (ordenes.reduce((s, o) => s + (o.scrap_pct || 0), 0) / ordenes.length).toFixed(2);
    } else if (id === "financiero") {
      const movimientos = await base44.entities.MovimientoCaja.filter({}, "-created_date", 1000);
      data.titulo = "Análisis Financiero";
      const ingresos = movimientos.filter(m => m.tipo === "Ingreso").reduce((s, m) => s + (m.monto || 0), 0);
      const egresos = movimientos.filter(m => m.tipo === "Egreso").reduce((s, m) => s + (m.monto || 0), 0);
      data.ingresos = ingresos;
      data.egresos = egresos;
      data.flujoNeto = ingresos - egresos;
      data.margenOperacional = ((data.flujoNeto / ingresos) * 100).toFixed(1);
    } else if (id === "okrs-desempeno") {
      const okrs = await base44.entities.OKR.filter({}, "-created_date", 100);
      data.titulo = "OKRs & Desempeño";
      data.totalOKRs = okrs.length;
      data.okrsPorEstado = {};
      okrs.forEach(o => {
        data.okrsPorEstado[o.estado] = (data.okrsPorEstado[o.estado] || 0) + 1;
      });
      data.progresoPromedio = (okrs.reduce((s, o) => s + ((o.valor_actual || 0) / (o.valor_meta || 1) * 100), 0) / okrs.length).toFixed(0);
    } else if (id === "sostenibilidad") {
      const [productos, ordenes, proveedores] = await Promise.all([
        base44.entities.Producto.filter({}, "-created_date", 500),
        base44.entities.OrdenCompra.filter({}, "-created_date", 500),
        base44.entities.Proveedor.filter({}, "-created_date", 500),
      ]);
      data.titulo = "Sostenibilidad ESG";
      data.productosReciclados = productos.filter(p => p.material === "Plástico 100% Reciclado").length;
      data.ordenesConCertificacion = ordenes.filter(o => o.certificado_reciclado).length;
      data.proveedoresCertificados = proveedores.filter(p => p.certificacion_reciclado).length;
    }

    data.fechaGeneracion = now.toLocaleString("es-CL");
    return data;
  } catch (error) {
    console.error("Error generando reporte:", error);
    return null;
  }
}

function ReporteCard({ reporte, onGenerare }) {
  const Icon = reporte.icon;
  return (
    <div className="bg-white border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: reporte.color + '15' }}>
          <Icon className="w-5 h-5" style={{ color: reporte.color }} />
        </div>
      </div>
      <h3 className="font-poppins font-semibold text-sm mb-1">{reporte.titulo}</h3>
      <p className="text-xs text-muted-foreground mb-4">{reporte.desc}</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 text-xs"
          onClick={() => onGenerare(reporte.id, "preview")}
        >
          <Eye className="w-3 h-3" /> Vista
        </Button>
        <Button
          size="sm"
          className="flex-1 text-xs"
          style={{ background: reporte.color }}
          onClick={() => onGenerare(reporte.id, "download")}
        >
          <Download className="w-3 h-3" /> Descargar
        </Button>
      </div>
    </div>
  );
}

function ReportePreview({ data, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-peyu-green to-peyu-light-green p-6 flex items-center justify-between">
          <h2 className="text-xl font-poppins font-bold text-white">{data.titulo}</h2>
          <button onClick={onClose} className="text-white text-xl font-light leading-none">×</button>
        </div>
        <div className="p-6 space-y-6">
          {/* Resumen */}
          {Object.entries(data).filter(([k]) => !k.startsWith("_") && k !== "titulo" && k !== "fechaGeneracion").map(([key, value]) => {
            if (Array.isArray(value) || typeof value === "object") return null;
            return (
              <div key={key} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                <span className="text-sm capitalize text-muted-foreground">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                <span className="font-semibold">{value}</span>
              </div>
            );
          })}

          {/* Detalles de tablas */}
          {data.detallePedidos && (
            <div>
              <h3 className="font-semibold mb-2 text-sm">Últimos Pedidos</h3>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {data.detallePedidos.map((p, i) => (
                  <div key={i} className="flex justify-between text-xs py-2 border-b border-muted">
                    <span>{p.numero}</span>
                    <span>{p.cliente}</span>
                    <span className="font-semibold">${p.total?.toLocaleString("es-CL")}</span>
                    <span className="text-muted-foreground">{p.estado}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground pt-4 border-t">
            Generado: {data.fechaGeneracion}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Reportes() {
  const [generando, setGenerando] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleAction = async (id, action) => {
    setGenerando(id);
    const data = await generarReporte(id);
    setGenerando(null);

    if (!data) {
      alert("Error generando reporte");
      return;
    }

    if (action === "preview") {
      setPreview(data);
    } else if (action === "download") {
      // Simple JSON download (puede expandirse a PDF con jsPDF)
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${id}-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-poppins font-bold">Reportes & Análisis</h1>
        <p className="text-muted-foreground text-sm mt-1">Genera reportes ejecutivos, descarga datos y analiza el desempeño del negocio</p>
      </div>

      {/* Info boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-semibold mb-1">💡 Tip</p>
          <p className="text-xs text-blue-700">Cada reporte se actualiza en tiempo real con datos de la base de datos</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-600 font-semibold mb-1">📊 Datos</p>
          <p className="text-xs text-green-700">Descarga en JSON para análisis avanzado en Excel o BI tools</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-amber-600 font-semibold mb-1">⚡ Rápido</p>
          <p className="text-xs text-amber-700">Todos los reportes se generan en segundos</p>
        </div>
      </div>

      {/* Grid de reportes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTES.map(reporte => (
          <ReporteCard
            key={reporte.id}
            reporte={reporte}
            onGenerare={handleAction}
          />
        ))}
      </div>

      {/* Preview modal */}
      {preview && <ReportePreview data={preview} onClose={() => setPreview(null)} />}

      {/* Loading overlay */}
      {generando && (
        <div className="fixed inset-0 bg-black/30 z-40 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-xl flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-peyu-green" />
            <p className="font-semibold text-sm">Generando reporte...</p>
          </div>
        </div>
      )}
    </div>
  );
}