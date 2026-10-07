import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles, CheckCircle2, ArrowRight, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PlanBLockedPage = ({ title = 'Operations & Financial Suite' }) => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const handleUpgradeClick = () => {
    if (updateUser) {
      updateUser({ currentPlan: 'Plan B (Full ERP Suite)' });
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xl text-slate-800 text-center relative overflow-hidden">
        {/* Top Lock Badge */}
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Lock className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-extrabold uppercase tracking-wider mb-3">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Plan B & Custom Plan Exclusive</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
          {title} is Locked
        </h2>

        <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6 leading-relaxed">
          Your farm account <span className="font-extrabold text-emerald-800">({user?.farmName || 'My Farm'})</span> is currently subscribed to <strong className="text-emerald-700">PLAN A (Small Farm)</strong>. 
          To unlock <strong className="text-slate-900">{title}</strong> along with full Operations, Staff Payroll, Financial Accounting & Custom Export Reports, please upgrade to <strong className="text-emerald-700">PLAN B</strong>.
        </p>

        {/* Plan Comparison Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 text-left grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-white rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Your Current Plan (Plan A)</h4>
            <ul className="space-y-1.5 text-xs text-slate-700">
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Up to 50 Animals Record Limit</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Farm Management Suite (Milk, Feed, Health)</span>
              </li>
              <li className="flex items-center space-x-1.5 text-slate-400 line-through">
                <span>Operations & Inventory Control</span>
              </li>
              <li className="flex items-center space-x-1.5 text-slate-400 line-through">
                <span>Profit & Loss Financial Analytics</span>
              </li>
            </ul>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-300 rounded-xl">
            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Unlocked in Plan B</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-emerald-950 font-medium">
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Up to 250+ Cattle Records</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Full Operations (Inventory, Employees, Customers)</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Finance Suite (Cash Flow, Payroll, Profit/Loss)</span>
              </li>
              <li className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>Custom Excel & PDF Reports Export</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleUpgradeClick}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Upgrade to Plan B Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
