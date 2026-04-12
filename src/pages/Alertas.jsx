import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  AlertTriangle, Clock, CheckCircle2, Zap, Package, Users, DollarSign,
  Trash2, Eye, Filter, Loader2, Bell, TrendingDown, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

const PRIORIDADES = {
  critica: { label: "Crítica", color: "#DC2626", bg: "#FEE2E2", icon: AlertTriangle },
  alta: { label: "Alta", color: "#EA580C", bg: "#FED7AA", icon: AlertCircle },
  media: { label: "Media", color: "#F59E0B", bg: "#FEF3C7", icon: Clock },
  baja: { label: "Baja", color: "#3B82F6", bg: "#DBEAFE", icon: Clock },
};

const CATEGORIAS = {
  cotizacion: { label: "Cotización", color: "#D96B4D" },
  produccion: { label: "Producción", color: "#9333ea" },
  inventario: { label: "Inventario", color: "#10b981" },
  cliente: { label: "Cliente", color: "#3b82f6" },
  finanzas: { label: "Finanzas", color: "#F59E0B" },
  tarea: { label: "Tarea", color: "#0F8B6C" },
};

function calcularAlertas(data) {
  const alertas = [];
  const ahora = new Date();
  
  // ─────────────────────────────────────────────────────
  // Cotizaciones
  const cotizaciones = data.cotizaciones || [];
  cotizaciones.forEach(c => {
    const fechaVenc = new Date(c.fecha_vencimiento);
    const diasRestantes = Math.ceil((fechaVenc - ahora) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0 && c.estado !== "Aceptada" && c.estado !== "Rechazada") {
      alertas.push({
        id: `cot-${c.id}`,
        prioridad: "critica",
        categoria: "cotizacion",
        titulo: `Cotización vencida: ${c.empresa}`,
        desc: `${c.numero} · ${c.sku} · Vencida hace ${Math.abs(diasRestantes)} días`,
        entidad: { tipo: "Cotizacion", id: c.id, nombre: c.empresa },
        accion: "Enviar nuevamente o cancelar",
      });
    } else if (diasRestantes <= 2 && diasRestantes >= 0 && c.estado === "Enviada") {
      alertas.push({
        id: `cot-${c.id}-exp`,
        prioridad: "alta",
        categoria: "cotizacion",
        titulo: `Cotización por vencer: ${c.empresa}`,
        desc: `${c.numero} · Vence en ${diasRestantes} día${diasRestantes !== 1 ? 's' : ''}`,
        entidad: { tipo: "Cotizacion", id: c.id },
        accion: "Hacer seguimiento",
      });
    }
  });

  // ─────────────────────────────────────────────────────
  // Órdenes de Producción
  const ordenes = data.ordenes || [];
  ordenes.forEach(o => {
    const fechaPrometida = new Date(o.fecha_entrega_prometida);
    const diasRestantes = Math.ceil((fechaPrometida - ahora) / (1000 * 60 * 60 * 24));
    
    if ((o.estado === "En Producción" || o.estado === "En Cola") && diasRestantes <= 2) {
      alertas.push({
        id: `op-${o.id}`,
        prioridad: diasRestantes < 0 ? "critica" : "alta",
        categoria: "produccion",
        titulo: `Orden ${diasRestantes < 0 ? "ATRASADA" : "urgente"}: ${o.numero_op}`,
        desc: `${o.empresa} · ${o.sku} x${o.cantidad}u · Estado: ${o.estado}`,
        entidad: { tipo: "OrdenProduccion", id: o.id },
        accion: diasRestantes < 0 ? "Acelerar producción" : "Monitorear",
      });
    }
  });

  // ─────────────────────────────────────────────────────
  // Inventario bajo
  const productos = data.productos || [];
  productos.forEach(p => {
    if (p.stock_actual < p.moq_personalizacion * 2) {
      alertas.push({
        id: `inv-${p.id}`,
        prioridad: "media",
        categoria: "inventario",
        titulo: `Stock bajo: ${p.nombre}`,
        desc: `${p.sku} · Stock actual: ${p.stock_actual}u · MOQ: ${p.moq_personalizacion}u`,
        entidad: { tipo: "Producto", id: p.id },
        accion: "Reordenar",
      });
    }
  });

  // ─────────────────────────────────────────────────────
  // Leads sin contactar
  const leads = data.leads || [];
  leads.forEach(l => {
    if (l.estado === "Nuevo" || l.estado === "Contactado") {
      const fechaNextAction = l.next_action_date ? new Date(l.next_action_date) : null;
      if (!fechaNextAction || fechaNextAction <= ahora) {
        alertas.push({
          id: `lead-${l.id}`,
          prioridad: "alta",
          categoria: "cliente",
          titulo: `Lead pendiente: ${l.empresa}`,
          desc: `${l.contacto} · ${l.canal} · Calidad: ${l.calidad_lead}`,
          entidad: { tipo: "Lead", id: l.id },
          accion: "Hacer seguimiento",
        });
      }
    }
  });

  // ─────────────────────────────────────────────────────
  // Tareas vencidas
  const tareas = data.tareas || [];
  tareas.forEach(t => {
    if ((t.estado === "Pendiente" || t.estado === "En curso") && t.fecha_limite) {
      const fechaLim = new Date(t.fecha_limite);
      if (fechaLim <= ahora) {
        alertas.push({
          id: `task-${t.id}`,
          prioridad: "alta",
          categoria: "tarea",
          titulo: `Tarea VENCIDA: ${t.titulo}`,
          desc: `${t.area} · Responsable: ${t.responsable || "Sin asignar"}`,
          entidad: { tipo: "Tarea", id: t.id },
          accion: "Completar o reasignar",
        });
      }
    }
  });

  // ─────────────────────────────────────────────────────
  // OKRs en riesgo
  const okrs = data.okrs || [];
  okrs.forEach(o => {
    if (o.estado === "En riesgo") {
      const progreso = (o.valor_actual / o.valor_meta) * 100;
      alertas.push({
        id: `okr-${o.id}`,
        prioridad: "media",
        categoria: "tarea",
        titulo: `OKR en riesgo: ${o.objetivo}`,
        desc: `${o.area} · Avance: ${Math.round(progreso)}% de ${o.valor_meta}`,
        entidad: { tipo: "OKR", id: o.id },
        accion: "Revisar iniciativas",
      });
    }
  });

  return alertas.sort((a, b) => {
    const prioridadOrder = { critica: 0, alta: 1, media: 2, baja: 3 };
    return prioridadOrder[a.prioridad] - prioridadOrder[b.prioridad];
  });
}

