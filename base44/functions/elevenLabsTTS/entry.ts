import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Voz del agente Peyu en ElevenLabs (fija para mantener identidad consistente).
const VOICE_ID = 'S0vhE09GXbbX3tr1jjTB';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await req.json();
    if (!text || !text.trim()) {
      return Response.json({ error: 'Falta el texto' }, { status: 400 });
    }

    // Limitamos el tamaño para mantener latencia y costo razonables.
    const clean = String(text).slice(0, 2500);

    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    const resp = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: clean,
          // turbo v2.5: baja latencia para conversación voz-a-voz fluida,
          // manteniendo soporte multilingüe (español natural).
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.8,
            style: 0.35,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!resp.ok) {
      const detail = await resp.text();
      return Response.json({ error: `ElevenLabs error: ${resp.status}`, detail }, { status: 502 });
    }

    const audioBuffer = await resp.arrayBuffer();
    // Devolvemos base64 en JSON para que el SDK (axios) lo entregue de forma
    // confiable al frontend sin ambigüedad de blob/stream.
    const bytes = new Uint8Array(audioBuffer);
    let binary = '';
    const chunk = 8192;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    const base64 = btoa(binary);
    return Response.json({ audio: base64, mime: 'audio/mpeg' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});