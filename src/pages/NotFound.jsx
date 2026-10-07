import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Home } from 'lucide-react';

export const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-lg mx-auto">
      <div className="p-4 bg-rose-100 text-rose-600 rounded-full mb-4">
        <AlertCircle className="w-12 h-12" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">404 - Page Not Found</h1>
      <p className="text-xs text-slate-500 font-medium mt-2 max-w-sm">
        The requested Cattle ERP module or page route does not exist or has been moved.
      </p>
      <button
        onClick={() => navigate('/')}
        className="mt-6 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2"
      >
        <Home className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </button>
    </div>
  );
};
