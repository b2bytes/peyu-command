/**
 * Perfil "Compra en 1 Clic" — datos guardados localmente del cliente recurrente.
 * Se persiste en localStorage tras el primer checkout exitoso (con consentimiento).
 *
 * Estructura:
 * {
 *   nombre, email, telefono,
 *   region, ciudad, direccion, codigo_postal,
 *   medio_pago: 'WebPay' | 'Transferencia' | 'MercadoPago',
 *   saved_at: ISO date,
 * }
 */

import { validarShippingForm } from '@/components/cart/ShippingAddressForm';

const STORAGE_KEY = 'peyu_one_click_profile';

export function getOneClickProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const profile = JSON.parse(raw);
    // Valida estructura completa (mismo validador del checkout)
    const errors = validarShippingForm(profile);
    if (Object.keys(errors).length > 0) return null;
    return profile;
  } catch {
    return null;
  }
}

export function saveOneClickProfile(cliente, medio_pago = 'WebPay') {
  try {
    const profile = {
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono,
      region: cliente.region,
      ciudad: cliente.ciudad,
      direccion: cliente.direccion,
      codigo_postal: cliente.codigo_postal || '',
      medio_pago,
      saved_at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return profile;
  } catch {
    return null;
  }
}

export function clearOneClickProfile() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}

export function hasOneClickProfile() {
  return getOneClickProfile() !== null;
}