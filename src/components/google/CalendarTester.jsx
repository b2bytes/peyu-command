// ============================================================================
// CalendarTester — Playground para agendar reuniones con Google Meet
// ============================================================================

import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar, Loader2, CheckCircle2, XCircle, ExternalLink, Video } from 'lucide-react';

/**
 * Helper para generar ISO string con zona horaria Chile.
 * Devuelve formato: "2026-04-25T15:00:00-04:00"
 */
function toChileIso(date, time) {
  // Chile: UTC-4 (horario verano) / UTC-3 (invierno). Usamos -04:00 por defecto.
  return `${date}T${time}:00-04:00`;
}

export default function CalendarTester() {
  // Default: mañana a las 15:00
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const [summary, setSummary] = useState('Reunión PEYU — Demo de propuesta');
  const [description, setDescription] = useState('Reunión para revisar propuesta corporativa.');
  const [date, setDate] = useState(tomorrow);
  const [startTime, setStartTime] = useState('15:00');
  const [endTime, setEndTime] = useState('15:30');
  const [attendees, setAttendees] = useState('ti@peyuchile.cl');
  const [withMeet, setWithMeet] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleCreate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('createCalendarEvent', {
        summary,
        description,
        start_iso: toChileIso(date, startTime),
        end_iso: toChileIso(date, endTime),
        attendees: attendees.split(',').map((e) => e.trim()).filter(Boolean),
        with_meet: withMeet,
      });
      setResult({ ok: true, data: res?.data });
    } catch (e) {
      setResult({ ok: false, error: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Título</Label>
        <Input value={summary} onChange={(e) => setSummary(e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Descripción</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Fecha</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Inicio</Label>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">Fin</Label>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>
      <div>
        <Label className="text-xs">Invitados (separados por coma)</Label>
        <Input
          value={attendees}
          onChange={(e) => setAttendees(e.target.value)}
          placeholder="cliente@acme.cl, ventas@peyuchile.cl"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
        <input
          type="checkbox"
          checked={withMeet}
          onChange={(e) => setWithMeet(e.target.checked)}
          className="rounded border-slate-300"
        />
        <Video className="w-4 h-4 text-slate-500" />
        Generar link de Google Meet automático
      </label>

      <Button onClick={handleCreate} disabled={loading || !summary} className="gap-2 w-full">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
        Agendar reunión
      </Button>

      {result && (
        <div className={`p-3 rounded-lg border text-xs ${
          result.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {result.ok ? (
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <p className="font-semibold">Evento creado ✓ (invitaciones enviadas)</p>
                <div className="flex flex-col gap-1 pt-1">
                  <a
                    href={result.data?.html_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> Ver en Google Calendar
                  </a>
                  {result.data?.meet_link && (
                    <a
                      href={result.data.meet_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 hover:underline text-blue-700"
                    >
                      <Video className="w-3 h-3" /> {result.data.meet_link}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}