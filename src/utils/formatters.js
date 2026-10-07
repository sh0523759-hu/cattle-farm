// Helper utilities for formatting numbers, currency, dates, and status styling

let currentGlobalSettings = {
  currency: 'Rs.',
  weightUnit: 'Kilogram',
  milkUnit: 'Liter'
};

export const setGlobalFormatSettings = (settings) => {
  if (!settings) return;
  if (settings.currency) currentGlobalSettings.currency = settings.currency;
  if (settings.weightUnit) currentGlobalSettings.weightUnit = settings.weightUnit;
  if (settings.milkUnit) currentGlobalSettings.milkUnit = settings.milkUnit;
};

export const getGlobalCurrency = () => {
  if (currentGlobalSettings.currency && currentGlobalSettings.currency !== 'Rs.') {
    return currentGlobalSettings.currency;
  }
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.endsWith('_settings') || k === 'cattle_erp_settings')) {
        const val = JSON.parse(localStorage.getItem(k));
        if (val && val.currency) return val.currency;
      }
    }
  } catch (e) {}
  return currentGlobalSettings.currency || 'Rs.';
};

export const getGlobalWeightUnit = () => {
  if (currentGlobalSettings.weightUnit && currentGlobalSettings.weightUnit !== 'Kilogram') {
    return currentGlobalSettings.weightUnit;
  }
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.endsWith('_settings') || k === 'cattle_erp_settings')) {
        const val = JSON.parse(localStorage.getItem(k));
        if (val && val.weightUnit) return val.weightUnit;
      }
    }
  } catch (e) {}
  return currentGlobalSettings.weightUnit || 'Kilogram';
};

export const getGlobalMilkUnit = () => {
  if (currentGlobalSettings.milkUnit && currentGlobalSettings.milkUnit !== 'Liter') {
    return currentGlobalSettings.milkUnit;
  }
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.endsWith('_settings') || k === 'cattle_erp_settings')) {
        const val = JSON.parse(localStorage.getItem(k));
        if (val && val.milkUnit) return val.milkUnit;
      }
    }
  } catch (e) {}
  return currentGlobalSettings.milkUnit || 'Liter';
};

export const formatCurrency = (amount, currencySymbol) => {
  const sym = currencySymbol || getGlobalCurrency();
  if (amount === undefined || amount === null || isNaN(amount)) return `${sym} 0`;
  const num = Number(amount);
  const formatted = num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${sym} ${formatted}`.trim();
};

export const formatNumber = (val, suffix = '') => {
  if (val === undefined || val === null || isNaN(val)) return `0 ${suffix}`.trim();
  return `${Number(val).toLocaleString('en-US')} ${suffix}`.trim();
};

export const formatUnit = (unit, defaultCategory = 'weight') => {
  const currentWeight = getGlobalWeightUnit();
  const currentMilk = getGlobalMilkUnit();
  if (!unit) return defaultCategory === 'milk' ? currentMilk : currentWeight;
  const u = String(unit).trim().toLowerCase();
  if (['l', 'ltr', 'liter', 'liters', 'litre', 'litres', 'gal', 'gallon', 'gallons'].includes(u)) {
    return currentMilk;
  }
  if (['kg', 'kgs', 'kilogram', 'kilograms', 'kilo', 'kilos', 'lb', 'lbs', 'pound', 'pounds'].includes(u)) {
    return currentWeight;
  }
  return String(unit).trim();
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return dateString;
  }
};

export const calculateDaysRemaining = (targetDateStr) => {
  if (!targetDateStr) return null;
  const target = new Date(targetDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getStatusBadgeColor = (status) => {
  if (!status) return 'bg-gray-100 text-gray-700 border-gray-200';
  const s = status.toLowerCase();
  
  if (['active', 'completed', 'healthy', 'delivered', 'present'].includes(s)) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (['sick', 'overdue', 'expired', 'failed', 'absent', 'danger', 'critical'].includes(s)) {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  if (['pregnant', 'in gestation'].includes(s)) {
    return 'bg-purple-50 text-purple-700 border-purple-200';
  }
  if (['due soon', 'low stock', 'expiring soon', 'leave', 'warning', 'bred', 'planned'].includes(s)) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (['sold', 'sold out', 'inactive', 'archived', 'maintenance'].includes(s)) {
    return 'bg-slate-100 text-slate-700 border-slate-300';
  }
  if (['dry', 'heifer', 'calf', 'info'].includes(s)) {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  
  return 'bg-gray-100 text-gray-700 border-gray-200';
};
