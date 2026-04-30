import { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft, ArrowRight, Sparkles, CheckCircle, Upload, Zap, Loader2,
  RefreshCw, Recycle, Package, Palette, Pencil, User, Check, ShieldCheck, Truck
} from 'lucide-react';

const PRODUCTOS = [
  { id: 'soporte-cel', nombre: 'Soporte Celular', emoji: '📱', precio: 6990, area: '40×20mm',
    imageUrl: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/08/IMG_2468-scaled.jpg?fit=600%2C600&ssl=1' },
  { id: 'posavaso', nombre: 'Posavaso Circular', emoji: '🟢', precio: 3990, area: '35×35mm',
    imageUrl: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/08/IMG_2453-scaled.jpg?fit=600%2C600&ssl=1' },
  { id: 'macetero', nombre: 'Macetero Escritorio', emoji: '🌱', precio: 5990, area: '30×15mm',
    imageUrl: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/11/bowlcoverst-Photoroom.jpg?fit=600%2C600&ssl=1' },
  { id: 'llavero', nombre: 'Llavero Soporte', emoji: '🔑', precio: 2990, area: '20×10mm',
    imageUrl: 'https://i0.wp.com/peyuchile.cl/wp-content/uploads/2022/08/IMG_2468-scaled.jpg?fit=600%2C600&ssl=1' },
];

const COLORES = [
  { id: 'negro', label: 'Negro Carbón', hex: '#1a1a1a' },
  { id: 'arena', label: 'Arena Natural', hex: '#E7D8C6' },
  { id: 'verde', label: 'Verde Reciclado', hex: '#0F8B6C' },
  { id: 'gris', label: 'Gris Marmolado', hex: '#8B8B8B' },
  { id: 'coral', label: 'Coral Terracota', hex: '#D96B4D' },
];

const STEP_LABELS = [
  { label: 'Producto', Icon: Package },
  { label: 'Color', Icon: Palette },
  { label: 'Diseño', Icon: Pencil },
  { label: 'Datos', Icon: User },
];

function StepIndicator({ step, total }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-8 max-w-md mx-auto">
      {Array.from({ length: total }).map((_, i) => {
        const { label, Icon } = STEP_LABELS[i];
        const active = i === step;
        const done = i < step;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 ${
              done
                ? 'bg-teal-500/20 border-teal-400/40 text-teal-300'
                : active
                  ? 'bg-gradient-to-br from-teal-500 to-cyan-500 border-teal-400 text-white shadow-lg shadow-teal-500/30 scale-110'
                  : 'bg-white/5 border-white/15 text-white/30'
            }`}>
              {done ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
            </div>
            <span className={`text-[10px] font-bold tracking-wide uppercase ${
              active ? 'text-white' : done ? 'text-teal-300' : 'text-white/30'
            }`}>{label}</span>
            {i < total - 1 && (
              <div className="absolute hidden" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function LaserPreview({ texto, productoId, colorId }) {
  const prod = PRODUCTOS.find(p => p.id === productoId);
  const color = COLORES.find(c => c.id === colorId);
  const isDark = ['negro', 'verde', 'gris', 'coral'].includes(colorId);
  return (
    <div className="relative mx-auto w-56 h-56 rounded-3xl flex items-center justify-center shadow-2xl border border-white/20 overflow-hidden"
      style={{ backgroundColor: color?.hex || '#1a1a1a' }}>
      <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18) 0%, transparent 60%)' }} />
      <div className="relative text-center">
        <div className="text-5xl mb-3 drop-shadow-lg">{prod?.emoji}</div>
        {texto && (
          <div className="font-bold text-xs px-3 py-1.5 rounded-lg border tracking-widest"
            style={{
              color: isDark ? '#D4AF37' : '#2a1a00',
              borderColor: isDark ? '#D4AF3780' : '#2a1a0040',
              backgroundColor: 'transparent',
              textShadow: isDark ? '0 0 12px #D4AF37' : 'none',
              fontFamily: 'monospace'
            }}>
            {texto.toUpperCase()}
          </div>
        )}
        {prod?.area && (
          <div className={`text-[10px] mt-2 font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>
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
  const [logoUrlSubido, setLogoUrlSubido] = useState('');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [mockupUrl, setMockupUrl] = useState('');
  const [mockupLoading, setMockupLoading] = useState(false);
  const [mockupError, setMockupError] = useState('');

  const producto = PRODUCTOS.find(p => p.id === productoId);
  const color = COLORES.find(c => c.id === colorId);

  const resetMockupIfNeeded = () => { if (mockupUrl) setMockupUrl(''); };

  const handleGenerateMockup = async () => {
    if (!texto && !archivo) {
      setMockupError('Agrega un texto o sube tu logo para generar el mockup.');
      return;
    }
    setMockupLoading(true);
    setMockupError('');
    try {
      let logoUrl = logoUrlSubido;
      if (archivo && !logoUrlSubido) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: archivo });
        logoUrl = file_url;
        setLogoUrlSubido(file_url);
      }
      const res = await base44.functions.invoke('generateMockup', {
        productName: producto?.nombre,
        productCategory: 'Personalización',
        productImageUrl: producto?.imageUrl,
        sku: productoId,
        logoUrl,
        text: texto,
        color: color?.label,
      });
      const url = res?.data?.mockup_url;
      if (!url) throw new Error(res?.data?.error || 'No se pudo generar el mockup');
      setMockupUrl(url);
    } catch (e) {
      setMockupError(e.message || 'Error generando mockup');
    } finally {
      setMockupLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    let logoUrl = logoUrlSubido;
    if (archivo && !logoUrlSubido) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: archivo });
      logoUrl = file_url;
    }
    const job = await base44.entities.PersonalizationJob.create({
      source_type: 'Pedido B2C', product_name: producto?.nombre || '', sku: productoId,
      quantity: 1, laser_required: true, laser_text: texto, logo_url: logoUrl,
      color_producto: color?.label || '', status: mockupUrl ? 'Preview generado' : 'Pendiente',
      mockup_urls: mockupUrl ? [mockupUrl] : [],
      customer_name: nombre, customer_email: email, estimated_minutes: 5,
    });
    if (job?.id && !mockupUrl && (logoUrl || texto)) {
      base44.functions.invoke('generateMockup', {
        productName: producto?.nombre, productCategory: 'Personalización',
        productImageUrl: producto?.imageUrl,
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

  // ── PANTALLA DE ÉXITO ────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12 font-inter">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto shadow-2xl shadow-teal-500/40 ring-4 ring-teal-400/20">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-poppins font-bold text-white mb-2">¡Personalización creada!</h2>
            <p className="text-sm text-white/55">Recibirás un email con los próximos pasos</p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/15 rounded-3xl p-5 text-left space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-white/15"
                style={{ backgroundColor: color?.hex + '30' }}>{producto?.emoji}</div>
              <div className="flex-1">
                <div className="font-semibold text-white text-sm">{producto?.nombre}</div>
                <div className="text-xs text-white/50">{color?.label}{texto ? ` · "${texto}"` : ''}</div>
              </div>
              <div className="font-poppins font-bold text-white">${producto?.precio.toLocaleString('es-CL')}</div>
            </div>
            <div className="bg-teal-500/15 border border-teal-400/25 rounded-2xl p-3">
              <p className="text-teal-200 text-xs leading-relaxed">
                <strong className="text-teal-100">¿Qué sigue?</strong><br />
                Nuestro equipo te contactará pronto para coordinar el pago y entrega.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <a
              href={`https://wa.me/56935040242?text=${encodeURIComponent(`Hola, hice un pedido de personalización de ${producto?.nombre} con texto "${texto}". Soy ${nombre}.`)}`}
              target="_blank" rel="noopener noreferrer">
              <Button className="w-full h-12 gap-2 rounded-2xl font-bold bg-green-500 hover:bg-green-600 text-white border-0 shadow-lg shadow-green-500/30">
                💬 Coordinar por WhatsApp
              </Button>
            </a>
            <Link to="/shop">
              <Button className="w-full h-12 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold">
                Seguir comprando
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── STEPS DEL FLUJO ───────────────────────────────────────────────────
  const steps = [
    // ── Step 0 — Producto ───────────────────────────────────────────
    <div key="prod" className="space-y-5">
      <div className="text-center">
        <p className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-2">Paso 1 · Elige tu base</p>
        <h2 className="text-2xl sm:text-3xl font-poppins font-bold text-white mb-2">¿Qué quieres personalizar?</h2>
        <p className="text-white/50 text-sm flex items-center justify-center gap-1.5">
          <Recycle className="w-3.5 h-3.5 text-teal-400" />
          100% plástico reciclado · Grabado láser UV
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {PRODUCTOS.map(p => {
          const sel = productoId === p.id;
          return (
            <button key={p.id} onClick={() => { setProductoId(p.id); setMockupUrl(''); }}
              className={`relative p-4 rounded-2xl border-2 transition-all text-left hover:-translate-y-0.5 hover:scale-[1.02] backdrop-blur-sm ${
                sel
                  ? 'border-teal-400 bg-gradient-to-br from-teal-500/25 to-cyan-500/20 shadow-xl shadow-teal-500/20'
                  : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10'
              }`}>
              {sel && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-teal-400 flex items-center justify-center shadow-lg">
                  <Check className="w-3 h-3 text-slate-900" strokeWidth={3} />
                </div>
              )}
              <div className="text-3xl mb-2 drop-shadow">{p.emoji}</div>
              <div className={`font-semibold text-sm leading-tight ${sel ? 'text-white' : 'text-white/85'}`}>{p.nombre}</div>
              <div className={`font-poppins font-bold text-base mt-1 ${sel ? 'text-teal-300' : 'text-white'}`}>
                ${p.precio.toLocaleString('es-CL')}
              </div>
              <div className="text-[10px] text-white/40 mt-1">Área: {p.area}</div>
            </button>
          );
        })}
      </div>
    </div>,

    // ── Step 1 — Color ──────────────────────────────────────────────
    <div key="color" className="space-y-5">
      <div className="text-center">
        <p className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-2">Paso 2 · Tu paleta</p>
        <h2 className="text-2xl sm:text-3xl font-poppins font-bold text-white mb-2">Elige el color</h2>
        <p className="text-white/50 text-sm">Cada marmolado es único e irrepetible</p>
      </div>
      <div className="space-y-2.5">
        {COLORES.map(c => {
          const sel = colorId === c.id;
          return (
            <button key={c.id} onClick={() => { setColorId(c.id); setMockupUrl(''); }}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all backdrop-blur-sm ${
                sel
                  ? 'border-teal-400 bg-gradient-to-r from-teal-500/20 to-cyan-500/15 shadow-lg shadow-teal-500/15'
                  : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10'
              }`}>
              <div className="w-11 h-11 rounded-xl border-2 border-white/40 shadow-md flex-shrink-0" style={{ backgroundColor: c.hex }} />
              <span className="font-semibold text-sm text-white flex-1 text-left">{c.label}</span>
              {sel && (
                <div className="w-6 h-6 rounded-full bg-teal-400 flex items-center justify-center shadow">
                  <Check className="w-3.5 h-3.5 text-slate-900" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>,

    // ── Step 2 — Diseño + Mockup IA ─────────────────────────────────
    <div key="pers" className="space-y-5">
      <div className="text-center">
        <p className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-2">Paso 3 · Tu diseño</p>
        <h2 className="text-2xl sm:text-3xl font-poppins font-bold text-white mb-2">Personaliza tu producto</h2>
        <p className="text-white/50 text-sm">Grabado láser UV permanente</p>
      </div>

      {/* Preview */}
      {mockupUrl ? (
        <div className="relative rounded-3xl overflow-hidden border border-white/20 bg-white/5 shadow-2xl">
          <img src={mockupUrl} alt="Mockup generado con IA" className="w-full h-auto" />
          <div className="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
            <Sparkles className="w-3 h-3" /> Generado con IA
          </div>
        </div>
      ) : (
        <div className="bg-white/5 backdrop-blur-sm border border-white/15 rounded-3xl p-6 shadow-xl">
          <LaserPreview texto={texto} productoId={productoId} colorId={colorId} />
          <p className="text-center text-[10px] text-white/40 mt-3">Vista previa simplificada</p>
        </div>
      )}

      <div className="space-y-3">
        {/* Texto */}
        <div>
          <label className="text-xs font-bold text-white/70 uppercase tracking-wider block mb-2">
            Texto a grabar (máx. 20)
          </label>
          <Input
            value={texto}
            onChange={e => { setTexto(e.target.value.slice(0, 20)); resetMockupIfNeeded(); }}
            placeholder="Tu nombre, empresa, frase..."
            className="text-center font-bold tracking-widest h-12 rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:bg-white/15 focus:border-teal-400/50 focus:ring-teal-400/20" />
          <p className={`text-xs text-right mt-1 font-bold ${texto.length >= 18 ? 'text-orange-400' : 'text-white/40'}`}>
            {texto.length}/20
          </p>
        </div>

        {/* Separador */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/15" />
          <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">o sube tu logo</span>
          <div className="flex-1 h-px bg-white/15" />
        </div>

        {/* Upload */}
        <div
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all backdrop-blur-sm ${
            archivo
              ? 'border-teal-400/50 bg-teal-500/10'
              : 'border-white/20 bg-white/5 hover:border-teal-400/40 hover:bg-white/10'
          }`}
          onClick={() => document.getElementById('pers-logo').click()}>
          <Upload className={`w-7 h-7 mx-auto mb-2 ${archivo ? 'text-teal-400' : 'text-white/40'}`} />
          {archivo ? (
            <p className="text-sm text-teal-300 font-bold">✓ {archivo.name}</p>
          ) : (
            <p className="text-sm text-white/50">PNG, SVG, AI · Subir tu logo</p>
          )}
          <input id="pers-logo" type="file" className="hidden" accept=".png,.svg,.ai,.pdf,.jpg"
            onChange={e => { setArchivo(e.target.files[0]); setLogoUrlSubido(''); resetMockupIfNeeded(); }} />
        </div>

        {/* Botón mockup IA */}
        <Button
          type="button"
          onClick={handleGenerateMockup}
          disabled={mockupLoading || (!texto && !archivo)}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold gap-2 shadow-lg shadow-purple-500/30 border-0 disabled:opacity-50">
          {mockupLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generando con IA... (~15s)</>
          ) : mockupUrl ? (
            <><RefreshCw className="w-4 h-4" /> Regenerar mockup</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Ver mockup realista con IA</>
          )}
        </Button>

        {mockupError && (
          <div className="bg-red-500/15 border border-red-400/30 text-red-300 text-xs rounded-xl px-3 py-2.5">
            {mockupError}
          </div>
        )}
        <p className="text-[10px] text-white/40 text-center">
          {mockupUrl
            ? '✓ Mockup incluido en tu pedido · resultado referencial'
            : 'Simulación fotorrealista sobre tu producto · opcional'}
        </p>
      </div>
    </div>,

    // ── Step 3 — Datos ──────────────────────────────────────────────
    <div key="datos" className="space-y-5">
      <div className="text-center">
        <p className="text-xs font-bold text-teal-400 uppercase tracking-widest mb-2">Paso 4 · Casi listo</p>
        <h2 className="text-2xl sm:text-3xl font-poppins font-bold text-white mb-2">Tus datos</h2>
        <p className="text-white/50 text-sm">Para coordinar el pago y entrega</p>
      </div>

      {/* Resumen del pedido */}
      <div className="bg-gradient-to-br from-teal-500/15 to-cyan-500/10 backdrop-blur-sm border border-teal-400/25 rounded-2xl p-4 shadow-lg">
        <p className="text-[10px] font-bold text-teal-300 uppercase tracking-widest mb-3">Resumen de tu pedido</p>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl border border-white/20"
            style={{ backgroundColor: color?.hex + '35' }}>{producto?.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-white truncate">{producto?.nombre}</div>
            <div className="text-xs text-white/55 truncate">{color?.label}{texto ? ` · "${texto}"` : ''}</div>
            {archivo && <div className="text-[10px] text-teal-300 mt-0.5">+ Logo adjunto</div>}
          </div>
          <div className="font-poppins font-bold text-lg text-white">${producto?.precio.toLocaleString('es-CL')}</div>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-3">
        {[
          { label: 'Tu nombre *', value: nombre, onChange: setNombre, placeholder: 'Nombre completo' },
          { label: 'Email *', value: email, onChange: setEmail, placeholder: 'tu@correo.cl', type: 'email' },
          { label: 'WhatsApp (opcional)', value: telefono, onChange: setTelefono, placeholder: '+56 9 xxxx xxxx' },
        ].map(f => (
          <div key={f.label}>
            <label className="text-xs font-bold text-white/70 uppercase tracking-wider block mb-2">{f.label}</label>
            <Input
              type={f.type || 'text'}
              value={f.value}
              onChange={e => f.onChange(e.target.value)}
              placeholder={f.placeholder}
              className="h-12 text-sm rounded-2xl bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:bg-white/15 focus:border-teal-400/50 focus:ring-teal-400/20" />
          </div>
        ))}
      </div>

      {/* Garantías */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2.5 backdrop-blur-sm">
          <ShieldCheck className="w-4 h-4 text-teal-400 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-white/70">Garantía 10 años</span>
        </div>
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2.5 backdrop-blur-sm">
          <Truck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-white/70">Envío a todo Chile</span>
        </div>
      </div>
    </div>,
  ];

  // ── LAYOUT ───────────────────────────────────────────────────────────
  return (
    <div className="flex-1 font-inter">
      {/* Navbar sticky con glassmorphism */}
      <nav className="sticky top-0 z-50 bg-slate-900/60 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-lg mx-auto px-5 py-3.5 flex items-center gap-3">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)}
              className="w-9 h-9 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl flex items-center justify-center transition-all">
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
          ) : (
            <Link to="/shop"
              className="w-9 h-9 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl flex items-center justify-center transition-all">
              <ArrowLeft className="w-4 h-4 text-white" />
            </Link>
          )}
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-poppins font-bold text-sm text-white leading-tight">Personalización</div>
              <div className="text-[10px] text-teal-300 leading-tight">Láser UV permanente</div>
            </div>
          </div>
          <span className="text-xs font-bold text-white/50">{step + 1}/4</span>
        </div>
      </nav>

      {/* Contenido principal */}
      <div className="max-w-lg mx-auto px-5 py-8">
        <StepIndicator step={step} total={4} />

        <div className="bg-white/5 backdrop-blur-sm border border-white/15 rounded-3xl p-5 sm:p-6 shadow-2xl">
          {steps[step]}
        </div>

        {/* CTA */}
        <div className="mt-6 sticky bottom-4 z-10">
          {step < 3 ? (
            <Button onClick={() => setStep(s => s + 1)} size="lg"
              className="w-full gap-2 font-bold rounded-2xl h-14 text-base bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-2xl shadow-teal-500/30 border-0 hover:scale-[1.01] transition-all"
              disabled={step === 2 && !texto && !archivo}>
              Continuar <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} size="lg"
              className="w-full gap-2 font-bold rounded-2xl h-14 text-base bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-2xl shadow-teal-500/30 border-0 hover:scale-[1.01] transition-all"
              disabled={loading || !nombre || !email}>
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
              ) : (
                <><Zap className="w-4 h-4" /> Confirmar personalización</>
              )}
            </Button>
          )}
        </div>

        {/* Trust footer */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[10px] text-white/40 font-medium">
          <span className="flex items-center gap-1"><Recycle className="w-3 h-3 text-teal-400" /> Reciclado</span>
          <span>·</span>
          <span>🇨🇱 Hecho en Chile</span>
          <span>·</span>
          <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-cyan-400" /> 10 años</span>
        </div>
      </div>
    </div>
  );
}