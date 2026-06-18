// ════════════════════════════════════════════════════════════════════════
// PhoneShell — Marco de iPhone realista (notch, status bar, home indicator).
// Envuelve cualquier "pantalla" mockup. variant.bg pinta el canvas interior.
// ════════════════════════════════════════════════════════════════════════
import { Signal, Wifi, BatteryFull } from 'lucide-react';

export default function PhoneShell({ children, label, bgCanvas = '#FBF7F0', dark = false }) {
  const fg = dark ? '#fff' : '#1C1410';
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative w-full max-w-[260px] rounded-[2.6rem] p-2"
        style={{
          background: dark ? '#0A1512' : '#15100C',
          boxShadow: '0 40px 80px -30px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.06)',
        }}
      >
        {/* lateral buttons */}
        <span className="absolute -left-[3px] top-24 w-[3px] h-9 rounded-l-md" style={{ background: '#2A211A' }} />
        <span className="absolute -left-[3px] top-36 w-[3px] h-9 rounded-l-md" style={{ background: '#2A211A' }} />
        <span className="absolute -right-[3px] top-28 w-[3px] h-14 rounded-r-md" style={{ background: '#2A211A' }} />

        <div className="relative rounded-[2.1rem] overflow-hidden h-[540px] flex flex-col" style={{ background: bgCanvas }}>
          {/* status bar */}
          <div className="relative flex items-center justify-between px-6 pt-2.5 pb-1 z-30">
            <span className="text-[11px] font-bold" style={{ color: fg }}>9:41</span>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[78px] h-[22px] rounded-full bg-black z-40" />
            <div className="flex items-center gap-1" style={{ color: fg }}>
              <Signal className="w-3 h-3" />
              <Wifi className="w-3 h-3" />
              <BatteryFull className="w-4 h-4" />
            </div>
          </div>
          {children}
        </div>
      </div>
      {label && <span className="text-xs font-semibold text-slate-500">{label}</span>}
    </div>
  );
}