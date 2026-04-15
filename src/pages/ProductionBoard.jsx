import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Kanban,
  Plus,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Download,
  RefreshCw,
} from 'lucide-react';

const STATUSES = [
  { id: 'Nuevo', label: 'Nuevo', color: '#3B82F6', bgColor: '#EFF6FF' },
  { id: 'Aprobado', label: 'Aprobado', color: '#8B5CF6', bgColor: '#FAF5FF' },
  { id: 'En Producción', label: 'En Producción', color: '#F59E0B', bgColor: '#FFFBEB' },
  { id: 'QC/Revisión', label: 'QC/Revisión', color: '#EC4899', bgColor: '#FDF2F8' },
  { id: 'Enviado', label: 'Enviado', color: '#10B981', bgColor: '#F0FDF4' },
  { id: 'Entregado', label: 'Entregado', color: '#6366F1', bgColor: '#EEF2FF' },
  { id: 'Rechazado', label: 'Rechazado', color: '#EF4444', bgColor: '#FEF2F2' },
];

function getStatusColor(status) {
  const st = STATUSES.find(s => s.id === status);
  return st || STATUSES[0];
}

function JobCard({ job, onViewDetails, onStatusChange }) {
  const statusColor = getStatusColor(job.status);
  
  return (
    <div
      className="bg-white rounded-lg border-l-4 p-3 shadow-sm hover:shadow-md transition-shadow"
      style={{ borderLeftColor: statusColor.color }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1">
          <h4 className="font-bold text-sm text-gray-900 truncate">{job.product_name}</h4>
          <p className="text-xs text-gray-500 truncate">{job.customer_name}</p>
        </div>
        <span className="text-xs font-mono text-gray-400 shrink-0"># {job.id?.slice(-4)}</span>
      </div>

      {/* Detalles */}
      <div className="space-y-1.5 mb-3 pb-3 border-b border-gray-100">
        {job.laser_required && (
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            <span className="text-gray-600">✨ Grabado: {job.laser_text?.slice(0, 20)}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-xs">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span className="text-gray-600">Est. {job.estimated_minutes}min</span>
        </div>
        {job.quantity && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-600">Qty: <strong>{job.quantity}</strong> unidades</span>
          </div>
        )}
      </div>

      {/* CTA Buttons */}
      <div className="flex gap-1.5">
        <Button
          size="sm"
          variant="ghost"
          className="flex-1 h-7 text-xs rounded-md"
          onClick={() => onViewDetails(job)}
        >
          <Eye className="w-3 h-3 mr-1" />
          Ver
        </Button>
        {job.status !== 'Entregado' && (
          <select
            value={job.status}
            onChange={(e) => onStatusChange(job.id, e.target.value)}
            className="flex-1 h-7 text-xs border border-gray-200 rounded-md px-2 bg-white font-medium"
            style={{ color: getStatusColor(job.status).color }}
          >
            {STATUSES.map(st => (
              <option key={st.id} value={st.id}>{st.label}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

function JobDetailsModal({ job, onClose, onStatusChange }) {
  if (!job) return null;

  const statusColor = getStatusColor(job.status);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-poppins font-bold text-xl text-gray-900">{job.product_name}</h2>
            <p className="text-sm text-gray-500 mt-1">Pedido #{job.id?.slice(-6)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-2xl">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div>
            <label className="text-sm font-semibold text-gray-900 block mb-2">Estado actual</label>
            <select
              value={job.status}
              onChange={(e) => onStatusChange(job.id, e.target.value)}
              className="w-full px-4 py-2 border-2 rounded-lg font-medium"
              style={{ borderColor: statusColor.color, color: statusColor.color }}
            >
              {STATUSES.map(st => (
                <option key={st.id} value={st.id}>{st.label}</option>
              ))}
            </select>
          </div>

          {/* Cliente Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">CLIENTE</label>
              <p className="font-semibold text-gray-900">{job.customer_name}</p>
              <p className="text-sm text-gray-500">{job.customer_email}</p>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-1">CONTACTO</label>
              <p className="font-semibold text-gray-900">{job.customer_name}</p>
              <p className="text-sm text-gray-500">WhatsApp disponible</p>
            </div>
          </div>

          {/* Producto */}
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-2">PRODUCTO</label>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Producto:</span>
                <span className="font-semibold text-gray-900">{job.product_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">SKU:</span>
                <span className="font-mono text-gray-900">{job.sku || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cantidad:</span>
                <span className="font-semibold text-gray-900">{job.quantity} unid.</span>
              </div>
              {job.color_producto && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Color:</span>
                  <span className="font-semibold text-gray-900">{job.color_producto}</span>
                </div>
              )}
            </div>
          </div>

          {/* Personalización */}
          {job.laser_required && (
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-2">✨ PERSONALIZACIÓN</label>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Grabado Láser:</span>
                  <span className="font-semibold text-purple-900">{job.laser_text}</span>
                </div>
                {job.laser_area_mm && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Área:</span>
                    <span className="font-semibold text-purple-900">{job.laser_area_mm}</span>
                  </div>
                )}
                {job.logo_url && (
                  <div className="pt-2">
                    <p className="text-xs text-gray-600 mb-1">Logo:</p>
                    <img src={job.logo_url} alt="Logo" className="h-16 rounded" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mockup */}
          {job.mockup_urls && job.mockup_urls.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-2">MOCKUPS</label>
              <div className="grid grid-cols-2 gap-2">
                {job.mockup_urls.map((url, i) => (
                  <img key={i} src={url} alt={`Mockup ${i + 1}`} className="h-24 w-full object-cover rounded-lg" />
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <label className="text-xs font-semibold text-gray-400 block mb-2">CRONOGRAMA</label>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tiempo estimado:</span>
                <span className="font-semibold">{job.estimated_minutes} minutos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Creado:</span>
                <span className="font-semibold">{new Date(job.created_at).toLocaleDateString('es-CL')}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {job.production_notes && (
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-2">NOTAS</label>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">{job.production_notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
          <Button variant="outline" className="rounded-lg" onClick={onClose}>
            Cerrar
          </Button>
          <Button className="bg-gray-900 hover:bg-gray-800 rounded-lg gap-2">
            <Download className="w-4 h-4" />
            Descargar PDF
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ProductionBoard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, laser

  useEffect(() => {
    cargarJobs();
  }, []);

  const cargarJobs = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.PersonalizationJob.list();
      setJobs(res || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
    setLoading(false);
  };

  const cambiarEstado = async (jobId, newStatus) => {
    try {
      await base44.entities.PersonalizationJob.update(jobId, { status: newStatus });
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Filtrar
  let filtered = jobs;
  if (filter === 'pending') {
    filtered = filtered.filter(j => !['Enviado', 'Entregado'].includes(j.status));
  } else if (filter === 'laser') {
    filtered = filtered.filter(j => j.laser_required);
  }
  if (search) {
    filtered = filtered.filter(j =>
      j.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      j.product_name?.toLowerCase().includes(search.toLowerCase())
    );
  }

  // Agrupar por estado
  const byStatus = {};
  STATUSES.forEach(st => {
    byStatus[st.id] = filtered.filter(j => j.status === st.id || (st.id === 'Nuevo' && !j.status));
  });

  // Stats
  const totalJobs = filtered.length;
  const laserJobs = filtered.filter(j => j.laser_required).length;
  const completedJobs = filtered.filter(j => j.status === 'Entregado').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-poppins font-bold text-gray-900">Production Board</h1>
        <p className="text-gray-500 mt-1">Gestión de personalización en tiempo real</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total', value: totalJobs, icon: Kanban, color: '#3B82F6' },
          { label: 'Grabado Láser', value: laserJobs, icon: Kanban, color: '#8B5CF6' },
          { label: 'Completados', value: completedJobs, icon: CheckCircle2, color: '#10B981' },
          { label: 'Pendientes', value: totalJobs - completedJobs, icon: Clock, color: '#F59E0B' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-semibold">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <stat.icon className="w-8 h-8" style={{ color: stat.color, opacity: 0.3 }} />
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por cliente, producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium"
        >
          <option value="all">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="laser">Con grabado</option>
        </select>
        <Button
          onClick={cargarJobs}
          variant="outline"
          size="icon"
          className="rounded-lg"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-7 gap-4 overflow-x-auto pb-4">
        {STATUSES.map(status => (
          <div key={status.id} className="flex-shrink-0 w-72">
            {/* Column Header */}
            <div
              className="rounded-lg p-3 mb-3 text-white font-semibold text-sm flex items-center justify-between"
              style={{ backgroundColor: status.color }}
            >
              <span>{status.label}</span>
              <span className="bg-white/30 px-2 py-0.5 rounded text-xs font-mono">
                {byStatus[status.id].length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2 min-h-96 bg-gray-50 rounded-lg p-2">
              {byStatus[status.id].map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  onViewDetails={setSelectedJob}
                  onStatusChange={cambiarEstado}
                />
              ))}
              {byStatus[status.id].length === 0 && (
                <div className="text-center py-8 text-gray-400 text-xs">Sin items</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onStatusChange={cambiarEstado}
      />
    </div>
  );
}
