import React, { useState } from 'react';
import { fetchAccessData } from '../services/api';

interface LoginProps {
    onLoginSuccess: (email: string, userName: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !email.includes('@')) {
            setError('Por favor, insira um e-mail válido.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const normalizedEmail = email.toLowerCase().replace(/\s/g, '').trim();

            // Tenta validar com cache primeiro
            let accessData = await fetchAccessData();
            let userMatch = accessData.find(item => item.email === normalizedEmail);

            // Se não encontrou, tenta forçar um refresh da planilha (caso o e-mail tenha sido adicionado recentemente)
            if (!userMatch) {
                accessData = await fetchAccessData(undefined, true);
                userMatch = accessData.find(item => item.email === normalizedEmail);
            }

            if (userMatch) {
                // Sucesso
                localStorage.setItem('deluna_user_email', normalizedEmail);
                localStorage.setItem('deluna_user_name', userMatch.user);
                onLoginSuccess(normalizedEmail, userMatch.user);
            } else {
                setError(`Sem acesso para: ${normalizedEmail}. Solicite acesso ao administrador.`);
            }
        } catch (err) {
            setError(`Erro ao validar acesso: ${err instanceof Error ? err.message : String(err)}`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] font-inter p-4">
            {/* Background Decorativo */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-deluna-primary/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-deluna-accent/10 rounded-full blur-[120px]"></div>
            </div>

            <main className="w-full max-w-[420px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 md:p-12 relative z-10 animate-in fade-in zoom-in duration-500">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-10">
                    <div className="size-20 rounded-3xl bg-deluna-primary flex items-center justify-center text-white mb-6 shadow-xl shadow-deluna-primary/20 rotate-3">
                        <span className="material-symbols-outlined text-4xl">local_shipping</span>
                    </div>
                    <h1 className="text-3xl font-black text-deluna-primary tracking-tighter uppercase text-center leading-none">
                        DelunaDash
                        <span className="block text-deluna-accent text-[10px] font-bold tracking-[0.4em] mt-2">Logistics Control</span>
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="email" className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">E-mail de Acesso</label>
                        <div className="relative group">
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nome@exemplo.com"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck="false"
                                className={`w-full h-14 pl-12 pr-4 bg-slate-50 border-2 rounded-2xl outline-none transition-all font-bold text-deluna-primary placeholder:text-slate-300 ${error ? 'border-red-100 focus:border-red-300' : 'border-slate-50 focus:border-deluna-primary focus:bg-white'}`}
                                disabled={loading}
                            />
                            <span className={`material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-xl transition-colors ${error ? 'text-red-400' : 'text-slate-300 group-focus-within:text-deluna-primary'}`}>
                                mail
                            </span>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl animate-in slide-in-from-top-2">
                            <div className="flex gap-3">
                                <span className="material-symbols-outlined text-red-500 text-sm">error</span>
                                <p className="text-red-800 text-[11px] font-black uppercase tracking-tight leading-tight">{error}</p>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="h-14 bg-deluna-primary hover:bg-deluna-primary-light text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-deluna-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 group"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Verificando...</span>
                            </>
                        ) : (
                            <>
                                <span>Entrar no Sistema</span>
                                <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-12 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Painel de Performance v5.0
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Login;
