import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from 'motion/react';
import { DigitalPatternBackground } from './DigitalPatternBackground';
import { load, save, KEYS } from '../storage';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<string | null>; // returns null on success, error message on failure
  mode: 'signin' | 'signup';
  onToggleMode: () => void;
}

const UserCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
  </svg>
);

const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75V4H5a2 2 0 00-2 2v1a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2h-1V3.75A2.75 2.75 0 0011.25 1h-2.5zM5 10a1 1 0 00-1 1v5a2 2 0 002 2h8a2 2 0 002-2v-5a1 1 0 00-1-1H5z" clipRule="evenodd" />
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
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
    <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clipRule="evenodd" />
  </svg>
);

const EyeOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-1.814-1.814m-2.903-2.903A9.952 9.952 0 0112 18.25c-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113 9.969 9.969 0 012.248-3.333m3.12 3.12a3.75 3.75 0 004.832 4.832m1.285-3.38a3.75 3.75 0 00-4.832-4.832" />
    <path fillRule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113A10.038 10.038 0 0117.222 17.1l-1.398-1.398c2.148-1.041 3.753-2.981 4.544-5.255a5.228 5.228 0 00-4.041-4.041" />
  </svg>
);

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, mode, onToggleMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastUser, setLastUser] = useState<{ email: string; name: string; profilePictureUrl?: string } | null>(null);

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    const lastUserData = load(KEYS.lastUser, null);
    if (lastUserData) {
        setLastUser(lastUserData);
        setEmail(lastUserData.email);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setIsSubmitting(true);
    const errorMessage = await onLogin(email, password);
    setIsSubmitting(false);
    if (errorMessage) {
      setError(errorMessage);
    } else {
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }
    }
  };

  const handleUseAnotherAccount = () => {
    setLastUser(null);
    setEmail('');
    setPassword('');
  };

  const handleRemoveAccount = () => {
      if (window.confirm("Are you sure you want to completely remove this account and forget login details?")) {
        setLastUser(null);
        setEmail('');
        setPassword('');
        setRememberMe(false);
        localStorage.removeItem(KEYS.lastUser);
        localStorage.removeItem('rememberedEmail');
      }
  };

  // Extract initials for beautiful monogram fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden select-none" style={{ background: 'radial-gradient(circle at center, #002c33 0%, #001d21 100%)' }}>
      <DigitalPatternBackground />
      
      {/* High-quality decorative lighting effects (Google style soft glowing orbs) */}
      <div className="absolute top-[-20%] left-[-25%] w-[60%] h-[60%] bg-[#fcb632]/8 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-25%] w-[60%] h-[60%] bg-amber-500/8 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[35%] h-[35%] bg-teal-500/6 blur-[140px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] rounded-3xl p-8 md:p-10 space-y-6 z-10" 
        style={{ 
          background: 'rgba(0, 31, 36, 0.85)', 
          backdropFilter: 'blur(24px)', 
          border: '1px solid rgba(252, 182, 50, 0.15)', 
          boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)' 
        }}
      >
        
        <AnimatePresence mode="wait">
          {lastUser ? (
            <motion.div 
              key="user-profile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center space-y-5"
            >
              {/* Remembered User DP (Google Style) */}
              <div className="relative group">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#fcb632] via-amber-500 to-[#fcb632]/20 opacity-40 blur-md group-hover:opacity-80 transition-opacity duration-500" />
                <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-[#fcb632] via-amber-400 to-[#fcb632]/20 shadow-2xl relative z-10 transition-transform duration-500 group-hover:scale-105">
                  <div className="w-full h-full bg-[#001d21] rounded-full flex items-center justify-center overflow-hidden">
                    {lastUser?.profilePictureUrl ? (
                        <img 
                            src={lastUser.profilePictureUrl} 
                            alt={lastUser.name} 
                            className="w-full h-full object-cover rounded-full"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-500 via-orange-600 to-yellow-500 flex items-center justify-center text-white text-2xl font-bold tracking-wider font-sans shadow-inner">
                          {getInitials(lastUser.name)}
                        </div>
                    )}
                  </div>
                </div>
                {/* Active user glowing indicator badge */}
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 border-2 border-[#001d21] rounded-full z-20 shadow-lg animate-pulse" />
              </div>

              <div className="text-center space-y-1 flex flex-col items-center">
                <p className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-[#fcb632]/5 border border-[#fcb632]/30 text-[10px] md:text-xs font-bold text-[#fcb632] uppercase tracking-widest mb-1.5 shadow-[0_4px_12px_rgba(252,182,50,0.05)] select-none">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#fcb632]"></span>
                  </span>
                  Welcome Back
                </p>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {lastUser.name}
                </h1>
                
                <div className="flex flex-col items-center pt-2 space-y-3">
                   <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#001d21]/60 border border-white/10 text-white/80 text-sm shadow-inner max-w-[280px]">
                      <EnvelopeIcon className="w-4 h-4 text-[#fcb632]/70 shrink-0" />
                      <span className="truncate">{lastUser.email}</span>
                   </div>
                   
                   <button 
                    type="button"
                    onClick={handleUseAnotherAccount}
                    className="text-xs text-amber-400/80 hover:text-[#fcb632] transition-colors underline underline-offset-4 font-medium"
                   >
                     Sign in with a different account
                   </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="login-header"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.3 }}
              className="text-center space-y-2"
            >
              <div className="w-16 h-16 bg-gradient-to-tr from-[#fcb632]/20 to-[#fcb632]/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#fcb632]/25 shadow-xl group transition-transform duration-500 hover:rotate-3">
                <UserCircleIcon className="w-9 h-9 text-[#fcb632] group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">{mode === 'signup' ? 'Create Your Account' : 'Sign In'}</h1>
              <p className="text-white/60 text-sm">{mode === 'signup' ? 'First time setup — this becomes your owner login' : 'Techinfigo CRM Workspace'}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-3.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/25 text-sm text-center flex items-center justify-center space-x-2 shadow-lg"
              >
                <span className="font-medium">{error}</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {!lastUser && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative group"
                >
                  <label htmlFor="email" className="block text-xs font-semibold text-white/50 group-focus-within:text-[#fcb632] mb-1.5 uppercase tracking-wider pl-1 transition-colors">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-5 w-5 text-white/30 group-focus-within:text-[#fcb632] transition-colors duration-300" />
                    </div>
                    <input
                        id="email"
                        type="email"
                        placeholder="name@agency.com"
                        aria-label="Email ID"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-[#001d21]/60 text-white placeholder-white/20 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#fcb632]/40 focus:border-[#fcb632] transition-all duration-300"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group">
              <label htmlFor="password" className="block text-xs font-semibold text-white/50 group-focus-within:text-[#fcb632] mb-1.5 uppercase tracking-wider pl-1 transition-colors">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-white/30 group-focus-within:text-[#fcb632] transition-colors duration-300" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  aria-label="Password"
                  className="w-full pl-11 pr-11 py-3.5 rounded-xl bg-[#001d21]/60 text-white placeholder-white/20 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#fcb632]/40 focus:border-[#fcb632] transition-all duration-300 font-sans"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  autoFocus={!!lastUser}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/30 hover:text-[#fcb632] focus:outline-none transition-colors duration-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5.5 w-5.5" />
                  ) : (
                    <EyeIcon className="h-5.5 w-5.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-sm px-1 pt-1">
            {!lastUser ? (
              <label htmlFor="remember-me" className="flex items-center cursor-pointer text-white/60 select-none group">
                <div className="relative flex items-center">
                  <input
                      id="remember-me"
                      type="checkbox"
                      className="peer h-4.5 w-4.5 rounded-md border-white/20 bg-[#001d21]/60 text-[#fcb632] focus:ring-[#fcb632]/40 transition-all cursor-pointer"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                  />
                </div>
                <span className="ml-2 group-hover:text-white text-xs md:text-sm transition-colors font-medium">Remember Me</span>
              </label>
            ) : (
              <button 
                type="button"
                onClick={handleRemoveAccount}
                className="flex items-center space-x-1.5 text-red-400/70 hover:text-red-400 text-xs md:text-sm font-semibold transition-colors duration-200 group"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Remove details</span>
              </button>
            )}
            <a href="#" className="font-semibold text-xs md:text-sm text-white/40 hover:text-[#fcb632] transition-colors duration-200">
              Forgot Password?
            </a>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full font-bold py-4 px-4 rounded-xl bg-gradient-to-r from-[#fcb632] to-amber-400 text-[#001d21] shadow-[0_8px_24px_-6px_rgba(252,182,50,0.4)] hover:shadow-[0_12px_32px_-4px_rgba(252,182,50,0.6)] transition-all duration-300 flex items-center justify-center space-x-2 text-base disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <LockClosedIcon className="w-5 h-5 shrink-0" />
            <span>{isSubmitting ? 'Please wait…' : mode === 'signup' ? 'Create Account' : (lastUser ? 'Sign In Securely' : 'Continue')}</span>
          </motion.button>

          <div className="pt-2 text-center">
            <p className="text-white/40 text-xs">
              {mode === 'signup' ? (
                <>Already set up? <button type="button" onClick={onToggleMode} className="text-[#fcb632] hover:underline font-semibold">Sign in instead</button></>
              ) : (
                <>First time here? <button type="button" onClick={onToggleMode} className="text-[#fcb632] hover:underline font-semibold">Create the owner account</button></>
              )}
            </p>
          </div>
          
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
