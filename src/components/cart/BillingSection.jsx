import { useState } from 'react';
import { FileText, Receipt, AlertCircle } from 'lucide-react';
import FormField from './FormField';
import { validarRut, formatearRut } from '@/lib/rut-chile';

/**
 * BillingSection — FIX 5. Toggle Boleta / Factura en el checkout.
 *  - Boleta: no pide datos de empresa.
 *  - Factura: muestra y EXIGE razón social, RUT (módulo 11), giro, dirección y comuna.
 * Inputs controlados con buen contraste (FormField) y validación visible.
 *
 * Props:
 *  - billing: { tipo_documento, razon_social, rut_empresa, giro, direccion_facturacion, comuna_facturacion }
 *  - setBilling: (next) => void
 *  - errors: { [campo]: mensaje }
 */
export default function BillingSection({ billing, setBilling, errors = {} }) {
  const [touched, setTouched] = useState({});
  const esFactura = billing.tipo_documento === 'Factura';

  const update = (key) => (e) => setBilling({ ...billing, [key]: e.target.value });
  const rutValido = billing.rut_empresa ? validarRut(billing.rut_empresa) : false;

  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-7 shadow-sm">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl text-white flex items-center justify-center font-poppins font-bold text-sm shadow-sm" style={{ background: 'linear-gradient(135deg,var(--ck-action, #C0785C),var(--ck-action-dark, #A86440))' }}>
          <Receipt className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-poppins font-bold text-gray-900 text-base">Documento tributario</h3>
          <p className="text-xs text-gray-500 mt-0.5">¿Necesitas boleta o factura?</p>
        </div>
      </div>

      {/* Toggle */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { id: 'Boleta', icon: Receipt, label: 'Boleta', sub: 'Compra personal' },
          { id: 'Factura', icon: FileText, label: 'Factura', sub: 'Empresa' },
        ].map((opt) => {
          const active = billing.tipo_documento === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setBilling({ ...billing, tipo_documento: opt.id })}
              className={`relative p-4 rounded-2xl border-2 text-left transition-all ${
                active ? 'shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              style={active ? { borderColor: 'var(--ck-action, #C0785C)', background: 'var(--ck-action-tint, rgba(192,120,92,.05))' } : undefined}
            >
              <opt.icon className={`w-5 h-5 mb-2 ${active ? '' : 'text-gray-400'}`} style={active ? { color: 'var(--ck-action, #C0785C)' } : undefined} />
              <p className="font-bold text-sm text-gray-900">{opt.label}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{opt.sub}</p>
            </button>
          );
        })}
      </div>

      {/* Datos de facturación (solo Factura) */}
      {esFactura && (
        <div className="space-y-4">
          <FormField
            label="Razón social"
            name="razon_social"
            autoComplete="organization"
            value={billing.razon_social}
            onChange={update('razon_social')}
            placeholder="Comercializadora Ejemplo SpA"
            required
            error={errors.razon_social}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="w-full min-w-0">
              <FormField
                label="RUT empresa"
                name="rut_empresa"
                autoComplete="off"
                value={billing.rut_empresa}
                onChange={update('rut_empresa')}
                onBlur={() => {
                  setTouched((p) => ({ ...p, rut_empresa: true }));
                  if (validarRut(billing.rut_empresa)) {
                    setBilling({ ...billing, rut_empresa: formatearRut(billing.rut_empresa) });
                  }
                }}
                placeholder="12.345.678-9"
                required
                error={errors.rut_empresa || (touched.rut_empresa && billing.rut_empresa && !rutValido ? 'RUT inválido (revisa el dígito verificador)' : undefined)}
                isValid={rutValido}
              />
            </div>
            <FormField
              label="Giro"
              name="giro"
              value={billing.giro}
              onChange={update('giro')}
              placeholder="Comercio al por menor"
              required
              error={errors.giro}
            />
          </div>
          <FormField
            label="Dirección de facturación"
            name="direccion_facturacion"
            autoComplete="off"
            value={billing.direccion_facturacion}
            onChange={update('direccion_facturacion')}
            placeholder="Av. Apoquindo 1234, oficina 56"
            required
            error={errors.direccion_facturacion}
          />
          <FormField
            label="Comuna de facturación"
            name="comuna_facturacion"
            value={billing.comuna_facturacion}
            onChange={update('comuna_facturacion')}
            placeholder="Las Condes"
            required
            error={errors.comuna_facturacion}
          />
          <p className="text-[11px] text-gray-400 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            Emitimos la factura electrónica con estos datos. Verifica que sean correctos.
          </p>
        </div>
      )}
    </div>
  );
}

// Validación exportable — devuelve { campo: mensaje } solo si es Factura.
export function validarBilling(billing) {
  const errs = {};
  if (billing.tipo_documento !== 'Factura') return errs;
  if (!billing.razon_social || billing.razon_social.trim().length < 2) errs.razon_social = 'Ingresa la razón social';
  if (!billing.rut_empresa || !validarRut(billing.rut_empresa)) errs.rut_empresa = 'RUT inválido (revisa el dígito verificador)';
  if (!billing.giro || billing.giro.trim().length < 2) errs.giro = 'Ingresa el giro';
  if (!billing.direccion_facturacion || billing.direccion_facturacion.trim().length < 3) errs.direccion_facturacion = 'Ingresa la dirección de facturación';
  if (!billing.comuna_facturacion || billing.comuna_facturacion.trim().length < 2) errs.comuna_facturacion = 'Ingresa la comuna';
  return errs;
}