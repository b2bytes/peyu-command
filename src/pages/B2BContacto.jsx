import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MessageCircle, Upload, CheckCircle, Building2, Package, Clock, Zap, Recycle } from 'lucide-react';

const FEATURES = [
  { icon: Zap, label: 'Laser UV gratis', sub: 'Desde 10 unidades', color: '#D96B4D' },
  { icon: Clock, label: 'Propuesta en <24h', sub: 'Con mockup de tu logo', color: '#0F8B6C' },
  { icon: Package, label: 'Entrega en 7 días', sub: 'Fabricación local Chile', color: '#4B4F54' },
];

const PRODUCTOS_CORPORATIVOS = [
  'Kit Escritorio (5 piezas)', 'Posavasos Corporativos', 'Maceteros Corporativos',
  'Cachos / Cubiletes', 'Lámparas Corporativas', 'Paletas Corporativas', 'Otro / Consultar',
];

function calcularScore(form, tieneArchivo) {
  let score = 10;
  if ((form.qty_estimate || 0) >= 500) score += 40;
  else if ((form.qty_estimate || 0) >= 100) score += 30;
  else if ((form.qty_estimate || 0) >= 50) score += 20;
  else if ((form.qty_estimate || 0) >= 10) score += 10;
  if (form.email) score += 15;
  if (form.phone) score += 10;
  if (form.rut) score += 10;
  if (form.personalization_needs) score += 5;
  if (form.delivery_date) score += 5;
  if (tieneArchivo) score += 10;
  if (form.has_plastic) score += 5;
  return Math.min(score, 100);
}

