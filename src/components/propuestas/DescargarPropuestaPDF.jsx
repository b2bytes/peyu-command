import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

// Convierte el base64 del PDF en un Blob y dispara la descarga.
// Funciona en escritorio Y móvil (iOS/Android): en iOS Safari, donde la
// descarga directa a veces falla, abre el Blob en una pestaña nueva como
// fallback para que el usuario pueda guardarlo/compartirlo.
function descargarBase64PDF(base64, filename) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS) {
    // iOS Safari ignora el atributo download → abrimos en pestaña nueva.
    window.open(url, '_blank');
  } else {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export default function DescargarPropuestaPDF({ proposalId, numero, className = '', size = 'sm' }) {
  const [loading, setLoading] = useState(false);

  const descargar = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('generateProposalPDF', { proposalId });
      const data = res?.data || res;
      if (!data?.pdf_base64) throw new Error(data?.error || 'No se pudo generar el PDF');
      descargarBase64PDF(data.pdf_base64, data.filename || `PEYU-Propuesta-${numero || proposalId}.pdf`);
    } catch (err) {
      alert('No se pudo descargar el PDF: ' + (err.message || 'Intenta de nuevo'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size={size}
      variant="outline"
      onClick={descargar}
      disabled={loading}
      className={`gap-1.5 text-xs h-9 ${className}`}
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
      {loading ? 'Generando…' : 'PDF'}
    </Button>
  );
}