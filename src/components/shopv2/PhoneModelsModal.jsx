import { X, Smartphone } from 'lucide-react';

export default function PhoneModelsModal({ modelos, selected, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end lg:items-center justify-center">
      <div className="bg-white w-full lg:max-w-md rounded-t-3xl lg:rounded-3xl p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4" style={{ color: '#8BAD8A' }} />
            <h2 className="font-fraunces text-lg font-bold" style={{ color: '#2C1810' }}>Modelos de teléfono</h2>
          </div>
          <button onClick={onClose} className="text-[#A08070] hover:text-[#7A6050] text-2xl">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              onSelect('Todos');
              onClose();
            }}
            className="p-3 rounded-xl text-sm font-bold transition-all active:scale-95"
            style={{
              background: selected === 'Todos' ? '#8BAD8A' : 'white',
              color: selected === 'Todos' ? 'white' : '#7A6050',
              border: `1.5px solid ${selected === 'Todos' ? '#8BAD8A' : '#D4C4B0'}`,
            }}
          >
            Todos
          </button>
          {modelos.map((m) => (
            <button
              key={m}
              onClick={() => {
                onSelect(m);
                onClose();
              }}
              className="p-3 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95"
              style={{
                background: selected === m ? '#8BAD8A' : 'white',
                color: selected === m ? 'white' : '#7A6050',
                border: `1.5px solid ${selected === m ? '#8BAD8A' : '#D4C4B0'}`,
                boxShadow: selected === m ? '0 4px 12px rgba(139,173,138,.2)' : 'none',
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}