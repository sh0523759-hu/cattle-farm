import React from 'react';
import { Download } from 'lucide-react';
import { exportToCSV } from '../../utils/pdfCsvExport';

export const ExportButton = ({
  data = [],
  filename = 'export.csv',
  columns = null,
  onClick = null,
  className = '',
  label = 'Export CSV',
  disabled = false,
  title = 'Export data to CSV file'
}) => {
  const handleExport = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
      return;
    }
    if (!data || data.length === 0) {
      alert('No data available to export.');
      return;
    }
    exportToCSV(data, filename, columns);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={disabled}
      title={title}
      className={`px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-emerald-700 border border-slate-200/90 hover:border-emerald-300 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <Download className="w-3.5 h-3.5 text-emerald-600" />
      <span>{label}</span>
    </button>
  );
};

export default ExportButton;
