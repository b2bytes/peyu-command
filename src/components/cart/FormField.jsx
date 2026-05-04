import { Input } from '@/components/ui/input';
import { AlertCircle, Check } from 'lucide-react';

/**
 * Campo de formulario robusto para checkout.
 *
 * IMPORTANTE: Este componente DEBE estar definido en su propio archivo
 * (no inline dentro del padre) para evitar que React lo destruya y
 * recree en cada render — eso causa que el input pierda el foco al
 * escribir una sola letra. Bug clásico de checkout.
 *
 * Best practices implementadas (Shopify/Stripe Checkout):
 *  - Inputs h-12 (44px+ tap target iOS HIG)
 *  - autoComplete correcto para que el navegador rellene
 *  - Padding generoso, w-full, box-border (no se sale del contenedor)
 *  - Validación inline al onBlur (no espera al submit)
 *  - Estado de "valido" visible cuando el campo pasa la validación
 *  - Hint debajo del input (microcopy contextual)
 */
export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  error,
  hint,
  autoComplete,
  inputMode,
  prefix,
  isValid = false,
  disabled = false,
  maxLength,
}) {
  const showError = !!error;
  const showValid = !showError && isValid && value;

  return (
    <div className="w-full min-w-0">
      <label
        htmlFor={name}
        className="text-[11px] font-bold text-gray-700 uppercase tracking-wider block mb-1.5"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <div className="relative">
        {prefix && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none font-medium">
            {prefix}
          </span>
        )}
        <Input
          id={name}
          name={name}
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          maxLength={maxLength}
          disabled={disabled}
          value={value || ''}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={[
            'w-full box-border h-12 text-[15px] rounded-xl bg-gray-50 transition-all',
            'focus:bg-white focus:ring-2 focus:ring-offset-0',
            prefix ? 'pl-10' : 'pl-3.5',
            showValid ? 'pr-10' : 'pr-3.5',
            showError
              ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/40'
              : showValid
                ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200'
                : 'border-gray-200 focus:border-gray-900 focus:ring-gray-200',
          ].join(' ')}
        />
        {showValid && (
          <Check className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
        )}
      </div>

      {showError ? (
        <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3 h-3 flex-shrink-0" /> {error}
        </p>
      ) : hint ? (
        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{hint}</p>
      ) : null}
    </div>
  );
}