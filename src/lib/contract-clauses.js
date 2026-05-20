// ============================================================================
// contract-clauses.js · Cláusulas resumidas del contrato PEYU-IMPULSIA
// ----------------------------------------------------------------------------
// Estructura legible del contrato firmado el 2026 entre PEYU CHILE SPA e
// IMPULSIA SPA (marca "B2BYTES"). Usado por la página /admin/contrato-impulsia
// para mostrar cláusulas, alcance comprometido, hitos y derechos de PEYU.
//
// Fuente original: Contrato de Regularización y Prestación de Servicios de
// Automatización con IA — Proyecto B2BYTES para PEYU Chile.
// Pago hecho: $719.976 CLP (Factura N°7, 30-mar-2026). NO entregado.
// ============================================================================

export const CONTRACT_META = {
  titulo: 'Contrato de Regularización y Prestación de Servicios de Automatización con IA',
  proyecto: 'B2BYTES para PEYU Chile',
  fecha_pago: '2026-03-30',
  monto_pagado_clp: 719976,
  monto_neto_clp: 605022,
  iva_clp: 114954,
  factura: 'N°7 emitida por IMPULSIA SPA',
  descriptivo_factura: 'SERVICIOS DE CONSTRUCCIÓN WEB, POR 3 MESES',
  proveedor: { nombre: 'IMPULSIA SPA', rut: '78.274.779-7', web: 'https://b2bytes.tech' },
  cliente:   { nombre: 'PEYU CHILE SPA', rut: '77.069.974-6' },
  garante:   { nombre: 'Lya Mundaca', rol: 'Socia, fundadora y garante personal solidaria' },
};

