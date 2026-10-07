import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { exportToCSV, triggerPrint } from '../../utils/pdfCsvExport';
import { formatDate, formatCurrency, formatUnit } from '../../utils/formatters';
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Printer, Download, Filter, FilterX, Milk, DollarSign,
  TrendingUp, TrendingDown, Users, Package, Stethoscope, Syringe,
  Wheat, Layers, Sun, BarChart3, UserCheck, ShoppingCart
} from 'lucide-react';
import { MilkChart } from '../../components/dashboard/MilkChart';

export const ReportsPage = () => {
  const {
    settings,
    animals,
    milkRecords,
    feedItems,
    healthRecords,
    vaccinations,
    breedingRecords,
    calves,
    inventory,
    employees,
    customers,
    income,
    expenses,
    sales,
    feedLogs,
    getMilkSaleQuantity
  } = useFarm();

  // Global Filter States
  const [datePeriod, setDatePeriod] = useState('all'); // 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_year' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedAnimalTag, setSelectedAnimalTag] = useState('all');
  const [selectedAnimalType, setSelectedAnimalType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFeedType, setSelectedFeedType] = useState('all');

  // Active Report Tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'milk' | 'herd' | 'health' | 'feed' | 'operations'

  // Map animal tag -> animal object
  const animalMap = useMemo(() => {
    const map = {};
    (animals || []).forEach(a => { map[a.tagNo] = a; });
    return map;
  }, [animals]);

  // Extract unique Animal Types with Presets (Cow, Buffalo, Goat, Sheep, Calf, Bull)
  const availableAnimalTypes = useMemo(() => {
    const defaultTypes = ['Cow', 'Buffalo', 'Goat', 'Sheep', 'Calf', 'Bull'];
    const typesSet = new Set(defaultTypes);
    (animals || []).forEach(a => { if (a.type) typesSet.add(a.type); });
    return Array.from(typesSet);
  }, [animals]);

  // Extract unique Categories with Presets
  const availableCategories = useMemo(() => {
    const defaultCategories = [
      'Milk Sale', 'Animal Sale', 'Feed', 'Salary', 'Electricity', 'Maintenance'
    ];
    const catSet = new Set(defaultCategories);
    (income || []).forEach(i => { if (i.category) catSet.add(i.category); });
    (expenses || []).forEach(e => { if (e.category) catSet.add(e.category); });
    return Array.from(catSet);
  }, [income, expenses]);

  // Extract unique Feed Types from stock items & logs
  const availableFeedTypes = useMemo(() => {
    const set = new Set();
    (feedItems || []).forEach(f => { if (f.feedName) set.add(f.feedName); });
    (feedLogs || []).forEach(l => { if (l.feedName) set.add(l.feedName); });
    return Array.from(set);
  }, [feedItems, feedLogs]);

  // Date Period Filter Helper
  const isDateInPeriod = (dateStr) => {
    if (!dateStr) return true;
    if (datePeriod === 'all') return true;

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    const monthStr = todayStr.slice(0, 7); // YYYY-MM
    const yearStr = todayStr.slice(0, 4);   // YYYY

    if (datePeriod === 'today') return dateStr === todayStr;
    if (datePeriod === 'yesterday') return dateStr === yesterdayStr;
    if (datePeriod === 'this_week') return dateStr >= weekStartStr && dateStr <= todayStr;
    if (datePeriod === 'this_month') return dateStr.startsWith(monthStr);
    if (datePeriod === 'this_year') return dateStr.startsWith(yearStr);
    if (datePeriod === 'custom') {
      if (customStartDate && dateStr < customStartDate) return false;
      if (customEndDate && dateStr > customEndDate) return false;
      return true;
    }
    return true;
  };

  // Filtered Datasets across all ERP modules based on active global filters
  const filteredData = useMemo(() => {
    // 1. Animals
    const filteredAnm = (animals || []).filter(a => {
      if (selectedAnimalTag !== 'all' && a.tagNo !== selectedAnimalTag) return false;
      if (selectedAnimalType !== 'all' && a.type !== selectedAnimalType) return false;
      const dobStr = a.dob || a.purchaseDate;
      if (!isDateInPeriod(dobStr)) return false;
      return true;
    });

    // 2. Milk Records
    const filteredMlk = (milkRecords || []).filter(r => {
      if (!isDateInPeriod(r.date)) return false;
      if (selectedAnimalTag !== 'all' && r.animalTag !== selectedAnimalTag) return false;
      const animal = animalMap[r.animalTag];
      if (selectedAnimalType !== 'all' && (animal?.type || '') !== selectedAnimalType) return false;
      return true;
    });

    // 3. Health Records
    const filteredHlt = (healthRecords || []).filter(r => {
      if (!isDateInPeriod(r.date)) return false;
      if (selectedAnimalTag !== 'all' && r.animalTag !== selectedAnimalTag) return false;
      const animal = animalMap[r.animalTag];
      if (selectedAnimalType !== 'all' && (animal?.type || '') !== selectedAnimalType) return false;
      return true;
    });

    // 4. Vaccination Records
    const filteredVac = (vaccinations || []).filter(r => {
      const dateStr = r.vaccinationDate || r.date;
      if (!isDateInPeriod(dateStr)) return false;
      if (selectedAnimalTag !== 'all' && r.animalTag !== selectedAnimalTag) return false;
      const animal = animalMap[r.animalTag];
      if (selectedAnimalType !== 'all' && (animal?.type || '') !== selectedAnimalType) return false;
      return true;
    });

    // 5. Breeding Records
    const filteredBrd = (breedingRecords || []).filter(r => {
      const dateStr = r.breedingDate || r.date;
      if (!isDateInPeriod(dateStr)) return false;
      if (selectedAnimalTag !== 'all' && r.femaleTag !== selectedAnimalTag && r.maleTag !== selectedAnimalTag) return false;
      return true;
    });

    // 6. Calves
    const filteredClf = (calves || []).filter(c => {
      const dateStr = c.birthDate || c.dob;
      if (!isDateInPeriod(dateStr)) return false;
      if (selectedAnimalTag !== 'all' && c.motherTag !== selectedAnimalTag && c.fatherTag !== selectedAnimalTag) return false;
      return true;
    });

    // 7. Income
    const filteredInc = (income || []).filter(i => {
      if (!isDateInPeriod(i.date)) return false;
      if (selectedCategory !== 'all' && (i.category || '') !== selectedCategory) return false;
      return true;
    });

    // 8. Expenses
    const filteredExp = (expenses || []).filter(e => {
      if (!isDateInPeriod(e.date)) return false;
      if (selectedCategory !== 'all' && (e.category || '') !== selectedCategory) return false;
      return true;
    });

    // 9. Feed Items
    const filteredFed = (feedItems || []).filter(f => {
      if (selectedCategory !== 'all' && (f.category || '') !== selectedCategory) return false;
      return true;
    });

    // 10. Inventory & Assets
    const filteredInv = (inventory || []).filter(i => {
      if (!isDateInPeriod(i.purchaseDate)) return false;
      return true;
    });

    // 11. Feed Usage Logs
    const filteredFdl = (feedLogs || []).filter(l => {
      if (!isDateInPeriod(l.date)) return false;
      if (selectedAnimalTag !== 'all' && l.animalTag !== selectedAnimalTag) return false;
      if (selectedFeedType !== 'all' && l.feedName !== selectedFeedType) return false;
      const animal = animalMap[l.animalTag];
      if (selectedAnimalType !== 'all' && (animal?.type || '') !== selectedAnimalType) return false;
      return true;
    });

    // 12. Sales Records
    const filteredSal = (sales || []).filter(s => {
      if (!isDateInPeriod(s.date)) return false;
      return true;
    });

    return {
      animals: filteredAnm,
      milkRecords: filteredMlk,
      healthRecords: filteredHlt,
      vaccinations: filteredVac,
      breedingRecords: filteredBrd,
      calves: filteredClf,
      income: filteredInc,
      expenses: filteredExp,
      sales: filteredSal,
      feedItems: filteredFed,
      inventory: filteredInv,
      feedLogs: filteredFdl,
      employees: employees || [],
      customers: customers || []
    };
  }, [animals, milkRecords, healthRecords, vaccinations, breedingRecords, calves, income, expenses, sales, feedItems, inventory, feedLogs, employees, customers, animalMap, datePeriod, customStartDate, customEndDate, selectedAnimalTag, selectedAnimalType, selectedCategory, selectedFeedType]);

  // Feed Consumption Analytics (For Feed Consumption Report)
  const feedConsumptionAnalytics = useMemo(() => {
    let totalKg = 0;
    let totalCost = 0;
    const feedTypeMap = {};
    const animalMapConsumption = {};
    const dateMap = {};

    (filteredData.feedLogs || []).forEach(log => {
      const qty = Number(log.quantityGiven || 0);
      const cost = Number(log.totalCost || (qty * Number(log.unitPrice || 0)));
      totalKg += qty;
      totalCost += cost;

      const ft = log.feedName || 'Other';
      feedTypeMap[ft] = (feedTypeMap[ft] || 0) + qty;

      const animKey = `${log.animalTag}${log.animalName ? ` (${log.animalName})` : ''}`;
      animalMapConsumption[animKey] = (animalMapConsumption[animKey] || 0) + qty;

      const d = log.date || 'Unknown';
      if (!dateMap[d]) dateMap[d] = { date: formatDate(d), rawDate: d, Quantity: 0, Cost: 0 };
      dateMap[d].Quantity += qty;
      dateMap[d].Cost += cost;
    });

    let topFeedType = 'N/A';
    let maxFeedQty = 0;
    Object.entries(feedTypeMap).forEach(([name, qty]) => {
      if (qty > maxFeedQty) {
        maxFeedQty = qty;
        topFeedType = `${name} (${qty} ${settings.weightUnit || 'Kilogram'})`;
      }
    });

    let topAnimal = 'N/A';
    let maxAnimQty = 0;
    Object.entries(animalMapConsumption).forEach(([name, qty]) => {
      if (qty > maxAnimQty) {
        maxAnimQty = qty;
        topAnimal = `${name} (${qty} ${settings.weightUnit || 'Kilogram'})`;
      }
    });

    const colors = ['#f59e0b', '#10b981', '#0284c7', '#8b5cf6', '#ec4899', '#64748b'];
    const feedTypeChartData = Object.entries(feedTypeMap).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));

    const animalChartData = Object.entries(animalMapConsumption)
      .map(([name, Quantity]) => ({ name, Quantity }))
      .sort((a, b) => b.Quantity - a.Quantity)
      .slice(0, 6);

    const dateTrendChartData = Object.values(dateMap)
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
      .slice(-14);

    return {
      totalKg,
      totalCost,
      topFeedType,
      topAnimal,
      feedTypeChartData,
      animalChartData,
      dateTrendChartData
    };
  }, [filteredData.feedLogs]);

  // Dynamic ERP KPI Summary (Short & Non-Repetitive 6 Cards)
  const erpKpis = useMemo(() => {
    let totalMilkProduced = 0;
    const milkDatesSet = new Set();

    filteredData.milkRecords.forEach(r => {
      const morning = Number(r.morningQty || 0);
      const evening = Number(r.eveningQty || 0);
      totalMilkProduced += Number(r.totalQty || (morning + evening));
      if (r.date) milkDatesSet.add(r.date);
    });

    const daysCount = Math.max(1, milkDatesSet.size);
    const avgDailyMilk = totalMilkProduced > 0 ? (totalMilkProduced / daysCount).toFixed(1) : '0.0';

    const totalMilkSold = (filteredData.sales || []).reduce((sum, s) => {
      return sum + (getMilkSaleQuantity ? getMilkSaleQuantity(s) : 0);
    }, 0);

    const availableMilk = Math.max(0, Number((totalMilkProduced - totalMilkSold).toFixed(1)));

    const totalInc = filteredData.income.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const totalExp = filteredData.expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netProfit = totalInc - totalExp;

    return {
      totalAnimals: filteredData.animals.length,
      totalMilkProduced: totalMilkProduced.toFixed(1),
      totalMilkSold: totalMilkSold.toFixed(1),
      availableMilk: availableMilk.toFixed(1),
      avgDailyMilk,
      totalIncome: totalInc,
      totalExpenses: totalExp,
      netProfit
    };
  }, [filteredData, getMilkSaleQuantity]);

  // Chart Dataset Computations
  const milkChartData = useMemo(() => {
    const map = {};
    filteredData.milkRecords.forEach(r => {
      const d = r.date || 'Unknown';
      if (!map[d]) map[d] = { date: formatDate(d), rawDate: d, Morning: 0, Evening: 0, Total: 0 };
      const m = Number(r.morningQty || 0);
      const e = Number(r.eveningQty || 0);
      map[d].Morning += m;
      map[d].Evening += e;
      map[d].Total += Number(r.totalQty || (m + e));
    });
    return Object.values(map).sort((a, b) => a.rawDate.localeCompare(b.rawDate)).slice(-14);
  }, [filteredData.milkRecords]);

  const financialChartData = useMemo(() => {
    const map = {};
    filteredData.income.forEach(i => {
      const key = (i.date || '').slice(0, 7) || 'Other';
      if (!map[key]) map[key] = { period: key, Income: 0, Expenses: 0, Profit: 0 };
      map[key].Income += Number(i.amount || 0);
    });
    filteredData.expenses.forEach(e => {
      const key = (e.date || '').slice(0, 7) || 'Other';
      if (!map[key]) map[key] = { period: key, Income: 0, Expenses: 0, Profit: 0 };
      map[key].Expenses += Number(e.amount || 0);
    });
    return Object.values(map).map(m => ({
      ...m,
      Profit: m.Income - m.Expenses
    })).sort((a, b) => a.period.localeCompare(b.period)).slice(-6);
  }, [filteredData.income, filteredData.expenses]);

  const herdPopulationChartData = useMemo(() => {
    const map = {};
    filteredData.animals.forEach(a => {
      const type = a.type || 'Cow';
      map[type] = (map[type] || 0) + 1;
    });
    const colors = ['#10b981', '#0284c7', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];
    return Object.keys(map).map((k, idx) => ({
      name: k,
      value: map[k],
      color: colors[idx % colors.length]
    }));
  }, [filteredData.animals]);

  const expenseCategoryChartData = useMemo(() => {
    const map = {};
    filteredData.expenses.forEach(e => {
      const cat = e.category || 'General';
      map[cat] = (map[cat] || 0) + Number(e.amount || 0);
    });
    const colors = ['#f43f5e', '#f59e0b', '#0284c7', '#8b5cf6', '#10b981', '#64748b'];
    return Object.keys(map).map((k, idx) => ({
      name: k,
      value: map[k],
      color: colors[idx % colors.length]
    }));
  }, [filteredData.expenses]);

  const resetAllFilters = () => {
    setDatePeriod('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedAnimalTag('all');
    setSelectedAnimalType('all');
    setSelectedCategory('all');
    setSelectedFeedType('all');
  };

  const isFilterActive = datePeriod !== 'all' || selectedAnimalTag !== 'all' || selectedAnimalType !== 'all' || selectedCategory !== 'all' || selectedFeedType !== 'all' || customStartDate !== '' || customEndDate !== '';

  // Helper to build filter scope text for printable header
  const filterDescription = useMemo(() => {
    const parts = [];
    if (datePeriod !== 'all') {
      const labels = {
        today: 'Today',
        yesterday: 'Yesterday',
        this_week: 'This Week',
        this_month: 'This Month',
        this_year: 'This Year',
        custom: customStartDate && customEndDate ? `${formatDate(customStartDate)} to ${formatDate(customEndDate)}` : 'Custom Range'
      };
      parts.push(`Date: ${labels[datePeriod] || datePeriod}`);
    } else {
      parts.push('Date: All Time');
    }

    if (selectedAnimalTag !== 'all') parts.push(`Animal: ${selectedAnimalTag}`);
    if (selectedAnimalType !== 'all') parts.push(`Species: ${selectedAnimalType}`);
    if (selectedCategory !== 'all') parts.push(`Category: ${selectedCategory}`);
    if (selectedFeedType !== 'all') parts.push(`Feed: ${selectedFeedType}`);

    return parts.join(' | ');
  }, [datePeriod, customStartDate, customEndDate, selectedAnimalTag, selectedAnimalType, selectedCategory, selectedFeedType]);

  const renderPrintableReportHeader = (title) => (
    <div className="hidden print:block border-b-2 border-emerald-900 pb-3 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-black text-slate-900 uppercase tracking-wide">
            {settings.farmName || 'Cattle ERP'}
          </h1>
          <p className="text-xs text-slate-600 font-medium">{settings.address || 'Farm Operations & Management'}</p>
          {settings.phone && <p className="text-xs text-slate-500 font-medium">Contact: {settings.phone}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-sm font-extrabold text-emerald-800 uppercase tracking-wider">{title}</h2>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Printed: {new Date().toLocaleString()}</p>
        </div>
      </div>
      <div className="mt-2 text-[11px] text-slate-600 font-semibold flex justify-between border-t border-slate-200 pt-1.5">
        <span><strong className="text-slate-800">Filter Scope:</strong> {filterDescription}</span>
        <span><strong className="text-slate-800">Currency:</strong> {settings.currency || 'PKR'}</span>
      </div>
    </div>
  );

  const handleExportCSV = () => {
    let dataset = [];
    let filename = `Farm_${activeTab}_data_${new Date().toISOString().slice(0, 10)}.csv`;

    if (activeTab === 'overview' || activeTab === 'operations') dataset = filteredData.income.concat(filteredData.expenses);
    else if (activeTab === 'milk') dataset = filteredData.milkRecords;
    else if (activeTab === 'herd') dataset = filteredData.animals;
    else if (activeTab === 'health') dataset = filteredData.healthRecords.concat(filteredData.vaccinations);
    else if (activeTab === 'feed') dataset = (filteredData.feedLogs || []).concat(filteredData.feedItems);

    exportToCSV(dataset, filename);
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Farm Reports & Analytics</h2>
          <p className="text-xs text-slate-500 font-medium">
            Live consolidated farm performance across financial, milk, herd, health, feed consumption & operations
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={triggerPrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 1. Global Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs no-print space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>Global Filters</span>
          </div>
          {isFilterActive && (
            <button
              onClick={resetAllFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center space-x-1 cursor-pointer"
            >
              <FilterX className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Date Period */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Date Period
            </label>
            <select
              value={datePeriod}
              onChange={(e) => setDatePeriod(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:outline-hidden font-semibold text-slate-800"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
              <option value="this_year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Animal */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Animal
            </label>
            <select
              value={selectedAnimalTag}
              onChange={(e) => setSelectedAnimalTag(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:outline-hidden font-semibold text-slate-800"
            >
              <option value="all">All Animals</option>
              {(animals || []).map(a => (
                <option key={a.id || a._id || a.tagNo} value={a.tagNo}>
                  {a.tagNo} - {a.name || 'Unnamed'}
                </option>
              ))}
            </select>
          </div>

          {/* Animal Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Animal Type
            </label>
            <select
              value={selectedAnimalType}
              onChange={(e) => setSelectedAnimalType(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:outline-hidden font-semibold text-slate-800"
            >
              <option value="all">All Species</option>
              {availableAnimalTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:outline-hidden font-semibold text-slate-800"
            >
              <option value="all">All Categories</option>
              {availableCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Feed Type */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Feed Type
            </label>
            <select
              value={selectedFeedType}
              onChange={(e) => setSelectedFeedType(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:outline-hidden font-semibold text-slate-800"
            >
              <option value="all">All Feed Types</option>
              {availableFeedTypes.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {datePeriod === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Short & Non-Repetitive Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 no-print">
        {/* Milk Produced */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-600">Produced</span>
            <Milk className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-emerald-700 leading-tight">
            {erpKpis.totalMilkProduced} {settings.milkUnit || 'Liter'}
          </div>
        </div>

        {/* Milk Sold */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-600">Milk Sold</span>
            <ShoppingCart className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl font-extrabold text-sky-700 leading-tight">
            {erpKpis.totalMilkSold} {settings.milkUnit || 'Liter'}
          </div>
        </div>

        {/* Available Milk */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-600">Available Milk</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-extrabold text-purple-700 leading-tight">
            {erpKpis.availableMilk} {settings.milkUnit || 'Liter'}
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-600">Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-extrabold text-slate-800 leading-tight truncate">
            {formatCurrency(erpKpis.totalIncome, settings.currency)}
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold text-slate-600">Expenses</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg font-extrabold text-slate-800 leading-tight truncate">
            {formatCurrency(erpKpis.totalExpenses, settings.currency)}
          </div>
        </div>

        {/* Profit */}
        <div className={`p-3.5 rounded-2xl border shadow-2xs flex flex-col justify-between ${
          erpKpis.netProfit >= 0 ? 'bg-emerald-50/60 border-emerald-200' : 'bg-rose-50/60 border-rose-200'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-700">Profit</span>
            <DollarSign className={`w-4 h-4 ${erpKpis.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`} />
          </div>
          <div className={`text-lg font-extrabold leading-tight truncate ${
            erpKpis.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'
          }`}>
            {formatCurrency(erpKpis.netProfit, settings.currency)}
          </div>
        </div>
      </div>

      {/* 3. Section Navigation Tabs (Short & Clean Names) */}
      <div className="flex space-x-1 bg-white p-1 rounded-2xl border border-slate-200/80 shadow-2xs overflow-x-auto no-scrollbar no-print">
        {[
          { id: 'overview', name: 'Financial', icon: BarChart3 },
          { id: 'milk', name: 'Milk', icon: Milk },
          { id: 'herd', name: 'Animals', icon: Layers },
          { id: 'health', name: 'Health & Breeding', icon: Stethoscope },
          { id: 'feed', name: 'Feed & Inventory', icon: Wheat },
          { id: 'operations', name: 'Staff & Customers', icon: Users }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* --- TAB CONTENT 1: FINANCIAL --- */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {renderPrintableReportHeader("Financial Statement & Profitability Analysis")}
          
          {/* Printable Financial Summary KPIs */}
          <div className="hidden print:grid print:grid-cols-3 print:gap-3 print:mb-5">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase block mb-0.5">Total Herd Animals</span>
              <span className="text-base font-black text-slate-900">{erpKpis.totalAnimals} Head</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase block mb-0.5">Total Milk Produced</span>
              <span className="text-base font-black text-emerald-800">{erpKpis.totalMilkProduced} {settings.milkUnit || 'Liter'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase block mb-0.5">Avg Daily Milk Yield</span>
              <span className="text-base font-black text-sky-800">{erpKpis.avgDailyMilk} {settings.milkUnit || 'Liter'}/day</span>
            </div>
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block mb-0.5">Total Farm Revenue</span>
              <span className="text-base font-black text-emerald-900">{formatCurrency(erpKpis.totalIncome, settings.currency)}</span>
            </div>
            <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200">
              <span className="text-[11px] font-bold text-rose-800 uppercase block mb-0.5">Total Farm Expenses</span>
              <span className="text-base font-black text-rose-900">{formatCurrency(erpKpis.totalExpenses, settings.currency)}</span>
            </div>
            <div className={`p-3 rounded-xl border ${erpKpis.netProfit >= 0 ? 'bg-emerald-100/80 border-emerald-300' : 'bg-rose-100/80 border-rose-300'}`}>
              <span className="text-[11px] font-bold text-slate-700 uppercase block mb-0.5">Net Profit / Loss</span>
              <span className={`text-base font-black ${erpKpis.netProfit >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
                {formatCurrency(erpKpis.netProfit, settings.currency)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 printable-chart-section">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs printable-chart-card">
              <div className="mb-4">
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Income vs Expenses</h3>
              </div>
              <div className="h-64 w-full printable-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={financialChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                      formatter={(val) => formatCurrency(val, settings.currency)}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Income" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs printable-chart-card">
              <div className="mb-4">
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Expense Categories</h3>
              </div>
              <div className="h-64 w-full flex items-center justify-center printable-chart-container">
                {expenseCategoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseCategoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {expenseCategoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                        formatter={(val) => formatCurrency(val, settings.currency)}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-400 font-medium">No expense data</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs printable-report">
            <div className="border-b-2 border-emerald-900 pb-4 mb-6 flex justify-between items-start no-print">
              <div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-wide">{settings.farmName || 'Cattle ERP'}</h1>
                <p className="text-xs text-slate-600">{settings.address || 'Agricultural Zone'}</p>
              </div>
              <div className="text-right">
                <h2 className="text-sm font-extrabold text-emerald-800 uppercase tracking-wider">Financial Statement</h2>
                <p className="text-xs text-slate-400 font-semibold mt-1">Generated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-700 mb-2 flex items-center space-x-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Income ({filteredData.income.length})</span>
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                        <th className="p-2">Date</th>
                        <th className="p-2">Category</th>
                        <th className="p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredData.income.slice(0, 10).map((row, idx) => (
                        <tr key={idx}>
                          <td className="p-2 text-slate-600">{formatDate(row.date)}</td>
                          <td className="p-2 font-semibold text-slate-800">{row.category}</td>
                          <td className="p-2 text-right font-bold text-emerald-700">{formatCurrency(row.amount, settings.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-extrabold text-xs border-t border-slate-300">
                        <td colSpan="2" className="p-2 text-slate-800 uppercase">Total Income</td>
                        <td className="p-2 text-right text-emerald-800 font-bold">{formatCurrency(erpKpis.totalIncome, settings.currency)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase text-slate-700 mb-2 flex items-center space-x-1">
                  <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                  <span>Expenses ({filteredData.expenses.length})</span>
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                        <th className="p-2">Date</th>
                        <th className="p-2">Category</th>
                        <th className="p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredData.expenses.slice(0, 10).map((row, idx) => (
                        <tr key={idx}>
                          <td className="p-2 text-slate-600">{formatDate(row.date)}</td>
                          <td className="p-2 font-semibold text-slate-800">{row.category}</td>
                          <td className="p-2 text-right font-bold text-rose-600">{formatCurrency(row.amount, settings.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-extrabold text-xs border-t border-slate-300">
                        <td colSpan="2" className="p-2 text-slate-800 uppercase">Total Expenses</td>
                        <td className="p-2 text-right text-rose-800 font-bold">{formatCurrency(erpKpis.totalExpenses, settings.currency)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 2: MILK --- */}
      {activeTab === 'milk' && (
        <div className="space-y-5">
          {renderPrintableReportHeader("Milk Production & Yield Analysis Report")}

          {/* Milk Summary Reconciliation KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid print:grid-cols-4 print:gap-3 print:mb-5">
            <div className="p-3.5 bg-white print:bg-emerald-50/70 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block mb-0.5">Total Milk Produced</span>
              <span className="text-lg font-black text-emerald-900">{erpKpis.totalMilkProduced} {settings.milkUnit || 'Liter'}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Actual milking recorded</span>
            </div>
            <div className="p-3.5 bg-white print:bg-sky-50/70 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-sky-800 uppercase block mb-0.5">Total Milk Sold</span>
              <span className="text-lg font-black text-sky-900">{erpKpis.totalMilkSold} {settings.milkUnit || 'Liter'}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Deducted via sales</span>
            </div>
            <div className="p-3.5 bg-white print:bg-purple-50/70 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-purple-800 uppercase block mb-0.5">Available Milk Stock</span>
              <span className="text-lg font-black text-purple-900">{erpKpis.availableMilk} {settings.milkUnit || 'Liter'}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Produced - Sold</span>
            </div>
            <div className="p-3.5 bg-white print:bg-amber-50/70 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-800 uppercase block mb-0.5">Avg Daily Milk Yield</span>
              <span className="text-lg font-black text-amber-900">{erpKpis.avgDailyMilk} {settings.milkUnit || 'Liter'}/d</span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Average per active day</span>
            </div>
          </div>

          <MilkChart
            records={filteredData.milkRecords}
            milkUnit={settings.milkUnit}
            selectedAnimal={selectedAnimalTag}
            className="printable-chart-card shadow-2xs"
          />

          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs printable-report">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">
              Milking Sessions ({filteredData.milkRecords.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase text-[11px]">
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Tag</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Morning</th>
                    <th className="p-2.5">Evening</th>
                    <th className="p-2.5">Total</th>
                    <th className="p-2.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredData.milkRecords.map((r, idx) => {
                    const animal = animalMap[r.animalTag];
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-semibold text-slate-800">{formatDate(r.date)}</td>
                        <td className="p-2.5 font-bold font-mono text-emerald-800">{r.animalTag}</td>
                        <td className="p-2.5 font-bold text-slate-700">{animal?.name || 'Unnamed'}</td>
                        <td className="p-2.5 text-slate-600">{animal?.type || 'Cow'}</td>
                        <td className="p-2.5 text-slate-700">{r.morningQty || 0} {settings.milkUnit || 'Liter'}</td>
                        <td className="p-2.5 text-slate-700">{r.eveningQty || 0} {settings.milkUnit || 'Liter'}</td>
                        <td className="p-2.5 font-extrabold text-emerald-700">{r.totalQty || 0} {settings.milkUnit || 'Liter'}</td>
                        <td className="p-2.5 text-slate-400 italic text-[11px]">{r.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Milk Sales & Sold Quantity Log */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs printable-report">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4 text-sky-600" />
                <span>Milk Sales & Dispatch Report ({filteredData.sales.filter(s => (getMilkSaleQuantity ? getMilkSaleQuantity(s) : 0) > 0).length})</span>
              </h3>
              <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                Total Sold: {erpKpis.totalMilkSold} {settings.milkUnit || 'Liter'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase text-[11px]">
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Invoice #</th>
                    <th className="p-2.5">Customer</th>
                    <th className="p-2.5 text-right">Milk Sold Quantity</th>
                    <th className="p-2.5 text-right">Unit Rate</th>
                    <th className="p-2.5 text-right">Total Amount</th>
                    <th className="p-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredData.sales.filter(s => (getMilkSaleQuantity ? getMilkSaleQuantity(s) : 0) > 0).length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-6 text-center text-slate-400 italic">
                        No milk sales recorded in this period.
                      </td>
                    </tr>
                  ) : (
                    filteredData.sales.filter(s => (getMilkSaleQuantity ? getMilkSaleQuantity(s) : 0) > 0).map((s, idx) => {
                      const qty = getMilkSaleQuantity ? getMilkSaleQuantity(s) : 0;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-semibold text-slate-800">{formatDate(s.date)}</td>
                          <td className="p-2.5 font-bold font-mono text-emerald-800">{s.invoiceNo || s.id}</td>
                          <td className="p-2.5 font-bold text-slate-700">{s.customerName}</td>
                          <td className="p-2.5 text-right font-extrabold text-sky-700">{qty} {settings.milkUnit || 'Liter'}</td>
                          <td className="p-2.5 text-right text-slate-600">{formatCurrency(s.unitPrice || (s.totalAmount / (qty || 1)), settings.currency)}</td>
                          <td className="p-2.5 text-right font-bold text-emerald-700">{formatCurrency(s.totalAmount, settings.currency)}</td>
                          <td className="p-2.5 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                              s.paymentStatus === 'Partial' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {s.paymentStatus || 'Paid'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 3: ANIMALS --- */}
      {activeTab === 'herd' && (
        <div className="space-y-5">
          {renderPrintableReportHeader("Herd Registry & Species Demographics Report")}

          {/* Printable Herd Summary KPIs */}
          <div className="hidden print:grid print:grid-cols-4 print:gap-3 print:mb-5">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-500 uppercase block mb-0.5">Total Herd Head</span>
              <span className="text-base font-black text-slate-900">{filteredData.animals.length} Head</span>
            </div>
            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200">
              <span className="text-[11px] font-bold text-emerald-800 uppercase block mb-0.5">Active Milking Females</span>
              <span className="text-base font-black text-emerald-900">
                {filteredData.animals.filter(a => a.gender === 'Female' && a.status === 'Active').length}
              </span>
            </div>
            <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200">
              <span className="text-[11px] font-bold text-purple-800 uppercase block mb-0.5">Pregnant Females</span>
              <span className="text-base font-black text-purple-900">
                {filteredData.animals.filter(a => a.status === 'Pregnant').length}
              </span>
            </div>
            <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200">
              <span className="text-[11px] font-bold text-sky-800 uppercase block mb-0.5">Calves Registered</span>
              <span className="text-base font-black text-sky-900">{filteredData.calves.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 printable-chart-section">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs printable-chart-card">
              <div className="mb-4">
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Species Distribution</h3>
              </div>
              <div className="h-64 w-full flex items-center justify-center printable-chart-container">
                {herdPopulationChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={herdPopulationChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {herdPopulationChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-400 font-medium">No animal data</div>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight mb-4">Herd Demographics</h3>
              </div>

              <div className="space-y-3 text-xs font-semibold">
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Active Female Milking Animals:</span>
                  <span className="font-bold text-emerald-700">
                    {filteredData.animals.filter(a => a.gender === 'Female' && a.status === 'Active').length}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Pregnant Females:</span>
                  <span className="font-bold text-sky-700">
                    {filteredData.animals.filter(a => a.status === 'Pregnant').length}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Sick / Observation:</span>
                  <span className="font-bold text-rose-600">
                    {filteredData.animals.filter(a => a.healthStatus === 'Sick').length}
                  </span>
                </div>
                <div className="flex justify-between p-2.5 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">Total Calves Registered:</span>
                  <span className="font-bold text-purple-700">
                    {filteredData.calves.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs printable-report">
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2">
              Herd Registry ({filteredData.animals.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase text-[11px]">
                    <th className="p-2.5">Tag No</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Breed</th>
                    <th className="p-2.5">Gender</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Health</th>
                    <th className="p-2.5">Daily Avg Yield</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredData.animals.map((a, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-bold font-mono text-emerald-800">{a.tagNo}</td>
                      <td className="p-2.5 font-extrabold text-slate-800">{a.name}</td>
                      <td className="p-2.5 font-semibold text-slate-700">{a.type}</td>
                      <td className="p-2.5 text-slate-600">{a.breed}</td>
                      <td className="p-2.5 text-slate-600">{a.gender}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          a.status === 'Pregnant' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          a.healthStatus === 'Sick' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {a.healthStatus || 'Healthy'}
                        </span>
                      </td>
                      <td className="p-2.5 font-extrabold text-emerald-700">{a.dailyAvgMilk || 0} {settings.milkUnit || 'Liter'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 4: HEALTH & BREEDING --- */}
      {activeTab === 'health' && (
        <div className="space-y-5">
          {renderPrintableReportHeader("Veterinary Care & Vaccination Report")}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs printable-report">
              <h3 className="text-xs font-bold uppercase text-slate-800 mb-3 flex items-center space-x-1">
                <Stethoscope className="w-4 h-4 text-emerald-600" />
                <span>Veterinary Care ({filteredData.healthRecords.length})</span>
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b text-[11px]">
                      <th className="p-2">Date</th>
                      <th className="p-2">Tag</th>
                      <th className="p-2">Diagnosis</th>
                      <th className="p-2">Treatment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredData.healthRecords.map((r, idx) => (
                      <tr key={idx}>
                        <td className="p-2 text-slate-600">{formatDate(r.date)}</td>
                        <td className="p-2 font-mono font-bold text-emerald-800">{r.animalTag}</td>
                        <td className="p-2 font-semibold text-rose-700">{r.diagnosis || r.problem}</td>
                        <td className="p-2 text-slate-700">{r.treatment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs printable-report">
              <h3 className="text-xs font-bold uppercase text-slate-800 mb-3 flex items-center space-x-1">
                <Syringe className="w-4 h-4 text-sky-600" />
                <span>Vaccinations ({filteredData.vaccinations.length})</span>
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b text-[11px]">
                      <th className="p-2">Date</th>
                      <th className="p-2">Tag</th>
                      <th className="p-2">Vaccine</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredData.vaccinations.map((r, idx) => (
                      <tr key={idx}>
                        <td className="p-2 text-slate-600">{formatDate(r.vaccinationDate || r.date)}</td>
                        <td className="p-2 font-mono font-bold text-emerald-800">{r.animalTag}</td>
                        <td className="p-2 font-semibold text-slate-800">{r.vaccineName}</td>
                        <td className="p-2 font-bold text-emerald-700">{r.status || 'Completed'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 5: FEED CONSUMPTION & INVENTORY REPORT --- */}
      {activeTab === 'feed' && (
        <div className="space-y-5">
          {renderPrintableReportHeader("Feed Consumption & Stock Inventory Report")}
          {/* Feed Consumption KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid print:grid-cols-4 print:gap-2 printable-card">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold text-slate-600">Total Feed Consumed</span>
                <Wheat className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-xl font-extrabold text-amber-700 leading-tight">
                {feedConsumptionAnalytics.totalKg.toLocaleString()} {settings.weightUnit || 'Kilogram'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">
                {(filteredData.feedLogs || []).length} recorded feeding logs
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold text-slate-600">Feed Cost Consumed</span>
                <DollarSign className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-xl font-extrabold text-rose-700 leading-tight">
                {formatCurrency(feedConsumptionAnalytics.totalCost, settings.currency)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">
                Total valuation of consumed feed
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold text-slate-600">Top Feed Type</span>
                <Package className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-sm font-extrabold text-slate-800 leading-tight truncate">
                {feedConsumptionAnalytics.topFeedType}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">
                Highest quantity consumed
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold text-slate-600">Top Consuming Animal</span>
                <Users className="w-4 h-4 text-sky-600" />
              </div>
              <div className="text-sm font-extrabold text-slate-800 leading-tight truncate">
                {feedConsumptionAnalytics.topAnimal}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">
                Highest ration recipient
              </div>
            </div>
          </div>

          {/* Charts: Date-wise Feed Usage Trend & Feed Consumption by Type */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 printable-chart-section">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs printable-chart-card">
              <div className="mb-4">
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Date-wise Feed Consumption Trend</h3>
              </div>
              <div className="h-64 w-full printable-chart-container">
                {feedConsumptionAnalytics.dateTrendChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={feedConsumptionAnalytics.dateTrendChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                        formatter={(val) => `${val} ${settings.weightUnit || 'Kilogram'}`}
                      />
                      <Area type="monotone" dataKey="Quantity" stroke="#f59e0b" fill="#fef3c7" name="Feed Quantity (Kilogram)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">No feed usage logs in selected period</div>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs printable-chart-card">
              <div className="mb-4">
                <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Feed Consumption by Feed Type</h3>
              </div>
              <div className="h-64 w-full flex items-center justify-center printable-chart-container">
                {feedConsumptionAnalytics.feedTypeChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={feedConsumptionAnalytics.feedTypeChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {feedConsumptionAnalytics.feedTypeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px' }} formatter={(val) => `${val} ${settings.weightUnit || 'Kilogram'}`} />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-400 font-medium">No consumption records</div>
                )}
              </div>
            </div>
          </div>

          {/* Printable Feed Consumption & Stock Report Tables */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-2xs printable-report space-y-6">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 border-b pb-2 flex items-center justify-between">
                <span>Feed Usage Log Records ({(filteredData.feedLogs || []).length})</span>
                <span className="text-xs text-slate-500 font-bold">Total: {feedConsumptionAnalytics.totalKg} {settings.weightUnit || 'Kilogram'} ({formatCurrency(feedConsumptionAnalytics.totalCost, settings.currency)})</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase text-[11px]">
                      <th className="p-2.5">Date</th>
                      <th className="p-2.5">Animal Tag & Name</th>
                      <th className="p-2.5">Feed Type</th>
                      <th className="p-2.5">Quantity Given</th>
                      <th className="p-2.5">Unit Price</th>
                      <th className="p-2.5">Total Cost</th>
                      <th className="p-2.5">Recorded By</th>
                      <th className="p-2.5">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {(filteredData.feedLogs || []).map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-semibold text-slate-800">{formatDate(r.date)}</td>
                        <td className="p-2.5 font-bold text-emerald-800">
                          <span className="font-mono">{r.animalTag}</span>
                          {r.animalName && <span className="ml-1 text-slate-700">({r.animalName})</span>}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {r.feedName}
                          </span>
                        </td>
                        <td className="p-2.5 font-extrabold text-emerald-700 font-mono text-sm">{r.quantityGiven} {formatUnit(r.unit || settings.weightUnit || 'Kilogram')}</td>
                        <td className="p-2.5 text-slate-600 font-semibold">{formatCurrency(r.unitPrice || 0, settings.currency)}</td>
                        <td className="p-2.5 font-bold text-rose-700 font-mono">{formatCurrency(r.totalCost || 0, settings.currency)}</td>
                        <td className="p-2.5 font-semibold text-slate-700">{r.recordedBy || 'Admin'}</td>
                        <td className="p-2.5 text-slate-400 italic text-[11px]">{r.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-800 mb-3 flex items-center space-x-1">
                  <Wheat className="w-4 h-4 text-amber-500" />
                  <span>Current Feed Stock ({filteredData.feedItems.length})</span>
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold border-b text-[11px]">
                        <th className="p-2">Item</th>
                        <th className="p-2">Category</th>
                        <th className="p-2">Stock Level</th>
                        <th className="p-2 text-right">Unit Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredData.feedItems.map((f, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-bold text-slate-800">{f.feedName || f.itemName}</td>
                          <td className="p-2 text-slate-600">{f.category}</td>
                          <td className="p-2 font-extrabold text-amber-700">{f.quantity} {formatUnit(f.unit || settings.weightUnit || 'Kilogram')}</td>
                          <td className="p-2 text-right font-semibold text-slate-700">{formatCurrency(f.purchasePrice || f.costPerUnit || 0, settings.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase text-slate-800 mb-3 flex items-center space-x-1">
                  <Package className="w-4 h-4 text-purple-600" />
                  <span>Equipment & Assets ({filteredData.inventory.length})</span>
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 font-bold border-b text-[11px]">
                        <th className="p-2">Asset</th>
                        <th className="p-2">Category</th>
                        <th className="p-2">Condition</th>
                        <th className="p-2 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredData.inventory.map((inv, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-bold text-slate-800">{inv.name}</td>
                          <td className="p-2 text-slate-600">{inv.category}</td>
                          <td className="p-2 font-semibold text-slate-700">{inv.condition || 'Good'}</td>
                          <td className="p-2 text-right font-bold text-emerald-700">{formatCurrency(inv.purchasePrice || 0, settings.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT 6: STAFF & CUSTOMERS --- */}
      {activeTab === 'operations' && (
        <div className="space-y-5">
          {renderPrintableReportHeader("Staff & Customer Directory Report")}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs printable-report">
              <h3 className="text-xs font-bold uppercase text-slate-800 mb-3 flex items-center space-x-1">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Employees ({filteredData.employees.length})</span>
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b text-[11px]">
                      <th className="p-2">Name</th>
                      <th className="p-2">Role</th>
                      <th className="p-2">Phone</th>
                      <th className="p-2 text-right">Salary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredData.employees.map((e, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-bold text-slate-800">{e.name}</td>
                        <td className="p-2 text-slate-600 font-semibold">{e.role}</td>
                        <td className="p-2 text-slate-500 font-mono">{e.phone}</td>
                        <td className="p-2 text-right font-bold text-emerald-700">{formatCurrency(e.salary || 0, settings.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs printable-report">
              <h3 className="text-xs font-bold uppercase text-slate-800 mb-3 flex items-center space-x-1">
                <UserCheck className="w-4 h-4 text-sky-600" />
                <span>Customers ({filteredData.customers.length})</span>
              </h3>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b text-[11px]">
                      <th className="p-2">Name</th>
                      <th className="p-2">Phone</th>
                      <th className="p-2 text-right">Rate / Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredData.customers.map((c, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-bold text-slate-800">{c.name}</td>
                        <td className="p-2 text-slate-500 font-mono">{c.phone || '-'}</td>
                        <td className="p-2 text-right font-bold text-emerald-700">{formatCurrency(c.ratePerLiter || 0, settings.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Professional Footer */}
      <div className="hidden print:block text-center text-[10px] text-slate-500 font-medium border-t border-slate-300 pt-3 mt-6">
        Report generated by {settings.farmName || 'Cattle ERP'} — Confident & Confidential Report | Printed on {new Date().toLocaleString()}
      </div>
    </div>
  );
};
