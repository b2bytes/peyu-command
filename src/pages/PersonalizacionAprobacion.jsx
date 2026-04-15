import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Sparkles, 
  Clock, 
  Package, 
  AlertTriangle,
  MessageCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const STATUS_CONFIG = {
  'Pendiente': { 
    icon: Clock, 
    color: 'text-amber-600', 
    bg: 'bg-amber-50', 
    border: 'border-amber-200',
    label: 'Pendiente de revision' 
  },
  'Preview generado': { 
    icon: Sparkles, 
    color: 'text-blue-600', 
    bg: 'bg-blue-50', 
    border: 'border-blue-200',
    label: 'Mockup listo para aprobar' 
  },
  'Aprobado': { 
    icon: CheckCircle, 
    color: 'text-green-600', 
    bg: 'bg-green-50', 
    border: 'border-green-200',
    label: 'Aprobado - En cola de produccion' 
  },
  'En produccion': { 
    icon: Package, 
    color: 'text-purple-600', 
    bg: 'bg-purple-50', 
    border: 'border-purple-200',
    label: 'En produccion' 
  },
  'Completado': { 
    icon: CheckCircle, 
    color: 'text-green-600', 
    bg: 'bg-green-50', 
    border: 'border-green-200',
    label: 'Completado' 
  },
  'Rechazado': { 
    icon: XCircle, 
    color: 'text-red-600', 
    bg: 'bg-red-50', 
    border: 'border-red-200',
    label: 'Rechazado' 
  },
};

