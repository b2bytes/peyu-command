import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, CheckCircle2, Sparkles, Briefcase, BookOpen, Heart } from 'lucide-react';

/**
 * Newsletter CTA contextual — el copy y el segmento dependen del origen.
 *
 * Variants estratégicos:
 *   gracias    → post-compra: pico de afinidad, mejor momento para captar (B2C)
 *   blog       → captura educativa, segmento Blog
 *   b2b        → calendario corporativo + ESG (B2B)
 *   exit       → discreto, footer/banner (General)
 *   compact    → línea inline para footer/sidebar
 *
 * Props:
 *   variant: 'gracias' | 'blog' | 'b2b' | 'exit' | 'compact'
 *   defaultEmail: prefill (ej: del checkout)
 *   defaultName: prefill nombre
 *   onSuccess: callback opcional
 */
export default function NewsletterCTA({ variant = 'exit', defaultEmail = '', defaultName = '', onSuccess }) {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const cfg = VARIANTS[variant] || VARIANTS.exit;
  const Icon = cfg.icon;

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email inválido');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await base44.functions.invoke('suscribirNewsletter', {
        email,
        nombre: defaultName,
        segmento: cfg.segmento,
        origen: cfg.origen,
        page_path: typeof window !== 'undefined' ? window.location.pathname : '',
      });
      setDone(true);
      onSuccess?.();
    } catch (err) {
      setError('Hubo un problema. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Estado éxito
  if (done) {
    return (
      <div className={`rounded-2xl p-5 text-center ${cfg.successBg}`}>
        <CheckCircle2 className={`w-9 h-9 mx-auto mb-2 ${cfg.successIcon}`} />
        <p className={`font-poppins font-bold text-base ${cfg.successText}`}>{cfg.successTitle}</p>
        <p className={`text-xs mt-1 ${cfg.successSub}`}>{cfg.successDesc}</p>
      </div>
    );
  }

  // Variant compact (footer/sidebar inline)
  if (variant === 'compact') {
    return (
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="h-10 rounded-full bg-white/10 border-white/20 text-white placeholder:text-white/40 text-sm flex-1"
          />
          <Button type="submit" disabled={loading} className="h-10 rounded-full bg-teal-500 hover:bg-teal-600 text-white px-4 font-semibold text-xs">
            {loading ? '...' : 'Sumarme'}
          </Button>
        </div>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </form>
    );
  }

  return (
    <div className={`rounded-3xl p-6 sm:p-7 ${cfg.bg}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
          <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-poppins font-bold text-base sm:text-lg leading-tight ${cfg.titleColor}`}>{cfg.title}</p>
          <p className={`text-xs mt-1 leading-relaxed ${cfg.subColor}`}>{cfg.subtitle}</p>
        </div>
      </div>

      {/* Beneficios */}
      <ul className={`space-y-1 mb-4 text-xs ${cfg.benefitColor}`}>
        {cfg.benefits.map((b, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className={cfg.benefitDot}>•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className={`h-11 rounded-xl text-sm flex-1 ${cfg.inputClass}`}
          required
        />
        <Button type="submit" disabled={loading} className={`h-11 rounded-xl px-5 font-bold text-sm ${cfg.btnClass}`}>
          {loading ? 'Enviando...' : cfg.btnLabel}
        </Button>
      </form>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      <p className={`text-[10px] mt-2 ${cfg.legalColor}`}>Sin spam. Te puedes dar de baja en 1 clic.</p>
    </div>
  );
}

// ── Configuración por variant ────────────────────────────────────────
const VARIANTS = {
  gracias: {
    segmento: 'B2C',
    origen: 'post_compra',
    icon: Heart,
    title: 'Únete al club PEYU 💚',
    subtitle: 'Eres parte del cambio. Recibe drops exclusivos y cupones solo para suscriptores.',
    benefits: [
      'Acceso anticipado a nuevos productos',
      'Cupones exclusivos (hasta -20%)',
      'Reporte mensual del impacto que generas',
    ],
    btnLabel: 'Sumarme al club',
    bg: 'bg-gradient-to-br from-pink-500/15 to-teal-500/15 border border-pink-300/30 backdrop-blur',
    iconBg: 'bg-pink-500/20',
    iconColor: 'text-pink-200',
    titleColor: 'text-white',
    subColor: 'text-white/70',
    benefitColor: 'text-white/75',
    benefitDot: 'text-pink-300',
    inputClass: 'bg-white/10 border-white/20 text-white placeholder:text-white/40',
    btnClass: 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-lg',
    legalColor: 'text-white/40',
    successBg: 'bg-gradient-to-br from-pink-500/20 to-teal-500/20 border border-pink-300/40',
    successIcon: 'text-pink-300',
    successText: 'text-white',
    successSub: 'text-white/70',
    successTitle: '¡Bienvenido al club! 💚',
    successDesc: 'Revisa tu email — te enviamos un cupón de bienvenida.',
  },
  blog: {
    segmento: 'Blog',
    origen: 'blog',
    icon: BookOpen,
    title: 'Ideas de regalos sostenibles, cada 15 días',
    subtitle: 'Guías, tendencias y casos reales de economía circular en Chile.',
    benefits: [
      'Guías estacionales de regalos (Patrias, Navidad, Día Madre)',
      'Tendencias ESG y economía circular',
      'Casos de empresas chilenas reales',
    ],
    btnLabel: 'Suscribirme',
    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-700',
    titleColor: 'text-gray-900',
    subColor: 'text-gray-600',
    benefitColor: 'text-gray-700',
    benefitDot: 'text-emerald-600',
    inputClass: 'bg-white border-emerald-200',
    btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    legalColor: 'text-gray-400',
    successBg: 'bg-emerald-50 border border-emerald-200',
    successIcon: 'text-emerald-600',
    successText: 'text-emerald-900',
    successSub: 'text-emerald-700',
    successTitle: '¡Listo! 📚',
    successDesc: 'En 15 días recibirás el primer post.',
  },
  b2b: {
    segmento: 'B2B',
    origen: 'b2b_landing',
    icon: Briefcase,
    title: 'Calendario corporativo + tips ESG',
    subtitle: 'Para encargados de RRHH, marketing y compras que regalan inteligente.',
    benefits: [
      'Calendario de fechas corporativas clave',
      'Briefs listos: Día del Trabajador, Patrias, Navidad corporativa',
      'Casos ESG con métricas reales',
    ],
    btnLabel: 'Recibir',
    bg: 'bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-300',
    titleColor: 'text-white',
    subColor: 'text-white/70',
    benefitColor: 'text-white/75',
    benefitDot: 'text-amber-300',
    inputClass: 'bg-white/10 border-white/20 text-white placeholder:text-white/40',
    btnClass: 'bg-amber-500 hover:bg-amber-600 text-gray-900',
    legalColor: 'text-white/40',
    successBg: 'bg-slate-900 border border-amber-400/30',
    successIcon: 'text-amber-400',
    successText: 'text-white',
    successSub: 'text-white/70',
    successTitle: '¡Suscrito al programa!',
    successDesc: 'Recibirás el calendario el 1° de cada mes.',
  },
  exit: {
    segmento: 'General',
    origen: 'exit_intent',
    icon: Mail,
    title: '¿Te vas? Llévate -10% 🎁',
    subtitle: 'Suscríbete y te enviamos un cupón de 10% para tu primera compra.',
    benefits: [
      'Cupón -10% válido 30 días',
      'Drops antes que nadie',
      'Sin spam, ~2 emails al mes',
    ],
    btnLabel: 'Quiero el -10%',
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200',
    iconBg: 'bg-amber-500/15',
    iconColor: 'text-amber-700',
    titleColor: 'text-gray-900',
    subColor: 'text-gray-600',
    benefitColor: 'text-gray-700',
    benefitDot: 'text-amber-600',
    inputClass: 'bg-white border-amber-200',
    btnClass: 'bg-amber-500 hover:bg-amber-600 text-gray-900',
    legalColor: 'text-gray-400',
    successBg: 'bg-amber-50 border border-amber-200',
    successIcon: 'text-amber-600',
    successText: 'text-amber-900',
    successSub: 'text-amber-800',
    successTitle: '¡Cupón en camino! 🎁',
    successDesc: 'Revisa tu email para el código de -10%.',
  },
  compact: {
    segmento: 'General',
    origen: 'footer',
    icon: Sparkles,
    title: '',
    subtitle: '',
    benefits: [],
    btnLabel: 'Sumarme',
    bg: '',
    iconBg: '',
    iconColor: '',
    titleColor: '',
    subColor: '',
    benefitColor: '',
    benefitDot: '',
    inputClass: '',
    btnClass: '',
    legalColor: '',
    successBg: 'bg-teal-500/15 border border-teal-400/30',
    successIcon: 'text-teal-300',
    successText: 'text-white',
    successSub: 'text-white/70',
    successTitle: '¡Listo! 🐢',
    successDesc: 'Te enviamos un email de confirmación.',
  },
};