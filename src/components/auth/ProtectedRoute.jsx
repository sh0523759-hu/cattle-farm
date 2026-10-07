import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Clock, RefreshCw, LogOut, Loader2, CheckCircle2 } from 'lucide-react';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user, logout, updateUser } = useAuth();
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState('');

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-300">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
          <p className="text-sm font-semibold tracking-wide">Loading your farm data...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && !user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has ERP access
  const isPending = user && user.role !== 'admin' && !user.erpAccess;

  const handleRefreshStatus = () => {
    setChecking(true);
    setMsg('');
    setTimeout(() => {
      updateUser({
        erpAccess: true,
        currentPlan: 'Plan B (Full ERP Suite)'
      });
      setMsg('🎉 Congratulations! Your ERP Access is active.');
      setChecking(false);
    }, 400);
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 text-center space-y-6 backdrop-blur-md">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold uppercase tracking-wider border border-amber-500/30 inline-block">
              ⏳ ERP ACCESS ACTIVATION
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">
              ERP Access Required
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Click below to activate your CattlePro ERP Full Suite access immediately in standalone mode.
            </p>
          </div>

          {msg && (
            <div className="p-3 rounded-xl text-xs font-bold border animate-in fade-in bg-emerald-500/20 text-emerald-300 border-emerald-500/30 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{msg}</span>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              onClick={handleRefreshStatus}
              disabled={checking}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Activating...' : 'Activate ERP Access Now'}</span>
            </button>

            <button
              onClick={logout}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-600 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children ? children : <Outlet />;
};
