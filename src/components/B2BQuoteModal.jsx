import { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

export default function B2BQuoteModal({ product, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    contact_name: '',
    company_name: '',
    email: '',
    phone: '',
    qty_estimate: 100,
    delivery_date: '',
    personalization_needs: false,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const lead = await base44.entities.B2BLead.create({
        ...formData,
        contact_name: formData.contact_name,
        company_name: formData.company_name,
        email: formData.email,
        phone: formData.phone,
        product_interest: product.nombre,
        qty_estimate: formData.qty_estimate,
        delivery_date: formData.delivery_date || null,
        personalization_needs: formData.personalization_needs,
        source: 'Catálogo B2B',
        status: 'Nuevo',
        urgency: 'Normal',
        notes: `Producto: ${product.nombre} (${product.sku})\n${formData.notes}`,
        brief_url: product.url || ''
      });

      onSuccess?.(lead);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al enviar solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-5 border-b border-gray-100 bg-white">
          <div>
            <h2 className="font-poppins font-bold text-gray-900">Solicitar cotización</h2>
            <p className="text-xs text-gray-500 mt-0.5">{product.nombre}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Nombre contacto *</label>
            <Input
              required
              placeholder="Juan Pérez"
              value={formData.contact_name}
              onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
              className="rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Empresa *</label>
            <Input
              required
              placeholder="Mi Empresa SpA"
              value={formData.company_name}
              onChange={e => setFormData({ ...formData, company_name: e.target.value })}
              className="rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
              <Input
                required
                type="email"
                placeholder="contacto@empresa.cl"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">WhatsApp *</label>
              <Input
                required
                placeholder="+56912345678"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Cantidad estimada (unidades) *</label>
            <Input
              required
              type="number"
              min="10"
              value={formData.qty_estimate}
              onChange={e => setFormData({ ...formData, qty_estimate: Number(e.target.value) })}
              className="rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Fecha requerida</label>
            <Input
              type="date"
              value={formData.delivery_date}
              onChange={e => setFormData({ ...formData, delivery_date: e.target.value })}
              className="rounded-lg"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.personalization_needs}
              onChange={e => setFormData({ ...formData, personalization_needs: e.target.checked })}
              className="rounded w-4 h-4"
            />
            <span className="text-sm text-gray-700">Requiere personalización adicional</span>
          </label>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Notas adicionales</label>
            <textarea
              placeholder="Especificaciones, colores preferidos, etc."
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border border-gray-200 rounded-lg p-2 text-sm resize-none h-20"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg h-11"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Enviando...' : 'Enviar solicitud'}
          </Button>
        </form>
      </div>
    </div>
  );
}