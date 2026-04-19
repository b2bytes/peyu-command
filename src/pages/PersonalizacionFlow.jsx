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
        <div key={i} className={`rounded-full transition-all duration-300 ${i < step ? 'bg-[#0F8B6C] w-6 h-2' : i === step ? 'bg-gray-900 w-8 h-2' : 'bg-gray-200 w-6 h-2'}`} />
      ))}
    </div>
  );
}

function LaserPreview({ texto, productoId, colorId }) {
  const prod = PRODUCTOS.find(p => p.id === productoId);
  const color = COLORES.find(c => c.id === colorId);
  const isDark = ['negro', 'verde', 'gris', 'coral'].includes(colorId);
  return (
    <div className="relative mx-auto w-52 h-52 rounded-3xl flex items-center justify-center shadow-2xl border border-white/10 overflow-hidden"
      style={{ backgroundColor: color?.hex || '#1a1a1a' }}>
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />
      <div className="relative text-center">
        <div className="text-5xl mb-3">{prod?.emoji}</div>
        {texto && (
          <div className="font-bold text-xs px-3 py-1.5 rounded-lg border tracking-widest"
            style={{ color: isDark ? '#D4AF37' : '#2a1a00', borderColor: isDark ? '#D4AF3780' : '#2a1a0040', backgroundColor: 'transparent', textShadow: isDark ? '0 0 10px #D4AF37' : 'none' }}>
            {texto.toUpperCase()}
          </div>
        )}
        {prod?.area && (
          <div className={`text-[10px] mt-2 font-medium ${isDark ? 'text-white/30' : 'text-black/30'}`}>
            Área láser: {prod.area}
          </div>
        )}
      </div>
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
    const job = await base44.entities.PersonalizationJob.create({
      source_type: 'Pedido B2C', product_name: producto?.nombre || '', sku: productoId,
      quantity: 1, laser_required: true, laser_text: texto, logo_url: logoUrl,
      color_producto: color?.label || '', status: 'Pendiente',
      customer_name: nombre, customer_email: email, estimated_minutes: 5,
    });
    // Generar mockup real con IA en background (no bloquea confirmación)
    if (job?.id && (logoUrl || texto)) {
      base44.functions.invoke('generateMockup', {
        productName: producto?.nombre, productCategory: 'Personalización',
        sku: productoId, logoUrl, text: texto, color: color?.label,
        jobId: job.id,
      }).catch(() => {});
    }
    if (email) {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: '✨ ¡Tu personalización Peyu está en cola!',
        body: `<div style="font-family:Inter,Arial,sans-serif;padding:20px;max-width:500px"><h2 style="color:#0F8B6C">Tu grabado láser está en proceso 🌿</h2><p>Hola <strong>${nombre}</strong>, recibimos tu pedido de personalización:</p><ul><li><strong>Producto:</strong> ${producto?.nombre}</li><li><strong>Color:</strong> ${color?.label}</li>${texto ? `<li><strong>Texto a grabar:</strong> ${texto}</li>` : ''}${logoUrl ? '<li><strong>Logo:</strong> Recibido ✓</li>' : ''}</ul><p>Nuestro equipo se contactará pronto para coordinar el pago y entrega.</p><p style="color:#9ca3af;font-size:12px">Peyu Chile · +56 9 3504 0242</p></div>`,
        from_name: 'Peyu Chile Personalización',
      });
    }
    setLoading(false);
    setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] font-inter flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center space-y-5">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#0F8B6C] to-[#A7D9C9] flex items-center justify-center mx-auto shadow-lg shadow-[#0F8B6C]/20">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-poppins font-bold text-gray-900">¡Personalización creada!</h2>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 text-sm text-left space-y-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: color?.hex + '25' }}>{producto?.emoji}</div>
              <div>
                <div className="font-semibold text-gray-900">{producto?.nombre}</div>
                <div className="text-xs text-gray-400">{color?.label}{texto ? ` · "${texto}"` : ''}</div>
              </div>
            </div>
            <div className="bg-[#0F8B6C]/8 border border-[#0F8B6C]/20 rounded-xl p-3 text-[#0F8B6C] text-xs">
              <strong>¿Qué sigue?</strong><br />Nuestro equipo te contactará pronto para coordinar el pago y entrega.
            </div>
          </div>
          <a href={`https://wa.me/56935040242?text=${encodeURIComponent(`Hola, hice un pedido de personalización de ${producto?.nombre} con texto "${texto}". Soy ${nombre}.`)}`} target="_blank" rel="noopener noreferrer">
            <Button className="w-full gap-2 rounded-2xl font-semibold" style={{ backgroundColor: '#25D366' }}>
              💬 Coordinar por WhatsApp
            </Button>
          </a>
          <Link to="/shop"><Button variant="outline" className="w-full rounded-2xl">Seguir comprando</Button></Link>
        </div>
      </div>
    );
  }

  const steps = [
    // Step 0 — Producto
    <div key="prod" className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-poppins font-bold text-gray-900 mb-1">Elige tu producto</h2>
        <p className="text-gray-400 text-sm">100% plástico reciclado · Grabado láser UV</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {PRODUCTOS.map(p => (
          <button key={p.id} onClick={() => setProductoId(p.id)}
            className={`p-4 rounded-2xl border-2 transition-all text-left hover:-translate-y-0.5 ${productoId === p.id ? 'border-gray-900 bg-gray-900 text-white shadow-lg' : 'border-gray-200 bg-white hover:border-gray-900'}`}>
            <div className="text-3xl mb-2">{p.emoji}</div>
            <div className={`font-semibold text-sm ${productoId === p.id ? 'text-white' : 'text-gray-900'}`}>{p.nombre}</div>
            <div className={`font-bold text-sm mt-0.5 ${productoId === p.id ? 'text-[#A7D9C9]' : 'text-[#0F8B6C]'}`}>${p.precio.toLocaleString('es-CL')}</div>
          </button>
        ))}
      </div>
    </div>,

    // Step 1 — Color
    <div key="color" className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-poppins font-bold text-gray-900 mb-1">Elige el color</h2>
        <p className="text-gray-400 text-sm">Cada marmolado es único e irrepetible</p>
      </div>
      <div className="space-y-2">
        {COLORES.map(c => (
          <button key={c.id} onClick={() => setColorId(c.id)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${colorId === c.id ? 'border-gray-900 bg-gray-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-400'}`}>
            <div className="w-9 h-9 rounded-xl border-2 border-white shadow-md flex-shrink-0" style={{ backgroundColor: c.hex }} />
            <span className="font-semibold text-sm text-gray-900">{c.label}</span>
            {colorId === c.id && <CheckCircle className="w-4 h-4 text-[#0F8B6C] ml-auto" />}
          </button>
        ))}
      </div>
    </div>,

    // Step 2 — Personalización
    <div key="pers" className="space-y-5">
      <div className="text-center">
        <h2 className="text-2xl font-poppins font-bold text-gray-900 mb-1">Tu personalización</h2>
        <p className="text-gray-400 text-sm">Grabado láser UV permanente e irrepetible</p>
      </div>
      <LaserPreview texto={texto} productoId={productoId} colorId={colorId} />
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-gray-400 block mb-1.5">Texto a grabar (máx. 20 caracteres)</label>
          <Input value={texto} onChange={e => setTexto(e.target.value.slice(0, 20))}
            placeholder="Tu nombre, empresa, frase..."
            className="text-center font-bold tracking-widest h-11 rounded-xl border-gray-200 bg-gray-50 focus:bg-white" />
          <p className="text-xs text-gray-300 text-right mt-1">{texto.length}/20</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400 font-medium">o sube tu logo</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>
        <div className="border-2 border-dashed border-gray-200 hover:border-[#0F8B6C] rounded-2xl p-5 text-center cursor-pointer transition-colors"
          onClick={() => document.getElementById('pers-logo').click()}>
          <Upload className="w-6 h-6 text-gray-300 mx-auto mb-2" />
          {archivo ? (
            <p className="text-sm text-[#0F8B6C] font-semibold">✓ {archivo.name}</p>
          ) : (
            <p className="text-sm text-gray-400">PNG, SVG, AI · Subir logo</p>
          )}
          <input id="pers-logo" type="file" className="hidden" accept=".png,.svg,.ai,.pdf,.jpg"
            onChange={e => setArchivo(e.target.files[0])} />
        </div>
      </div>
    </div>,

    // Step 3 — Datos
    <div key="datos" className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-poppins font-bold text-gray-900 mb-1">Tus datos</h2>
        <p className="text-gray-400 text-sm">Para coordinar el pago y entrega</p>
      </div>
      {/* Resumen */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: color?.hex + '20' }}>{producto?.emoji}</div>
        <div className="flex-1">
          <div className="font-semibold text-sm text-gray-900">{producto?.nombre}</div>
          <div className="text-xs text-gray-400">{color?.label}{texto ? ` · "${texto}"` : ''}</div>
        </div>
        <div className="font-poppins font-bold text-gray-900">${producto?.precio.toLocaleString('es-CL')}</div>
      </div>
      <div className="space-y-3">
        {[
          { label: 'Tu nombre *', value: nombre, onChange: setNombre, placeholder: 'Nombre completo' },
          { label: 'Email *', value: email, onChange: setEmail, placeholder: 'tu@correo.cl', type: 'email' },
          { label: 'WhatsApp (opcional)', value: telefono, onChange: setTelefono, placeholder: '+56 9 xxxx xxxx' },
        ].map(f => (
          <div key={f.label}>
            <label className="text-xs font-semibold text-gray-400 block mb-1.5">{f.label}</label>
            <Input type={f.type || 'text'} value={f.value} onChange={e => f.onChange(e.target.value)}
              placeholder={f.placeholder}
              className="h-11 text-sm rounded-xl border-gray-200 bg-gray-50 focus:bg-white" />
          </div>
        ))}
      </div>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-inter">

      {/* ── NAVBAR ─────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 shadow-sm">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center gap-3">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
          ) : (
            <Link to="/shop" className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200 transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </Link>
          )}
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-yellow-500" />
            <span className="font-poppins font-bold text-gray-900">Personalización Láser</span>
          </div>
          <span className="ml-auto text-xs text-gray-400 font-medium">Paso {step + 1}/4</span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-5 py-8">
        <StepIndicator step={step} total={4} />
        {steps[step]}

        <div className="mt-8">
          {step < 3 ? (
            <Button onClick={() => setStep(s => s + 1)} size="lg"
              className="w-full gap-2 font-semibold rounded-2xl bg-gray-900 hover:bg-gray-800 shadow-lg h-13"
              disabled={step === 2 && !texto && !archivo}>
              Continuar <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} size="lg"
              className="w-full gap-2 font-semibold rounded-2xl bg-[#0F8B6C] hover:bg-[#0a7558] shadow-lg shadow-[#0F8B6C]/20 h-13"
              disabled={loading || !nombre || !email}>
              <Zap className="w-4 h-4" />
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Enviando...</>
              ) : 'Confirmar personalización'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}