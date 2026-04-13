'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Link from 'next/link';
import { Icons } from '@/components/ui/Icons';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { useI18n } from '@/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { user, isGuest, loading, initialized, signIn, signUp, continueAsGuest, error, clearError } = useAuthStore();
  const { t } = useI18n();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialized && !loading) {
      if (user || isGuest) {
        router.push(isGuest ? '/app' : '/projects');
      }
    }
  }, [initialized, loading, user, isGuest, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSubmitting(true);

    let result;
    if (isRegisterMode) {
      result = await signUp(email, password);
    } else {
      result = await signIn(email, password);
    }

    setSubmitting(false);

    if (!result.error) {
      router.push('/projects');
    }
  };

  const handleGuestMode = () => {
    continueAsGuest();
    router.push('/app');
  };

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-[#0b1326] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00e5ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] font-sans">
      {/* TopNavBar */}
      <nav className="bg-[#0b1326]/80 backdrop-blur-xl border-b border-[#3b494c]/10 text-[#00e5ff] font-medium flex justify-between items-center w-full px-8 h-16 fixed top-0 z-50">
        <button
          onClick={() => router.push('/projects')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img src="/logo.png" alt="Logo" className="h-20 w-auto object-contain" />
        </button>
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <Link
            href="/app"
            className="bg-[#00e5ff] text-[#00363d] px-5 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:brightness-110 transition-all"
          >
            {t('nav.startModeling')}
          </Link>
        </div>
      </nav>

      <main className="min-h-screen pt-16 flex flex-col md:flex-row overflow-hidden">
        {/* Left Section */}
        <section className="flex-1 relative p-8 lg:p-12 xl:p-24 flex flex-col justify-center">
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              src="/login-bg.png"
              alt=""
              className="w-full h-full object-cover opacity-40 mix-blend-screen"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#131b2e]/80 via-[#0b1326]/60 to-[#0b1326]" />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#00e5ff]/10 via-transparent to-transparent" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <header className="mb-8">
              <span className="inline-block px-3 py-1 bg-[#00e5ff]/10 border border-[#00e5ff]/20 text-[#00e5ff] text-[10px] uppercase tracking-[0.2em] font-bold rounded mb-6">
                Engineered for High-Fidelity
              </span>
              <h1 className="text-6xl lg:text-8xl font-black text-[#dae2fd] tracking-tighter leading-none mb-8">
                Sculpt the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] to-[#00daf3]">Future.</span>
              </h1>
              <p className="text-[#bac9cc] text-xl leading-relaxed">
                The web&apos;s most powerful 3D workspace. Professional-grade modeling and real-time collaboration, refined for the modern creator.
              </p>
            </header>
            <div className="flex gap-8 items-center text-[#bac9cc] text-xs font-bold uppercase tracking-widest opacity-60">
              <div className="flex items-center gap-2"><span className="text-[#00e5ff] text-sm">✓</span> Real-time Raytracing</div>
              <div className="flex items-center gap-2"><span className="text-[#00e5ff] text-sm">✓</span> Dynamic Sculpting</div>
              <div className="flex items-center gap-2"><span className="text-[#00e5ff] text-sm">✓</span> Team Workflows</div>
            </div>
          </div>
        </section>

        {/* Right Section: Auth Panel */}
        <aside className="w-full md:w-[450px] lg:w-[520px] bg-[#131b2e]/95 backdrop-blur-3xl border-l border-[#3b494c]/10 flex flex-col p-8 lg:p-16 relative z-20">
          <div className="flex flex-col h-full">
            <div className="mb-12 text-center">
              <h2 className="text-4xl font-black text-[#dae2fd] tracking-tight mb-3">
                {isRegisterMode ? t('auth.joinVoid') : t('auth.welcomeBack')}
              </h2>
              <p className="text-[#bac9cc] text-sm">
                {isRegisterMode ? t('auth.registerSubtitle') : t('auth.loginSubtitle')}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-10 bg-[#060e20] p-1.5 rounded-xl">
              <button
                onClick={() => setIsRegisterMode(false)}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  !isRegisterMode
                    ? 'bg-[#222a3d] text-[#00e5ff] shadow-sm'
                    : 'text-[#bac9cc] hover:text-[#dae2fd]'
                }`}
              >
                {t('auth.login')}
              </button>
              <button
                onClick={() => setIsRegisterMode(true)}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  isRegisterMode
                    ? 'bg-[#222a3d] text-[#00e5ff] shadow-sm'
                    : 'text-[#bac9cc] hover:text-[#dae2fd]'
                }`}
              >
                {t('auth.register')}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8 flex-1">
              <div className="space-y-5">
                <div className="group">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2.5 px-1">
                    {t('auth.email')}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#060e20] border border-[#3b494c]/10 focus:ring-1 focus:ring-[#00e5ff]/50 focus:border-[#00e5ff] rounded-xl py-4 px-5 text-[#dae2fd] placeholder:text-slate-600 transition-all"
                      placeholder="name@studio.com"
                      required
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500"><Icons.mail /></span>
                  </div>
                </div>
                <div className="group">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2.5 px-1">
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#060e20] border border-[#3b494c]/10 focus:ring-1 focus:ring-[#00e5ff]/50 focus:border-[#00e5ff] rounded-xl py-4 px-5 text-[#dae2fd] placeholder:text-slate-600 transition-all"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500"><Icons.lock /></span>
                  </div>
                </div>
              </div>

              {!isRegisterMode && (
                <div className="flex items-center justify-end">
                  <a className="text-xs text-[#00e5ff] hover:text-[#00daf3] transition-colors font-bold tracking-wide" href="#">
                    {t('auth.forgotAccess')}
                  </a>
                </div>
              )}

              {error && (
                <div className="text-red-400 text-sm text-center py-2 px-4 bg-red-400/10 rounded-lg border border-red-400/20">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#00e5ff] to-[#00daf3] py-5 rounded-xl text-[#00363d] font-black uppercase tracking-widest text-sm hover:brightness-110 transition-all shadow-xl shadow-[#00e5ff]/20 disabled:opacity-50"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#00363d] border-t-transparent rounded-full animate-spin" />
                    {isRegisterMode ? t('auth.creatingAccount') : t('auth.signingIn')}
                  </span>
                ) : (
                  isRegisterMode ? t('auth.createAccount') : t('auth.launchDashboard')
                )}
              </button>

              <div className="relative flex items-center py-6">
                <div className="flex-grow border-t border-[#3b494c]/10" />
                <span className="flex-shrink mx-6 text-[10px] text-slate-600 uppercase tracking-widest font-bold">{t('auth.or')}</span>
                <div className="flex-grow border-t border-[#3b494c]/10" />
              </div>

              <button
                type="button"
                onClick={handleGuestMode}
                className="w-full flex items-center justify-center gap-3 bg-[#222a3d]/30 py-4 rounded-xl border border-[#3b494c]/15 text-[#dae2fd] text-sm font-medium hover:bg-[#222a3d]/50 transition-all"
              >
                <Icons.door /> {t('auth.continueAsGuest')}
              </button>
            </form>

            <footer className="mt-16 text-center">
              <p className="text-[10px] text-slate-600 leading-relaxed uppercase tracking-tighter">
                {t('auth.byEnteringVoid')}<br />
                <a className="text-slate-400 hover:text-[#00e5ff] underline" href="#">{t('auth.eula')}</a> &amp; <a className="text-slate-400 hover:text-[#00e5ff] underline" href="#">{t('auth.privacyPolicy')}</a>
              </p>
            </footer>
          </div>
        </aside>
      </main>
    </div>
  );
}