export const CLAUSULAS = [
  {
    id: '1',
    titulo: 'Identificación comercial y responsabilidad',
    resumen: 'IMPULSIA SPA es el único responsable legal. B2BYTES, B2Business, Lya, Centro de Comandos son marcas, no entidades. Lya Mundaca constituye garantía personal solidaria.',
    puntos_clave: [
      'IMPULSIA SPA (RUT 78.274.779-7) es responsable legal, comercial, tributario y técnico.',
      'B2BYTES y B2Business son MARCAS de IMPULSIA, sin personalidad jurídica autónoma.',
      'Si se constituye B2BYTES SpA, IMPULSIA mantiene responsabilidad principal sin novación.',
      'Lya Mundaca firma personalmente como garante solidaria.',
    ],
    nuestra_postura: 'Confirmado por WhatsApp de Lya: "la empresa se llama IMPULSIA, la factura salió de ahí". Sin ambigüedad.',
  },
  {
    id: '2-3',
    titulo: 'Objeto y alcance integral del servicio',
    resumen: 'Proyecto integral B2B + B2C: infraestructura web + móvil, 17 agentes IA, e-commerce B2C, panel B2B, integraciones, hosting, backups, código fuente entregable.',
    puntos_clave: [
      'A. Infraestructura: web responsive + app móvil iOS/Android, hosting, SSL, CDN, backups 30 días, código fuente propiedad de PEYU.',
      'B. 17 agentes IA coordinados (cada uno con nombre, función, modelo, métricas garantizadas, supervisión humana, canal B2B/B2C).',
      'C. E-commerce B2C: carrito, checkout, pasarelas pago, gestión pedidos, abandono, post-venta.',
      'D. Panel B2B: leads, cotizaciones, propuestas, mockups, seguimiento.',
      'E. Catálogo: sincronización, imágenes, SEO, indexación.',
      'F. Logística: integración courier (Bluex/Starken), tracking, etiquetas.',
      'G. Analítica: dashboards en tiempo real, reportes ejecutivos.',
      'H. El descriptivo "SERVICIOS DE CONSTRUCCIÓN WEB POR 3 MESES" de la factura NO limita el alcance.',
    ],
    nuestra_postura: 'IMPULSIA NO entregó NADA del alcance. PEYU construyó por su cuenta sobre Base44 lo que IMPULSIA prometió.',
  },
  {
    id: '4',
    titulo: 'Plazos y hitos vinculantes',
    resumen: 'Fase 0 (estabilización) debió entregarse dentro de los plazos pactados por correo. Incumplido. Resto del proyecto con plazos a definir post-firma.',
    puntos_clave: [
      'Fase 0 (Estabilización y Recopilación): NO ENTREGADA pese al pago efectuado.',
      'IMPULSIA solicitó pagos adicionales sin entregar Fase 0 → PEYU rechazó.',
      'PEYU exige suscripción de este contrato como condición previa a continuar.',
    ],
    nuestra_postura: 'Tenemos derecho legal (Art. 1489 Código Civil) a resolución del contrato + restitución íntegra + indemnización.',
  },
  {
    id: '5',
    titulo: 'Precio, pagos efectuados y compensaciones',
    resumen: 'Único pago realizado: $719.976 CLP (Factura N°7, 30-mar-2026). IMPULSIA reclama pagos adicionales que PEYU NO debe hasta que cumpla.',
    puntos_clave: [
      'Pago realizado: $719.976 CLP (neto $605.022 + IVA $114.954) el 30-mar-2026.',
      'Pagos futuros condicionados a aceptación formal de hitos por PEYU.',
      'Cláusula de no novación: este contrato regulariza pero NO renuncia a reclamaciones previas.',
    ],
    nuestra_postura: 'Suma pagada queda imputada como anticipo. Si IMPULSIA no entrega, debe restituir + multas.',
  },
  {
    id: '6',
    titulo: 'Garantía personal de Lya Mundaca',
    resumen: 'Lya Mundaca responde solidariamente con su patrimonio personal por las obligaciones de IMPULSIA SPA.',
    puntos_clave: [
      'Garantía personal y solidaria sobre la totalidad de las obligaciones de IMPULSIA.',
      'Subsiste aunque IMPULSIA se disuelva o sea sucedida por B2BYTES SpA.',
      'PEYU puede ejecutar contra Lya directamente sin necesidad de excluir primero a IMPULSIA.',
    ],
    nuestra_postura: 'Si IMPULSIA no responde, ejecutamos contra Lya personalmente.',
  },
  {
    id: '7',
    titulo: 'Multas y compensaciones por incumplimiento',
    resumen: 'Multas escalonadas por atraso, reproceso y abandono del proyecto.',
    puntos_clave: [
      'Atraso en hitos: multa diaria configurable (típicamente 1-5% del monto facturado por día).',
      'Reproceso por defectos: a cargo de IMPULSIA, sin costo adicional para PEYU.',
      'Abandono del proyecto: restitución íntegra + multa adicional + indemnización por daño emergente y lucro cesante.',
      'Uso indebido de marca PEYU sin autorización: multa específica (ver cláusula 10).',
    ],
    nuestra_postura: 'Activamos cláusula de multas desde el día 1 del incumplimiento de Fase 0.',
  },
  {
    id: '8',
    titulo: 'Propiedad intelectual y código fuente',
    resumen: 'Todo lo desarrollado para PEYU es de propiedad exclusiva de PEYU. IMPULSIA no puede reutilizar nada en otros clientes.',
    puntos_clave: [
      'Código fuente, prompts de agentes, datasets, configuración: 100% propiedad de PEYU.',
      'Entrega documentada con repos Git, credenciales y handoff técnico.',
      'IMPULSIA prohibida de usar la marca PEYU como caso de éxito sin autorización escrita.',
    ],
    nuestra_postura: 'No hay código que entregar porque no hubo desarrollo real de IMPULSIA. Lo construido por PEYU sobre Base44 es de PEYU.',
  },
  {
    id: '9',
    titulo: 'Confidencialidad y datos',
    resumen: 'Datos de clientes, proveedores, financieros: estrictamente confidenciales. NDA bilateral. Cumplimiento Ley 19.628.',
    puntos_clave: [
      'IMPULSIA no puede divulgar datos comerciales, técnicos ni financieros de PEYU.',
      'Cumplimiento Ley 19.628 sobre protección de datos personales (Chile).',
      'Brechas de seguridad: notificación obligatoria en 24h.',
    ],
    nuestra_postura: 'Auditar qué datos compartimos con IMPULSIA y verificar que no haya leaks en b2bytes.tech.',
  },
  {
    id: '10',
    titulo: 'Caso de éxito publicado sin autorización',
    resumen: 'IMPULSIA publicó en b2bytes.tech/casos-exito-eaas-empresas un "caso PEYU Distribución" con métricas no verificadas ni autorizadas por PEYU.',
    puntos_clave: [
      'IMPULSIA debe retirar el caso de éxito de inmediato.',
      'Si lo deja publicado, multa adicional + obligación de rectificación pública.',
      'PEYU se reserva derecho de demandar por uso indebido de marca y publicidad engañosa.',
    ],
    nuestra_postura: 'Exigir retiro inmediato + screenshot legal de la versión actual como evidencia.',
  },
  {
    id: '11',
    titulo: 'Resolución y término anticipado',
    resumen: 'PEYU puede terminar el contrato unilateralmente si IMPULSIA incumple por > 15 días corridos sin justificación.',
    puntos_clave: [
      'Aviso de término con 15 días, sin necesidad de declaración judicial.',
      'IMPULSIA debe restituir lo no devengado + entregar handoff técnico.',
      'PEYU mantiene todo derecho a indemnización adicional.',
    ],
    nuestra_postura: 'Tenemos derecho a resolver. Decisión estratégica: continuar exigiendo entrega o resolver y demandar.',
  },
  {
    id: '12',
    titulo: 'Foro, ley aplicable y arbitraje',
    resumen: 'Ley chilena. Tribunales ordinarios de Santiago. Posibilidad de mediación previa CAM Santiago.',
    puntos_clave: [
      'Ley aplicable: República de Chile.',
      'Foro: Tribunales ordinarios de Santiago.',
      'Mediación opcional vía CAM Santiago antes de demanda.',
    ],
    nuestra_postura: 'Carta certificada como primer paso. Mediación CAM si IMPULSIA responde. Demanda si no.',
  },
];

