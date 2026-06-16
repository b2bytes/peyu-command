import { useState, useEffect } from 'react';

// Cuenta regresiva al 18 de septiembre. Se recalcula al año actual para que
// nunca quede "negativa": si ya pasó el 18S de este año, apunta al del próximo.
function getTarget() {
  const now = new Date();
  let year = now.getFullYear();
  const target = new Date(year, 8, 18, 0, 0, 0); // mes 8 = septiembre
  if (now > target) target.setFullYear(year + 1);
  return target;
}

export default function CountdownDieciocho({ label = 'Faltan para el 18' }) {
  const [diff, setDiff] = useState(() => getTarget() - new Date());

  useEffect(() => {
    const t = setInterval(() => setDiff(getTarget() - new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const total = Math.max(0, diff);
  const dias = Math.floor(total / (1000 * 60 * 60 * 24));
  const horas = Math.floor((total / (1000 * 60 * 60)) % 24);
  const min = Math.floor((total / (1000 * 60)) % 60);
  const seg = Math.floor((total / 1000) % 60);

  const Box = ({ value, unit }) => (
    <div className="flex flex-col items-center">
      <div
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-poppins font-extrabold text-xl sm:text-2xl text-white tabular-nums"
        style={{ background: 'linear-gradient(135deg,#C0785C,#A8443A)', boxShadow: '0 8px 22px rgba(168,68,58,.32)' }}
      >
        {String(value).padStart(2, '0')}
      </div>
      <span className="mt-1.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: '#A8443A' }}>{unit}</span>
    </div>
  );

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#7A6050' }}>{label}</span>
      <div className="flex items-center gap-2 sm:gap-3">
        <Box value={dias} unit="días" />
        <Box value={horas} unit="hrs" />
        <Box value={min} unit="min" />
        <Box value={seg} unit="seg" />
      </div>
    </div>
  );
}