function AlertaCard({ alerta, onDismiss }) {
  const cfg = PRIORIDADES[alerta.prioridad];
  const Icon = cfg.icon;
  const catCfg = CATEGORIAS[alerta.categoria];
  
  return (
    <div
      className="flex gap-3 p-4 rounded-xl border-l-4 transition-all hover:shadow-md"
      style={{ background: cfg.bg, borderColor: cfg.color }}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <p className="font-semibold text-sm" style={{ color: cfg.color }}>{alerta.titulo}</p>
            <p className="text-xs text-gray-600 mt-0.5">{alerta.desc}</p>
          </div>
          <span className="text-[10px] px-2 py-1 rounded-full flex-shrink-0 font-semibold" style={{ background: catCfg.color + '20', color: catCfg.color }}>
            {catCfg.label}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500 italic">{alerta.accion}</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 hover:bg-white/50"
            onClick={() => onDismiss(alerta.id)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Alertas() {
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("todas");
  const [alertasDismissed, setAlertasDismissed] = useState(new Set());

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [cotizaciones, ordenes, productos, leads, tareas, okrs] = await Promise.all([
          base44.entities.Cotizacion.list("-updated_date", 500).catch(() => []),
          base44.entities.OrdenProduccion.list("-updated_date", 500).catch(() => []),
          base44.entities.Producto.list("-updated_date", 500).catch(() => []),
          base44.entities.Lead.list("-updated_date", 500).catch(() => []),
          base44.entities.Tarea.list("-updated_date", 500).catch(() => []),
          base44.entities.OKR.list("-updated_date", 100).catch(() => []),
        ]);

        const data = { cotizaciones, ordenes, productos, leads, tareas, okrs };
        const calculadas = calcularAlertas(data);
        setAlertas(calculadas);
      } catch (e) {
        console.error("Error cargando alertas:", e);
      }
      setLoading(false);
    };
    load();

    // Refrescar cada 60 segundos
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleDismiss = (id) => {
    setAlertasDismissed(prev => new Set([...prev, id]));
  };

  const alertasVisibles = alertas.filter(a => !alertasDismissed.has(a.id));
  const alertasFiltradas = filtro === "todas" ? alertasVisibles : alertasVisibles.filter(a => a.prioridad === filtro);

  const contadores = {
    critica: alertasVisibles.filter(a => a.prioridad === "critica").length,
    alta: alertasVisibles.filter(a => a.prioridad === "alta").length,
    media: alertasVisibles.filter(a => a.prioridad === "media").length,
    baja: alertasVisibles.filter(a => a.prioridad === "baja").length,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-poppins font-bold">Centro de Alertas</h1>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-peyu-green" />
            <span className="text-sm font-semibold">{alertasVisibles.length} alertas activas</span>
          </div>
        </div>
        <p className="text-muted-foreground text-sm">Monitoreo en tiempo real de eventos críticos del negocio</p>
      </div>

      {/* KPIs de prioridades */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(PRIORIDADES).map(([prioridad, cfg]) => (
          <div key={prioridad} className="bg-white border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <cfg.icon className="w-4 h-4" style={{ color: cfg.color }} />
              <p className="text-xs font-semibold text-muted-foreground uppercase">{cfg.label}</p>
            </div>
            <p className="text-2xl font-bold">{contadores[prioridad]}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filtro === "todas" ? "default" : "outline"}
          className="text-xs"
          onClick={() => setFiltro("todas")}
        >
          <Filter className="w-3 h-3" /> Todas
        </Button>
        {Object.entries(PRIORIDADES).map(([p, cfg]) => (
          <Button
            key={p}
            variant={filtro === p ? "default" : "outline"}
            className="text-xs"
            style={filtro === p ? { background: cfg.color } : {}}
            onClick={() => setFiltro(p)}
          >
            {cfg.label} ({contadores[p]})
          </Button>
        ))}
      </div>

      {/* Lista de alertas */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : alertasFiltradas.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="font-semibold text-green-800">¡Sin alertas críticas!</p>
            <p className="text-sm text-green-700 mt-1">Todo está bajo control</p>
          </div>
        ) : (
          alertasFiltradas.map(alerta => (
            <AlertaCard key={alerta.id} alerta={alerta} onDismiss={handleDismiss} />
          ))
        )}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <Zap className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">💡 Alertas automáticas</p>
            <p>Se actualizan cada minuto. Incluyen cotizaciones vencidas, órdenes atrasadas, stock bajo, leads sin contactar y tareas vencidas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}