// Hechos clave que vamos a probar con métricas reales de la plataforma.
// La página /admin/contrato-impulsia cruza estos hechos con datos vivos
// del backend (contractAnalysis) para demostrar punto por punto.
export const HECHOS_A_PROBAR = [
  {
    id: 'F1',
    hecho: 'PEYU pagó $719.976 CLP el 30-mar-2026 a IMPULSIA SPA.',
    fuente_evidencia: 'Factura Electrónica N°7 IMPULSIA SPA',
    estado: 'PROBADO',
  },
  {
    id: 'F2',
    hecho: 'IMPULSIA no entregó la Fase 0 ni ningún componente del alcance.',
    fuente_evidencia: 'Ausencia total de código, repositorios, credenciales o handoff entregado por IMPULSIA.',
    estado: 'PROBADO',
  },
  {
    id: 'F3',
    hecho: 'PEYU construyó por su cuenta el sistema actual sobre la plataforma Base44.',
    fuente_evidencia: 'Métricas vivas en /admin/contrato-impulsia (funciones, agentes, pedidos, integraciones).',
    estado: 'PROBADO',
  },
  {
    id: 'F4',
    hecho: 'IMPULSIA publicó un "caso de éxito PEYU" sin autorización.',
    fuente_evidencia: 'URL pública: https://b2bytes.tech/casos-exito-eaas-empresas',
    estado: 'PROBADO',
  },
  {
    id: 'F5',
    hecho: 'IMPULSIA solicitó pagos adicionales sin entregar la Fase 0 pagada.',
    fuente_evidencia: 'Correos y WhatsApp posteriores al 30-mar-2026.',
    estado: 'PROBADO',
  },
  {
    id: 'F6',
    hecho: 'Lya Mundaca confirmó por WhatsApp que "la empresa se llama IMPULSIA y la factura salió de ahí".',
    fuente_evidencia: 'Anexo IV del contrato (captura WhatsApp).',
    estado: 'PROBADO',
  },
];

// Estrategia de respuesta sugerida al contrato.
export const ESTRATEGIA_RESPUESTA = {
  postura_general: 'Firmar el contrato es PROCEDENTE porque endurece nuestras condiciones y NO renuncia a reclamaciones previas. Pero exigir simultáneamente que IMPULSIA: (1) retire el caso de éxito publicado, (2) entregue Fase 0 en plazo perentorio, (3) acepte multas desde el día 1 del incumplimiento previo.',
  pasos_concretos: [
    {
      paso: 1,
      accion: 'Confirmar exposición real: hoy todo lo construido es de PEYU sobre Base44. IMPULSIA no tiene código ni acceso productivo.',
      responsable: 'Equipo técnico PEYU',
      plazo: 'Inmediato',
    },
    {
      paso: 2,
      accion: 'Capturar screenshot legal del caso de éxito en b2bytes.tech y reservar evidencia con timestamp notarial o servicio tipo Web Archive.',
      responsable: 'PEYU + abogado',
      plazo: '24h',
    },
    {
      paso: 3,
      accion: 'Cerrar contrato con cláusulas reforzadas (versión actual ya las tiene): garantía Lya, no novación, indivisibilidad, multas, propiedad PEYU.',
      responsable: 'Abogado PEYU + IMPULSIA + Lya',
      plazo: '7 días',
    },
    {
      paso: 4,
      accion: 'Enviar carta certificada formalizando incumplimiento previo de Fase 0 + activación de multas desde día 1.',
      responsable: 'Abogado PEYU',
      plazo: 'Día firma + 1',
    },
    {
      paso: 5,
      accion: 'Definir plazo perentorio (15-20 días) para entrega Fase 0 reformulada. Si no cumple → resolución y demanda.',
      responsable: 'PEYU',
      plazo: 'Calendario',
    },
    {
      paso: 6,
      accion: 'Evaluar si conviene exigir restitución de los $719.976 o aceptar como crédito a futuras entregas. Recomendación: restitución, porque PEYU ya construyó el sistema.',
      responsable: 'Dirección PEYU',
      plazo: 'Decisión estratégica',
    },
  ],
  argumentos_negociacion: [
    'PEYU ya construyó la plataforma completa sobre Base44 — no necesita a IMPULSIA técnicamente. Esto cambia el balance de poder.',
    'IMPULSIA usó la marca PEYU sin autorización en un caso de éxito ficticio. Este solo hecho activa multas + es publicidad engañosa.',
    'La factura "SERVICIOS DE CONSTRUCCIÓN WEB POR 3 MESES" + WhatsApp de Lya + sitio b2bytes.tech con "17 agentes IA" prueban que el alcance comprometido excede ampliamente cualquier "construcción web".',
    'Lya Mundaca firma como garante personal — la persona responde con su patrimonio si IMPULSIA se disuelve.',
    'Código civil chileno Art. 1489: incumplimiento → resolución + indemnización. Está a favor de PEYU.',
  ],
};