import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { REGIONES_CHILE, getComunasByRegion, validarCodigoPostal, validarTelefonoChile, validarDireccion } from '@/lib/chile-regiones';
import { AlertCircle } from 'lucide-react';

/**
 * Form robusto de dirección de envío chilena.
 * Valida en tiempo real y muestra errores inline.
 *
 * Props:
 *   cliente: { nombre, email, telefono, region, ciudad, direccion, codigo_postal }
 *   setCliente: setter
 *   errors: objeto con errores por campo
 *   onEmailBlur: callback (para captura carrito abandonado)
 */
export default function ShippingAddressForm({ cliente, setCliente, errors = {}, onEmailBlur }) {
  const comunas = getComunasByRegion(cliente.region);

  const Field = ({ label, k, type = 'text', placeholder, req, error, onBlur }) => (
    <div>
      <label className="text-xs font-semibold text-gray-700 block mb-1.5">
        {label} {req && <span className="text-red-500">*</span>}
      </label>
      <Input
        type={type}
        value={cliente[k] || ''}
        onChange={(e) => setCliente({ ...cliente, [k]: e.target.value })}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`h-11 text-sm rounded-xl bg-gray-50 focus:bg-white ${
          error ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-gray-400'
        }`}
      />
      {error && (
        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <Field label="Nombre completo" k="nombre" placeholder="Tu nombre" req error={errors.nombre} />
      <Field label="Email" k="email" type="email" placeholder="tu@email.com" req error={errors.email} onBlur={onEmailBlur} />
      <Field label="Teléfono / WhatsApp" k="telefono" placeholder="+56 9 XXXX XXXX" req error={errors.telefono} />

      {/* Región (select) */}
      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1.5">
          Región <span className="text-red-500">*</span>
        </label>
        <Select
          value={cliente.region || ''}
          onValueChange={(v) => setCliente({ ...cliente, region: v, ciudad: '' })}
        >
          <SelectTrigger className={`h-11 rounded-xl bg-gray-50 ${errors.region ? 'border-red-300' : 'border-gray-200'}`}>
            <SelectValue placeholder="Selecciona tu región" />
          </SelectTrigger>
          <SelectContent className="max-h-[280px]">
            {REGIONES_CHILE.map((r) => (
              <SelectItem key={r.codigo} value={r.nombre}>{r.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.region && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.region}
          </p>
        )}
      </div>

      {/* Comuna (select dependiente) */}
      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1.5">
          Comuna <span className="text-red-500">*</span>
        </label>
        <Select
          value={cliente.ciudad || ''}
          onValueChange={(v) => setCliente({ ...cliente, ciudad: v })}
          disabled={!cliente.region}
        >
          <SelectTrigger className={`h-11 rounded-xl bg-gray-50 ${errors.ciudad ? 'border-red-300' : 'border-gray-200'}`}>
            <SelectValue placeholder={cliente.region ? 'Selecciona tu comuna' : 'Primero elige región'} />
          </SelectTrigger>
          <SelectContent className="max-h-[280px]">
            {comunas.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.ciudad && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errors.ciudad}
          </p>
        )}
      </div>

      <Field
        label="Dirección de despacho"
        k="direccion"
        placeholder="Calle, número, depto"
        req
        error={errors.direccion}
      />

      <Field
        label="Código postal"
        k="codigo_postal"
        placeholder="7 dígitos (ej: 7500000)"
        error={errors.codigo_postal}
      />
    </div>
  );
}

// Validación centralizada exportable
export function validarShippingForm(cliente) {
  const errors = {};
  if (!cliente.nombre || cliente.nombre.trim().length < 3) errors.nombre = 'Ingresa tu nombre completo';
  if (!cliente.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email)) errors.email = 'Email inválido';
  if (!cliente.telefono || !validarTelefonoChile(cliente.telefono)) errors.telefono = 'Teléfono chileno inválido (+56 9 XXXX XXXX)';
  if (!cliente.region) errors.region = 'Selecciona una región';
  if (!cliente.ciudad) errors.ciudad = 'Selecciona una comuna';
  if (!cliente.direccion || !validarDireccion(cliente.direccion)) errors.direccion = 'Calle y número (ej: Av. Apoquindo 1234)';
  if (cliente.codigo_postal && !validarCodigoPostal(cliente.codigo_postal)) errors.codigo_postal = 'Código postal: 7 dígitos';
  return errors;
}