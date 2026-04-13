import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MessageCircle, Upload, CheckCircle, Building2, Package, Clock, Leaf } from 'lucide-react';

const FEATURES = [
  { icon: Leaf, label: 'Personalización gratis', sub: 'Láser UV desde 10 u.' },
  { icon: Clock, label: 'Propuesta en <24h', sub: 'Con mockup de tu logo' },
  { icon: Package, label: 'Entrega en 7 días', sub: 'Fabricación local Chile' },
];

const PRODUCTOS_CORPORATIVOS = [
  'Kit Escritorio (5 piezas)',
  'Posavasos Corporativos',
  'Maceteros Corporativos',
  'Cachos / Cubiletes',
  'Lámparas Corporativas',
  'Paletas Corporativas',
  'Otro / Consultar',
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
    contact_name: '',
    company_name: '',
    email: '',
    phone: '',
    rut: '',
    product_interest: productoNombre || '',
    qty_estimate: '',
    delivery_date: '',
    personalization_needs: false,
    has_plastic: false,
    notes: '',
    source: 'Formulario Web',
    status: 'Nuevo',
    urgency: 'Normal',
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
    try {
      let logoUrl = '';
      if (archivo) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: archivo });
        logoUrl = file_url;
      }
      const score = calcularScore({ ...form, qty_estimate: Number(form.qty_estimate) || 0 }, !!archivo);
      const urgency = score >= 70 ? 'Alta' : score >= 40 ? 'Normal' : 'Baja';

      const leadCreado = await base44.entities.B2BLead.create({
        ...form,
        qty_estimate: Number(form.qty_estimate) || 0,
        lead_score: score,
        logo_url: logoUrl,
        brief_url: logoUrl,
        urgency,
        utm_source: document.referrer || 'directo',
      });
      // Enrich score async with AI (non-blocking)
      if (leadCreado?.id) {
        base44.functions.invoke('scoreLead', { leadId: leadCreado.id }).catch(() => {});
      }
      setEnviado(true);
    } catch {
      setError('Error al enviar la solicitud. Inténtalo de nuevo o escríbenos por WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-[#006D5B]" />
          </div>
          <h2 className="text-2xl font-bold font-poppins">¡Solicitud enviada!</h2>
          <p className="text-muted-foreground">
            Carlos del equipo Peyu te contactará en menos de 24 horas con una propuesta personalizada con mockups de tu logo.
          </p>
          <div className="bg-white rounded-xl p-5 border border-border text-sm text-left space-y-3">
            <p className="font-semibold text-[#006D5B]">¿Necesitas respuesta urgente?</p>
            <p className="text-muted-foreground">Escríbenos directamente por WhatsApp y menciona que enviaste la solicitud web:</p>
            <a
              href="https://wa.me/56935040242?text=Hola%2C%20acabo%20de%20enviar%20una%20solicitud%20de%20cotizaci%C3%B3n%20corporativa%20por%20la%20web%20de%20Peyu"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full gap-2 bg-green-600 hover:bg-green-700">
                <MessageCircle className="w-4 h-4" />
                Abrir WhatsApp
              </Button>
            </a>
          </div>
          <Link to="/shop">
            <Button variant="outline" className="w-full">Ver catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to={productoId ? `/producto/${productoId}` : '/shop'}>
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
          </Link>
          <span className="text-muted-foreground text-sm">|</span>
          <div>
            <span className="font-bold text-[#006D5B] font-poppins">PEYU</span>
            <span className="text-xs text-muted-foreground ml-2">Ventas Corporativas</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-green-50 text-[#006D5B] px-4 py-1.5 rounded-full text-sm font-medium mb-3">
            <Building2 className="w-4 h-4" /> Cotización Corporativa B2B
          </div>
          <h1 className="text-3xl font-bold font-poppins mb-2">Regalos corporativos con impacto</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Transformamos residuos plásticos en regalos únicos personalizados con tu logo. Fabricación local en Chile, personalización láser UV gratuita.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3">
          {FEATURES.map((f, i) => (
            <div key={i} className="bg-white rounded-xl p-4 text-center border border-border">
              <f.icon className="w-5 h-5 text-[#006D5B] mx-auto mb-1" />
              <div className="font-semibold text-sm font-poppins">{f.label}</div>
              <div className="text-xs text-muted-foreground">{f.sub}</div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-border p-6 md:p-8">
          <h2 className="font-bold text-lg font-poppins mb-6">Solicitar cotización</h2>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Datos contacto */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Nombre contacto *</label>
                <Input value={form.contact_name} onChange={e => update('contact_name', e.target.value)} placeholder="Tu nombre" required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Empresa *</label>
                <Input value={form.company_name} onChange={e => update('company_name', e.target.value)} placeholder="Nombre de la empresa" required />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Email *</label>
                <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="correo@empresa.cl" required />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Teléfono / WhatsApp *</label>
                <Input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+56 9 xxxx xxxx" required />
              </div>
            </div>

            {/* Pedido */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Producto de interés</label>
                <select
                  value={form.product_interest}
                  onChange={e => update('product_interest', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="">Seleccionar producto...</option>
                  {PRODUCTOS_CORPORATIVOS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Cantidad estimada (u)</label>
                <Input
                  type="number"
                  value={form.qty_estimate}
                  onChange={e => update('qty_estimate', e.target.value)}
                  placeholder="Ej: 50, 100, 500"
                  min="1"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">RUT Empresa</label>
                <Input value={form.rut} onChange={e => update('rut', e.target.value)} placeholder="12.345.678-9" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Fecha requerida</label>
                <Input
                  type="date"
                  value={form.delivery_date}
                  onChange={e => update('delivery_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="grid md:grid-cols-2 gap-3">
              <label className="flex items-start gap-3 p-4 border border-border rounded-xl cursor-pointer hover:border-[#006D5B] transition">
                <input
                  type="checkbox"
                  checked={form.personalization_needs}
                  onChange={e => update('personalization_needs', e.target.checked)}
                  className="mt-0.5 accent-[#006D5B]"
                />
                <div>
                  <div className="font-medium text-sm">Requiero personalización con logo</div>
                  <div className="text-xs text-muted-foreground">Grabado láser UV · gratis desde 10 u.</div>
                </div>
              </label>
              <label className="flex items-start gap-3 p-4 border border-border rounded-xl cursor-pointer hover:border-[#006D5B] transition">
                <input
                  type="checkbox"
                  checked={form.has_plastic}
                  onChange={e => update('has_plastic', e.target.checked)}
                  className="mt-0.5 accent-[#006D5B]"
                />
                <div>
                  <div className="font-medium text-sm">Tengo plástico para reciclar</div>
                  <div className="text-xs text-muted-foreground">Economía circular real con tus residuos</div>
                </div>
              </label>
            </div>

            {/* Logo upload */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Sube tu logo o brief (opcional pero recomendado)</label>
              <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-[#006D5B] transition cursor-pointer"
                onClick={() => document.getElementById('logo-upload').click()}
              >
                <Upload className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
                {archivo ? (
                  <p className="text-sm text-[#006D5B] font-medium">✓ {archivo.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium">Arrastra tu archivo o haz clic</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, SVG, PDF, AI, EPS · max 10MB</p>
                  </>
                )}
                <input
                  id="logo-upload"
                  type="file"
                  className="hidden"
                  accept=".png,.svg,.pdf,.jpg,.jpeg,.ai,.eps,.xlsx,.xls"
                  onChange={e => setArchivo(e.target.files[0])}
                />
              </div>
              <p className="text-xs text-muted-foreground">Con tu logo generamos un mockup gratuito y lo adjuntamos a la propuesta.</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Notas adicionales</label>
              <textarea
                value={form.notes}
                onChange={e => update('notes', e.target.value)}
                placeholder="Packaging personalizado, colores específicos, instrucciones especiales..."
                className="w-full border border-input rounded-md px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-1 focus:ring-ring bg-transparent"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full font-semibold"
              style={{ backgroundColor: '#006D5B' }}
              disabled={loading}
            >
              {loading ? 'Enviando solicitud...' : 'Solicitar cotización — respondemos en <24h'}
            </Button>

            <div className="text-center space-y-1">
              <p className="text-sm text-muted-foreground">¿Prefieres WhatsApp directo?</p>
              <a
                href="https://wa.me/56935040242?text=Hola%2C%20me%20interesa%20una%20cotizaci%C3%B3n%20corporativa%20de%20Peyu"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#006D5B] font-medium hover:underline flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                +56 9 3504 0242
              </a>
            </div>
          </form>
        </div>

        {/* Social proof */}
        <div className="text-center text-sm text-muted-foreground py-4">
          Clientes que confían en Peyu: <span className="font-medium text-foreground">Adidas · Nestlé · BancoEstado · DUOC UC · UAI</span>
        </div>
      </div>
    </div>
  );
}