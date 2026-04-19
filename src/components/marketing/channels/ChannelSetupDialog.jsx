import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Modal con la guía paso-a-paso real para canales que requieren OAuth app propia
 * (Meta, Google Ads, YouTube, Pinterest).
 */
export default function ChannelSetupDialog({ channel, open, onOpenChange }) {
  if (!channel) return null;

  const copy = (txt) => {
    navigator.clipboard.writeText(txt);
    toast.success('Copiado al portapapeles');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${channel.color} flex items-center justify-center text-2xl shadow`}>
              {channel.icon}
            </div>
            <div>
              <DialogTitle className="font-poppins text-lg">Conectar {channel.name}</DialogTitle>
              <DialogDescription className="text-xs">
                {channel.subtitle} · Setup estimado: <strong>{channel.setupTime}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Pasos */}
        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Pasos en el portal del proveedor</h4>
            <ol className="space-y-2">
              {channel.setupSteps?.map((step, i) => (
                <li key={i} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
                  <div className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed flex-1">{step}</div>
                </li>
              ))}
            </ol>
          </div>

          {/* Botón al dashboard del proveedor */}
          {channel.dashUrl && (
            <a href={channel.dashUrl} target="_blank" rel="noreferrer">
              <Button className="w-full gap-2 bg-gray-900 hover:bg-gray-800">
                <ExternalLink className="w-4 h-4" /> Abrir portal de {channel.name}
              </Button>
            </a>
          )}

          {/* Qué hacer cuando tengas las credenciales */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-purple-600" /> Cuando tengas App ID + App Secret
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              Pégalas aquí y el Director IA las registrará como <strong>App User Connector</strong> en Base44.
              Cada usuario de PEYU podrá conectar su propia cuenta de {channel.name} con 1 click.
            </p>
            <div className="bg-white rounded-lg border border-gray-200 p-3 font-mono text-[11px] text-gray-700 relative group">
              <button
                onClick={() =>
                  copy(
                    `Configura el connector de ${channel.name} con estas credenciales:\nApp ID: [PEGAR]\nApp Secret: [PEGAR]`
                  )
                }
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-700"
              >
                <Copy className="w-3 h-3" />
              </button>
              Configura el connector de {channel.name} con estas credenciales:
              <br />
              App ID: [PEGAR]
              <br />
              App Secret: [PEGAR]
            </div>
            <p className="text-[10px] text-gray-500">
              💡 Copia el mensaje anterior al chat del Director IA y lanzaré la configuración.
            </p>
          </div>

          {/* Link a docs */}
          <a
            href={channel.docs}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1"
          >
            📖 Documentación oficial de {channel.name} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}