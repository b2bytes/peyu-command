// ============================================================================
// useVoz · Reproduce la voz del agente Peyu vía ElevenLabs (backend TTS).
// Mantiene un solo audio sonando a la vez y limpia bloques markdown/emoji
// para que el TTS lea texto natural.
// ============================================================================
import { useState, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// Quita markdown, emojis y restos de formato para una lectura limpia.
const limpiar = (t) =>
  String(t || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[*_#>`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

export default function useVoz() {
  const [hablandoId, setHablandoId] = useState(null);
  const [cargandoId, setCargandoId] = useState(null);
  const audioRef = useRef(null);

  const detener = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setHablandoId(null);
    setCargandoId(null);
  }, []);

  const hablar = useCallback(async (id, texto) => {
    // Si ya está sonando esta misma respuesta → toggle off.
    if (hablandoId === id || cargandoId === id) {
      detener();
      return;
    }
    detener();
    const clean = limpiar(texto);
    if (!clean) return;

    setCargandoId(id);
    try {
      const resp = await base44.functions.invoke(
        'elevenLabsTTS',
        { text: clean },
        { responseType: 'blob' }
      );
      const blob = resp.data instanceof Blob ? resp.data : new Blob([resp.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setHablandoId(null); URL.revokeObjectURL(url); };
      audio.onerror = () => { setHablandoId(null); setCargandoId(null); };
      await audio.play();
      setCargandoId(null);
      setHablandoId(id);
    } catch (e) {
      setCargandoId(null);
      setHablandoId(null);
    }
  }, [hablandoId, cargandoId, detener]);

  return { hablar, detener, hablandoId, cargandoId };
}