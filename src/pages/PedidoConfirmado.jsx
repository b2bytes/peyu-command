import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function PedidoConfirmado() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [pedido, setPedido] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verificarPago = async () => {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        setStatus('error');
        setError('No se encontró información de sesión');
        return;
      }

      try {
        // Aquí llamas a tu endpoint para verificar el pago
        const response = await fetch(`/api/verify-checkout?session_id=${sessionId}`);
        const data = await response.json();

        if (data.success) {
          setPedido(data.pedido);
          setStatus('success');
        } else {
          setStatus('error');
          setError(data.error || 'Error al procesar el pago');
        }
      } catch (err) {
        console.error('Error:', err);
        setStatus('error');
        setError('Error al verificar el pago. Por favor intenta más tarde.');
      }
    };

    verificarPago();
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#FAFAF8] font-inter flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 mx-auto animate-spin text-gray-400" />
          <p className="text-gray-600">Verificando tu pago...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#FAFAF8] font-inter flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-24 h-24 rounded-3xl bg-red-50 flex items-center justify-center mx-auto">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <div>
            <h2 className="text-3xl font-poppins font-bold text-gray-900">Error en el pago</h2>
            <p className="text-gray-500 mt-2">{error}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => navigate('/carrito')}>
              Volver al carrito
            </Button>
            <Button className="flex-1 rounded-2xl bg-gray-900" onClick={() => navigate('/shop')}>
              Seguir comprando
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-inter flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0F8B6C] to-[#A7D9C9] flex items-center justify-center mx-auto shadow-lg shadow-[#0F8B6C]/20">
          <CheckCircle2 className="w-12 h-12 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-poppins font-bold text-gray-900">¡Pago recibido!</h2>
          <p className="text-gray-500 mt-2">Tu pedido fue procesado exitosamente con Stripe</p>
        </div>
        
        {pedido && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 text-left space-y-3 shadow-sm">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Pedido</span>
              <span className="font-semibold text-gray-900">{pedido.numero_pedido}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Cliente</span>
              <span className="font-semibold text-gray-900">{pedido.cliente_nombre}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Total pagado</span>
              <span className="font-semibold text-[#0F8B6C]">${pedido.total?.toLocaleString('es-CL')}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Confirmación enviada a</span>
              <span className="font-semibold text-gray-900">{pedido.cliente_email}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Tiempo de entrega</span>
              <span className="font-semibold text-gray-900">3–7 días hábiles</span>
            </div>
          </div>
        )}

        <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-sm text-green-700">
          📧 Revisa tu correo para la confirmación. ¿Preguntas? WhatsApp: <strong>+56 9 3504 0242</strong>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 rounded-2xl" onClick={() => navigate('/shop')}>
            Seguir comprando
          </Button>
          <Button className="flex-1 rounded-2xl bg-gray-900 hover:bg-gray-800" onClick={() => navigate('/seguimiento')}>
            Ver mi pedido
          </Button>
        </div>
      </div>
    </div>
  );
}
