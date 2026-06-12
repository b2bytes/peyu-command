import { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

// Carga el Excel de tarifas Bluex más reciente directamente al sistema:
// sube el archivo → importBluexTarifas (reemplaza las tarifas del servicio).
export default function ExcelUploaderBluex({ onImported }) {
  const fileRef = useRef(null);
  const [servicio, setServicio] = useState('EXPRESS');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.functions.invoke('importBluexTarifas', {
        file_url,
        servicio,
        replace: true,
      });
      if (res.data?.ok) {
        setResult(res.data);
        toast.success(`Tarifario ${servicio} actualizado · ${res.data.registros_creados} comunas`);
        onImported?.();
      } else {
        toast.error(res.data?.error || 'Error al importar el Excel');
      }
    } catch (err) {
      toast.error(err.message || 'Error al subir el archivo');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h2 className="text-sm font-bold text-gray-900 mb-1 flex items-center gap-2">
        <FileSpreadsheet className="w-4 h-4 text-green-600" /> Cargar tarifario Excel más reciente
      </h2>
      <p className="text-xs text-gray-500 mb-3">
        Sube el Excel oficial de Bluexpress (EXPRESS o PRIORITY). Reemplaza las tarifas
        actuales del servicio y los costos del checkout se actualizan al instante.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <Select value={servicio} onValueChange={setServicio} disabled={uploading}>
          <SelectTrigger className="w-40 bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="EXPRESS">EXPRESS</SelectItem>
            <SelectItem value="PRIORITY">PRIORITY</SelectItem>
          </SelectContent>
        </Select>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
          className="hidden"
        />
        <Button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="gap-2 bg-green-600 hover:bg-green-700"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Importando...' : `Subir Excel ${servicio}`}
        </Button>
        {result && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            {result.registros_creados} comunas importadas ({result.columnas_kg_detectadas?.length || 0} tramos de peso)
          </span>
        )}
      </div>
    </div>
  );
}