export default function B2BContacto() {
  const [searchParams] = useSearchParams();
  const productoId = searchParams.get('productoId');
  const productoNombre = searchParams.get('nombre');

  const [form, setForm] = useState({
    contact_name: '', company_name: '', email: '', phone: '', rut: '',
    product_interest: productoNombre || '', qty_estimate: '', delivery_date: '',
    personalization_needs: false, has_plastic: false, notes: '',
    source: 'Formulario Web', status: 'Nuevo', urgency: 'Normal',
  });

  const [archivo, setArchivo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.contact_name || !form.company_name || !form.email || !form.phone) {
      setError('Por favor completa nombre, empresa, email y teléfono.');
      return;
    }
    setLoading(true);
    setError('');
    let logoUrl = '';
    if (archivo) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: archivo });
      logoUrl = file_url;
    }
    const score = calcularScore({ ...form, qty_estimate: Number(form.qty_estimate) || 0 }, !!archivo);
    const urgency = score >= 70 ? 'Alta' : score >= 40 ? 'Normal' : 'Baja';
    const leadCreado = await base44.entities.B2BLead.create({
      ...form, qty_estimate: Number(form.qty_estimate) || 0,
      lead_score: score, logo_url: logoUrl, brief_url: logoUrl,
      urgency, utm_source: document.referrer || 'directo',
    });
    if (leadCreado?.id) {
      base44.functions.invoke('scoreLead', { leadId: leadCreado.id }).catch(() => {});
    }
    setEnviado(true);
    setLoading(false);
  };

  if (enviado) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] font-inter flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0F8B6C] to-[#A7D9C9] flex items-center justify-center mx-auto shadow-lg shadow-[#0F8B6C]/20">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-poppins font-bold text-gray-900">¡Solicitud enviada!</h2>
            <p className="text-gray-500 mt-2 leading-relaxed">Carlos del equipo Peyu te contactará en menos de 24 horas con una propuesta personalizada y mockup de tu logo.</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm text-left space-y-3">
            <p className="font-semibold text-sm text-gray-900">¿Necesitas respuesta urgente?</p>
            <p className="text-xs text-gray-500">Escríbenos directamente por WhatsApp mencionando que enviaste el formulario:</p>
            <a href="https://wa.me/56935040242?text=Hola%2C%20acabo%20de%20enviar%20una%20solicitud%20de%20cotizaci%C3%B3n%20corporativa%20por%20la%20web%20de%20Peyu" target="_blank" rel="noopener noreferrer">
              <Button className="w-full gap-2 rounded-2xl font-semibold" style={{ backgroundColor: '#25D366' }}>
                <MessageCircle className="w-4 h-4" /> Abrir WhatsApp
              </Button>
            </a>
          </div>
          <Link to="/shop">
            <Button variant="outline" className="w-full rounded-2xl">Ver catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-inter">

      {/* ── NAVBAR ─────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center gap-4">
          <Link to={productoId ? `/producto/${productoId}` : '/shop'} className="group">
            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </div>
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0F8B6C] to-[#06634D] flex items-center justify-center shadow">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <div>
              <p className="text-sm font-poppins font-bold text-gray-900 leading-none">PEYU</p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">Ventas Corporativas</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-5 py-10 space-y-6">

        {/* Hero */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#0F8B6C]/10 text-[#0F8B6C] px-4 py-1.5 rounded-full text-sm font-semibold">
            <Building2 className="w-4 h-4" /> Cotización Corporativa B2B
          </div>
          <h1 className="text-3xl md:text-4xl font-poppins font-bold text-gray-900 leading-tight">Regalos corporativos<br />con impacto real</h1>
          <p className="text-gray-500 max-w-xl mx-auto leading-relaxed text-sm">
            Transformamos residuos plásticos en regalos únicos con tu logo. Fabricación local en Chile, personalización láser UV gratuita.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3">
          {FEATURES.map((f, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: f.color + '15' }}>
                <f.icon className="w-5 h-5" style={{ color: f.color }} />
              </div>
              <div className="font-semibold text-xs text-gray-900 font-poppins leading-tight">{f.label}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{f.sub}</div>
            </div>
          ))}
        </div>

        {/* Formulario */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
          <h2 className="font-poppins font-bold text-xl text-gray-900 mb-6">Solicitar cotización</h2>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl mb-5 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: 'Nombre contacto *', key: 'contact_name', placeholder: 'Tu nombre' },
                { label: 'Empresa *', key: 'company_name', placeholder: 'Nombre de la empresa' },
                { label: 'Email *', key: 'email', placeholder: 'correo@empresa.cl', type: 'email' },
                { label: 'Teléfono / WhatsApp *', key: 'phone', placeholder: '+56 9 xxxx xxxx' },
                { label: 'RUT Empresa', key: 'rut', placeholder: '12.345.678-9' },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400">{f.label}</label>
                  <Input
                    type={f.type || 'text'}
                    value={form[f.key]}
                    onChange={e => update(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="h-11 text-sm rounded-xl border-gray-200 bg-gray-50 focus:bg-white"
                  />
                </div>
              ))}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Fecha requerida</label>
                <Input type="date" value={form.delivery_date} onChange={e => update('delivery_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-11 text-sm rounded-xl border-gray-200 bg-gray-50 focus:bg-white" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Producto de interés</label>
                <select value={form.product_interest} onChange={e => update('product_interest', e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-gray-200 bg-gray-50 focus:bg-white px-3 py-2 text-sm">
                  <option value="">Seleccionar producto...</option>
                  {PRODUCTOS_CORPORATIVOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Cantidad estimada (u)</label>
                <Input type="number" value={form.qty_estimate} onChange={e => update('qty_estimate', e.target.value)}
                  placeholder="Ej: 50, 100, 500" min="1"
                  className="h-11 text-sm rounded-xl border-gray-200 bg-gray-50 focus:bg-white" />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { key: 'personalization_needs', title: '✨ Requiero personalización con logo', sub: 'Grabado láser UV · gratis desde 10 u.' },
                { key: 'has_plastic', title: '♻️ Tengo plástico para reciclar', sub: 'Economía circular con tus residuos' },
              ].map(cb => (
                <label key={cb.key} className="flex items-start gap-3 p-4 border border-gray-200 rounded-2xl cursor-pointer hover:border-[#0F8B6C] hover:bg-[#0F8B6C]/5 transition group">
                  <input type="checkbox" checked={form[cb.key]} onChange={e => update(cb.key, e.target.checked)} className="mt-0.5 accent-[#0F8B6C]" />
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{cb.title}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{cb.sub}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Logo upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">Logo o brief (opcional pero recomendado)</label>
              <div className="border-2 border-dashed border-gray-200 hover:border-[#0F8B6C] rounded-2xl p-6 text-center transition-colors cursor-pointer"
                onClick={() => document.getElementById('logo-upload').click()}>
                <Upload className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                {archivo ? (
                  <p className="text-sm text-[#0F8B6C] font-semibold">✓ {archivo.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-600">Arrastra tu archivo o haz clic</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, SVG, PDF, AI, EPS · max 10MB</p>
                  </>
                )}
                <input id="logo-upload" type="file" className="hidden"
                  accept=".png,.svg,.pdf,.jpg,.jpeg,.ai,.eps"
                  onChange={e => setArchivo(e.target.files[0])} />
              </div>
              <p className="text-xs text-gray-400">Con tu logo generamos un mockup gratuito adjunto a la propuesta.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">Notas adicionales</label>
              <textarea value={form.notes} onChange={e => update('notes', e.target.value)}
                placeholder="Packaging personalizado, colores, instrucciones especiales..."
                className="w-full border border-gray-200 bg-gray-50 focus:bg-white rounded-xl px-3 py-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-[#0F8B6C]/20 transition" />
            </div>

            <Button type="submit" size="lg" className="w-full font-semibold rounded-2xl h-13 shadow-lg gap-2"
              style={{ backgroundColor: '#0F8B6C' }} disabled={loading}>
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Enviando...</>
              ) : '📋 Solicitar cotización — respondemos en <24h'}
            </Button>

            <div className="text-center space-y-1.5">
              <p className="text-sm text-gray-400">¿Prefieres WhatsApp directo?</p>
              <a href="https://wa.me/56935040242?text=Hola%2C%20me%20interesa%20una%20cotizaci%C3%B3n%20corporativa%20de%20Peyu"
                target="_blank" rel="noopener noreferrer"
                className="text-sm text-[#0F8B6C] font-semibold hover:underline flex items-center justify-center gap-1.5">
                <MessageCircle className="w-4 h-4" /> +56 9 3504 0242
              </a>
            </div>
          </form>
        </div>

        {/* Social proof */}
        <div className="text-center text-sm text-gray-400 py-4">
          Clientes que confían en Peyu: <span className="font-semibold text-gray-700">Adidas · Nestlé · BancoEstado · DUOC UC · UAI</span>
        </div>
      </div>
    </div>
  );
}