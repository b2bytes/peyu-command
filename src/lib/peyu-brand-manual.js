// ════════════════════════════════════════════════════════════════════════
// peyu-brand-manual — Fuente única de contenido del Manual de Marca de
// "Peyu", la tortuga mascota de PEYU. Consumido por la página del manual
// (/manual-peyu) y por el generador del PDF diseñado.
// ════════════════════════════════════════════════════════════════════════

export const LOGO_OFICIAL = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/cead5fbd1_image.png'; // tortuga + PEYU (tinta)
export const LOGO_VERDE = 'https://media.base44.com/images/public/69d99b9d61f699701129c103/b67ed29f9_image.png';   // logo web

export const RELATO = {
  titulo: 'PEYU, LA TORTUGA QUE NACIÓ DE UNA TAPITA',
  parrafos: [
    'En las costas de Chile, donde el mar devuelve lo que la ciudad olvida, miles de tapitas plásticas terminaban cada año enterradas en la arena. De una de ellas — la primera que rescatamos — nació Peyu: una tortuga paciente, terca y profundamente optimista, convencida de que ningún plástico merece ser basura.',
    'Peyu no es un adorno de la marca: ES la marca. Su nombre es el nuestro, su caparazón está hecho de las mismas tapitas fundidas que dan vida a cada producto, y su paso — lento pero imposible de detener — es la forma en que entendemos el cambio: constante, real, sin atajos.',
    'Como las tortugas marinas, Peyu vuelve siempre al mismo lugar: al origen. Cada objeto que fabricamos es una tapita que vuelve a casa convertida en algo útil, durable y con historia. Por eso Peyu acompaña cada rincón del viaje: saluda en la tienda, asesora en el chat, cotiza para las empresas y celebra cada entrega.',
    'Peyu es parte del equipo. Firma los correos, responde el WhatsApp a las 3 AM y le recuerda a cada cliente que detrás de un regalo corporativo hay un gesto por el planeta.',
    'Peyu es la promesa hecha personaje: «Hasta que el plástico deje de ser basura».',
  ],
};

export const POR_QUE_TORTUGA = [
  { icono: '🌊', titulo: 'Guardiana del océano', texto: 'La tortuga marina es la primera víctima del plástico — y por eso, nuestro mejor recordatorio de para quién trabajamos.' },
  { icono: '🐢', titulo: 'Paso constante', texto: 'Lenta pero imparable: así es la economía circular real. Sin greenwashing, tapita a tapita.' },
  { icono: '🛡️', titulo: 'Caparazón resistente', texto: 'El plástico reciclado PEYU dura décadas — garantía de 10 años. El caparazón es esa promesa hecha forma.' },
  { icono: '🏠', titulo: 'Siempre vuelve al origen', texto: 'Como las tortugas vuelven a su playa, cada tapita vuelve al ciclo convertida en un objeto con propósito.' },
];

export const POR_QUE_NOMBRE = [
  'Nombre corto, cálido y sonoro: «Pe-yu» — dos sílabas fáciles de recordar y de querer.',
  'La mascota ES la marca: no hay distancia entre el personaje y la empresa. Peyu firma, vende y acompaña.',
  'Funciona en logo, grabado láser, sticker, chat y peluche: escala de 16px a una gigantografía sin perder identidad.',
];

export const CONCEPTO = {
  nombre: 'Peyu',
  especie: 'Tortuga chilena estilizada, hecha de tapitas recicladas',
  descripcion: 'Peyu representa la perseverancia, la calidez y el propósito ambiental de la marca. Es un personaje cercano, paciente y optimista que convierte cada compra en un gesto por el planeta.',
  rasgos: [
    { rasgo: 'Perseverancia', arrow: 'el cambio real se logra paso a paso' },
    { rasgo: 'Calidez', arrow: 'trato cercano, de tú, sin corporativismo' },
    { rasgo: 'Optimismo', arrow: 'el plástico no es el problema, es la materia prima' },
    { rasgo: 'Propósito', arrow: 'guardiana del océano y del oficio chileno' },
  ],
};

export const PALETA_PRINCIPAL = [
  { nombre: 'Verde PEYU', uso: 'Caparazón · identidad principal · CTAs', hex: '#0F8B6C', rgb: '15, 139, 108' },
  { nombre: 'Verde profundo', uso: 'Sombras del caparazón · fondos hero', hex: '#0B4634', rgb: '11, 70, 52' },
  { nombre: 'Arena', uso: 'Piel · vientre · superficies cálidas', hex: '#E7D8C6', rgb: '231, 216, 198' },
  { nombre: 'Terracota', uso: 'Acentos · energía · destacados', hex: '#D96B4D', rgb: '217, 107, 77' },
  { nombre: 'Crema', uso: 'Fondos claros · respiro visual', hex: '#F8F3ED', rgb: '248, 243, 237' },
  { nombre: 'Tinta', uso: 'Trazo del logo · contornos · texto', hex: '#2C1810', rgb: '44, 24, 16' },
];

