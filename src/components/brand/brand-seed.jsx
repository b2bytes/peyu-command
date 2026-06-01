// Direcciones de marca semilla para el Brand Lab. Tokens completos claro/oscuro.
// Identidad PEYU: verde/teal + acento terracota, plástico reciclado, Empresa B.

export const SEED_DIRECTIONS = [
  {
    nombre: 'Editorial Cálido',
    descripcion: 'Serif elegante en titulares, mucho blanco, teal + terracota suave. Premium y editorial.',
    orden: 1,
    activa: false,
    tokens: {
      tipografia: { titular: "'Fraunces', Georgia, serif", cuerpo: "'Hanken Grotesk', system-ui, sans-serif" },
      radios: { sm: '10px', md: '18px', lg: '28px' },
      densidad: 'amplia',
      sombras: 'suave',
      paleta: {
        light: { bg: '#FBF9F4', surface: '#FFFFFF', accent: '#0F8B6C', accent2: '#D96B4D', text: '#1C2B27', muted: '#7C8784' },
        dark: { bg: '#14201C', surface: '#1E2C28', accent: '#3FC9A3', accent2: '#E8825F', text: '#F4F1E9', muted: '#9AA8A2' },
      },
    },
  },
  {
    nombre: 'Minimal Premium',
    descripcion: 'Sans geométrica, ultra limpio, teal profundo. Confianza moderna y silenciosa.',
    orden: 2,
    activa: false,
    tokens: {
      tipografia: { titular: "'Plus Jakarta Sans', system-ui, sans-serif", cuerpo: "'Inter', system-ui, sans-serif" },
      radios: { sm: '8px', md: '14px', lg: '20px' },
      densidad: 'media',
      sombras: 'media',
      paleta: {
        light: { bg: '#FFFFFF', surface: '#F4F6F5', accent: '#0B6E55', accent2: '#C7603F', text: '#0B1F1A', muted: '#6B7C77' },
        dark: { bg: '#0A1512', surface: '#13211D', accent: '#14B894', accent2: '#E07B57', text: '#FFFFFF', muted: '#8A9A94' },
      },
    },
  },
  {
    nombre: 'Eco Vibrante',
    descripcion: 'Más color, verde vivo, dinámico y juvenil. Energía, comunidad y planeta.',
    orden: 3,
    activa: false,
    tokens: {
      tipografia: { titular: "'Poppins', system-ui, sans-serif", cuerpo: "'Hanken Grotesk', system-ui, sans-serif" },
      radios: { sm: '12px', md: '20px', lg: '32px' },
      densidad: 'media',
      sombras: 'marcada',
      paleta: {
        light: { bg: '#F2FBF6', surface: '#FFFFFF', accent: '#15A36B', accent2: '#F2723D', text: '#0E2A1E', muted: '#6FA188' },
        dark: { bg: '#0C1F16', surface: '#143024', accent: '#2EE08A', accent2: '#FF8A4C', text: '#F0FFF7', muted: '#83B79B' },
      },
    },
  },
  {
    nombre: 'Warm Dusk OS',
    descripcion: 'Protagonista el modo oscuro estilo Agent OS: fondo difuminado plomo/vino con glows sutiles.',
    orden: 4,
    activa: false,
    tokens: {
      tipografia: { titular: "'Plus Jakarta Sans', system-ui, sans-serif", cuerpo: "'Hanken Grotesk', system-ui, sans-serif" },
      radios: { sm: '12px', md: '18px', lg: '26px' },
      densidad: 'amplia',
      sombras: 'marcada',
      paleta: {
        light: { bg: '#F7F4F2', surface: '#FFFFFF', accent: '#0F8B6C', accent2: '#C25A45', text: '#221C1F', muted: '#8A7E82' },
        dark: { bg: '#1A1418', surface: '#241B22', accent: '#19C39C', accent2: '#E47A5C', text: '#F6EEF1', muted: '#A2929A' },
      },
    },
  },
];