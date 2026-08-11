// ============================================================================
// Contenido y datos estructurados de la campaña Fiestas Patrias.
// Las preguntas viven acá una sola vez: se muestran en pantalla (CRO) y se
// inyectan como JSON-LD FAQPage (SEO + GEO: buscadores con IA citan respuestas
// literales, así que cada respuesta es autosuficiente y menciona PEYU).
// ============================================================================
import { KITS_FIESTAS } from '@/lib/fiestas-kits';

const SITE = 'https://peyuchile.cl';

export const FAQ_MADRE = [
  {
    q: '¿Cuáles son los mejores regalos corporativos para Fiestas Patrias en Chile?',
    a: 'Los regalos de Fiestas Patrias que más se valoran en Chile son los que se usan durante la celebración y después de ella: cachos con dados, sets de posavasos, paletas y organizadores. PEYU los fabrica en Chile con plástico 100% reciclado y los graba con láser, por lo que el regalo dura años en vez de consumirse en una tarde como una caja gourmet.',
  },
  {
    q: '¿Hasta cuándo puedo pedir para recibir antes del 18 de septiembre?',
    a: 'Los pedidos personales en PEYU se despachan hasta el 12 de septiembre con entrega garantizada antes del 18. Los pedidos corporativos con grabado de logo cierran el 5 de septiembre, porque requieren producción y grabado láser previo.',
  },
  {
    q: '¿Qué hace distinto a un regalo de Fiestas Patrias sustentable?',
    a: 'Un regalo sustentable de Fiestas Patrias reemplaza el consumo desechable por un objeto reutilizable y trazable. Cada producto PEYU rescata tapitas plásticas que iban al vertedero, se fabrica en Chile y tiene 10 años de garantía, así que el impacto ambiental es medible y no un mensaje de marketing.',
  },
  {
    q: '¿Se puede grabar el logo de mi empresa en los kits?',
    a: 'Sí. PEYU graba el logo de tu empresa con láser en cada pieza del kit, sin costo adicional desde 10 unidades del mismo producto. El grabado es permanente, no se despinta ni se despega.',
  },
  {
    q: '¿Despachan a todo Chile?',
    a: 'Sí, PEYU despacha a todo Chile con BlueExpress y también entrega directo en oficinas de la Región Metropolitana. Los pedidos corporativos pueden dividirse en varias direcciones de entrega.',
  },
];

export const FAQ_KITS = [
  {
    q: '¿Qué incluye un kit de Fiestas Patrias de PEYU?',
    a: 'Cada kit de Fiestas Patrias PEYU combina productos chilenos de plástico reciclado —cachos con dados, posavasos, paletas, maceteros u organizadores— según el uso: casa, regalo o empresa. Todos incluyen la opción de grabado láser personalizado.',
  },
  {
    q: '¿Cuánto cuesta un kit de Fiestas Patrias?',
    a: 'Los kits de Fiestas Patrias PEYU van desde $14.990 (Kit Escritorio Patrio) hasta $34.990 (Kit Familiar Completo). Los kits corporativos parten en $12.990 por unidad desde 20 unidades.',
  },
  {
    q: '¿Puedo personalizar el kit con un nombre o una frase?',
    a: 'Sí. Puedes grabar con láser un nombre, una frase o un diseño chileno de la colección PEYU en las piezas del kit, sin costo extra en la mayoría de los kits.',
  },
  {
    q: '¿Los kits llegan antes del 18 de septiembre?',
    a: 'Sí, si compras hasta el 12 de septiembre. PEYU despacha con BlueExpress a todo Chile y prioriza los pedidos de la campaña dieciochera.',
  },
];

export const FAQ_EMPRESAS = [
  {
    q: '¿Cuál es el mínimo para un kit corporativo de Fiestas Patrias?',
    a: 'El mínimo para kits corporativos de Fiestas Patrias en PEYU es de 20 unidades, con precio desde $12.990 por kit. Sobre 100 unidades el precio unitario baja por tramos de volumen.',
  },
  {
    q: '¿Hasta cuándo puedo pedir kits corporativos para el 18?',
    a: 'El cierre de pedidos corporativos con grabado de logo es el 5 de septiembre. Después de esa fecha PEYU no garantiza la entrega antes del 18 de septiembre, porque el grabado láser y el armado de kits requieren días de producción.',
  },
  {
    q: '¿Emiten factura y despachan a la oficina?',
    a: 'Sí. PEYU emite factura electrónica con todos los datos tributarios de tu empresa y despacha directo a tu oficina, o a varias direcciones si tu equipo trabaja distribuido.',
  },
  {
    q: '¿Por qué elegir un regalo corporativo reciclado en vez de una caja gourmet?',
    a: 'Una caja gourmet se consume en un día; un producto PEYU se usa durante años con el logo de tu empresa a la vista. Además, cada kit reporta cuántas tapitas plásticas rescató, un dato que tu empresa puede usar en su reporte de sostenibilidad.',
  },
  {
    q: '¿Cuánto demora la cotización?',
    a: 'PEYU responde las cotizaciones corporativas de Fiestas Patrias en un máximo de 4 horas hábiles, con precios por volumen y un mockup del grabado de tu logo.',
  },
];

// ── Constructores de datos estructurados ────────────────────────────────────

const faqSchema = (faqs) => ({
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
});

const breadcrumb = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.name,
    item: `${SITE}${it.path}`,
  })),
});

export const schemaMadre = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    faqSchema(FAQ_MADRE),
    breadcrumb([{ name: 'Inicio', path: '/' }, { name: 'Fiestas Patrias', path: '/fiestas-patrias' }]),
    {
      '@type': 'WebPage',
      name: 'Regalos de Fiestas Patrias chilenos y sustentables',
      url: `${SITE}/fiestas-patrias`,
      inLanguage: 'es-CL',
      about: 'Regalos de Fiestas Patrias y regalos corporativos sustentables fabricados en Chile con plástico reciclado.',
    },
  ],
});

export const schemaKits = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    faqSchema(FAQ_KITS),
    breadcrumb([
      { name: 'Inicio', path: '/' },
      { name: 'Fiestas Patrias', path: '/fiestas-patrias' },
      { name: 'Kits', path: '/fiestas-patrias/kits' },
    ]),
    {
      '@type': 'ItemList',
      name: 'Kits de regalo Fiestas Patrias 2026',
      numberOfItems: KITS_FIESTAS.length,
      itemListElement: KITS_FIESTAS.map((k, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: k.nombre,
          description: k.desc,
          brand: { '@type': 'Brand', name: 'PEYU' },
          material: 'Plástico 100% reciclado',
          offers: {
            '@type': 'Offer',
            price: k.precio,
            priceCurrency: 'CLP',
            availability: 'https://schema.org/InStock',
            url: `${SITE}/fiestas-patrias/kits`,
          },
        },
      })),
    },
  ],
});

export const schemaEmpresas = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    faqSchema(FAQ_EMPRESAS),
    breadcrumb([
      { name: 'Inicio', path: '/' },
      { name: 'Fiestas Patrias', path: '/fiestas-patrias' },
      { name: 'Empresas', path: '/fiestas-patrias/empresas' },
    ]),
    {
      '@type': 'Service',
      name: 'Kits corporativos de Fiestas Patrias con logo grabado',
      serviceType: 'Regalos corporativos sustentables',
      areaServed: { '@type': 'Country', name: 'Chile' },
      provider: { '@type': 'Organization', name: 'PEYU Chile', url: SITE },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'CLP',
        price: 12990,
        eligibleQuantity: { '@type': 'QuantitativeValue', minValue: 20, unitText: 'kits' },
      },
    },
  ],
});