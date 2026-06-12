// ════════════════════════════════════════════════════════════════════════
// vendedor-chat.js — Cliente del vendedor IA público (agente vendedor_peyu).
// Conversación PERSISTENTE: el conversation_id vive en localStorage, así el
// hilo sobrevive a recargas y navegación entre páginas.
// ════════════════════════════════════════════════════════════════════════
import { base44 } from '@/api/base44Client';
import { getCartV2 } from '@/lib/shop-v2-cart';

const CONV_KEY = 'vendedor_peyu_conv_id';
const CART_DONE_KEY = 'vendedor_peyu_cart_done';
const LEAD_DONE_KEY = 'vendedor_peyu_lead_done';

export async function ensureConversation() {
  let id = localStorage.getItem(CONV_KEY);
  if (id) return id;
  const res = await base44.functions.invoke('vendedorChatProxy', {
    action: 'create',
    page_path: window.location.pathname,
  });
  id = res?.data?.conversation_id;
  if (id) localStorage.setItem(CONV_KEY, id);
  return id;
}

export function resetConversation() {
  localStorage.removeItem(CONV_KEY);
  localStorage.removeItem(CART_DONE_KEY);
  localStorage.removeItem(LEAD_DONE_KEY);
}

// Adjunta contexto invisible (página + carrito) para que el agente venda mejor.
function buildContext() {
  const cart = getCartV2();
  const total = cart.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0);
  return `\n\n[CONTEXTO] page=${window.location.pathname}; cart_items=${cart.length}; cart_total=${total}`;
}

export async function sendChatMessage(conversationId, text) {
  await base44.functions.invoke('vendedorChatProxy', {
    action: 'send',
    conversation_id: conversationId,
    content: text + buildContext(),
  });
}

export async function fetchMessages(conversationId) {
  const res = await base44.functions.invoke('vendedorChatProxy', {
    action: 'get',
    conversation_id: conversationId,
  });
  return res?.data?.messages || [];
}

// ── Parsing de tags del agente ──────────────────────────────────────────
export const RE_PRODUCTO = /\[\[PRODUCTO:([^\]]+)\]\]/g;
export const RE_CART = /\[\[CART:([^:\]]+):(\d+)\]\]/g;
export const RE_CHECKOUT = /\[\[CHECKOUT\]\]/;
export const RE_NAV = /\[\[NAV:([^|\]]+)\|([^\]]+)\]\]/g;
export const RE_LEAD = /\[\[LEAD:([^\]]+)\]\]/g;

export function stripTags(text) {
  return String(text || '')
    .replace(RE_PRODUCTO, '')
    .replace(RE_CART, '')
    .replace(/\[\[CHECKOUT\]\]/g, '')
    .replace(RE_NAV, '')
    .replace(RE_LEAD, '')
    .replace(/\[CONTEXTO\][^\n]*/g, '')
    .replace(/\[CATALOGO\][\s\S]*$/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractSkus(text) {
  const skus = new Set();
  for (const m of String(text || '').matchAll(RE_PRODUCTO)) skus.add(m[1].trim());
  for (const m of String(text || '').matchAll(RE_CART)) skus.add(m[1].trim());
  return [...skus];
}

export function extractCartActions(text) {
  const out = [];
  for (const m of String(text || '').matchAll(RE_CART)) {
    out.push({ sku: m[1].trim(), cantidad: Math.max(1, parseInt(m[2], 10) || 1) });
  }
  return out;
}

export function extractNavs(text) {
  const out = [];
  for (const m of String(text || '').matchAll(RE_NAV)) {
    out.push({ to: m[1].trim(), label: m[2].trim() });
  }
  return out;
}

// ── Captura de leads ([[LEAD:campo=valor;...]]) ─────────────────────────
export function extractLeadActions(text) {
  const out = [];
  for (const m of String(text || '').matchAll(RE_LEAD)) {
    const fields = {};
    m[1].split(';').forEach((pair) => {
      const idx = pair.indexOf('=');
      if (idx > 0) {
        const k = pair.slice(0, idx).trim().toLowerCase();
        const v = pair.slice(idx + 1).trim();
        if (k && v) fields[k] = v;
      }
    });
    if (Object.keys(fields).length) out.push(fields);
  }
  return out;
}

// Guarda/actualiza el ChatLead de esta conversación (upsert en backend).
export async function saveLeadData(conversationId, fields) {
  await base44.functions.invoke('vendedorChatProxy', {
    action: 'lead',
    conversation_id: conversationId,
    fields,
    page_path: window.location.pathname,
  });
}

export function leadActionDone(msgIndex) {
  try {
    return JSON.parse(localStorage.getItem(LEAD_DONE_KEY) || '[]').includes(msgIndex);
  } catch { return false; }
}

export function markLeadActionDone(msgIndex) {
  try {
    const done = JSON.parse(localStorage.getItem(LEAD_DONE_KEY) || '[]');
    if (!done.includes(msgIndex)) {
      done.push(msgIndex);
      localStorage.setItem(LEAD_DONE_KEY, JSON.stringify(done));
    }
  } catch { /* noop */ }
}

// Idempotencia de [[CART:]]: marca qué mensajes del hilo ya ejecutaron su add.
export function cartActionDone(msgIndex) {
  try {
    const done = JSON.parse(localStorage.getItem(CART_DONE_KEY) || '[]');
    return done.includes(msgIndex);
  } catch { return false; }
}

export function markCartActionDone(msgIndex) {
  try {
    const done = JSON.parse(localStorage.getItem(CART_DONE_KEY) || '[]');
    if (!done.includes(msgIndex)) {
      done.push(msgIndex);
      localStorage.setItem(CART_DONE_KEY, JSON.stringify(done));
    }
  } catch { /* noop */ }
}