// ─────────────────────────────────────────────────────────────────────────────
// Catálogo de secuencias Bluex · fuente única de verdad UI ↔ backend
// ─────────────────────────────────────────────────────────────────────────────
// Mantén sincronizado con functions/bluexTrackingPollerCRON.js
// ─────────────────────────────────────────────────────────────────────────────

export const SECUENCIAS = [
  {
    key: 'estandar_urbano',
    label: 'Estándar Urbano',
    icon: '🏙️',
    color: 'from-blue-500 to-cyan-500',
    bg: 'from-blue-50 to-cyan-50',
    border: 'border-blue-200',
    descripcion: 'Santiago, Viña del Mar y comunas urbanas. Lead time 2-3 días.',
    criterio: 'Por defecto, cuando no aplica ninguna otra secuencia.',
    emails: ['etiqueta_generada', 'retirado_courier', 'en_transito', 'en_reparto_hoy', 'entregado'],
  },
  {
    key: 'extremo_norte',
    label: 'Extremo Norte',
    icon: '🏔️',
    color: 'from-orange-500 to-amber-500',
    bg: 'from-orange-50 to-amber-50',
    border: 'border-orange-200',
    descripcion: 'Lead time 3-7 días por logística aérea/terrestre.',
    criterio: 'Comuna en: Arica, Iquique, Alto Hospicio, Pozo Almonte, Calama, Antofagasta, Tocopilla, Mejillones.',
    emails: ['etiqueta_generada', 'extremo_aviso_largo', 'retirado_courier', 'en_transito', 'en_reparto_hoy', 'entregado'],
  },
  {
    key: 'extremo_sur',
    label: 'Extremo Sur',
    icon: '❄️',
    color: 'from-cyan-500 to-blue-600',
    bg: 'from-cyan-50 to-blue-50',
    border: 'border-cyan-200',
    descripcion: 'Lead time 3-7 días + posibles demoras climáticas.',
    criterio: 'Comuna en: Punta Arenas, Pto Natales, Coyhaique, Pto Aysén, Castro, Ancud, Pto Montt, Osorno.',
    emails: ['etiqueta_generada', 'extremo_aviso_largo', 'retirado_courier', 'en_transito', 'en_reparto_hoy', 'entregado'],
  },
  {
    key: 'rural',
    label: 'Rural / Extendido',
    icon: '🌾',
    color: 'from-emerald-500 to-teal-500',
    bg: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-200',
    descripcion: 'Zona extendida BlueExpress, +1-2 días sobre el lead time normal.',
    criterio: 'tipo_destino = "Rural" o "Extendido" en la base.',
    emails: ['etiqueta_generada', 'remoto_lead_time', 'retirado_courier', 'en_transito', 'en_reparto_hoy', 'entregado'],
  },
  {
    key: 'alto_valor',
    label: 'Alto Valor',
    icon: '💎',
    color: 'from-violet-500 to-purple-600',
    bg: 'from-violet-50 to-purple-50',
    border: 'border-violet-200',
    descripcion: 'Pedidos ≥ $80.000 CLP. Atención prioritaria + opción WhatsApp manual.',
    criterio: 'valor_declarado_clp ≥ $80.000 (y no es zona extrema/rural).',
    emails: ['etiqueta_generada', 'retirado_courier', 'en_transito', 'en_reparto_hoy', 'entregado'],
  },
];

// Triggers transversales (aplican a cualquier secuencia)
export const TRIGGERS_TRANSVERSALES = [
  {
    key: 'intento_fallido',
    label: 'Intento de entrega fallido',
    icon: '⚠️',
    descripcion: 'Bluex marca "No Entregado" → email al cliente para reagendar.',
  },
  {
    key: 'excepcion',
    label: 'Excepción / incidencia',
    icon: '🔔',
    descripcion: 'El evento contiene palabras como "rechazado", "siniestro", "extravío".',
  },
  {
    key: 'atraso_proactivo',
    label: 'Atraso proactivo',
    icon: '🕐',
    descripcion: 'Más de 5 días en tránsito sin entregar → email transparente al cliente.',
  },
];

// Etiquetas legibles de los tipos de email
export const TIPOS_EMAIL_LABELS = {
  etiqueta_generada: 'OT emitida · sale mañana',
  retirado_courier: 'Retirado por courier',
  en_transito: 'En tránsito',
  en_reparto_hoy: 'En reparto hoy',
  entregado: 'Entregado',
  intento_fallido: 'Intento fallido',
  excepcion: 'Incidencia',
  extremo_aviso_largo: 'Aviso lead time largo',
  remoto_lead_time: 'Aviso zona extendida',
  atraso_proactivo: 'Atraso proactivo',
  review_request: 'Solicitud de reseña',
};

export function getSecuencia(key) {
  return SECUENCIAS.find(s => s.key === key) || SECUENCIAS[0];
}