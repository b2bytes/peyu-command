// ============================================================================
// useGrabacion · Graba audio del micrófono, lo sube y lo transcribe.
// ─────────────────────────────────────────────────────────────────────────────
// Permite el flujo voz-a-voz: el usuario habla, capturamos el audio con
// MediaRecorder, lo subimos con UploadFile y lo transcribimos con
// TranscribeAudio (Whisper). Devuelve el texto para enviarlo al agente.
// ============================================================================
import { useState, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

export default function useGrabacion({ onTranscrito } = {}) {
  const [grabando, setGrabando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  const iniciar = useCallback(async () => {
    if (grabando || procesando) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    chunksRef.current = [];
    const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    mediaRef.current = rec;
    rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    rec.onstop = async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setGrabando(false);
      setProcesando(true);
      try {
        const blob = new Blob(chunksRef.current, { type: mime || 'audio/webm' });
        const file = new File([blob], `nota-voz-${Date.now()}.webm`, { type: blob.type });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        const texto = await base44.integrations.Core.TranscribeAudio({ audio_url: file_url });
        const limpio = String(texto || '').trim();
        if (limpio) onTranscrito?.(limpio);
      } finally {
        setProcesando(false);
      }
    };
    rec.start();
    setGrabando(true);
  }, [grabando, procesando, onTranscrito]);

  const detener = useCallback(() => {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.stop();
    }
  }, []);

  const cancelar = useCallback(() => {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      mediaRef.current.onstop = null;
      mediaRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    chunksRef.current = [];
    setGrabando(false);
    setProcesando(false);
  }, []);

  return { grabando, procesando, iniciar, detener, cancelar };
}