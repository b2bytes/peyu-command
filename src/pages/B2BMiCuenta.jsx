import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut, Building2, FileText, Sparkles, Wand2, Loader2 } from 'lucide-react';

import PanelAuthForm from '@/components/b2b/panel/PanelAuthForm';
import ProposalHistoryCard from '@/components/b2b/panel/ProposalHistoryCard';
import MockupGallery from '@/components/b2b/panel/MockupGallery';

const SESSION_KEY = 'peyu_b2b_panel_session';

export default function B2BMiCuenta() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [tab, setTab] = useState('proposals'); // 'proposals' | 'mockups'
  const [downloading, setDownloading] = useState(null);
  const [repeating, setRepeating] = useState(null);

  // Restaurar sesión si existe y es válida
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (parsed.expires_at && parsed.expires_at > Date.now()) {
        setSession(parsed);
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch { /* ignore */ }
  }, []);

  const handleAuthenticated = (data) => {
    const sess = {
      profile: data.profile,
      proposals: data.proposals || [],
      mockups: data.mockups || [],
      session_token: data.session_token,
      expires_at: Date.now() + 24 * 60 * 60 * 1000,
    };
    setSession(sess);
    localStorage.setItem(SESSION_KEY, JSON.stringify(sess));
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  const handleDownload = async (proposalId, numero) => {
    setDownloading(proposalId);
    try {
      const res = await base44.functions.invoke('generateProposalPDF', { proposalId });
      const { pdf_base64, filename } = res.data;
      const byteChars = atob(pdf_base64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `PEYU-Propuesta-${numero}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('No se pudo descargar el PDF.');
    } finally {
      setDownloading(null);
    }
  };

  // Repetir pedido: carga productos por SKU, arma carrito y salta a self-service listo para generar
  const handleRepeat = async (proposal) => {
    setRepeating(proposal.id);
    try {
      const productos = await base44.entities.Producto.list();
      const cart = [];
      for (const it of (proposal.items || [])) {
        const prod = productos.find(p => p.sku === it.sku);
        if (prod) cart.push({ producto: prod, cantidad: it.cantidad || it.qty || 10 });
      }
      if (cart.length === 0) {
        alert('Los productos de esta cotización ya no están disponibles. Te llevamos al catálogo.');
        navigate('/b2b/self-service');
        return;
      }

      // Persistir contexto para que B2BSelfService lo levante
      sessionStorage.setItem('peyu_b2b_repeat', JSON.stringify({
        cart: cart.map(c => ({ sku: c.producto.sku, cantidad: c.cantidad })),
        form: {
          contact_name: session.profile.contact_name || '',
          company_name: session.profile.company_name || '',
          email: session.profile.email || '',
          phone: session.profile.phone || '',
          rut: session.profile.rut || '',
          notes: `Repetir pedido — basado en ${proposal.numero}`,
        },
      }));
      navigate('/b2b/self-service?repeat=1');
    } catch (e) {
      alert('No pudimos armar el repedido: ' + e.message);
    } finally {
      setRepeating(null);
    }
  };

  // ───────────── VISTA NO AUTENTICADA ─────────────
  if (!session) {
    return (
      <div className="flex-1 overflow-auto font-inter min-h-screen">
        <div className="px-4 sm:px-6 py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <p className="text-sm font-poppins font-bold text-white">Mi cuenta corporativa</p>
        </div>
        <div className="px-4 sm:px-6 py-8">
          <PanelAuthForm onAuthenticated={handleAuthenticated} />
        </div>
      </div>
    );
  }

  // ───────────── VISTA AUTENTICADA ─────────────
  const { profile, proposals, mockups } = session;
  const totalCotizado = proposals.reduce((s, p) => s + (p.total || 0), 0);
  const aceptadas = proposals.filter(p => p.status === 'Aceptada').length;

  return (
    <div className="flex-1 overflow-auto font-inter min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500/30 to-cyan-500/30 border-b border-white/20 px-4 sm:px-6 py-3 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => navigate('/')}
              className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 flex-shrink-0">
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-poppins font-bold text-white leading-none truncate">{profile.company_name}</p>
              <p className="text-[10px] text-white/60 leading-none mt-0.5 truncate">{profile.email}</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 gap-1.5">
            <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/5 border border-white/15 rounded-2xl p-4 backdrop-blur-sm">
            <p className="text-[10px] text-white/50 uppercase font-semibold">Cotizaciones</p>
            <p className="text-2xl font-poppins font-bold text-white mt-1">{proposals.length}</p>
          </div>
          <div className="bg-white/5 border border-white/15 rounded-2xl p-4 backdrop-blur-sm">
            <p className="text-[10px] text-white/50 uppercase font-semibold">Aceptadas</p>
            <p className="text-2xl font-poppins font-bold text-emerald-300 mt-1">{aceptadas}</p>
          </div>
          <div className="bg-white/5 border border-white/15 rounded-2xl p-4 backdrop-blur-sm">
            <p className="text-[10px] text-white/50 uppercase font-semibold">Monto total</p>
            <p className="text-2xl font-poppins font-bold text-white mt-1">${(totalCotizado / 1000).toFixed(0)}K</p>
          </div>
          <div className="bg-white/5 border border-white/15 rounded-2xl p-4 backdrop-blur-sm">
            <p className="text-[10px] text-white/50 uppercase font-semibold">Mockups</p>
            <p className="text-2xl font-poppins font-bold text-white mt-1">{mockups.length}</p>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex flex-wrap gap-2">
          <Link to="/b2b/self-service">
            <Button className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold gap-2 shadow-lg">
              <Wand2 className="w-4 h-4" /> Nueva cotización
            </Button>
          </Link>
          <Link to="/b2b/catalogo">
            <Button variant="outline" className="rounded-xl border-white/30 text-white hover:bg-white/10 gap-2">
              Catálogo corporativo
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          {[
            { id: 'proposals', label: 'Mis cotizaciones', icon: FileText, count: proposals.length },
            { id: 'mockups', label: 'Mis mockups', icon: Sparkles, count: mockups.length },
          ].map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                  active ? 'border-teal-400 text-white' : 'border-transparent text-white/50 hover:text-white/80'
                }`}>
                <Icon className="w-4 h-4" /> {t.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-teal-500/30 text-teal-200' : 'bg-white/10 text-white/40'}`}>{t.count}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        {tab === 'proposals' ? (
          proposals.length === 0 ? (
            <div className="bg-white/5 border border-white/15 rounded-2xl p-10 text-center backdrop-blur-sm">
              <FileText className="w-10 h-10 text-white/30 mx-auto mb-3" />
              <p className="text-white/70 text-sm">Aún no tienes cotizaciones.</p>
              <Link to="/b2b/self-service" className="inline-block mt-3">
                <Button className="rounded-xl bg-teal-500 hover:bg-teal-600 text-white gap-2">
                  <Wand2 className="w-4 h-4" /> Crear mi primera cotización
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {proposals.map(p => (
                <ProposalHistoryCard
                  key={p.id}
                  proposal={p}
                  onDownload={handleDownload}
                  onRepeat={handleRepeat}
                  downloading={downloading === p.id}
                  repeating={repeating === p.id}
                />
              ))}
            </div>
          )
        ) : (
          <MockupGallery mockups={mockups} />
        )}
      </div>
    </div>
  );
}