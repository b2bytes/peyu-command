import { User, Building2 } from 'lucide-react';

// Toggle global B2C ("Personal") / B2B ("Empresa"). Default = b2c.
export default function V2ModeToggle({ mode, onChange }) {
  return (
    <div className="v2-segment inline-flex items-center gap-1">
      <button
        data-active={mode === 'b2c'}
        onClick={() => onChange('b2c')}
        className="v2-segment-btn flex items-center gap-1.5 px-4 h-9 text-xs"
      >
        <User className="w-3.5 h-3.5" />
        Personal
      </button>
      <button
        data-active={mode === 'b2b'}
        onClick={() => onChange('b2b')}
        className="v2-segment-btn flex items-center gap-1.5 px-4 h-9 text-xs"
      >
        <Building2 className="w-3.5 h-3.5" />
        Empresa
      </button>
    </div>
  );
}