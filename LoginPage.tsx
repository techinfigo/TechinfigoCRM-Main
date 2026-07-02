import React, { useState, useEffect } from "react";
import { DigitalPatternBackground } from '@/components/DigitalPatternBackground';
import { t } from '@/i18n';

interface LoginPageProps {
  onLogin: (email: string, password: string) => boolean;
}

const UserCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
  </svg>
);

const EnvelopeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
    <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
  </svg>
);

const LockClosedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
  </svg>
);

const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
    <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
  </svg>
);

const EyeOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.186A10.004 10.004 0 0010 3c-2.26 0-4.34.73-6.063 2.003L3.28 2.22zM10 12.5a2.5 2.5 0 01-2.5-2.5 2.5 2.5 0 01.38-1.354l-1.574-1.574A4 4 0 0014 10a4 4 0 00-.28-1.543l-1.574-1.574A4 4 0 0010 5.5c-1.32 0-2.472.63-3.197 1.584l-1.096-1.096A10.038 10.038 0 0110 3c4.257 0 7.893 2.66 9.336 6.41a1.651 1.651 0 010 1.186 10.03 10.03 0 01-2.012 3.444l-1.32-1.32a4 4 0 00-4-4z" />
  </svg>
);


const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!email || !password) {
      setError(t('login.error.required'));
      return;
    }
    const success = onLogin(email, password);
    if (!success) {
      setError(t('login.error.invalid'));
    } else {
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{ background: '#001d21' }}>
      <DigitalPatternBackground />
      <div className="w-full max-w-sm rounded-2xl p-8 space-y-6 z-10" style={{ background: 'rgba(0, 44, 51, 0.75)', backdropFilter: 'blur(10px)', border: '1px solid rgba(252, 182, 50, 0.2)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}>
        
        <div className="flex justify-center">
            <div className="w-20 h-20 bg-[#001d21] rounded-full flex items-center justify-center border-2 border-[#fcb632]/50">
                <UserCircleIcon className="w-12 h-12 text-[#fcb632]/80"/>
            </div>
        </div>

        <div className="text-center">
            <h1 className="text-2xl font-bold text-white">{t('login.title')}</h1>
            <p className="text-white/60 text-sm">{t('login.subtitle')}</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 rounded-lg bg-[#fcb632]/10 text-[#fcb632] border border-[#fcb632]/30 text-sm text-center" role="alert">
              {error}
            </div>
          )}
          
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-white/40" />
              </div>
              <input
                id="email"
                type="email"
                placeholder="founder@agency.com"
                aria-label={t('login.emailLabel')}
                className="w-full pl-11 pr-4 py-3 rounded-lg bg-[#001d21] text-white placeholder-white/40 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#fcb632] focus:border-[#fcb632] transition-all duration-200"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-white/40" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('login.passwordLabel')}
                aria-label={t('login.passwordLabel')}
                className="w-full pl-11 pr-11 py-3 rounded-lg bg-[#001d21] text-white placeholder-white/40 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#fcb632] focus:border-[#fcb632] transition-all duration-200"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white/70 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="text-sm flex justify-between items-center">
            <label htmlFor="remember-me" className="flex items-center cursor-pointer text-white/60 select-none">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-white/30 bg-[#001d21] text-secondary-accent focus:ring-secondary-accent focus:ring-offset-0"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="ml-2">{t('login.rememberMe')}</span>
            </label>
            <a href="#" className="font-medium text-white/60 hover:text-[#fcb632] transition-colors">
              {t('login.forgotPassword')}
            </a>
          </div>

          <div className="pt-2">
            <button
                type="submit"
                className="w-full font-bold py-3 px-4 rounded-lg bg-secondary-accent text-secondary-accent-text shadow-[0_4px_14px_0_rgba(252,182,50,0.39)] hover:shadow-[0_6px_20px_0_rgba(252,182,50,0.5)] hover:bg-secondary-accent-hover transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#001d21] focus:ring-secondary-accent hover:scale-105"
            >
                {t('login.signIn')}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
};

export default LoginPage;