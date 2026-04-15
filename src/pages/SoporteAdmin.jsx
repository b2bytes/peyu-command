import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Plus,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  User,
  Calendar,
  Filter,
  RefreshCw,
  Eye,
  Reply,
} from 'lucide-react';

const TICKET_STATUSES = ['Abierto', 'En progreso', 'Pendiente cliente', 'Resuelto', 'Cerrado'];
const TICKET_PRIORITIES = ['Baja', 'Normal', 'Alta', 'Urgente'];
const TICKET_CATEGORIES = ['Producto', 'Pedido', 'Envío', 'Pago', 'Personalización', 'Otro'];

const STATUS_COLORS = {
  'Abierto': { bg: '#EFF6FF', color: '#1E40AF', icon: AlertCircle },
  'En progreso': { bg: '#FFFBEB', color: '#B45309', icon: Clock },
  'Pendiente cliente': { bg: '#FDF2F8', color: '#BE185D', icon: Clock },
  'Resuelto': { bg: '#DCFCE7', color: '#15803D', icon: CheckCircle2 },
  'Cerrado': { bg: '#F3F4F6', color: '#6B7280', icon: CheckCircle2 },
};

const PRIORITY_COLORS = {
  'Baja': '#10B981',
  'Normal': '#3B82F6',
  'Alta': '#F59E0B',
  'Urgente': '#EF4444',
};

function TicketCard({ ticket, onViewDetails }) {
  const statusInfo = STATUS_COLORS[ticket.status] || STATUS_COLORS['Abierto'];
  const StatusIcon = statusInfo.icon;

  return (
    <div
      onClick={() => onViewDetails(ticket)}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{ticket.titulo}</h4>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ticket.descripcion}</p>
        </div>
        <div
          className="px-2 py-1 rounded-full flex items-center gap-1 shrink-0"
          style={{ backgroundColor: statusInfo.bg }}
        >
          <StatusIcon className="w-3 h-3" style={{ color: statusInfo.color }} />
          <span className="text-xs font-semibold" style={{ color: statusInfo.color }}>
            {ticket.status}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <User className="w-3 h-3" />
          {ticket.cliente_nombre}
        </div>
        <div className="flex items-center gap-1">
          <Tag
            className="w-3 h-3"
            style={{ color: PRIORITY_COLORS[ticket.prioridad] }}
          />
          <span
            className="text-xs font-semibold"
            style={{ color: PRIORITY_COLORS[ticket.prioridad] }}
          >
            {ticket.prioridad}
          </span>
        </div>
        <div className="text-xs text-gray-400">
          <Calendar className="w-3 h-3 inline mr-1" />
          {new Date(ticket.created_at).toLocaleDateString('es-CL')}
        </div>
      </div>
    </div>
  );
}

