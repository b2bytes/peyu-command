import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle, Upload, Zap } from 'lucide-react';

const PRODUCTOS = [
  { id: 'soporte-cel', nombre: 'Soporte Celular', emoji: '📱', precio: 6990, area: '40×20mm' },
  { id: 'posavaso', nombre: 'Posavaso Circular', emoji: '🟢', precio: 3990, area: '35×35mm' },
  { id: 'macetero', nombre: 'Macetero Escritorio', emoji: '🌱', precio: 5990, area: '30×15mm' },
  { id: 'llavero', nombre: 'Llavero Soporte', emoji: '🔑', precio: 2990, area: '20×10mm' },
];

const COLORES = [
  { id: 'negro', label: 'Negro Carbón', hex: '#1a1a1a' },
  { id: 'arena', label: 'Arena Natural', hex: '#E7D8C6' },
  { id: 'verde', label: 'Verde Reciclado', hex: '#0F8B6C' },
  { id: 'gris', label: 'Gris Marmolado', hex: '#8B8B8B' },
  { id: 'coral', label: 'Coral Terracota', hex: '#D96B4D' },
];

function StepIndicator({ step, total }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`rounded-full transition-all duration-300 ${i < step ? 'bg-[#006D5B] w-6 h-2' : i === step ? 'bg-[#006D5B] w-8 h-2' : 'bg-border w-6 h-2'}`} />
      ))}
    </div>
  );
}

