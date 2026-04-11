import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const results = { leads: 0, cotizaciones: 0, ordenes: 0, campanas: 0, productos: 0 };

  // Productos
  const productos = [
    { sku: 'SOPC-001', nombre: 'Soporte Celular PEYU', categoria: 'Escritorio', material: 'Plástico 100% Reciclado', canal: 'B2B + B2C', precio_b2c: 6990, precio_base_b2b: 4500, precio_50_199: 4050, precio_200_499: 3825, precio_500_mas: 3510, moq_personalizacion: 10, personalizacion_gratis_desde: 10, lead_time_sin_personal: 5, lead_time_con_personal: 7, inyecciones_requeridas: 1, garantia_anios: 10, activo: true, area_laser_mm: '60x40' },
    { sku: 'SONB-001', nombre: 'Soporte Notebook PEYU', categoria: 'Escritorio', material: 'Plástico 100% Reciclado', canal: 'B2B + B2C', precio_b2c: 9990, precio_base_b2b: 6500, precio_50_199: 5850, precio_200_499: 5525, precio_500_mas: 5070, moq_personalizacion: 10, personalizacion_gratis_desde: 10, lead_time_sin_personal: 5, lead_time_con_personal: 7, inyecciones_requeridas: 1, garantia_anios: 10, activo: true, area_laser_mm: '80x50' },
    { sku: 'LLAV-001', nombre: 'Llavero Soporte Celular', categoria: 'Escritorio', material: 'Plástico 100% Reciclado', canal: 'B2B + B2C', precio_b2c: 3990, precio_base_b2b: 2500, precio_50_199: 2250, precio_200_499: 2125, precio_500_mas: 1950, moq_personalizacion: 10, personalizacion_gratis_desde: 10, lead_time_sin_personal: 4, lead_time_con_personal: 6, inyecciones_requeridas: 1, garantia_anios: 10, activo: true, area_laser_mm: '30x15' },
    { sku: 'POSAV-001', nombre: 'Posavasos Set x4', categoria: 'Hogar', material: 'Plástico 100% Reciclado', canal: 'B2B + B2C', precio_b2c: 7990, precio_base_b2b: 5000, precio_50_199: 4500, precio_200_499: 4250, precio_500_mas: 3900, moq_personalizacion: 10, personalizacion_gratis_desde: 10, lead_time_sin_personal: 5, lead_time_con_personal: 7, inyecciones_requeridas: 1, garantia_anios: 10, activo: true },
    { sku: 'CACH-001', nombre: 'Pack Cachos (6 u)', categoria: 'Entretenimiento', material: 'Plástico 100% Reciclado', canal: 'B2B + B2C', precio_b2c: 25990, precio_base_b2b: 18000, precio_50_199: 16200, precio_200_499: 15300, precio_500_mas: 14040, moq_personalizacion: 10, personalizacion_gratis_desde: 10, lead_time_sin_personal: 6, lead_time_con_personal: 8, inyecciones_requeridas: 2, garantia_anios: 10, activo: true },
    { sku: 'LAMP-001', nombre: 'Lámpara Chillka', categoria: 'Hogar', material: 'Plástico 100% Reciclado', canal: 'B2B + B2C', precio_b2c: 23490, precio_base_b2b: 16000, precio_50_199: 14400, precio_200_499: 13600, precio_500_mas: 12480, moq_personalizacion: 10, personalizacion_gratis_desde: 10, lead_time_sin_personal: 10, lead_time_con_personal: 12, inyecciones_requeridas: 3, garantia_anios: 10, activo: true },
    { sku: 'MACE-001', nombre: 'Macetero Ecológico', categoria: 'Hogar', material: 'Plástico 100% Reciclado', canal: 'B2B + B2C', precio_b2c: 5990, precio_base_b2b: 3800, precio_50_199: 3420, precio_200_499: 3230, precio_500_mas: 2964, moq_personalizacion: 10, personalizacion_gratis_desde: 10, lead_time_sin_personal: 5, lead_time_con_personal: 7, inyecciones_requeridas: 1, garantia_anios: 10, activo: true },
    { sku: 'KIT-ESCR-001', nombre: 'Kit Escritorio Corporativo (5 piezas)', categoria: 'Corporativo', material: 'Plástico 100% Reciclado', canal: 'B2B Exclusivo', precio_b2c: 0, precio_base_b2b: 19990, precio_50_199: 17990, precio_200_499: 16990, precio_500_mas: 15590, moq_personalizacion: 10, personalizacion_gratis_desde: 10, lead_time_sin_personal: 7, lead_time_con_personal: 9, inyecciones_requeridas: 1, garantia_anios: 10, activo: true, descripcion: 'Soporte celular + soporte notebook + llavero + posavaso + separador de páginas' },
    { sku: 'CARC-001', nombre: 'Carcasa iPhone Fibra Trigo', categoria: 'Carcasas B2C', material: 'Fibra de Trigo (Compostable)', canal: 'B2C Exclusivo', precio_b2c: 14990, precio_base_b2b: 0, moq_personalizacion: 0, personalizacion_gratis_desde: 0, lead_time_sin_personal: 3, lead_time_con_personal: 3, inyecciones_requeridas: 0, garantia_anios: 2, activo: true, descripcion: 'Carcasa compostable 100% fibra de trigo. Solo canal B2C.' },
  ];

  for (const p of productos) {
    await base44.asServiceRole.entities.Producto.create(p);
    results.productos++;
  }

  // Leads
  const leads = [
    { empresa: 'Adidas Chile', contacto: 'María González', email: 'mgonzalez@adidas.cl', telefono: '+56912345678', canal: 'WhatsApp', estado: 'Cotizado', tipo: 'B2B Corporativo', calidad_lead: 'Caliente', cantidad_estimada: 500, presupuesto_estimado: 9000000, producto_interes: 'Kit Escritorio Corporativo', logo_recibido: true, personalizacion: true, next_action: 'Enviar mockup con logo Adidas', next_action_date: '2026-04-12' },
    { empresa: 'Nestlé Chile', contacto: 'Carlos Vega', email: 'cvega@nestle.com', canal: 'Email', estado: 'Muestra Enviada', tipo: 'B2B Corporativo', calidad_lead: 'Caliente', cantidad_estimada: 1000, presupuesto_estimado: 18000000, producto_interes: 'Posavasos + Soporte Celular', logo_recibido: true, personalizacion: true, next_action: 'Seguimiento a muestra enviada', next_action_date: '2026-04-13' },
    { empresa: 'BancoEstado', contacto: 'Ana Martínez', email: 'amartinez@bancoestado.cl', canal: 'LinkedIn', estado: 'Negociación', tipo: 'B2B Corporativo', calidad_lead: 'Caliente', cantidad_estimada: 2000, presupuesto_estimado: 32000000, producto_interes: 'Kit Escritorio + Cachos', logo_recibido: true, personalizacion: true, notas: 'Empresa con política ESG fuerte. Muy interesados en fabricación local.' },
    { empresa: 'DUOC UC', contacto: 'Pedro Soto', email: 'psoto@duoc.cl', canal: 'Instagram', estado: 'Contactado', tipo: 'B2B Pyme', calidad_lead: 'Tibio', cantidad_estimada: 200, presupuesto_estimado: 4000000, producto_interes: 'Llavero Soporte', personalizacion: true, next_action: 'Enviar catálogo B2B', next_action_date: '2026-04-14' },
    { empresa: 'Tech Startup SPA', contacto: 'Laura Pérez', canal: 'WhatsApp', estado: 'Nuevo', tipo: 'B2B Pyme', calidad_lead: 'Tibio', cantidad_estimada: 50, producto_interes: 'Soporte Celular', personalizacion: true },
    { empresa: 'Felicitación #1', contacto: 'Patricia Rojas', canal: 'WhatsApp', estado: 'Perdido', tipo: 'B2C', calidad_lead: 'No Comercial', notas: 'Solo felicitó el proyecto, no intención de compra' },
    { empresa: 'Minera Los Bronces', contacto: 'Roberto Fuentes', email: 'rfuentes@minera.com', canal: 'LinkedIn', estado: 'Nuevo', tipo: 'B2B Corporativo', calidad_lead: 'Caliente', cantidad_estimada: 5000, presupuesto_estimado: 75000000, producto_interes: 'Kit Escritorio Corporativo', personalizacion: true, notas: 'Empresa con alto estándar sustentabilidad, no miran precio. Catálogo premium.' },
    { empresa: 'Universidad Adolfo Ibáñez', contacto: 'Francisca Lima', canal: 'Email', estado: 'Cotizado', tipo: 'B2B Corporativo', calidad_lead: 'Tibio', cantidad_estimada: 300, presupuesto_estimado: 6000000, producto_interes: 'Cachos Pack', personalizacion: true, logo_recibido: false },
  ];

  for (const l of leads) {
    await base44.asServiceRole.entities.Lead.create(l);
    results.leads++;
  }

  // Cotizaciones
  const cotizaciones = [
    { empresa: 'Adidas Chile', contacto: 'María González', sku: 'Kit Escritorio Corporativo', cantidad: 500, precio_unitario: 19990, descuento_pct: 22, fee_personalizacion: 0, fee_packaging: 14993, total: 7934543, personalizacion_tipo: 'Láser UV', packaging: 'Personalizado', lead_time_dias: 12, estado: 'Enviada', es_express: false },
    { empresa: 'Nestlé Chile', contacto: 'Carlos Vega', sku: 'Posavasos + Soporte Celular (mix)', cantidad: 1000, precio_unitario: 4750, descuento_pct: 22, fee_personalizacion: 0, total: 3705000, personalizacion_tipo: 'Láser UV', packaging: 'Estándar (stock)', lead_time_dias: 9, estado: 'Aceptada', es_express: false },
    { empresa: 'DUOC UC', contacto: 'Pedro Soto', sku: 'Llavero Soporte Celular', cantidad: 200, precio_unitario: 2500, descuento_pct: 15, fee_personalizacion: 0, total: 425000, personalizacion_tipo: 'Láser UV', packaging: 'Estándar (stock)', lead_time_dias: 7, estado: 'Borrador', es_express: false },
  ];

  for (const c of cotizaciones) {
    await base44.asServiceRole.entities.Cotizacion.create(c);
    results.cotizaciones++;
  }

  // Órdenes producción
  const ordenes = [
    { numero_op: 'OP-2026-001', empresa: 'Nestlé Chile', sku: 'Posavasos + Soporte Celular (mix)', cantidad: 1000, estado: 'En Producción', prioridad: 'Normal', inyectora: 'Inyectora 1', laser: 'Láser 1', personalizacion: true, packaging_externo: false, anticipo_pagado: true, fecha_inicio: '2026-04-08', fecha_entrega_prometida: '2026-04-15' },
    { numero_op: 'OP-2026-002', empresa: 'BancoEstado', sku: 'Kit Escritorio Corporativo', cantidad: 2000, estado: 'En Cola', prioridad: 'Alta (urgente)', inyectora: 'Inyectora 2', laser: 'Láser 2', personalizacion: true, packaging_externo: true, anticipo_pagado: true, fecha_inicio: '2026-04-12', fecha_entrega_prometida: '2026-04-22' },
    { numero_op: 'OP-2026-003', empresa: 'Stock B2C Web', sku: 'Soporte Celular PEYU', cantidad: 500, estado: 'Listo para Despacho', prioridad: 'Normal', inyectora: 'Inyectora 3', laser: 'No requiere', personalizacion: false, packaging_externo: false, anticipo_pagado: true, fecha_despacho_real: '2026-04-11' },
    { numero_op: 'OP-2026-004', empresa: 'Stock B2C Web', sku: 'Lámpara Chillka', cantidad: 50, estado: 'Control Calidad', prioridad: 'Baja', inyectora: 'Inyectora 4', laser: 'No requiere', personalizacion: false, packaging_externo: false, anticipo_pagado: true },
  ];

  for (const o of ordenes) {
    await base44.asServiceRole.entities.OrdenProduccion.create(o);
    results.ordenes++;
  }

  // Campañas
  const campanas = [
    { nombre: 'Meta Ads — Escritorio Q2', canal: 'Meta Ads', objetivo: 'Conversión', estado: 'Activa', presupuesto_clp: 1200000, gasto_real_clp: 980000, impresiones: 450000, clics: 5400, conversiones: 12, leads_generados: 35, roas: 1.8, cac_clp: 28000, ctr_pct: 1.2, tipo_contenido: 'Video Reel', sku_promovido: 'Soporte Celular + Notebook' },
    { nombre: 'Meta Ads — B2B Corporativo', canal: 'Meta Ads', objetivo: 'B2B Lead Gen', estado: 'Activa', presupuesto_clp: 800000, gasto_real_clp: 600000, impresiones: 120000, clics: 900, conversiones: 3, leads_generados: 8, roas: 2.1, cac_clp: 75000, ctr_pct: 0.75, tipo_contenido: 'Imagen Estática', sku_promovido: 'Kit Escritorio Corporativo' },
    { nombre: 'TikTok — How it\'s Made', canal: 'TikTok Ads', objetivo: 'Awareness', estado: 'Planificada', presupuesto_clp: 300000, gasto_real_clp: 0, impresiones: 0, clics: 0, conversiones: 0, leads_generados: 0, tipo_contenido: 'Video Reel', sku_promovido: 'Proceso fábrica' },
    { nombre: 'Google Search — Regalos Corp.', canal: 'Google Search', objetivo: 'B2B Lead Gen', estado: 'Planificada', presupuesto_clp: 500000, tipo_contenido: 'Texto', sku_promovido: 'regalos corporativos sustentables' },
    { nombre: 'Orgánico IG — Proceso Reciclaje', canal: 'Orgánico Instagram', objetivo: 'Awareness', estado: 'Activa', presupuesto_clp: 0, gasto_real_clp: 0, impresiones: 85000, clics: 2100, leads_generados: 12, ctr_pct: 2.5, tipo_contenido: 'Video Reel' },
  ];

  for (const c of campanas) {
    await base44.asServiceRole.entities.Campana.create(c);
    results.campanas++;
  }

  return Response.json({ ok: true, results });
});