function TicketDetailsModal({ ticket, onClose, onUpdateStatus }) {
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState([]);

  const statusInfo = STATUS_COLORS[ticket.status] || STATUS_COLORS['Abierto'];

  const handleReply = async () => {
    if (!replyText.trim()) return;

    try {
      // Crear respuesta
      await base44.entities.TicketResponse.create({
        ticket_id: ticket.id,
        autor: 'Admin',
        mensaje: replyText,
        tipo: 'internal',
      });

      setReplyText('');
      // Recargar respuestas (en un caso real)
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{ticket.titulo}</h2>
            <p className="text-sm text-gray-500 mt-1">Ticket #{ticket.id?.slice(-6)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-900 text-2xl shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-2">ESTADO</label>
              <select
                value={ticket.status}
                onChange={(e) => onUpdateStatus(ticket.id, e.target.value)}
                className="w-full px-3 py-2 border-2 rounded-lg font-medium"
                style={{ borderColor: statusInfo.color, color: statusInfo.color }}
              >
                {TICKET_STATUSES.map(st => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-2">PRIORIDAD</label>
              <select
                defaultValue={ticket.prioridad}
                className="w-full px-3 py-2 border-2 rounded-lg font-medium"
                style={{ borderColor: PRIORITY_COLORS[ticket.prioridad] }}
              >
                {TICKET_PRIORITIES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cliente Info */}
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-2">CLIENTE</label>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="font-semibold text-gray-900">{ticket.cliente_nombre}</p>
              <p className="text-sm text-gray-600">{ticket.cliente_email}</p>
              {ticket.cliente_telefono && (
                <p className="text-sm text-gray-600">{ticket.cliente_telefono}</p>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-2">DESCRIPCIÓN</label>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <p className="text-gray-900 whitespace-pre-wrap">{ticket.descripcion}</p>
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-2">CATEGORÍA</label>
            <div className="flex flex-wrap gap-2">
              {TICKET_CATEGORIES.map(cat => (
                <span
                  key={cat}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    ticket.categoria === cat
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Mensajes */}
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-3">CONVERSACIÓN</label>
            <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
              {replies.map((reply, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg ${
                    reply.tipo === 'customer'
                      ? 'bg-blue-50 border-l-2 border-blue-300'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="text-xs font-semibold text-gray-600 mb-1">
                    {reply.autor} • {new Date(reply.fecha).toLocaleDateString('es-CL')}
                  </div>
                  <p className="text-sm text-gray-900">{reply.mensaje}</p>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            {ticket.status !== 'Cerrado' && (
              <div className="space-y-2">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escribe una respuesta interna..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm resize-none"
                  rows="3"
                />
                <Button
                  onClick={handleReply}
                  className="w-full bg-gray-900 hover:bg-gray-800 gap-2"
                >
                  <Reply className="w-4 h-4" />
                  Responder
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
          <Button variant="outline" className="rounded-lg" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SoporteAdmin() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    cargarTickets();
  }, []);

  const cargarTickets = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.SupportTicket.list();
      setTickets(res || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
    setLoading(false);
  };

  const actualizarStatus = async (ticketId, newStatus) => {
    try {
      await base44.entities.SupportTicket.update(ticketId, { status: newStatus });
      setTickets(prev =>
        prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t)
      );
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  // Filtrar
  let filtered = tickets;
  if (statusFilter !== 'all') {
    filtered = filtered.filter(t => t.status === statusFilter);
  }
  if (priorityFilter !== 'all') {
    filtered = filtered.filter(t => t.prioridad === priorityFilter);
  }
  if (search) {
    filtered = filtered.filter(t =>
      t.titulo?.toLowerCase().includes(search.toLowerCase()) ||
      t.cliente_nombre?.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Stats
  const stats = {
    total: tickets.length,
    abiertos: tickets.filter(t => t.status === 'Abierto').length,
    enProgreso: tickets.filter(t => t.status === 'En progreso').length,
    resueltos: tickets.filter(t => t.status === 'Resuelto').length,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-gray-900">Centro de Soporte</h1>
          <p className="text-gray-500 mt-1">Gestión de tickets y consultas de clientes</p>
        </div>
        <Button className="bg-gray-900 hover:bg-gray-800 gap-2 rounded-lg">
          <Plus className="w-4 h-4" />
          Nuevo Ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, color: '#6B7280' },
          { label: 'Abiertos', value: stats.abiertos, color: '#EF4444' },
          { label: 'En progreso', value: stats.enProgreso, color: '#F59E0B' },
          { label: 'Resueltos', value: stats.resueltos, color: '#10B981' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 font-semibold">{stat.label}</p>
            <p className="text-2xl font-bold mt-1" style={{ color: stat.color }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium"
        >
          <option value="all">Todos los estados</option>
          {TICKET_STATUSES.map(st => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium"
        >
          <option value="all">Todas las prioridades</option>
          {TICKET_PRIORITIES.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <Button
          onClick={cargarTickets}
          variant="outline"
          size="icon"
          className="rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Tickets List */}
      <div className="grid grid-cols-1 gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay tickets que coincidan con los filtros</p>
          </div>
        ) : (
          filtered.map(ticket => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onViewDetails={setSelectedTicket}
            />
          ))
        )}
      </div>

      {/* Details Modal */}
      {selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdateStatus={actualizarStatus}
        />
      )}
    </div>
  );
}