export const PALETA_SECUNDARIA = [
  { nombre: 'Menta', uso: 'Burbujas de chat · detalles suaves', hex: '#A7D9C9' },
  { nombre: 'Teal digital', uso: 'Hover · modo noche · interacción', hex: '#14B894' },
  { nombre: 'Café cálido', uso: 'Texto secundario · ojos', hex: '#7A6050' },
];

export const TIPOGRAFIA = [
  { fuente: 'Fraunces', rol: 'Display editorial — titulares con alma, itálicas para el relato' },
  { fuente: 'Plus Jakarta Sans', rol: 'Títulos de interfaz — moderna, redonda, amistosa como el caparazón' },
  { fuente: 'Hanken Grotesk', rol: 'Cuerpo de texto — legible, cálida, sin pretensión' },
];

export const FORMAS = [
  'Trazo orgánico hecho a mano: el logo de Peyu conserva las imperfecciones del dibujo original — nunca vectorizarlo "perfecto".',
  'Curvas de caparazón: bordes redondeados generosos (radio 14-24px) en tarjetas, botones y burbujas de toda la web.',
  'Sin esquinas duras ni sombras agresivas: la luz de PEYU es suave, como la arena.',
  'El punto blanco del ojo SIEMPRE visible: es la chispa de vida de Peyu.',
];

export const APLICACIONES = [
  { donde: 'Burbuja «Peyu te ayuda»', detalle: 'Chat flotante en la esquina inferior derecha (móvil) y barra centrada (desktop). Peyu saluda con 🐢 y habla de tú.', canal: 'Tienda web' },
  { donde: 'Vendedor WhatsApp 24/7', detalle: 'Peyu atiende, recomienda con fotos, genera mockups y cierra ventas — siempre con su tono cálido y emojis medidos.', canal: 'WhatsApp' },
  { donde: 'Grabado láser', detalle: 'La silueta de Peyu se graba en productos como sello de autenticidad — versión monocroma tinta.', canal: 'Producto físico' },
  { donde: 'Correos transaccionales', detalle: 'Cada confirmación, despacho y postventa lo firma Peyu 🐢 — el cliente le escribe a alguien, no a un sistema.', canal: 'Email' },
  { donde: 'Agent OS interno', detalle: 'Peyu también trabaja para los founders: opera pedidos, stock y cotizaciones desde el chat del admin.', canal: 'Equipo' },
  { donde: 'Packaging y stickers', detalle: 'Versión minimalista vectorial para pines, cajas kraft y material impreso.', canal: 'Impreso' },
];

export const VIAJE = [
  { paso: '1', etapa: 'Descubre', detalle: 'Peyu recibe al visitante en el home: «Plástico 100% reciclado 🇨🇱»' },
  { paso: '2', etapa: 'Asesora', detalle: 'En el chat, Peyu recomienda el producto ideal y muestra cómo quedaría su logo grabado.' },
  { paso: '3', etapa: 'Cotiza', detalle: 'Para empresas, Peyu arma la propuesta B2B con mockup y precios por volumen en 24h.' },
  { paso: '4', etapa: 'Acompaña', detalle: 'Confirma el pago, avisa la producción y comparte el tracking — siempre con nombre propio.' },
  { paso: '5', etapa: 'Celebra', detalle: '«¿Cómo llegó tu PEYU?» — pide la reseña, regala un cupón y cierra el ciclo con impacto: tapitas rescatadas.' },
];

export const USOS = {
  si: [
    'Usar sobre crema, arena o verde profundo con contraste completo',
    'Versión monocroma: tinta sobre claro · crema sobre oscuro',
    'Área de resguardo: el alto de la cabeza de Peyu por cada lado',
    'Escalar proporcionalmente, desde favicon hasta gigantografía',
  ],
  no: [
    'Deformar, estirar, rotar o inclinar la tortuga',
    'Cambiar los colores oficiales o aplicar degradados al trazo',
    'Agregar sombras duras, contornos extra o efectos 3D',
    'Encerrarla en cajas, círculos o marcos ajenos a la marca',
  ],
};