// ============================================================================
// /admin/ga-realtime — Dashboard GA4 en vivo
// ----------------------------------------------------------------------------
// Muestra usuarios activos en tiempo real + métricas de 7d por canal/país/device.
// Requiere que el usuario ingrese una vez el GA4 Property ID (se persiste en ls).
// ============================================================================
import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { BarChart3, RefreshCw, Loader2, Users, TrendingUp, Globe, Smartphone, AlertTriangle } from 'lucide-react';

const LS_KEY = 'peyu_ga4_property_id';

export default function GA4Realtime() {
  const [propertyId, setPropertyId] = useState(() => localStorage.getItem(LS_KEY) || '');
  const [editing, setEditing] = useState(!propertyId);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!propertyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('gaFetchRealtime', { property_id: propertyId });
      setData(res?.data || null);
    } catch (e) {
      setError(e.message || 'Error consultando GA4');
    } finally {
      setLoading(false);
    }
  };

  const saveAndFetch = () => {
    localStorage.setItem(LS_KEY, propertyId.trim());
    setEditing(false);
    fetchData();
  };

  useEffect(() => {
    if (propertyId && !editing) {
      fetchData();
      const t = setInterval(fetchData, 30000); // refresh cada 30s
      return () => clearInterval(t);
    }
  }, [propertyId, editing]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">GA4 Realtime</h1>
            <p className="text-sm text-slate-300">Tráfico en vivo · peyuchile.cl · Refresh automático 30s</p>
          </div>
        </div>
        {!editing && propertyId && (
          <Button onClick={fetchData} disabled={loading} variant="outline" size="sm" className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Actualizar
          </Button>
        )}
      </div>

      {/* Property ID config */}
      {editing ? (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Conectar GA4</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label>GA4 Property ID (solo números, sin el prefijo "properties/")</Label>
            <div className="flex gap-2">
              <Input
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                placeholder="Ej: 123456789"
                className="max-w-xs"
              />
              <Button onClick={saveAndFetch} disabled={!propertyId.trim()}>Guardar y conectar</Button>
            </div>
            <p className="text-xs text-slate-500">
              📍 Encuentra el Property ID en GA4 → Admin → Property settings → Property ID.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary" className="font-mono">Property: {propertyId}</Badge>
              {data?.last_updated && (
                <span className="text-xs text-slate-400">
                  Actualizado: {new Date(data.last_updated).toLocaleTimeString('es-CL')}
                </span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Cambiar</Button>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Error consultando GA4</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Realtime users */}
      {data?.realtime && (
        <Card className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-emerald-100">Usuarios activos ahora</p>
                <p className="text-6xl font-bold mt-2 font-poppins">{data.realtime.active_users || 0}</p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
                  <Users className="w-10 h-10" />
                </div>
              </div>
            </div>

            {data.realtime.by_country?.length > 0 && (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-widest text-emerald-100 mb-2">Por país</p>
                <div className="flex flex-wrap gap-2">
                  {data.realtime.by_country.slice(0, 6).map((c, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur px-3 py-1.5 rounded-full text-sm flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" /> {c.country}: <strong>{c.users}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Historical 7d */}
      {data?.historical && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Sesiones (7d)', value: data.historical.sessions, icon: TrendingUp, color: 'text-blue-600' },
            { label: 'Usuarios únicos', value: data.historical.total_users, icon: Users, color: 'text-purple-600' },
            { label: 'Conversiones', value: data.historical.conversions, icon: BarChart3, color: 'text-emerald-600' },
            { label: 'Ingresos (CLP)', value: data.historical.revenue ? `$${Number(data.historical.revenue).toLocaleString('es-CL')}` : '$0', icon: TrendingUp, color: 'text-orange-600' },
          ].map((k, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <k.icon className={`w-7 h-7 ${k.color}`} />
                <div>
                  <p className="text-xl font-bold text-slate-900">{k.value || 0}</p>
                  <p className="text-xs text-slate-500">{k.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* By device */}
      {data?.realtime?.by_device?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-slate-500" />
              Dispositivos activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {data.realtime.by_device.map((d, i) => (
                <div key={i} className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className="text-2xl font-bold text-slate-900">{d.users}</p>
                  <p className="text-xs text-slate-500 capitalize">{d.device}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!data && !loading && !editing && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-slate-500">
            No hay datos todavía. Verifica que el Property ID sea correcto y que ti@peyuchile.cl tenga acceso a esa propiedad en GA4.
          </CardContent>
        </Card>
      )}
    </div>
  );
}