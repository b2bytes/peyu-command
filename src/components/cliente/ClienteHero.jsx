import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, Phone, Award, MessageCircle, Pencil, Check, X, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';

const ESTADOS = ['Activo', 'VIP', 'En Riesgo', 'Inactivo', 'Bloqueado'];

const ESTADO_STYLE = {
  VIP: 'bg-amber-100 text-amber-800 border-amber-300',
  Activo: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'En Riesgo': 'bg-red-100 text-red-700 border-red-300',
  Inactivo: 'bg-gray-100 text-gray-600 border-gray-300',
  Bloqueado: 'bg-gray-800 text-white border-gray-700',
};

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
}

// Hero del perfil 360°: identidad, contacto accionable y edición rápida de estado.
export default function ClienteHero({ cliente, onClienteUpdate }) {
  const [editing, setEditing] = useState(false);
  const [estado, setEstado] = useState(cliente.estado || 'Activo');
  const [saving, setSaving] = useState(false);

  const guardarEstado = async () => {
    setSaving(true);
    await base44.entities.Cliente.update(cliente.id, { estado });
    onClienteUpdate({ ...cliente, estado });
    setSaving(false);
    setEditing(false);
  };

  const nombre = cliente.empresa || cliente.contacto || 'Cliente';
  const badge = ESTADO_STYLE[cliente.estado] || ESTADO_STYLE.Inactivo;
  const wa = cliente.telefono ? cliente.telefono.replace(/\D/g, '') : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-teal-600 via-cyan-500 to-emerald-500" />
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4 flex-wrap">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-md">
            {initials(nombre)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{nombre}</h1>
              {cliente.estado === 'VIP' && <Award className="w-5 h-5 text-amber-500" />}
              {editing ? (
                <span className="flex items-center gap-1">
                  <select value={estado} onChange={e => setEstado(e.target.value)}
                    className="text-xs border border-gray-300 rounded-lg px-2 py-1 bg-white">
                    {ESTADOS.map(e => <option key={e}>{e}</option>)}
                  </select>
                  <button onClick={guardarEstado} disabled={saving} className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setEditing(false)} className="p-1 rounded-md bg-gray-200 text-gray-600 hover:bg-gray-300">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ) : (
                <button onClick={() => setEditing(true)}
                  className={`group text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${badge}`}>
                  {cliente.estado || 'Activo'}
                  <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-70 transition-opacity" />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {cliente.tipo}{cliente.segmento ? ` · ${cliente.segmento}` : ''}{cliente.rut ? ` · RUT ${cliente.rut}` : ''}
            </p>
            {cliente.contacto && cliente.empresa && (
              <p className="text-xs text-gray-400 mt-0.5">Contacto: {cliente.contacto}</p>
            )}
          </div>

          {/* Acciones de contacto */}
          <div className="flex items-center gap-2 flex-wrap">
            {wa && (
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors">
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            )}
            {cliente.email && (
              <a href={`mailto:${cliente.email}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors">
                <Mail className="w-3.5 h-3.5" /> Email
              </a>
            )}
            <Link to={`/admin/agente?cliente=${encodeURIComponent(cliente.email || nombre)}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-700 transition-colors">
              <Bot className="w-3.5 h-3.5" /> Abrir en Agente
            </Link>
          </div>
        </div>

        {/* Línea de contacto */}
        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-4 text-xs text-gray-500">
          {cliente.email && <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {cliente.email}</span>}
          {cliente.telefono && <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {cliente.telefono}</span>}
          {cliente.canal_preferido && <span>Canal preferido: <b className="text-gray-700">{cliente.canal_preferido}</b></span>}
          {cliente.pagos_al_dia === false && <span className="text-red-600 font-semibold">⚠ Pagos pendientes</span>}
        </div>
      </div>
    </div>
  );
}