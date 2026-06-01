import React from 'react';

const SWATCH_KEYS = [
  { key: 'bg', label: 'BG' },
  { key: 'surface', label: 'Surface' },
  { key: 'accent', label: 'Accent' },
  { key: 'accent2', label: 'Accent 2' },
  { key: 'text', label: 'Text' },
  { key: 'muted', label: 'Muted' },
];

export default function BrandSwatches({ palette }) {
  if (!palette) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {SWATCH_KEYS.map(({ key, label }) => (
        <div key={key} className="flex flex-col items-center gap-1">
          <div
            className="w-9 h-9 rounded-lg ring-1 ring-black/10 shadow-sm"
            style={{ backgroundColor: palette[key] || '#ccc' }}
            title={`${label}: ${palette[key] || ''}`}
          />
          <span className="text-[9px] font-medium uppercase tracking-wide opacity-60">{label}</span>
        </div>
      ))}
    </div>
  );
}