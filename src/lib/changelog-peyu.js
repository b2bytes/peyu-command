// ════════════════════════════════════════════════════════════════════════
// CHANGELOG PEYU — Fuente de verdad del Resumen Operativo.
// Cada avance (bug, mejora, feature) se registra aquí como una entrada.
// La página /resumen-operativo lo renderiza automáticamente agrupado por
// fecha, con KPIs calculados. Para actualizar el resumen: agregar entradas
// al inicio de CHANGELOG (más reciente primero). NO editar la página.
//
// tipo: 'bug' | 'mejora' | 'feature'
// area: módulo/página afectada (texto libre corto)
// ════════════════════════════════════════════════════════════════════════

export const CHANGELOG = [
  // ── 10 junio 2026 · Colores reales en TODO el catálogo + mockup sin caja blanca ──
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Ficha de producto · Personalizar',
    titulo: 'Colores reales con foto en todos los productos y mockup sin caja blanca',
    detalle: 'Dos arreglos: (1) La visión IA ahora también DETECTA los colores de productos que no los tenían cargados (mirando su galería de fotos) y puebla colores + foto por color — corrió sobre el catálogo completo (10 productos actualizados: packs escritorio, maceteros, sujetadores, etc.), así el selector de color con variante real funciona en todos los productos, no solo en algunos. (2) Se corrigió la CAJA BLANCA del mockup: el motor de grabado ahora carga el logo vía fetch (el canvas ya no queda bloqueado por CORS y siempre puede limpiar el fondo), y si aún así falla, el fallback usa fusión multiply que hace desaparecer el fondo blanco — nunca más un parche blanco sobre el producto.',
  },

  // ── 10 junio 2026 · Capa de diseño unificada en todo el admin ──
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Admin · Todas las secciones',
    titulo: 'Identidad unificada: una sola capa de diseño para las ~60 páginas del panel',
    detalle: 'Las secciones del admin mezclaban estilos: tarjetas blancas con textos y bordes grises pensados para tema claro, que se rompían sobre el fondo nuevo (modo noche) y se veían inconsistentes entre módulos. Nueva capa CSS de unificación: dentro del canvas admin, todas las clases legacy (fondos blancos, grises de texto, bordes, hovers, sombras y divisores) se remapean automáticamente a los tokens del sistema Liquid Dual. Resultado: superficies, tipografías, botones y colores coherentes con la misma identidad profesional en cada sección, en modo día y noche, y en todos los dispositivos — sin migrar página por página.',
  },

  // ── 10 junio 2026 · Catálogo admin unificado al diseño nuevo ──
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Admin · Catálogo',
    titulo: 'Catálogo de Productos unificado al diseño Liquid Dual',
    detalle: 'El catálogo del admin mezclaba tarjetas blancas con el fondo oscuro del panel nuevo (precios ilegibles, chips lavados). Ahora usa los tokens del sistema: tarjetas glass adaptativas día/noche, chips de categoría con punto de color y estado activo en verde PEYU, buscador y filtros translúcidos, y bloque de precios por volumen con el acento de acción. Todo legible y coherente con el resto del panel.',
  },

  // ── 10 junio 2026 · Catálogo móvil compactado ──
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Catálogo · Móvil',
    titulo: 'Catálogo móvil más corto: pasos ligeros y menos aire vertical',
    detalle: 'El catálogo en móvil se sentía eterno. El stepper de compra ahora solo muestra el texto del paso ACTIVO (los demás quedan como número) — más corto y ligero. Título y claim en una sola línea, márgenes de buscador/chips/filtros reducidos a la mitad, botón "Ver modelos" compacto y footer más bajo. Los productos aparecen mucho antes en la primera pantalla.',
  },

  // ── 10 junio 2026 · Asistente inteligente de etiqueta BlueExpress ──
  {
    fecha: '2026-06-10',
    tipo: 'feature',
    area: 'Agent OS · BlueExpress',
    titulo: 'Etiqueta BlueExpress con asistente guiado: burbujas que enseñan cada paso',
    detalle: 'Al apretar "Etiqueta" ya no falla con un error 500 críptico: se abre un asistente que revisa CON BURBUJAS cada requisito — 1) pago confirmado (con botón "Marcar pagado" ahí mismo), 2) dirección y comuna completas (link a Procesar Pedidos si faltan), 3) cobertura Bluex de la comuna contra el tarifario de 346 comunas (link a Tarifas si no aparece), 4) sin OT previa (anti cobros duplicados). Cada paso que falla EXPLICA cómo resolverlo y a qué módulo ir — el equipo aprende el proceso mientras lo ejecuta. Además se corrigió la causa del 500: el backend exigía payment_status=paid y rechazaba transferencias confirmadas (estado Confirmado+); ahora ambas vías cuentan como pago válido.',
  },

  // ── 10 junio 2026 · Ficha móvil: mockup inmediato arriba ──
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Ficha de producto · Móvil',
    titulo: 'El mockup aparece DE INMEDIATO en móvil, en el lugar de la foto',
    detalle: 'El recorrido móvil era engorroso: el mockup se renderizaba abajo, lejos del personalizador, y al cargar el logo no se veía nada. Ahora con grabado activo el mockup EN VIVO reemplaza la foto principal arriba (con su barra de aprobación pegada), y al subir un logo o elegir un diseño PEYU la página sube sola hasta el mockup para que el resultado se vea al instante. Se eliminó el mockup duplicado del fondo y se agregó un acceso "↑ Ver tu mockup en vivo" en el personalizador. Flujo: configurar → ver al tiro → aprobar → agregar.',
  },

  // ── 10 junio 2026 · Aprobar mockup junto al mockup ──
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Ficha de producto',
    titulo: 'El botón "Aprobar mockup" ahora vive pegado al mockup',
    detalle: 'El usuario se perdía: el mockup estaba al centro pero el botón de aprobar quedaba escondido en el panel de personalización. Ahora la aprobación aparece SIEMPRE junto al mockup (desktop y móvil) en una barra distinguida: hint terracota "¿Te gusta cómo quedó?" + botón verde grande "Aprobar mockup", y al aprobar muestra confirmación con opción Editar. El personalizador solo guía ("revisa el mockup y apruébalo ↓") sin duplicar el botón. Flujo más lógico: configurar → ver → aprobar → agregar.',
  },

  // ── 10 junio 2026 · Color → foto real con VISIÓN IA en todo el catálogo ──
  {
    fecha: '2026-06-10',
    tipo: 'feature',
    area: 'Ficha de producto',
    titulo: 'La IA miró las fotos del catálogo y mapeó cada color a su foto real',
    detalle: 'El matching por nombre de archivo no funcionaba en productos como los cachos (las fotos se llaman IMG_8105.jpg, sin el color). Nueva función visionMapColorImages: la IA analiza VISUALMENTE las fotos de la galería de cada producto y asigna a cada color la foto donde el producto aparece claramente en ese color — igual que las carcasas. Ya corrió sobre el catálogo (packs de cachos, paletas, maceteros...) y la ficha prioriza ese mapa: al elegir Azul/Rojo/Verde/Negro la imagen principal cambia a la foto real de ese color. Los colores sin foto real quedan reportados para subirles foto.',
  },

  // ── 10 junio 2026 · Color → imagen en TODOS los productos + ficha móvil compacta ──
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Ficha de producto',
    titulo: 'Elegir color cambia la foto automáticamente en todos los productos',
    detalle: 'La lógica inteligente de las carcasas (elegir color → la imagen del producto cambia sola) ahora funciona en TODO el catálogo: al escoger un color (ej. cachos rojo/negro/verde/azul), el sistema busca en la galería la foto que coincide con ese color y la muestra como imagen principal; en móvil además la pantalla se desplaza sola hasta la foto para que el cambio se VEA. Y la ficha móvil se acortó: los 3 bloques grandes de confianza (reciclado, envío, pago seguro) se condensaron en una sola franja compacta — menos scroll eterno hacia abajo.',
  },

  // ── 10 junio 2026 · Carrusel fiel a productos reales + botón permanente ──
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Inicio · Hero',
    titulo: 'Carrusel con los productos REALES, textos legibles y Personalizar siempre a mano',
    detalle: 'Las 3 imágenes del carrusel (escritorio, cachos, carcasa) se regeneraron usando las fotos oficiales de la galería como referencia exacta: mismos tonos, mismo marmolado y misma forma de los productos reales — mejor presentación sin inventar productos distintos. Los textos de cada slide ahora se leen siempre (degradado más oscuro + sombra de texto). Y la acción principal gana permanencia: al hacer scroll aparece un botón flotante "Personalizar" fijo abajo a la derecha, sobre los tabs móviles.',
  },

  // ── 10 junio 2026 · El logo del cliente reemplaza a PEYU automáticamente ─
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Ficha de producto',
    titulo: 'Producto personalizado: la marca PEYU desaparece sola y aparece el logo del cliente',
    detalle: 'Al activar una personalización en la ficha, si el producto aún no tiene su foto "base limpia" (sin la marca PEYU grabada), se genera automáticamente con IA en segundo plano y el mockup cambia solo al lienzo limpio — el diseño del cliente reemplaza a PEYU sin ningún clic extra. Generada de inmediato la base limpia del Pack 4 Cachos Todo Terreno; el resto del catálogo se va generando solo la primera vez que un cliente personaliza cada producto.',
  },

  // ── 10 junio 2026 · PDFs unificados con datos siempre perfectos ────────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Exportación PDF',
    titulo: 'Todos los PDF (cotizaciones, propuestas, chat) con el mismo diseño y datos impecables',
    detalle: 'Los 4 generadores de PDF (cotización admin, cotización rápida B2B, cotización del chat y propuesta corporativa) ya comparten la plantilla profesional PEYU. Se corrigió lo que faltaba: la cotización del admin ahora muestra el NOMBRE real del producto desde el catálogo (antes imprimía solo el código SKU, ej. "61411") con el SKU como línea secundaria, y todos los nombres de empresa/contacto/email largos se truncan con guardas para que nunca se monten sobre el monto total ni se salgan del documento. Verificado con cotización real: genera 200 OK.',
  },

  // ── 10 junio 2026 · Hero carrusel editorial con imágenes generadas ─────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Inicio · Hero móvil',
    titulo: 'Carrusel del hero rediseñado: imágenes editoriales generadas desde los productos reales',
    detalle: 'El carrusel de la home mostraba fotos crudas de producto (fondos planos, mezcla de estilos) que se veían pobres en móvil. Se generaron 4 imágenes lifestyle de calidad editorial A PARTIR de los productos reales del catálogo (que no se tocan): escritorio consciente, cachos al atardecer, carcasa eco y set de regalo corporativo. El carrusel ahora es full-bleed con efecto ken-burns suave, caption por slide (historia + destino), navegación por swipe en móvil (sin flechas encima de la foto) y dots refinados. Cada slide lleva a su categoría o al embudo B2B.',
  },

  // ── 10 junio 2026 · Barra superior móvil alineada + blog unificado ─────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Navegación pública · Móvil',
    titulo: 'Barra superior alineada al tema cálido y navegación móvil sin duplicados',
    detalle: 'La barra superior se veía oscura en móvil (fondo transparente que dejaba ver el modo noche detrás): ahora tiene fondo crema sólido con blur, igual que la barra inferior de tabs — coherente en modo día y noche. Se eliminaron los links duplicados "Tienda/Empresas" del top móvil (ya viven en los tabs inferiores Inicio·Tienda·Blog·B2B·Carrito), dejando logo + carrito + menú y un tagline de marca. El banner "cotización en curso" ya no trunca su texto y respira con padding superior. Blog e interior de artículos unificados al mismo fondo crema del sitio, con link "Ver todos" visible también en móvil.',
  },

  // ── 10 junio 2026 · Escala desktop calibrada a zoom nativo 75-80% ──────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Toda la app · Desktop',
    titulo: 'Escala perfecta a pantalla completa sin tocar el zoom del navegador',
    detalle: 'Los escalones de densidad global se profundizaron para que en computadores a pantalla completa la página se vea como con zoom 75-80% del navegador, automáticamente: 14px ≥1024px, 13px ≥1280px, 12.5px ≥1536px y 12px ≥1920px (pantalla completa típica). Todo el contenido (texto, paddings, tarjetas, espaciados) se compacta proporcionalmente porque la app dimensiona en rem. Móvil se mantiene en 16px por accesibilidad.',
  },

  // ── 10 junio 2026 · Pulido móvil de todos los embudos públicos ──────────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Embudos públicos · Móvil',
    titulo: 'Pulido móvil de punta a punta en compra, post-venta y soporte',
    detalle: 'Mejoras concretas en cada embudo público: (1) Catálogo: botón X para limpiar la búsqueda y CTA "Ver todo el catálogo" cuando los filtros no arrojan resultados (recuperación del embudo); (2) Carrito: el teaser de descuento por cantidad ahora es visible y accionable — "Agrega 1 más y ahorra 15%" suma la unidad con un tap; (3) Gracias: el número de pedido se copia con un tap (útil para seguimiento y WhatsApp); (4) Seguimiento: badge de estado del pedido visible de inmediato (Entregado/Despachado/etc.); (5) Soporte: el formulario ya no queda pegado en "Enviando..." si falla y los errores se muestran inline (sin alert() de sistema); (6) Contacto: botón "Llamar ahora" con marcado directo en móvil.',
  },

  // ── 10 junio 2026 · Auditoría de correos: fin de los duplicados ─────────
  {
    fecha: '2026-06-10',
    tipo: 'bug',
    area: 'Secuencias de correo',
    titulo: 'Fin de los correos duplicados al equipo y al cliente B2B',
    detalle: 'Auditoría completa de TODAS las secuencias de correo. Encontrado: cada cotización B2B generaba hasta 7 correos al equipo (quickB2BQuoteV2 a 3 buzones + automatización "Alerta: Nuevo Lead" a ventas@ + onNewB2BLead a 3 buzones) y el cliente podía caer en 3 secuencias paralelas (nurturing por hora + secuencia de propuesta + nurturing "tibios"). Corregido: (1) archivada la alerta redundante de lead; (2) onNewB2BLead ya no re-notifica leads que vienen de la cotización Shop v2; (3) archivado el CRON "tibios" (duplicaba el nurturing principal); (4) handoff limpio: cuando hay propuesta formal Enviada, solo la secuencia de propuesta escribe al cliente. Resultado: 1 correo al equipo y 1 secuencia al cliente por cotización.',
  },
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Cotización + Compra',
    titulo: 'Viaje único cerrado: de la cotización a la compra sin re-elegir nada',
    detalle: 'La pantalla de éxito de la cotización ahora ofrece "Comprar ahora este mismo pedido": como el carro único conserva los productos cotizados, el cliente puede cerrar la compra al instante sin esperar al ejecutivo. Además cada cotización guarda en su historial el desglose estructurado completo (líneas, tramos, neto, IVA, total) para que el admin vea en el pipeline exactamente lo que el cliente cotizó, no solo un resumen de texto.',
  },

  // ── 10 junio 2026 · Agent OS móvil: header compacto + input persistente ──
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Agent OS',
    titulo: 'Diseño móvil del agente: marca, toggle integrado e input siempre visible',
    detalle: 'El header del Agent OS se desarmaba en móvil y los botones flotantes del admin (Comando + Companion) tapaban el input del chat. Ahora: header compacto con marca PEYU (🐢 Peyu Agent OS · En línea) y el toggle Chat/Operaciones integrado como control segmentado; el input del chat queda persistente al fondo de la pantalla; los chips de acceso rápido cubren todos los módulos (Resumen del día, Ventas, Pedidos, Envíos BlueExpress, Pipeline B2B, Cotizaciones, Stock, Clientes) en una fila deslizable; y los FABs flotantes ya no aparecen en las páginas de agente.',
  },

  // ── 10 junio 2026 · Catálogo B2B simplificado + flujo lineal ────────────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Empresas B2B',
    titulo: 'Catálogo B2B simplificado y flujo directo a cotización',
    detalle: 'Las tarjetas del catálogo empresas eran excesivas: tabla de 4 tramos de precio, overlay al pasar el mouse y varias líneas de texto por producto. Ahora cada tarjeta es compacta — imagen, nombre, precio "desde 50u" y un botón "Cotizar" que lleva DIRECTO a la cotización con el producto ya cargado (flujo lineal sin desvíos). El detalle completo de tramos vive en la ficha del producto. Con tarjetas más livianas el grid muestra 4-5 columnas y todo cabe en una pantalla.',
  },

  // ── 10 junio 2026 · Escala global: fin del "zoom al 75%" ────────────────
  {
    fecha: '2026-06-10',
    tipo: 'bug',
    area: 'Toda la tienda',
    titulo: 'La página ya no se ve gigante a pantalla completa',
    detalle: 'En escritorio a pantalla completa todo se veía sobredimensionado ("amorfo") y había que bajar el zoom del navegador a 75% para verla bien. Se aplicó una escala de densidad global: en pantallas grandes la base tipográfica baja (15px ≥1024px, 14px ≥1536px), compactando proporcionalmente texto, paddings y tarjetas de TODA la app como un zoom nativo. Además el titular del hero se redujo (83px → máx 54px), junto con el ancho y los espaciados del hero. Mobile queda en 16px por accesibilidad.',
  },

  // ── 10 junio 2026 · Auditoría de flujos: 3 quiebres corregidos ──────────
  {
    fecha: '2026-06-10',
    tipo: 'bug',
    area: 'Funnel completo',
    titulo: 'Auditoría entrada/salida de cada flujo: 3 quiebres corregidos',
    detalle: 'Revisión página por página del recorrido de compra y cotización (backend verificado sano con health check). Corregido: (1) en el carrito móvil el resumen de totales aparecía DESPUÉS del footer — ahora va antes; (2) "Otra cotización" no limpiaba el carro único, así que los productos viejos reaparecían al recargar la cotización ya enviada — ahora parte limpio de verdad; (3) al confirmar una compra se borraban el nombre, email y dirección del cliente — ahora el perfil persiste y la próxima compra llega pre-llenada (igual que el perfil B2B).',
  },

  // ── 10 junio 2026 · Checkout = cockpit de 1 pantalla ────────────────────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Checkout',
    titulo: '"Finaliza tu compra" integrado al viaje: cockpit de 1 pantalla',
    detalle: 'El pago ya no se siente como "otra pantalla": ahora usa el mismo formato cockpit de /personalizar y la cotización B2B. Header propio con el viaje completo (Tienda → Producto → Carrito → Pago) y botón Pagar siempre visible; resumen "Tu pedido" vivo a la izquierda (items, descuentos, envío, total) y el formulario al centro con scroll propio — todo en una sola pantalla en escritorio. Toda la lógica intacta: persistencia progresiva de datos, captura de carrito abandonado, BlueExpress, facturación y MercadoPago/transferencia. Mobile conserva su flujo vertical con barra de pago sticky.',
  },

  // ── 10 junio 2026 · Mockup B2B: fin de la mancha negra + ficha cliente ──
  {
    fecha: '2026-06-10',
    tipo: 'bug',
    area: 'Cotización Rápida B2B',
    titulo: 'Logo grabado real (sin mancha negra) + ficha del cliente unificada',
    detalle: 'El mockup pintaba una MANCHA NEGRA gigante sobre el producto: el filtro brightness(0) ennegrecía todo el rectángulo del logo (incluido el fondo blanco de un JPG). Ahora el motor usa grayscale+contrast con fusión multiply/screen según el tono del producto: el fondo del logo desaparece y solo se graba el arte, en un área más realista (26-34% del producto). Además la cotización se une a la ficha del cliente: el logo subido se guarda en el B2BLead del pipeline, y los datos de empresa (razón social, RUT, contacto, despacho) quedan recordados como perfil — la próxima cotización llega pre-llenada.',
  },

  // ── 10 junio 2026 · Cotización B2B: mockup arreglado + recorrido pulido ─
  {
    fecha: '2026-06-10',
    tipo: 'bug',
    area: 'Cotización Rápida B2B',
    titulo: 'Mockup corregido y fin de las "pantallas encima"',
    detalle: 'Se arreglaron 4 problemas visuales del cockpit B2B: (1) el logo grabado era INVISIBLE en productos oscuros (blend fijo) — ahora el modo de fusión se adapta al tono del producto; (2) el loader del mockup podía girar infinito si la detección de tono fallaba — ahora hay timeout de seguridad y el logo siempre aparece; (3) al subir el logo se disparaba sola la generación IA de todos los mockups, poniendo pantallas de carga encima de cada producto — ahora la IA es solo manual; (4) tarjetas dentro de tarjetas y doble scroll anidado eliminados. Además el recorrido desktop mejoró: el paso 1 muestra el catálogo GIGANTE al centro y los pasos 2-3 el mockup en vivo, con la ficha de producto siempre por sobre el header.',
  },

  // ── 10 junio 2026 · EmpresasNuevo = inicio del modo B2B en cockpit ──────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Empresas B2B',
    titulo: 'EmpresasNuevo unificado: el modo B2B parte en cockpit de 1 pantalla',
    detalle: 'La página de Empresas ahora abre el recorrido B2B con el mismo formato cockpit de /personalizar y /CotizacionRapida: header wizard que muestra el recorrido completo (Catálogo B2B → Cotización → Propuesta) con CTA siempre visible, propuesta de valor + sellos de confianza a la izquierda, catálogo gigante con buscador y filtros al centro (scroll propio, página sin scroll) y clientes + CTA a la derecha. Si el visitante dejó una cotización a medias, se le ofrece retomarla en 1 clic. Mobile conserva el flujo vertical completo sin perder ninguna función.',
  },

  // ── 10 junio 2026 · Cotización B2B = cockpit de 1 pantalla ─────────────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Cotización Rápida B2B',
    titulo: 'Rediseño completo al formato cockpit de /personalizar — versión B2B',
    detalle: 'La cotización B2B ahora usa el mismo formato del personalizador: header wizard propio con pasos clickeables y CTA siempre visible, panel izquierdo con stepper + resumen vivo (productos, neto, ahorro, logo, empresa) + sellos de confianza, mockup GIGANTE del logo al centro con uploader, y los controles del paso a la derecha con scroll propio. En móvil: barra de progreso arriba y CTA sticky con total c/IVA abajo. Desglose de totales unificado en un componente (Subtotal → descuento volumen → Neto sin IVA → IVA 19% → Total c/IVA) visible en cada paso. Toda la lógica se mantiene intacta: carro único, viaje persistente y envío a quickB2BQuoteV2.',
  },

  // ── 10 junio 2026 · Personalizar: reglas por producto + precio en vivo ──
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Personalizar',
    titulo: 'Grabado según producto + detalle de precio en vivo con IVA',
    detalle: 'Solo las carcasas ofrecen los 4 tipos de personalización; el resto de productos (maceteros, escritorio, etc.) ahora muestra solo frase y logo propio — si un viaje guardado traía "Diseño PEYU" en un producto no permitido, se resetea limpio. Además el paso Diseño suma un detalle de precio EN VIVO que calca las reglas reales del carrito: descuento por cantidad (2u→10%, 3+u→15%), grabado gratis ≥10u, desglose Neto + IVA 19% (IVA incluido) y teaser "agrega 1 más y ahorra". Se corrigió la nota engañosa "+IVA" del paso Confirmar: el precio B2C siempre fue IVA incluido, igual que carrito y checkout.',
  },

  // ── 10 junio 2026 · Auditoría completa del funnel público ──────────────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Funnel completo · Tienda pública',
    titulo: 'Recorrido a prueba de humanos: botones, navegación y continuidad',
    detalle: 'Auditoría de punta a punta del relato de compra: (1) los CTAs "Ver tienda" y "Para empresas" del hero recargaban la página completa — ahora navegan instantáneo sin perder estado; (2) el contador del carrito en la barra superior ahora se actualiza EN VIVO al agregar productos desde cualquier página; (3) el menú móvil tenía botones anidados inválidos que rompían los taps — corregido; (4) nuevo banner de continuidad en Inicio y Tienda: si el cliente dejó una personalización o cotización a medias, se le ofrece retomarla en 1 clic donde quedó.',
  },

  // ── 10 junio 2026 · Carro único: cotización y compra unificadas ─────────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Carro único · Compra + Cotización',
    titulo: 'Un solo carro para comprar y cotizar — sin pasos redundantes',
    detalle: 'La cotización B2B ahora lee y sincroniza el MISMO carrito de compra (carrito_v2): al cruzar desde /personalizar el item configurado (color, diseño, cantidad) se agrega al carro y la cotización lo hidrata desde ahí, saltando el paso redundante de elegir productos (entra directo a Datos). Cambios de cantidad, productos agregados o eliminados en la cotización se reflejan en el carro y viceversa. El carrito de compra suma un puente "Cotiza este mismo carrito" para empresas. La selección final llega intacta a ambos destinos.',
  },

  // ── 10 junio 2026 · Comprar o cotizar: un solo viaje, nada se pierde ────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Personalizar + Cotización B2B',
    titulo: 'Puente unificado: cantidad real, logo y avance persisten entre comprar y cotizar',
    detalle: 'Al cruzar de /personalizar a Cotización Rápida ya no se pisa la cantidad (antes forzaba 50u aunque el cliente tenía 17): viaja la cantidad real junto con su logo o diseño elegido, que llega pre-cargado al mockup B2B. Además la cotización ahora tiene viaje persistente igual que el personalizador: productos, cantidades, datos de empresa, paso y logo se guardan automáticamente, sobreviven recargas y se limpian solo al enviar la solicitud.',
  },

  // ── 10 junio 2026 · Personalizar: color persiste hasta el final ─────────
  {
    fecha: '2026-06-10',
    tipo: 'bug',
    area: 'Personalizar',
    titulo: 'El color elegido de la carcasa ya no se pierde en el mockup',
    detalle: 'Al agregar un diseño, el preview cambiaba a la imagen "base limpia" genérica y pisaba el color que el cliente había escogido. Ahora en productos con colores reales (carcasas) la imagen del color elegido es siempre la fuente de verdad del mockup, y ese color viaja intacto hasta el carrito, el pedido y la orden de producción. Además el logo subido se guarda al instante (sobrevive recargas) con indicador "Subiendo tu logo…".',
  },

  // ── 10 junio 2026 · Personalizar: mockup unificado ──────────────────────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Personalizar',
    titulo: 'Mockup unificado: el preview en vivo ES el mockup, sin paso extra de IA',
    detalle: 'Se eliminó el botón "Generar mockup fotorrealista con IA" que abría un segundo flujo de mockup distinto al preview en vivo. Ahora el mockup en vivo (donde el cliente ajusta tamaño y posición) es la única vista: en Confirmar se muestra el mismo preview con botón "Editar diseño" para volver, y el CTA pasa directo a confirmar. Menos pasos, sin duplicación.',
  },

  // ── 10 junio 2026 · Personalizar: textos visibles en todos los pasos ────
  {
    fecha: '2026-06-10',
    tipo: 'fix',
    area: 'Personalizar',
    titulo: 'Contraste total: mockup en vivo, galería y cantidad legibles (desktop + móvil)',
    detalle: 'El preview láser, la galería de diseños PEYU y el selector de cantidad usaban estilos para fondo oscuro (texto blanco) y quedaban invisibles sobre el fondo crema. Ahora tienen tema claro de alto contraste (texto café oscuro, acentos terracota) en /personalizar, manteniendo el tema oscuro donde corresponde (chat /v2). Además la página fuerza modo día mientras está abierta para que el modo noche del visitante no borre los textos.',
  },

  // ── 10 junio 2026 · Personalizar: contraste + viaje persistente ─────────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Personalizar',
    titulo: 'Alto contraste en cada paso + viaje del cliente persistente',
    detalle: 'Selectores de color y de tipo de grabado rediseñados con cards blancas sólidas, texto café oscuro y selección terracota (antes se veían lavados sobre el fondo crema). El botón Continuar deshabilitado ahora se distingue claramente. Y el viaje completo del cliente (paso, producto, color, diseño, texto, cantidad, mockup) se guarda automáticamente en cada decisión: sobrevive recargas y se limpia al agregar al carrito, con indicador "Tu avance se guarda automáticamente".',
  },

  // ── 10 junio 2026 · Personalizar: comprar o cotizar ─────────────────────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Personalizar',
    titulo: 'Flujo completo: comprar al instante o cotizar B2B',
    detalle: 'Puente directo a Cotización Rápida B2B desde /personalizar: aparece al subir la cantidad a 10+ en el paso Diseño, en Confirmar y en la pantalla de éxito, pre-cargando producto y cantidad. La pantalla de éxito ahora también ofrece "Revisar carrito". Además, si falla la subida del logo el botón ya no queda pegado en "Agregando...".',
  },

  // ── 10 junio 2026 · Personalizar = cockpit de 1 pantalla ───────────────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Personalizar',
    titulo: 'Escritorio en una sola pantalla, sin scroll',
    detalle: '/personalizar ahora es un cockpit de 3 columnas en desktop: stepper + resumen a la izquierda, preview GIGANTE en vivo al centro (toda la altura, con barra de producto/precio) y los controles del paso a la derecha con scroll propio y CTA siempre visible. La galería de diseños y las opciones ya no empujan el botón fuera de pantalla. Mobile mantiene su flujo vertical.',
  },

  // ── 10 junio 2026 · Agente Central con gestión total ───────────────────
  {
    fecha: '2026-06-10',
    tipo: 'feature',
    area: 'Agente Central',
    titulo: 'Gestión total del sistema desde /admin/agente-central',
    detalle: 'El Agente Central ahora puede CREAR pedidos manuales, leads B2B, clientes y órdenes de producción, ELIMINAR registros, marcar pagos, generar etiquetas Bluex, cancelar pedidos, reconciliar MercadoPago y sincronizar envíos — todo conversando y con confirmación por botón. El contexto incluye los IDs reales de pedidos, leads y cotizaciones para que las acciones nunca fallen.',
  },

  // ── 10 junio 2026 · Agent OS con capacidades totales ───────────────────
  {
    fecha: '2026-06-10',
    tipo: 'feature',
    area: 'Agent OS',
    titulo: 'El agente ahora EJECUTA la operación desde el chat',
    detalle: 'El chat entiende intenciones y propone acciones reales con botón de confirmación: avanzar/cancelar pedidos, marcar pagos, generar etiquetas Bluex, responder consultas por Gmail, mover leads y propuestas, ajustar stock/precios, enviar emails libres y sincronizar tracking. Toda mutación requiere confirmación del founder y pasa por el backend con validación admin.',
  },

  // ── 10 junio 2026 · Correcciones reunión Joaquín ───────────────────────
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Catálogo',
    titulo: 'Categorías reorganizadas (reunión Joaquín)',
    detalle: '"Cachos" pasó a llamarse "Entretención y Juegos". Carcasas ahora navegan por Marca (iPhone, Samsung, Huawei, AirPods) → Modelo. La categoría Corporativo ya no queda vacía: muestra todos los productos aptos para empresas (canal B2B).',
  },
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Ficha de producto',
    titulo: 'Mockup central en escritorio + carcasas con fuente única de imagen',
    detalle: 'En desktop el preview de grabado EN VIVO toma el lugar de la galería (columna izquierda sticky) — se interactúa casi sin scroll. En carcasas se ocultó la galería de ángulos extra: la imagen por color del selector es la única fuente de verdad, y los swatches crecieron de tamaño.',
  },
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Ficha de producto · Móvil',
    titulo: 'Orden móvil: foto → color → personalización',
    detalle: 'La descripción del producto pasó a una pestaña colapsable al final de la ficha, dejando el flujo foto → color → personalización en la misma pantalla con menos scroll.',
  },

  // ── 10 junio 2026 · BlueExpress API PROD desbloqueada ─────────────────
  {
    fecha: '2026-06-10',
    tipo: 'feature',
    area: 'BlueExpress',
    titulo: 'API corporativa de producción conectada y verificada',
    detalle: 'Con las credenciales PROD nuevas (OAuth client_credentials vía sso.blue.cl) la integración quedó autenticada de punta a punta: emisión de OT (cmkin emission), tracking en tiempo real (tracking-pull-corp) y etiqueta PDF. El tracking ya valida OTs reales contra Bluex.',
  },
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'BlueExpress',
    titulo: 'Códigos de comuna oficiales en la emisión',
    detalle: 'La etiqueta ya no se emite con comuna genérica: el código de distrito Bluex real (ej. PRO = Providencia) se resuelve desde el tarifario oficial de 346 comunas cargado en la base, con fallback a la API BX-Geo. Además: modo dry-run para verificar payload sin emitir OT real.',
  },

  // ── 10 junio 2026 · Agent OS = página maestra de operaciones ──────────
  {
    fecha: '2026-06-10',
    tipo: 'feature',
    area: 'Agent OS',
    titulo: 'Centro de Operaciones maestro',
    detalle: 'Nueva pestaña "Operaciones" en /admin/agente: gestión completa de pedidos sin salir de la página — marcar pedido no pagado como pagado en 1 clic, generar etiqueta BlueExpress, cambiar estado, abrir etiqueta/tracking, buscador y filtros (por pagar / por despachar / despachados). Incluye accesos a todos los módulos del admin.',
  },
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Agent OS · IA',
    titulo: 'Modelo IA de última generación',
    detalle: 'El chat del Agent OS ahora responde con Claude Opus 4.8 (el modelo más nuevo y capaz disponible) para razonamiento de negocio de mayor calidad.',
  },
  {
    fecha: '2026-06-10',
    tipo: 'mejora',
    area: 'Backend',
    titulo: 'Acciones nuevas del agente',
    detalle: 'agentOSAction soporta marcarPedidoPagado (confirma pago + historial) y generarEtiqueta (emite OT Bluex reutilizando el flujo B2C con validación de pago).',
  },

  // ── 9 junio 2026 · Estabilidad tienda B2C ──────────────────────────────
  {
    fecha: '2026-06-09',
    tipo: 'bug',
    area: 'Toda la tienda',
    titulo: 'Scroll con rueda del mouse bloqueado',
    detalle: 'Una regla CSS global (overscroll-behavior: contain) se tragaba la rueda del mouse en toda la página: solo se podía scrollear arrastrando la barra. Eliminada — el scroll funciona desde cualquier punto.',
  },
  {
    fecha: '2026-06-09',
    tipo: 'bug',
    area: 'Checkout móvil',
    titulo: 'Botón de pagar invisible en celular',
    detalle: 'El banner "Instalar PEYU" (PWA) y el aviso de cookies se montaban encima de la barra de compra/pago en mobile. El banner PWA ya no aparece en el flujo de compra y el aviso de cookies quedó sobre la barra, sin taparla.',
  },
  {
    fecha: '2026-06-09',
    tipo: 'bug',
    area: 'ProductoNuevo',
    titulo: '"Producto no encontrado" intermitente',
    detalle: 'El cargador apagaba el loading antes de terminar los reintentos y no reintentaba cuando la consulta por ID venía vacía de forma transitoria. Ahora: 3 intentos resilientes + doble verificación contra la lista completa antes de declarar "no encontrado".',
  },
  {
    fecha: '2026-06-09',
    tipo: 'mejora',
    area: 'TiendaNueva · Cards',
    titulo: 'Robustez de enlaces y skeleton de carga',
    detalle: 'ProductCardV2: prop style duplicado eliminado (enlaces ?id= verificados en TiendaNueva y CatálogoNuevo). TiendaNueva mantiene el skeleton visible mientras reintenta cargar, en vez de mostrar grilla vacía.',
  },

  // ── Sesiones anteriores · Despacho y logística ─────────────────────────
  {
    fecha: '2026-06-05',
    tipo: 'bug',
    area: 'Etiqueta BlueExpress',
    titulo: 'Check de pago con transferencias',
    detalle: 'La generación de etiqueta ahora reconoce transferencias confirmadas como pago válido.',
  },
  {
    fecha: '2026-06-05',
    tipo: 'bug',
    area: 'Checkout',
    titulo: 'Retiro en tienda pedía dirección',
    detalle: 'El checkout ya no exige dirección de envío cuando el cliente elige retiro en tienda.',
  },
  {
    fecha: '2026-06-05',
    tipo: 'bug',
    area: 'Tarifas Bluex',
    titulo: 'Tarifas Atacama sin datos',
    detalle: 'Tramos de peso sin tarifa aplican +15% acumulado sobre el tramo anterior.',
  },
  {
    fecha: '2026-06-05',
    tipo: 'mejora',
    area: 'Envíos',
    titulo: 'Lead time estimado por región',
    detalle: 'RM: 1 día · Sur: 2-3 días · Extremos: 4-5 días. ShippingSelector muestra días hábiles reales por comuna.',
  },
  {
    fecha: '2026-06-05',
    tipo: 'feature',
    area: 'Admin',
    titulo: 'Despacho Rápido',
    detalle: 'Flujo express: selecciona pedido → genera etiqueta Bluex → imprime PDF. Búsqueda por pedido, tracking o cliente.',
  },
  {
    fecha: '2026-06-05',
    tipo: 'feature',
    area: 'Admin',
    titulo: 'Centro Logístico Bluex',
    detalle: 'Dashboard con lista de envíos, KPIs, filtros, sync de tracking (CRON cada 6h), secuencias IA por ciudad y análisis OTIF/excepciones.',
  },
  {
    fecha: '2026-06-05',
    tipo: 'mejora',
    area: 'IA',
    titulo: 'Modelos de mayor capacidad en flujos B2B',
    detalle: 'Triage de leads B2B y generación de propuestas corporativas usan modelos de alta capacidad para mejor calidad.',
  },
];

