import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Settings, Users, Bell, Link, Lock, Database, Mail, MessageCircle,
  Loader2, Check, AlertTriangle, Eye, EyeOff, Trash2, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PESTANAS = ["usuarios", "integraciones", "notificaciones", "empresa", "seguridad"];
const INTEGRACIONES_DISPONIBLES = [
  { id: "whatsapp", nombre: "WhatsApp", desc: "Recibe leads y pedidos por WhatsApp", icon: MessageCircle, color: "#25D366" },
  { id: "email", nombre: "Email (SMTP)", desc: "Envía confirmaciones y reportes automáticos", icon: Mail, color: "#EA4335" },
  { id: "webhook", nombre: "Webhooks", desc: "Integra sistemas terceros en tiempo real", icon: Link, color: "#3b82f6" },
];

function ConfiguracionUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoRol, setNuevoRol] = useState("user");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const users = await base44.entities.User.list("-created_date", 100);
        setUsuarios(users);
      } catch (e) {
        console.error("Error cargando usuarios:", e);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleInvitar = async () => {
    if (!nuevoEmail) return;
    try {
      await base44.users.inviteUser(nuevoEmail, nuevoRol);
      setNuevoEmail("");
      setNuevoRol("user");
      // Reload
      const users = await base44.entities.User.list("-created_date", 100);
      setUsuarios(users);
    } catch (e) {
      alert("Error invitando usuario: " + e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Los usuarios deben ser invitados por email. Una vez aceptan, pueden acceder con su cuenta.
        </p>
      </div>

      {/* Invitar nuevo usuario */}
      <div className="bg-white border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4">Invitar Nuevo Usuario</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Email del usuario"
            value={nuevoEmail}
            onChange={(e) => setNuevoEmail(e.target.value)}
            className="flex-1"
          />
          <select
            value={nuevoRol}
            onChange={(e) => setNuevoRol(e.target.value)}
            className="px-3 py-2 border border-border rounded-md text-sm"
          >
            <option value="user">Usuario</option>
            <option value="admin">Admin</option>
          </select>
          <Button
            onClick={handleInvitar}
            disabled={!nuevoEmail}
            className="bg-peyu-green hover:bg-peyu-green/90"
          >
            <Plus className="w-4 h-4" /> Invitar
          </Button>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="bg-white border border-border rounded-xl p-5">
        <h3 className="font-semibold mb-4">Usuarios Actuales ({usuarios.length})</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : usuarios.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No hay usuarios</p>
        ) : (
          <div className="space-y-2">
            {usuarios.map(u => (
              <div key={u.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{u.full_name || u.email}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: u.role === 'admin' ? '#fecaca' : '#dbeafe', color: u.role === 'admin' ? '#991b1b' : '#1e40af' }}>
                    {u.role === 'admin' ? 'Admin' : 'Usuario'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConfiguracionIntegraciones() {
  const [integraciones, setIntegraciones] = useState({
    whatsapp: { conectado: false, token: "" },
    email: { conectado: false, smtp: "", usuario: "" },
    webhook: { conectado: false, url: "" },
  });
  const [mostrando, setMostrando] = useState({});
  const [editando, setEditando] = useState(null);

  const handleConnect = (id) => {
    setIntegraciones(prev => ({
      ...prev,
      [id]: { ...prev[id], conectado: !prev[id].conectado }
    }));
  };

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <strong>Próximamente:</strong> Las integraciones estarán disponibles en futuras actualizaciones. Ahora puedes ver la estructura.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {INTEGRACIONES_DISPONIBLES.map(integracion => {
          const config = integraciones[integracion.id];
          const Icon = integracion.icon;
          return (
            <div key={integracion.id} className="bg-white border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: integracion.color + '20' }}>
                    <Icon className="w-5 h-5" style={{ color: integracion.color }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{integracion.nombre}</h4>
                    <p className="text-xs text-muted-foreground">{integracion.desc}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={config.conectado ? "default" : "outline"}
                  className="flex-1 text-xs"
                  onClick={() => handleConnect(integracion.id)}
                  style={config.conectado ? { background: integracion.color } : {}}
                >
                  {config.conectado ? "✓ Conectado" : "Conectar"}
                </Button>
                {config.conectado && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs"
                    onClick={() => setEditando(editando === integracion.id ? null : integracion.id)}
                  >
                    ⚙
                  </Button>
                )}
              </div>

              {editando === integracion.id && config.conectado && (
                <div className="space-y-2 border-t border-border pt-3">
                  {integracion.id === "whatsapp" && (
                    <div>
                      <label className="text-xs font-semibold block mb-1">Token API WhatsApp</label>
                      <Input
                        type={mostrando[integracion.id] ? "text" : "password"}
                        placeholder="Tu token..."
                        className="text-xs"
                        value={config.token}
                        onChange={(e) => setIntegraciones(prev => ({
                          ...prev,
                          whatsapp: { ...prev.whatsapp, token: e.target.value }
                        }))}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs mt-2 w-full"
                        onClick={() => setMostrando(prev => ({ ...prev, whatsapp: !prev.whatsapp }))}
                      >
                        {mostrando[integracion.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                    </div>
                  )}
                  {integracion.id === "email" && (
                    <>
                      <Input placeholder="SMTP (ej: smtp.gmail.com)" className="text-xs" />
                      <Input placeholder="Usuario/Email" className="text-xs" />
                      <Input type="password" placeholder="Contraseña" className="text-xs" />
                    </>
                  )}
                  {integracion.id === "webhook" && (
                    <Input placeholder="URL del webhook" className="text-xs" />
                  )}
                  <Button size="sm" className="w-full text-xs">Guardar</Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConfiguracionNotificaciones() {
  const [notifs, setNotifs] = useState({
    nuevosLeads: true,
    cotizacionesVencidas: true,
    ordenesAtrasadas: true,
    bajoStock: true,
    reportesDiarios: false,
  });

  return (
    <div className="space-y-4">
      <div className="bg-white border border-border rounded-xl p-5 space-y-3">
        {Object.entries(notifs).map(([key, valor]) => (
          <label key={key} className="flex items-center gap-3 p-2 hover:bg-muted/10 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={valor}
              onChange={(e) => setNotifs(prev => ({ ...prev, [key]: e.target.checked }))}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm">
              {key === "nuevosLeads" && "Notificar nuevos leads"}
              {key === "cotizacionesVencidas" && "Alertar cotizaciones por vencer"}
              {key === "ordenesAtrasadas" && "Ordenes de producción retrasadas"}
              {key === "bajoStock" && "Inventario bajo"}
              {key === "reportesDiarios" && "Reportes resumidos diarios"}
            </span>
          </label>
        ))}
      </div>
      <Button className="w-full bg-peyu-green hover:bg-peyu-green/90">Guardar Preferencias</Button>
    </div>
  );
}

function ConfiguracionEmpresa() {
  const [empresa, setEmpresa] = useState({
    nombre: "Peyu Chile SPA",
    rut: "76.XXX.XXX-X",
    email: "contacto@peyuchile.cl",
    telefono: "+56 9 1234 5678",
    web: "www.peyuchile.cl",
    direccion: "Providencia, Santiago, Chile",
  });

  const handleUpdate = async () => {
    try {
      await base44.auth.updateMe(empresa);
      alert("Empresa actualizada");
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-border rounded-xl p-5 space-y-3">
        {Object.entries(empresa).map(([key, valor]) => (
          <div key={key}>
            <label className="text-xs font-semibold block mb-1 capitalize">{key}</label>
            <Input
              value={valor}
              onChange={(e) => setEmpresa(prev => ({ ...prev, [key]: e.target.value }))}
              placeholder={key}
            />
          </div>
        ))}
      </div>
      <Button onClick={handleUpdate} className="w-full bg-peyu-green hover:bg-peyu-green/90">Guardar Cambios</Button>
    </div>
  );
}

function ConfiguracionSeguridad() {
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [sesiones, setSesiones] = useState([
    { id: 1, dispositivo: "Chrome en Windows", fecha: "Ahora" },
    { id: 2, dispositivo: "Safari en iPhone", fecha: "Hace 2 horas" },
  ]);

  return (
    <div className="space-y-4">
      {/* Cambiar contraseña */}
      <div className="bg-white border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-semibold">Cambiar Contraseña</h3>
        <Input type="password" placeholder="Contraseña actual" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} />
        <Input type="password" placeholder="Contraseña nueva" value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)} />
        <Input type="password" placeholder="Confirmar contraseña" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
        <Button className="w-full bg-peyu-green hover:bg-peyu-green/90">Actualizar Contraseña</Button>
      </div>

      {/* Sesiones activas */}
      <div className="bg-white border border-border rounded-xl p-5 space-y-3">
        <h3 className="font-semibold">Sesiones Activas</h3>
        <div className="space-y-2">
          {sesiones.map(sesion => (
            <div key={sesion.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
              <div>
                <p className="text-sm font-medium">{sesion.dispositivo}</p>
                <p className="text-xs text-muted-foreground">{sesion.fecha}</p>
              </div>
              <Button size="sm" variant="outline" className="text-xs">
                <Trash2 className="w-3 h-3" /> Cerrar
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Respaldo de datos */}
      <div className="bg-white border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Respaldo de Datos</h3>
          <span className="text-xs text-muted-foreground">Último: Hace 1 día</span>
        </div>
        <Button className="w-full variant-outline">
          <Database className="w-4 h-4" /> Descargar Respaldo
        </Button>
      </div>
    </div>
  );
}

export default function Configuracion() {
  const [pestana, setPestana] = useState("usuarios");

  const iconos = {
    usuarios: Users,
    integraciones: Link,
    notificaciones: Bell,
    empresa: Settings,
    seguridad: Lock,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-poppins font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestiona usuarios, integraciones, notificaciones y seguridad</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap border-b border-border pb-4">
        {PESTANAS.map(p => {
          const Icon = iconos[p];
          const isActive = pestana === p;
          return (
            <button
              key={p}
              onClick={() => setPestana(p)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border-2 transition-all ${
                isActive
                  ? "border-peyu-green text-peyu-green"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          );
        })}
      </div>

      {/* Contenido */}
      <div>
        {pestana === "usuarios" && <ConfiguracionUsuarios />}
        {pestana === "integraciones" && <ConfiguracionIntegraciones />}
        {pestana === "notificaciones" && <ConfiguracionNotificaciones />}
        {pestana === "empresa" && <ConfiguracionEmpresa />}
        {pestana === "seguridad" && <ConfiguracionSeguridad />}
      </div>
    </div>
  );
}