import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';

export const Toast = () => {
  const { toast } = useFarm();

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-sky-500 flex-shrink-0" />
  };

  const bgBorder = {
    success: 'bg-emerald-900/90 text-white border-emerald-700',
    error: 'bg-rose-900/90 text-white border-rose-700',
    warning: 'bg-amber-900/90 text-white border-amber-700',
    info: 'bg-sky-900/90 text-white border-sky-700'
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-bounce-in max-w-sm w-full">
      <div className={`flex items-start p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 ${bgBorder[toast.type] || bgBorder.info}`}>
        {icons[toast.type] || icons.info}
        <div className="ml-3 mr-2 flex-1 text-sm font-medium">
          {toast.message}
        </div>
      </div>
    </div>
  );
};
