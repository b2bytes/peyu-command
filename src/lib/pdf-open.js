// ── Abre un PDF de etiqueta en una pestaña nueva.
// Los navegadores BLOQUEAN window.open / navegación a URLs "data:" — las
// etiquetas Bluex llegan como data:application/pdf;base64. Convertimos a
// Blob URL para que abra e imprima sin interrumpir el flujo.
export function openPdfUrl(url) {
  if (!url) return;
  if (url.startsWith('data:application/pdf')) {
    const b64 = url.split(',')[1] || '';
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: 'application/pdf' });
    window.open(URL.createObjectURL(blob), '_blank');
  } else {
    window.open(url, '_blank');
  }
}