import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { REGIONES_CHILE, getComunasByRegion, validarCodigoPostal, validarTelefonoChile, validarDireccion } from '@/lib/chile-regiones';
import { AlertCircle, User, MapPin, Mail } from 'lucide-react';
import FormField from './FormField';

/**
 * Formulario de checkout robusto, agrupado en 3 secciones visuales:
 *  1) Contacto (nombre + email + teléfono)
 *  2) Dirección (región + comuna + calle + depto + CP)
 *  3) Notas opcionales
 *
 * Best practices:
 *  - autoComplete correcto en cada campo → el navegador rellena
 *  - Validación onBlur inline (no espera a "Continuar")
 *  - Telefono normalizado, depto separado de calle
 *  - Inputs no se salen del contenedor (w-full + min-w-0 + box-border)
 *  - FormField está en archivo separado: NO se rompe el foco al escribir
 */
export default function ShippingAddressForm({ cliente, setCliente, errors = {}, onEmailBlur }) {
  const [touched, setTouched] = useState({});
  const [localErrors, setLocalErrors] = useState({});
  const comunas = getComunasByRegion(cliente.region);

  // Helper de update — preserva foco porque el setter es estable
  const update = (key) => (e) => {
    const value = e.target.value;
    setCliente({ ...cliente, [key]: value });
    // Limpiar error al escribir
    if (localErrors[key]) {
      setLocalErrors({ ...localErrors, [key]: undefined });
    }
  };

  // Validación inline al hacer blur
  const validateField = (key) => () => {
    const errs = validarShippingForm(cliente);
    setLocalErrors((prev) => ({ ...prev, [key]: errs[key] }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const fieldError = (key) => errors[key] || localErrors[key];
  const fieldValid = (key) => touched[key] && !fieldError(key) && cliente[key];

  return (
    <div className="space-y-5">
      {/* ── SECCIÓN 1 · CONTACTO ──────────────────────────────────── */}
      <Section icon={User} title="Contacto" subtitle="Te enviaremos el comprobante y tracking aquí">
        <FormField
          label="Nombre completo"
          name="nombre"
          autoComplete="name"
          value={cliente.nombre}
          onChange={update('nombre')}
          onBlur={validateField('nombre')}
          placeholder="María González"
          required
          error={fieldError('nombre')}
          isValid={fieldValid('nombre')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={cliente.email}
            onChange={update('email')}
            onBlur={(e) => { validateField('email')(); onEmailBlur?.(e); }}
            placeholder="tu@email.com"
            required
            error={fieldError('email')}
            isValid={fieldValid('email')}
            hint="No spam · solo confirmación y tracking"
          />
          <FormField
            label="Teléfono · WhatsApp"
            name="telefono"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={cliente.telefono}
            onChange={update('telefono')}
            onBlur={validateField('telefono')}
            placeholder="9 1234 5678"
            prefix="+56"
            required
            error={fieldError('telefono')}
            isValid={fieldValid('telefono')}
            hint="Para coordinar el despacho"
          />
        </div>
      </Section>

      {/* ── SECCIÓN 2 · DIRECCIÓN ─────────────────────────────────── */}
      <Section icon={MapPin} title="Dirección de despacho" subtitle="A todo Chile vía BlueExpress">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Región */}
          <div className="w-full min-w-0">
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
              Región <span className="text-red-500 ml-0.5">*</span>
            </label>
            <Select
              value={cliente.region || ''}
              onValueChange={(v) => {
                setCliente({ ...cliente, region: v, ciudad: '' });
                setTouched((p) => ({ ...p, region: true }));
              }}
            >
              <SelectTrigger
                className={`h-12 rounded-xl bg-gray-50 text-[15px] w-full ${
                  fieldError('region') ? 'border-red-300 bg-red-50/40' : 'border-gray-200'
                }`}
              >
                <SelectValue placeholder="Selecciona tu región" />
              </SelectTrigger>
              <SelectContent className="max-h-[280px]">
                {REGIONES_CHILE.map((r) => (
                  <SelectItem key={r.codigo} value={r.nombre}>{r.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError('region') && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" /> {fieldError('region')}
              </p>
            )}
          </div>

          {/* Comuna */}
          <div className="w-full min-w-0">
            <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
              Comuna <span className="text-red-500 ml-0.5">*</span>
            </label>
            <Select
              value={cliente.ciudad || ''}
              onValueChange={(v) => {
                setCliente({ ...cliente, ciudad: v });
                setTouched((p) => ({ ...p, ciudad: true }));
              }}
              disabled={!cliente.region}
            >
              <SelectTrigger
                className={`h-12 rounded-xl bg-gray-50 text-[15px] w-full ${
                  fieldError('ciudad') ? 'border-red-300 bg-red-50/40' : 'border-gray-200'
                } ${!cliente.region ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <SelectValue placeholder={cliente.region ? 'Selecciona tu comuna' : 'Primero elige región'} />
              </SelectTrigger>
              <SelectContent className="max-h-[280px]">
                {comunas.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldError('ciudad') && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" /> {fieldError('ciudad')}
              </p>
            )}
          </div>
        </div>

        <FormField
          label="Calle y número"
          name="direccion"
          autoComplete="street-address"
          value={cliente.direccion}
          onChange={update('direccion')}
          onBlur={validateField('direccion')}
          placeholder="Av. Apoquindo 1234"
          required
          error={fieldError('direccion')}
          isValid={fieldValid('direccion')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Depto / Oficina / Casa"
            name="referencia"
            autoComplete="address-line2"
            value={cliente.referencia || ''}
            onChange={update('referencia')}
            placeholder="Depto 502, Torre B (opcional)"
            hint="Ayuda al courier a encontrarte"
          />
          <FormField
            label="Código postal"
            name="codigo_postal"
            autoComplete="postal-code"
            inputMode="numeric"
            maxLength={7}
            value={cliente.codigo_postal}
            onChange={update('codigo_postal')}
            onBlur={validateField('codigo_postal')}
            placeholder="7500000"
            error={fieldError('codigo_postal')}
            isValid={fieldValid('codigo_postal')}
            hint="Opcional · 7 dígitos"
          />
        </div>
      </Section>

      {/* Errores agregados al final */}
      {Object.values(errors).some(Boolean) && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-2.5 text-sm text-red-900">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
          <div>
            <p className="font-bold">Revisa los campos marcados</p>
            <p className="text-xs text-red-700 mt-0.5">Necesitamos esta información para enviarte tu pedido.</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Sub-componentes (definidos FUERA del padre para no romper foco)
   ────────────────────────────────────────────────────────────────── */

function Section({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5 pb-1">
        <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-gray-700" />
        </div>
        <div className="min-w-0">
          <h4 className="font-poppins font-bold text-gray-900 text-sm leading-tight">{title}</h4>
          {subtitle && <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// Validación centralizada exportable (sin cambios funcionales)
export function validarShippingForm(cliente) {
  const errors = {};
  if (!cliente.nombre || cliente.nombre.trim().length < 3) errors.nombre = 'Ingresa tu nombre completo';
  if (!cliente.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email)) errors.email = 'Email inválido';
  if (!cliente.telefono || !validarTelefonoChile(cliente.telefono)) errors.telefono = 'Teléfono chileno inválido';
  if (!cliente.region) errors.region = 'Selecciona una región';
  if (!cliente.ciudad) errors.ciudad = 'Selecciona una comuna';
  if (!cliente.direccion || !validarDireccion(cliente.direccion)) errors.direccion = 'Calle y número (ej: Av. Apoquindo 1234)';
  if (cliente.codigo_postal && !validarCodigoPostal(cliente.codigo_postal)) errors.codigo_postal = '7 dígitos';
  return errors;
}