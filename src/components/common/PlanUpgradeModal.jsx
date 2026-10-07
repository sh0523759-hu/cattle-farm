import React, { useEffect } from 'react';
import { Lock, Sparkles, CheckCircle2, ArrowRight, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PlanUpgradeModal = ({ isOpen, onClose, featureName = 'Operations & Finance' }) => {
  const { updateUser } = useAuth();
  useEffect(() => {
    if (isOpen) {
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpgradeClick = () => {
    if (updateUser) {
      updateUser({ currentPlan: 'Plan B (Full ERP Suite)' });
    }
    onClose();
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overscroll-contain animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#071911] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-white overflow-hidden overscroll-contain"
      >
        {/* Glow Effects */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-emerald-950/60 rounded-xl hover:bg-emerald-900/80 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon Badge */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-950/50">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider">
              <ShieldAlert className="w-3 h-3" />
              <span>Plan B Feature</span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight mt-1">
              Unlock {featureName}
            </h3>
          </div>
        </div>

        {/* Description Body */}
        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          Your farm is currently on <strong className="text-emerald-400 font-extrabold">Plan A (Small Farm)</strong>. 
          Access to <strong className="text-amber-300 font-bold">{featureName}</strong>, full Inventory, Staff Payroll, Cash Flow & Reports requires an active <strong className="text-emerald-400 font-extrabold">Plan B</strong> or <strong className="text-emerald-400 font-extrabold">Custom Plan</strong> subscription.
        </p>

        {/* What Plan B Unlocks */}
        <div className="bg-[#0b2519] border border-emerald-900/60 rounded-2xl p-4 mb-6 space-y-2.5">
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>What Plan B & Custom Plan Include:</span>
          </h4>
          <ul className="space-y-2 text-xs text-slate-200">
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Up to 250+ Cattle Head Records (vs 50 in Plan A)</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Full Operations Suite (Inventory, Employees, Equipment & Customers)</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Complete Financial ERP (Cash Flow, Income, Expenses, Payroll & Profit/Loss)</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Custom Analytics & Excel Export Reports</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleUpgradeClick}
            className="w-full sm:flex-1 py-3 px-5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/60 flex items-center justify-center space-x-2 transition-all cursor-pointer text-sm"
          >
            <span>Upgrade to Plan B</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-4 bg-emerald-950/60 hover:bg-emerald-900/60 text-slate-300 hover:text-white font-semibold rounded-xl border border-emerald-800/40 transition-colors text-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
