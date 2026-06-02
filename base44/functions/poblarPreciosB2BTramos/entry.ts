import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ============================================================================
// poblarPreciosB2BTramos
// ----------------------------------------------------------------------------
// Pobla el objeto `precio_b2b_tramos` (8 llaves) que lee el cotizador B2B en
// los productos corporativos/personalizables y carcasas que lo tengan NULL.
//
// FUENTE DE PRECIOS (en orden de prioridad):
//   1. Campos oficiales del catálogo PDF ya cargados en el Producto
//      (precio_unitario_oficial_clp, precio_10_49_clp, ... precio_2000_mas_clp).
//      Si existen, se usan TAL CUAL — son la fuente de verdad de Peyu.
//   2. Si NO hay campos oficiales, se calcula una TARIFA PRELIMINAR con regla
//      porcentual de descuento por volumen sobre el precio unitario base:
//        10-49u  = -10% · 50-99u = -15% · 100-249u = -20%
//        250-499u = -25% · 500-999u = -28% · 1000-1999u = -30% · 2000+ = -33%
//      Estos productos quedan marcados con precio_b2b_preliminar = true.
//
// Llaves de salida (las que espera V2_B2B_TRAMOS / el cotizador):
//   unitario, t10_49, t50_99, t100_249, t250_499, t500_999, t1000_1999, t2000_mas
//
// Payload:
//   { sku }                  → un producto (prueba)
//   { lote:true, limite:N }  → procesa en lote (default 100)
//   { sobrescribir:false }   → si true, recalcula aunque ya tenga tramos
//   { soloCalculados:false } → si true, recalcula SOLO los preliminares
// ============================================================================

const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null);
const round = (n) => Math.round(n / 10) * 10; // redondeo a la decena CLP

// Descuento porcentual por tramo (tarifa preliminar editable).
const REGLA_PCT = {
  unitario: 0,
  t10_49: 0.10,
  t50_99: 0.15,
  t100_249: 0.20,
  t250_499: 0.25,
  t500_999: 0.28,
  t1000_1999: 0.30,
  t2000_mas: 0.33,
};

// Mapa llave_salida → campo oficial del Producto.
const CAMPO_OFICIAL = {
  unitario: 'precio_unitario_oficial_clp',
  t10_49: 'precio_10_49_clp',
  t50_99: 'precio_50_99_clp',
  t100_249: 'precio_100_249_clp',
  t250_499: 'precio_250_499_clp',
  t500_999: 'precio_500_999_clp',
  t1000_1999: 'precio_1000_1999_clp',
  t2000_mas: 'precio_2000_mas_clp',
};

// Construye los 8 tramos para un producto. Devuelve { tramos, preliminar } o null.
function construirTramos(p) {
  const baseUnit = num(p.precio_unitario_oficial_clp) ?? num(p.precio_b2c);
  if (!baseUnit) return null; // sin precio base no podemos hacer nada

  // ¿Tiene al menos un campo oficial de tramo (más allá del unitario)?
  const tieneOficiales = ['precio_10_49_clp', 'precio_50_99_clp', 'precio_100_249_clp',
    'precio_250_499_clp', 'precio_500_999_clp', 'precio_1000_1999_clp', 'precio_2000_mas_clp']
    .some(c => num(p[c]));

  const tramos = {};
  if (tieneOficiales) {
    // Usar oficiales; rellenar huecos con el tramo anterior disponible (nunca sube).
    let ultimo = baseUnit;
    for (const key of Object.keys(CAMPO_OFICIAL)) {
      const val = num(p[CAMPO_OFICIAL[key]]);
      if (val) { tramos[key] = val; ultimo = val; }
      else { tramos[key] = ultimo; }
    }
    return { tramos, preliminar: false };
  }

  // Tarifa preliminar por regla porcentual.
  for (const [key, pct] of Object.entries(REGLA_PCT)) {
    tramos[key] = round(baseUnit * (1 - pct));
  }
  return { tramos, preliminar: true };
}

async function procesar(base44, p, sobrescribir, soloCalculados) {
  const yaTiene = p.precio_b2b_tramos && typeof p.precio_b2b_tramos === 'object' && Object.keys(p.precio_b2b_tramos).length > 0;
  if (yaTiene && !sobrescribir && !(soloCalculados && p.precio_b2b_preliminar)) {
    return { sku: p.sku, nombre: p.nombre, ok: false, motivo: 'ya tiene tramos' };
  }
  const built = construirTramos(p);
  if (!built) return { sku: p.sku, nombre: p.nombre, ok: false, motivo: 'sin precio base' };

  await base44.asServiceRole.entities.Producto.update(p.id, {
    precio_b2b_tramos: built.tramos,
    precio_b2b_preliminar: built.preliminar,
  });
  return { sku: p.sku, nombre: p.nombre, ok: true, preliminar: built.preliminar, tramos: built.tramos };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { sku = null, lote = false, limite = 100, sobrescribir = false, soloCalculados = false, internalSecret = null } = body;

    const user = await base44.auth.me().catch(() => null);
    const esInterno = internalSecret && internalSecret === Deno.env.get('MADRE_V2_SECRET');
    if (user?.role !== 'admin' && !esInterno) {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    if (sku) {
      const arr = await base44.asServiceRole.entities.Producto.filter({ sku });
      const p = arr?.[0];
      if (!p) return Response.json({ error: 'Producto no encontrado' }, { status: 404 });
      const res = await procesar(base44, p, sobrescribir, soloCalculados);
      return Response.json({ success: true, modo: 'single', resultado: res });
    }

    if (lote) {
      // Productos B2B-relevantes: corporativos/personalizables (canal B2B) + carcasas.
      const todos = await base44.asServiceRole.entities.Producto.filter({}, '-updated_date', 1000);
      const relevantes = todos.filter(p => {
        const esB2B = p.canal === 'B2B + B2C' || p.canal === 'B2B Exclusivo';
        const esCarcasa = p.categoria === 'Carcasas B2C';
        return esB2B || esCarcasa;
      });

      const pendientesTodos = relevantes.filter(p => {
        const yaTiene = p.precio_b2b_tramos && typeof p.precio_b2b_tramos === 'object' && Object.keys(p.precio_b2b_tramos).length > 0;
        if (sobrescribir) return true;
        if (soloCalculados) return p.precio_b2b_preliminar === true;
        return !yaTiene;
      });
      const pendientes = pendientesTodos.slice(0, limite);

      const resultados = [];
      for (const p of pendientes) {
        resultados.push(await procesar(base44, p, sobrescribir, soloCalculados));
        await new Promise(r => setTimeout(r, 120)); // throttle para no gatillar rate limit
      }
      const oks = resultados.filter(r => r.ok);
      return Response.json({
        success: true,
        modo: 'lote',
        candidatos: pendientes.length,
        procesados: oks.length,
        con_precio_oficial: oks.filter(r => !r.preliminar).length,
        preliminares: oks.filter(r => r.preliminar).length,
        pendientes_restantes: Math.max(0, pendientesTodos.length - pendientes.length),
        resultados,
      });
    }

    return Response.json({ error: 'Especifica sku o lote:true' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});