import React from 'react';
import { AlertCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AlertList = ({ alerts = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Alerts & Reminders</h3>
        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-bold rounded-full">
          {alerts.length} Active
        </span>
      </div>

      <div className="space-y-3">
        {alerts.length > 0 ? (
          alerts.map(alert => (
            <div
              key={alert.id}
              onClick={() => navigate(alert.link)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 group ${
                alert.type === 'danger'
                  ? 'bg-rose-50/60 border-rose-200 hover:bg-rose-100/60'
                  : 'bg-amber-50/60 border-amber-200 hover:bg-amber-100/60'
              }`}
            >
              {alert.type === 'danger' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>{alert.title}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
                <p className="text-slate-600 mt-0.5 font-medium">{alert.message}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="p-6 text-center text-xs text-slate-400">
            No active alerts at this time. All operations running smoothly!
          </div>
        )}
      </div>
    </div>
  );
};