// Pendientes / próximas mejoras — se van tachando (hecho: true) o eliminando.
export const PENDIENTES = [
  { texto: 'Cargar Excel tarifas Bluex de hoy (todas las comunas de Chile)', tag: 'TODO' },
  { texto: 'Calendarizar actualización de tarifas / definir alcance con Joaquín', tag: 'TODO' },
  { texto: 'Revisar paso a paso flujo generar etiqueta (terminando)', tag: 'TODO' },
  { texto: 'Auditar tarifas Atacama vs factura Bluex', tag: 'TODO' },
  { texto: 'Refrescar imágenes productos (limpiar logos viejos)', tag: 'TODO' },
  { texto: 'Finalizar color-mapping B2B', tag: 'TODO' },
  { texto: 'PedidoDetailDrawer: considerar split en subcomponentes', tag: 'NOTA' },
];

// Estado de sistemas clave mostrado en el panel derecho.
export const ESTADO_SISTEMA = [
  { nombre: 'BlueExpress API PROD (OAuth)', estado: 'Operativo' },
  { nombre: 'Tarifas (346 comunas)', estado: 'Cargadas' },
  { nombre: 'Checkout v2', estado: 'Completo' },
  { nombre: 'Tienda B2C v2', estado: 'Estable' },
  { nombre: 'MercadoPago + webhook', estado: 'Activo' },
  { nombre: 'Emails transaccionales', estado: 'Routed' },
];

/** Agrupa el changelog por fecha (más reciente primero). */
export function changelogPorFecha() {
  const grupos = {};
  for (const e of CHANGELOG) {
    (grupos[e.fecha] = grupos[e.fecha] || []).push(e);
  }
  return Object.entries(grupos).sort((a, b) => b[0].localeCompare(a[0]));
}

/** KPIs calculados automáticamente desde el changelog. */
export function changelogKPIs() {
  return {
    total: CHANGELOG.length,
    bugs: CHANGELOG.filter((e) => e.tipo === 'bug').length,
    mejoras: CHANGELOG.filter((e) => e.tipo === 'mejora').length,
    features: CHANGELOG.filter((e) => e.tipo === 'feature').length,
    pendientes: PENDIENTES.length,
  };
}

export function fmtFecha(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}