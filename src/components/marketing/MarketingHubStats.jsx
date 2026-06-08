import { TrendingUp, Calendar, Target, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MarketingHubStats({ posts, calendarios, campanas, assets }) {
  const navigate = useNavigate();
  const stats = [
    {
      icon: Calendar,
      label: 'Posts programados',
      value: posts.filter(p => ['Programado', 'Aprobado'].includes(p.estado)).length,
      total: posts.length,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Target,
      label: 'Campañas activas',
      value: campanas.filter(c => c.estado === 'Activa').length,
      total: campanas.length,
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: TrendingUp,
      label: 'Calendarios activos',
      value: calendarios.filter(c => c.estado === 'Activo').length,
      total: calendarios.length,
      color: 'from-green-500 to-teal-500',
    },
    {
      icon: ImageIcon,
      label: 'Assets disponibles',
      value: assets.filter(a => a.aprobado).length,
      total: assets.length,
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => (
        <button
          key={s.label}
          onClick={() => {
            if (s.label === 'Campañas activas') {
              navigate('/admin/ads-command');
            }
          }}
          className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-left"
        >
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow`}>
            <s.icon className="w-4 h-4 text-white" />
          </div>
          <div className="font-poppins font-bold text-2xl text-gray-900">
            {s.value}
            <span className="text-sm text-gray-400 font-normal ml-1">/ {s.total}</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
        </button>
      ))}
    </div>
  );
}