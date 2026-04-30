import { useLocation, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Home, ShoppingCart, MessageCircle } from 'lucide-react';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);
    const isAdminPath = location.pathname.startsWith('/admin');

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await base44.auth.me();
                return { user, isAuthenticated: true };
            } catch {
                return { user: null, isAuthenticated: false };
            }
        }
    });

    // ---- Versión PÚBLICA: tortuga + CTA a tienda + WhatsApp ----
    if (!isAdminPath) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900">
                <div className="max-w-md w-full bg-white/5 backdrop-blur-md border border-white/15 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-2xl">
                    <div className="text-7xl">🐢</div>
                    <div className="space-y-2">
                        <h1 className="text-5xl font-poppins font-black text-white">404</h1>
                        <p className="text-white/60 text-sm">
                            Esta tortuga buscó por todas partes pero no encontró la página
                            {pageName && <> <span className="font-mono text-teal-300">/{pageName}</span></>}.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                        <Link to="/" className="flex-1">
                            <button className="w-full h-11 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-sm font-bold flex items-center justify-center gap-2 transition">
                                <Home className="w-4 h-4" /> Inicio
                            </button>
                        </Link>
                        <Link to="/shop" className="flex-1">
                            <button className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg">
                                <ShoppingCart className="w-4 h-4" /> Ir a la tienda
                            </button>
                        </Link>
                    </div>
                    <a
                        href="https://wa.me/56935040242?text=Hola%20Peyu%2C%20busco%20ayuda"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-teal-300 hover:text-teal-200 transition"
                    >
                        <MessageCircle className="w-3.5 h-3.5" /> ¿Necesitas ayuda? Escríbenos por WhatsApp
                    </a>
                </div>
            </div>
        );
    }

    // ---- Versión ADMIN: original con nota para builder ----
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-7xl font-light text-slate-300">404</h1>
                        <div className="h-0.5 w-16 bg-slate-200 mx-auto"></div>
                    </div>
                    <div className="space-y-3">
                        <h2 className="text-2xl font-medium text-slate-800">Page Not Found</h2>
                        <p className="text-slate-600 leading-relaxed">
                            The page <span className="font-medium text-slate-700">"{pageName}"</span> could not be found in this application.
                        </p>
                    </div>
                    {isFetched && authData.isAuthenticated && authData.user?.role === 'admin' && (
                        <div className="mt-8 p-4 bg-slate-100 rounded-lg border border-slate-200">
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center mt-0.5">
                                    <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                                </div>
                                <div className="text-left space-y-1">
                                    <p className="text-sm font-medium text-slate-700">Admin Note</p>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        This could mean that the AI hasn't implemented this page yet. Ask it to implement it in the chat.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="pt-6">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors duration-200"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Go Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}