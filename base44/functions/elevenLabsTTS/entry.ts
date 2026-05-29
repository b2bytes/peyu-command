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
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.2 },
        }),
      }
    );

    if (!resp.ok) {
      const detail = await resp.text();
      return Response.json({ error: `ElevenLabs error: ${resp.status}`, detail }, { status: 502 });
    }

    const audioBuffer = await resp.arrayBuffer();
    return new Response(audioBuffer, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg' },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});