function MockupGallery({ urls }) {
  const [current, setCurrent] = useState(0);
  
  if (!urls || urls.length === 0) return null;
  
  return (
    <div className="relative">
      <div className="relative rounded-2xl overflow-hidden bg-gray-100">
        <img 
          src={urls[current]} 
          alt={`Mockup ${current + 1}`}
          className="w-full h-64 sm:h-80 object-cover"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full">
          {current + 1} / {urls.length}
        </div>
      </div>
      
      {urls.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <button
            onClick={() => setCurrent(c => c > 0 ? c - 1 : urls.length - 1)}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex gap-1.5">
            {urls.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === current ? 'bg-[#0F8B6C]' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setCurrent(c => c < urls.length - 1 ? c + 1 : 0)}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function PersonalizacionAprobacion() {
  const [searchParams] = useSearchParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionDone, setActionDone] = useState(null);

  const jobId = searchParams.get('id');
  const token = searchParams.get('token');

  useEffect(() => {
    const loadJob = async () => {
      if (!jobId) {
        setError('No se encontro el ID del pedido');
        setLoading(false);
        return;
      }

      try {
        const jobs = await base44.entities.PersonalizationJob.filter({ id: jobId });
        
        if (!jobs || jobs.length === 0) {
          setError('Pedido no encontrado');
          setLoading(false);
          return;
        }

        const foundJob = jobs[0];
        
        // Verificar token de aprobacion
        if (token && foundJob.approval_token && foundJob.approval_token !== token) {
          setError('Token de acceso invalido');
          setLoading(false);
          return;
        }

        setJob(foundJob);
      } catch (err) {
        console.log('[v0] Error loading job:', err);
        setError('Error al cargar el pedido');
      } finally {
        setLoading(false);
      }
    };

    loadJob();
  }, [jobId, token]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await base44.entities.PersonalizationJob.update(jobId, {
        status: 'Aprobado',
        approved_at: new Date().toISOString(),
      });

      // Enviar email de confirmacion
      if (job.customer_email) {
        await base44.integrations.Core.SendEmail({
          to: job.customer_email,
          subject: 'Tu personalizacion ha sido aprobada - Peyu',
          body: `
            <div style="font-family:Inter,Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto">
              <div style="text-align:center;margin-bottom:24px">
                <h1 style="color:#0F8B6C;font-size:24px;margin:0">PEYU</h1>
              </div>
              
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:16px;padding:24px;text-align:center">
                <div style="width:48px;height:48px;background:#0F8B6C;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px">
                  <span style="color:white;font-size:24px">OK</span>
                </div>
                <h2 style="color:#166534;font-size:20px;margin:0 0 8px">Aprobacion confirmada</h2>
                <p style="color:#15803d;font-size:14px;margin:0">Tu personalizacion entra en cola de produccion</p>
              </div>
              
              <div style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:12px">
                <p style="color:#4b5563;font-size:14px;margin:0 0 8px"><strong>Producto:</strong> ${job.product_name}</p>
                <p style="color:#4b5563;font-size:14px;margin:0 0 8px"><strong>Color:</strong> ${job.color_producto}</p>
                ${job.laser_text ? `<p style="color:#4b5563;font-size:14px;margin:0"><strong>Texto:</strong> "${job.laser_text}"</p>` : ''}
              </div>
              
              <p style="color:#6b7280;font-size:13px;margin-top:24px;text-align:center">
                Te notificaremos cuando tu pedido este listo.<br />
                Tiempo estimado: 3-5 dias habiles.
              </p>
              
              <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px">
                Peyu Chile | +56 9 3504 0242
              </p>
            </div>
          `,
          from_name: 'Peyu Chile',
        });
      }

      setActionDone('approved');
      setJob(prev => ({ ...prev, status: 'Aprobado', approved_at: new Date().toISOString() }));
    } catch (err) {
      console.log('[v0] Error approving:', err);
      alert('Error al aprobar. Intentalo de nuevo.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Por favor indica el motivo del rechazo');
      return;
    }

    setActionLoading(true);
    try {
      await base44.entities.PersonalizationJob.update(jobId, {
        status: 'Rechazado',
        rejection_reason: rejectReason,
      });

      // Enviar email al equipo
      if (job.customer_email) {
        await base44.integrations.Core.SendEmail({
          to: job.customer_email,
          subject: 'Cambios solicitados en tu personalizacion - Peyu',
          body: `
            <div style="font-family:Inter,Arial,sans-serif;padding:20px;max-width:600px;margin:0 auto">
              <div style="text-align:center;margin-bottom:24px">
                <h1 style="color:#0F8B6C;font-size:24px;margin:0">PEYU</h1>
              </div>
              
              <h2 style="color:#1a1a1a;font-size:18px;margin-bottom:16px">Recibimos tu solicitud de cambios</h2>
              
              <p style="color:#4b5563;font-size:14px;line-height:1.6;margin-bottom:20px">
                Hola ${job.customer_name || 'Cliente'},<br /><br />
                Recibimos tu solicitud de cambios para la personalizacion. Nuestro equipo se pondra en contacto contigo pronto para ajustar el diseno.
              </p>
              
              <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:12px;padding:16px;margin-bottom:20px">
                <p style="color:#92400e;font-size:13px;margin:0"><strong>Tu comentario:</strong><br />${rejectReason}</p>
              </div>
              
              <p style="color:#9ca3af;font-size:12px;text-align:center;margin-top:24px">
                Peyu Chile | +56 9 3504 0242
              </p>
            </div>
          `,
          from_name: 'Peyu Chile',
        });
      }

      setActionDone('rejected');
      setJob(prev => ({ ...prev, status: 'Rechazado' }));
    } catch (err) {
      console.log('[v0] Error rejecting:', err);
      alert('Error al enviar. Intentalo de nuevo.');
    } finally {
      setActionLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#0F8B6C] animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Cargando tu pedido...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-poppins font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-500 text-sm mb-6">{error}</p>
          <Link to="/personalizar">
            <Button variant="outline" className="rounded-xl">
              Crear nueva personalizacion
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG['Pendiente'];
  const StatusIcon = statusConfig.icon;
  const canApprove = ['Pendiente', 'Preview generado'].includes(job.status);

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-inter">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0F8B6C] flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-poppins font-bold text-gray-900">PEYU</span>
          </Link>
          <div className={`${statusConfig.bg} ${statusConfig.border} border rounded-full px-3 py-1 flex items-center gap-1.5`}>
            <StatusIcon className={`w-3.5 h-3.5 ${statusConfig.color}`} />
            <span className={`text-xs font-medium ${statusConfig.color}`}>{job.status}</span>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Titulo */}
        <div className="text-center">
          <h1 className="text-2xl font-poppins font-bold text-gray-900 mb-1">
            {actionDone === 'approved' 
              ? 'Aprobacion confirmada' 
              : actionDone === 'rejected'
                ? 'Cambios solicitados'
                : 'Aprueba tu personalizacion'}
          </h1>
          <p className="text-gray-500 text-sm">
            {actionDone === 'approved' 
              ? 'Tu pedido entra en produccion'
              : actionDone === 'rejected'
                ? 'Te contactaremos para ajustar el diseno'
                : 'Revisa el mockup y confirma para producir'}
          </p>
        </div>

        {/* Mockup Gallery */}
        {job.mockup_urls && job.mockup_urls.length > 0 && (
          <MockupGallery urls={job.mockup_urls} />
        )}

        {/* Detalles del pedido */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Detalles del pedido</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-500">Producto</span>
              <span className="text-sm font-medium text-gray-900">{job.product_name}</span>
            </div>
            
            {job.color_producto && (
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Color</span>
                <span className="text-sm font-medium text-gray-900">{job.color_producto}</span>
              </div>
            )}
            
            {job.laser_text && (
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Texto grabado</span>
                <span className="text-sm font-medium text-gray-900">{`"${job.laser_text}"`}</span>
              </div>
            )}
            
            {job.laser_area_mm && (
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Area de grabado</span>
                <span className="text-sm font-medium text-gray-900">{job.laser_area_mm}</span>
              </div>
            )}
            
            {job.logo_url && (
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Logo</span>
                <a 
                  href={job.logo_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[#0F8B6C] hover:underline"
                >
                  Ver archivo
                </a>
              </div>
            )}
            
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">Estado</span>
              <div className={`${statusConfig.bg} ${statusConfig.border} border rounded-full px-2.5 py-1 flex items-center gap-1.5`}>
                <StatusIcon className={`w-3 h-3 ${statusConfig.color}`} />
                <span className={`text-xs font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        {canApprove && !actionDone && (
          <div className="space-y-3">
            {!showRejectForm ? (
              <>
                <Button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="w-full gap-2 h-12 rounded-2xl font-semibold bg-[#0F8B6C] hover:bg-[#0a7558] shadow-lg shadow-[#0F8B6C]/20"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Aprobar y producir
                </Button>
                
                <Button
                  onClick={() => setShowRejectForm(true)}
                  variant="outline"
                  className="w-full gap-2 h-12 rounded-2xl font-semibold border-red-200 text-red-600 hover:bg-red-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Solicitar cambios
                </Button>
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
                <h3 className="font-semibold text-gray-900">Que cambios necesitas?</h3>
                <Textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Describe los cambios que necesitas en el diseno..."
                  className="min-h-24 rounded-xl border-gray-200 text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowRejectForm(false)}
                    variant="outline"
                    className="flex-1 rounded-xl"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={actionLoading || !rejectReason.trim()}
                    className="flex-1 rounded-xl bg-red-600 hover:bg-red-700"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Enviar solicitud'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estado post-accion */}
        {actionDone === 'approved' && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
            <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-green-800 mb-1">Aprobacion exitosa</h3>
            <p className="text-green-700 text-sm">
              Tu pedido esta en cola de produccion. Te notificaremos cuando este listo.
            </p>
            <p className="text-green-600 text-xs mt-2">
              Tiempo estimado: 3-5 dias habiles
            </p>
          </div>
        )}

        {actionDone === 'rejected' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
            <RefreshCw className="w-10 h-10 text-amber-600 mx-auto mb-3" />
            <h3 className="font-semibold text-amber-800 mb-1">Solicitud enviada</h3>
            <p className="text-amber-700 text-sm">
              Nuestro equipo revisara tus comentarios y te contactara pronto.
            </p>
          </div>
        )}

        {/* Status ya aprobado/rechazado */}
        {!canApprove && !actionDone && (
          <div className={`${statusConfig.bg} ${statusConfig.border} border rounded-2xl p-5 text-center`}>
            <StatusIcon className={`w-10 h-10 ${statusConfig.color} mx-auto mb-3`} />
            <h3 className={`font-semibold ${statusConfig.color} mb-1`}>
              {job.status === 'Aprobado' && 'Ya aprobaste este pedido'}
              {job.status === 'En produccion' && 'Tu pedido esta en produccion'}
              {job.status === 'Completado' && 'Tu pedido esta completado'}
              {job.status === 'Rechazado' && 'Solicitaste cambios'}
            </h3>
            <p className={`text-sm ${statusConfig.color} opacity-80`}>
              {job.status === 'Aprobado' && 'Esta en cola de produccion'}
              {job.status === 'En produccion' && 'Pronto estara listo'}
              {job.status === 'Completado' && 'Gracias por tu compra'}
              {job.status === 'Rechazado' && 'Te contactaremos pronto'}
            </p>
          </div>
        )}

        {/* WhatsApp */}
        <a 
          href={`https://wa.me/56935040242?text=${encodeURIComponent(`Hola, tengo una consulta sobre mi pedido de personalizacion ${job.product_name}. Soy ${job.customer_name || 'cliente'}.`)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button 
            variant="outline" 
            className="w-full gap-2 h-11 rounded-2xl border-[#25D366] text-[#25D366] hover:bg-[#25D366]/5"
          >
            <MessageCircle className="w-4 h-4" />
            Contactar por WhatsApp
          </Button>
        </a>

        {/* Footer */}
        <div className="text-center pt-4">
          <Link to="/shop" className="text-sm text-[#0F8B6C] hover:underline">
            Seguir comprando
          </Link>
        </div>
      </main>
    </div>
  );
}
