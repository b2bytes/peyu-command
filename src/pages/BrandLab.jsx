import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';
import BrandDirectionCard from '@/components/brand/BrandDirectionCard';
import { PEYU_LOGO } from '@/components/brand/BrandMockupPreview';
import { SEED_DIRECTIONS } from '@/components/brand/brand-seed';

export default function BrandLab() {
  const [directions, setDirections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [choosingId, setChoosingId] = useState(null);

  const load = async () => {
    let list = await base44.entities.BrandDirection.list('orden');
    // Seed automático la primera vez (sin tocar nada existente).
    if (!list || list.length === 0) {
      await base44.entities.BrandDirection.bulkCreate(SEED_DIRECTIONS);
      list = await base44.entities.BrandDirection.list('orden');
    }
    setDirections(list || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleChoose = async (direction) => {
    setChoosingId(direction.id);
    // Desactivar todas, activar la elegida.
    const others = directions.filter((d) => d.activa && d.id !== direction.id);
    await Promise.all(others.map((d) => base44.entities.BrandDirection.update(d.id, { activa: false })));
    await base44.entities.BrandDirection.update(direction.id, { activa: true });
    await load();
    setChoosingId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Header */}
      <header className="px-5 pt-10 pb-6 max-w-5xl mx-auto text-center">
        <img src={PEYU_LOGO} alt="PEYU" className="h-9 w-auto mx-auto mb-5 object-contain" />
        <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-3">
          Brand Lab · Fase 0
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">
          Elige la dirección visual de PEYU
        </h1>
        <p className="text-slate-500 mt-3 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Cada dirección es una identidad completa para el nuevo Commerce OS conversacional.
          Prueba el modo claro/oscuro y mira cómo se sentiría la home con Peyu 🐢, una card y el carrito.
        </p>
      </header>

      {/* Galería */}
      <main className="px-4 pb-20 max-w-5xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {directions.map((d) => (
              <BrandDirectionCard
                key={d.id}
                direction={d}
                onChoose={handleChoose}
                choosing={choosingId === d.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}