function LaserPreview({ texto, productoId, colorId }) {
  const prod = PRODUCTOS.find(p => p.id === productoId);
  const color = COLORES.find(c => c.id === colorId);
  const isDark = ['negro', 'verde'].includes(colorId);
  return (
    <div className="relative mx-auto w-48 h-48 rounded-2xl flex items-center justify-center shadow-xl border border-white/20"
      style={{ backgroundColor: color?.hex || '#1a1a1a' }}>
      <div className="text-center">
        <div className="text-4xl mb-2">{prod?.emoji}</div>
        {texto && (
          <div
            className="font-bold text-xs px-3 py-1 rounded border tracking-widest"
            style={{
              color: isDark ? '#D4AF37' : '#2a1a00',
              borderColor: isDark ? '#D4AF37' : '#2a1a00',
              backgroundColor: 'transparent',
              textShadow: isDark ? '0 0 8px #D4AF37' : 'none',
            }}
          >
            {texto.toUpperCase()}
          </div>
        )}
        {prod?.area && (
          <div className={`text-xs mt-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
            Área láser: {prod.area}
          </div>
        )}
      </div>
      {/* Laser glow effect */}
      {texto && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{ boxShadow: isDark ? 'inset 0 0 30px rgba(212,175,55,0.1)' : 'none' }} />
      )}
    </div>
  );
}

export default function PersonalizacionFlow() {
  const [step, setStep] = useState(0);
  const [productoId, setProductoId] = useState('soporte-cel');
  const [colorId, setColorId] = useState('negro');
  const [texto, setTexto] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const producto = PRODUCTOS.find(p => p.id === productoId);
  const color = COLORES.find(c => c.id === colorId);

  const handleSubmit = async () => {
    setLoading(true);
    let logoUrl = '';
    if (archivo) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: archivo });
      logoUrl = file_url;
    }
    await base44.entities.PersonalizationJob.create({
      source_type: 'Pedido B2C',
      product_name: producto?.nombre || '',
      sku: productoId,
      quantity: 1,
      laser_required: true,
      laser_text: texto,
      logo_url: logoUrl,
      color_producto: color?.label || '',
      status: 'Pendiente',
      customer_name: nombre,
      customer_email: email,
      estimated_minutes: 5,
    });
    // Send WhatsApp-like notification via email
    if (email) {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: '✨ ¡Tu personalización Peyu está en cola!',
        body: `<div style="font-family:Inter,Arial,sans-serif;padding:20px;max-width:500px">
          <h2 style="color:#006D5B">Tu grabado láser está en proceso 🌿</h2>
          <p>Hola <strong>${nombre}</strong>, recibimos tu pedido de personalización:</p>
          <ul>
            <li><strong>Producto:</strong> ${producto?.nombre}</li>
            <li><strong>Color:</strong> ${color?.label}</li>
            ${texto ? `<li><strong>Texto a grabar:</strong> ${texto}</li>` : ''}
            ${logoUrl ? '<li><strong>Logo:</strong> Recibido ✓</li>' : ''}
          </ul>
          <p>Nuestro equipo se contactará en ${telefono ? 'menos de 1 hora' : '24 horas'} para coordinar el retiro o despacho.</p>
          <p style="color:#9ca3af;font-size:12px">Peyu Chile · +56 9 3504 0242</p>
        </div>`,
        from_name: 'Peyu Chile Personalización',
      });
    }
    setLoading(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-[#006D5B]" />
          </div>
          <h2 className="text-2xl font-bold font-poppins">¡Personalización creada!</h2>
          <div className="bg-white rounded-xl p-5 border border-border text-sm text-left space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full" style={{ backgroundColor: color?.hex }} />
              <div>
                <div className="font-semibold">{producto?.nombre}</div>
                <div className="text-xs text-muted-foreground">{color?.label}{texto ? ` · "${texto}"` : ''}</div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-green-700 text-xs">
              <strong>¿Qué sigue?</strong><br />
              Nuestro equipo te contactará pronto para coordinar el pago y entrega.
            </div>
          </div>
          <a href={`https://wa.me/56935040242?text=${encodeURIComponent(`Hola, hice un pedido de personalización de ${producto?.nombre} con texto "${texto}". Soy ${nombre}.`)}`} target="_blank" rel="noopener noreferrer">
            <Button className="w-full gap-2" style={{ backgroundColor: '#25D366' }}>
              💬 Coordinar por WhatsApp
            </Button>
          </a>
          <Link to="/shop"><Button variant="outline" className="w-full">Seguir comprando</Button></Link>
        </div>
      </div>
    );
  }

  const steps = [
    // Step 0 — Product
    <div key="prod" className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold font-poppins mb-1">Elige tu producto</h2>
        <p className="text-muted-foreground text-sm">100% plástico reciclado · Grabado láser UV</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {PRODUCTOS.map(p => (
          <button key={p.id} onClick={() => setProductoId(p.id)}
            className={`p-4 rounded-xl border-2 transition text-left ${productoId === p.id ? 'border-[#006D5B] bg-green-50' : 'border-border hover:border-[#006D5B]'}`}>
            <div className="text-3xl mb-2">{p.emoji}</div>
            <div className="font-semibold text-sm">{p.nombre}</div>
            <div className="text-[#006D5B] font-bold text-sm">${p.precio.toLocaleString('es-CL')}</div>
          </button>
        ))}
      </div>
    </div>,

    // Step 1 — Color
    <div key="color" className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold font-poppins mb-1">Elige el color</h2>
        <p className="text-muted-foreground text-sm">Todos son plástico reciclado con marmolado único</p>
      </div>
      <div className="space-y-2">
        {COLORES.map(c => (
          <button key={c.id} onClick={() => setColorId(c.id)}
            className={`w-full flex items-center gap-4 p-3.5 rounded-xl border-2 transition ${colorId === c.id ? 'border-[#006D5B] bg-green-50' : 'border-border hover:border-[#006D5B]'}`}>
            <div className="w-8 h-8 rounded-full border-2 border-white shadow" style={{ backgroundColor: c.hex }} />
            <span className="font-medium text-sm">{c.label}</span>
            {colorId === c.id && <CheckCircle className="w-4 h-4 text-[#006D5B] ml-auto" />}
          </button>
        ))}
      </div>
    </div>,

    // Step 2 — Personalización
    <div key="pers" className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold font-poppins mb-1">Tu personalización</h2>
        <p className="text-muted-foreground text-sm">Grabado láser UV permanente e irrepetible</p>
      </div>
      <LaserPreview texto={texto} productoId={productoId} colorId={colorId} />
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Texto a grabar (máx. 20 caracteres)</label>
          <Input
            value={texto}
            onChange={e => setTexto(e.target.value.slice(0, 20))}
            placeholder="Tu nombre, empresa, frase..."
            className="text-center font-medium tracking-wide"
          />
          <p className="text-xs text-muted-foreground text-right">{texto.length}/20</p>
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
          <div className="relative flex justify-center"><span className="bg-[#F7F7F5] px-3 text-xs text-muted-foreground">o sube tu logo</span></div>
        </div>
        <div
          className="border-2 border-dashed border-border rounded-xl p-5 text-center cursor-pointer hover:border-[#006D5B] transition"
          onClick={() => document.getElementById('pers-logo').click()}
        >
          <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          {archivo ? (
            <p className="text-sm text-[#006D5B] font-medium">✓ {archivo.name}</p>
          ) : (
            <p className="text-sm text-muted-foreground">PNG, SVG, AI · Subir logo</p>
          )}
          <input id="pers-logo" type="file" className="hidden" accept=".png,.svg,.ai,.pdf,.jpg"
            onChange={e => setArchivo(e.target.files[0])} />
        </div>
      </div>
    </div>,

    // Step 3 — Datos contacto
    <div key="datos" className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold font-poppins mb-1">Tus datos</h2>
        <p className="text-muted-foreground text-sm">Para coordinar el pago y entrega</p>
      </div>
      {/* Resumen */}
      <div className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
          style={{ backgroundColor: color?.hex + '20' }}>
          {producto?.emoji}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm">{producto?.nombre}</div>
          <div className="text-xs text-muted-foreground">{color?.label}{texto ? ` · "${texto}"` : ''}</div>
        </div>
        <div className="font-bold text-[#006D5B]">${producto?.precio.toLocaleString('es-CL')}</div>
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Tu nombre *</label>
          <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre completo" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Email *</label>
          <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@correo.cl" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">WhatsApp (opcional)</label>
          <Input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="+56 9 xxxx xxxx" />
        </div>
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <Link to="/shop" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          )}
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#006D5B]" />
            <span className="font-bold text-[#006D5B] font-poppins">Personalización Láser</span>
          </div>
          <span className="ml-auto text-xs text-muted-foreground">Paso {step + 1}/4</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <StepIndicator step={step} total={4} />
        {steps[step]}

        <div className="mt-8">
          {step < 3 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              className="w-full gap-2 font-semibold"
              style={{ backgroundColor: '#006D5B' }}
              size="lg"
              disabled={step === 2 && !texto && !archivo}
            >
              Continuar <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="w-full gap-2 font-semibold"
              style={{ backgroundColor: '#006D5B' }}
              size="lg"
              disabled={loading || !nombre || !email}
            >
              <Zap className="w-4 h-4" />
              {loading ? 'Enviando...' : 'Confirmar personalización'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}