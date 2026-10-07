import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFarm } from '../../context/FarmContext';
import { Sprout, Lock, Mail, Eye, EyeOff, LogIn, UserPlus, Building2, User, CheckCircle2 } from 'lucide-react';

export const LoginPage = () => {
  const { login, register, isAuthenticated } = useAuth();
  const { showToast, settings } = useFarm();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState('login');

  // Sign In state
  const [email, setEmail] = useState(() => searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const urlEmail = searchParams.get('email');
    if (urlEmail) {
      setEmail(urlEmail);
    }
  }, [searchParams]);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regFarmName, setRegFarmName] = useState('');

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        showToast(`Successfully logged in to ${res.user?.farmName || 'Cattle ERP'}!`, 'success');
        navigate('/', { replace: true });
      } else {
        setError(res.message || 'Failed to login. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await register({
        name: regName,
        email: regEmail,
        password: regPassword,
        farmName: regFarmName
      });

      if (res.success) {
        showToast(`Welcome! Farm account "${regFarmName}" registered successfully!`, 'success');
        navigate('/', { replace: true });
      } else {
        setError(res.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred during registration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b2519] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Dynamic Background Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10 my-6">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-2 bg-white border border-emerald-500/40 rounded-2xl mb-3 shadow-xl shadow-emerald-950/60 backdrop-blur-xs">
            <img src="/logo1.jpg" alt="CattlePro Logo" className="w-12 h-12 object-contain rounded-xl" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {settings?.farmName || 'CattlePro ERP'}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-emerald-400/90 mt-1">
            Multi-Tenant Smart Farm Management Platform
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-[#071911]/90 backdrop-blur-md border border-emerald-900/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/80">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-[#040e0a]/80 p-1 rounded-2xl border border-emerald-900/50 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                mode === 'login'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-emerald-300/70 hover:text-emerald-100'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                mode === 'register'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-emerald-300/70 hover:text-emerald-100'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register New Account</span>
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-950/50 border border-rose-800/60 rounded-2xl text-rose-300 text-xs font-semibold flex items-start space-x-2.5 animate-in fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-emerald-200/90 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-500/70">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@farm.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#040e0a]/80 border border-emerald-900/70 rounded-xl text-sm text-white placeholder-emerald-700/60 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-200/90 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-500/70">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#040e0a]/80 border border-emerald-900/70 rounded-xl text-sm text-white placeholder-emerald-700/60 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-emerald-500/80 hover:text-emerald-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/60 flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>

              <div className="pt-3 border-t border-emerald-900/40">
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 text-center">
                  ⚡ 1-Click Demo Sign In
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setEmail('admin@cattleerp.com');
                      setPassword('admin123');
                      setIsLoading(true);
                      const res = await login('admin@cattleerp.com', 'admin123');
                      if (res.success) {
                        showToast(`Logged in as Farm Admin!`, 'success');
                        navigate('/', { replace: true });
                      }
                      setIsLoading(false);
                    }}
                    className="p-2.5 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-800/70 rounded-xl text-left cursor-pointer transition-all"
                  >
                    <div className="text-[11px] font-bold text-white flex items-center gap-1">👑 Admin Demo</div>
                    <div className="text-[10px] text-emerald-400/80 truncate">admin@cattleerp.com</div>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setEmail('almadina@farm.com');
                      setPassword('farm123');
                      setIsLoading(true);
                      const res = await login('almadina@farm.com', 'farm123');
                      if (res.success) {
                        showToast(`Logged in as Farm Owner!`, 'success');
                        navigate('/', { replace: true });
                      }
                      setIsLoading(false);
                    }}
                    className="p-2.5 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-800/70 rounded-xl text-left cursor-pointer transition-all"
                  >
                    <div className="text-[11px] font-bold text-white flex items-center gap-1">🌾 Farm Owner</div>
                    <div className="text-[10px] text-emerald-400/80 truncate">almadina@farm.com</div>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-emerald-200/90 uppercase tracking-wider mb-1.5">
                  Farm Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-500/70">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regFarmName}
                    onChange={(e) => setRegFarmName(e.target.value)}
                    placeholder="e.g. Al-Riaz Dairy Farm"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#040e0a]/80 border border-emerald-900/70 rounded-xl text-sm text-white placeholder-emerald-700/60 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-200/90 uppercase tracking-wider mb-1.5">
                  Owner Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-500/70">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Muhammad Riaz"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#040e0a]/80 border border-emerald-900/70 rounded-xl text-sm text-white placeholder-emerald-700/60 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-emerald-200/90 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-500/70">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="riaz@farm.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#040e0a]/80 border border-emerald-900/70 rounded-xl text-sm text-white placeholder-emerald-700/60 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-emerald-200/90 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-500/70">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3 py-2.5 bg-[#040e0a]/80 border border-emerald-900/70 rounded-xl text-sm text-white placeholder-emerald-700/60 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-200/90 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-500/70">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3 py-2.5 bg-[#040e0a]/80 border border-emerald-900/70 rounded-xl text-sm text-white placeholder-emerald-700/60 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 transition-all"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/60 flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

