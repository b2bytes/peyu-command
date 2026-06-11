// ============================================================================
// useAgentVoice · Voz completa del Agent OS Peyu.
// - TTS con la voz de Joaquín (ElevenLabs, backend elevenLabsTTS): reproducir,
//   PAUSAR/reanudar y detener. Un solo audio a la vez.
// - Modo conversación: auto-lee cada respuesta del agente cuando está activo.
// - Entrada por micrófono (SpeechRecognition es-CL) para hablarle al agente.
// ============================================================================
import { useState, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

// Quita markdown, emojis y formato para una lectura natural.
const limpiar = (t) =>
  String(t || '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[*_#>`]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

export default function useAgentVoice() {
  const [voiceOn, setVoiceOn] = useState(false);   // modo conversación (auto-lee)
  const [speakingId, setSpeakingId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [paused, setPaused] = useState(false);
  const [listening, setListening] = useState(false);
  const audioRef = useRef(null);
  const recRef = useRef(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setSpeakingId(null);
    setLoadingId(null);
    setPaused(false);
  }, []);

  // Pausa / reanuda el audio actual sin perder la posición.
  const togglePause = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) { a.play(); setPaused(false); }
    else { a.pause(); setPaused(true); }
  }, []);

  const speak = useCallback(async (id, texto) => {
    // Toggle: si ya suena este mismo mensaje → pausar/reanudar.
    if (speakingId === id && audioRef.current) { togglePause(); return; }
    stop();
    const clean = limpiar(texto);
    if (!clean) return;

    setLoadingId(id);
    try {
      const resp = await base44.functions.invoke('elevenLabsTTS', { text: clean });
      const b64 = resp?.data?.audio;
      if (!b64) throw new Error('Sin audio');
      const audio = new Audio(`data:audio/mpeg;base64,${b64}`);
      audioRef.current = audio;
      audio.onended = () => { setSpeakingId(null); setPaused(false); };
      audio.onerror = () => { setSpeakingId(null); setLoadingId(null); setPaused(false); };
      await audio.play();
      setLoadingId(null);
      setSpeakingId(id);
      setPaused(false);
    } catch (_) {
      setLoadingId(null);
      setSpeakingId(null);
    }
  }, [speakingId, stop, togglePause]);

  // ── Micrófono: dictado en español chileno ────────────────────────────
  const startListening = useCallback((onResult) => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Tu navegador no soporta dictado por voz. Usa Chrome o Safari.'); return; }
    stop(); // no hablar mientras escucha
    const rec = new SR();
    rec.lang = 'es-CL';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript || '';
      if (transcript) onResult(transcript);
    };
    rec.onend = () => { setListening(false); recRef.current = null; };
    rec.onerror = () => { setListening(false); recRef.current = null; };
    recRef.current = rec;
    setListening(true);
    rec.start();
  }, [listening, stop]);

  return {
    voiceOn, setVoiceOn,
    speak, stop, togglePause,
    speakingId, loadingId, paused,
    listening, startListening,
  };
}