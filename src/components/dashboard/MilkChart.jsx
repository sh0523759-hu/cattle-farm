import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Milk, Calendar, Filter, Sparkles } from 'lucide-react';
import { useFarm } from '../../context/FarmContext';

export const MilkChart = ({
  records: externalRecords,
  milkUnit: externalMilkUnit,
  title = "Milk Production Trend",
  subtitle = "Daily morning & evening yield logs",
  selectedAnimal: externalSelectedAnimal,
  showAnimalFilter = true,
  showRangeFilter = true,
  className = ""
}) => {
  const farm = useFarm();
  const rawMilkUnit = externalMilkUnit || farm?.settings?.milkUnit || 'Liter';
  const milkUnit = rawMilkUnit === 'L' || rawMilkUnit?.toLowerCase() === 'liter' ? 'Liter' : rawMilkUnit;
  const records = externalRecords || farm?.milkRecords || [];
  const allAnimals = farm?.animals || [];

  // Internal Filter States
  const [range, setRange] = useState('7days'); // '7days' | '30days' | 'monthly' | 'custom' | 'all'
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [internalAnimal, setInternalAnimal] = useState('all');

  // Active animal filter (external prop takes precedence)
  const activeAnimal = externalSelectedAnimal !== undefined ? externalSelectedAnimal : internalAnimal;

  // Extract unique milking animals from records
  const availableAnimals = useMemo(() => {
    const map = new Map();
    (records || []).forEach(r => {
      if (r.animalTag && !map.has(r.animalTag)) {
        const match = allAnimals.find(a => a.tagNo === r.animalTag);
        map.set(r.animalTag, {
          tagNo: r.animalTag,
          name: match?.name || r.animalName || r.animalTag,
          type: match?.type || r.animalType || 'Cow'
        });
      }
    });
    return Array.from(map.values());
  }, [records, allAnimals]);

  // Filter records by selected animal
  const animalFilteredRecords = useMemo(() => {
    if (!records || !records.length) return [];
    if (!activeAnimal || activeAnimal === 'all') return records;
    return records.filter(r => r.animalTag === activeAnimal);
  }, [records, activeAnimal]);

  // Helper to format short date string for X-axis labels
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.length >= 10) {
      const parts = dateStr.slice(0, 10).split('-');
      if (parts.length === 3) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIdx = parseInt(parts[1], 10) - 1;
        const monthName = months[monthIdx] || parts[1];
        return `${monthName} ${parseInt(parts[2], 10)}`;
      }
    }
    return dateStr;
  };

  // Build chart dataset according to selected range
  const chartData = useMemo(() => {
    if (!animalFilteredRecords || !animalFilteredRecords.length) return [];

    // Aggregate by calendar date (YYYY-MM-DD)
    const dailyMap = {};
    animalFilteredRecords.forEach(r => {
      if (!r || !r.date) return;
      const dateStr = String(r.date).trim();
      const cleanDate = dateStr.length >= 10 ? dateStr.slice(0, 10) : dateStr;

      const morning = Number(r.morningQty || 0);
      const evening = Number(r.eveningQty || 0);
      let total = Number(r.totalQty);
      if (isNaN(total) || total <= 0) {
        total = morning + evening;
      }

      if (!dailyMap[cleanDate]) {
        dailyMap[cleanDate] = { morning: 0, evening: 0, total: 0, count: 0 };
      }
      dailyMap[cleanDate].morning += morning;
      dailyMap[cleanDate].evening += evening;
      dailyMap[cleanDate].total += total;
      dailyMap[cleanDate].count += 1;
    });

    const sortedDates = Object.keys(dailyMap).sort();
    if (!sortedDates.length) return [];

    // Mode 1: MONTHLY AGGREGATION
    if (range === 'monthly') {
      const monthMap = {};
      sortedDates.forEach(d => {
        const monthKey = d.slice(0, 7); // YYYY-MM
        if (!monthMap[monthKey]) {
          monthMap[monthKey] = { morning: 0, evening: 0, total: 0, daysCount: 0 };
        }
        monthMap[monthKey].morning += dailyMap[d].morning;
        monthMap[monthKey].evening += dailyMap[d].evening;
        monthMap[monthKey].total += dailyMap[d].total;
        monthMap[monthKey].daysCount += 1;
      });

      return Object.keys(monthMap).sort().map(m => {
        const [year, month] = m.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthLabel = monthNames[parseInt(month, 10) - 1] ? `${monthNames[parseInt(month, 10) - 1]} ${year}` : m;

        return {
          date: monthLabel,
          fullDate: m,
          morning: Number(monthMap[m].morning.toFixed(1)),
          evening: Number(monthMap[m].evening.toFixed(1)),
          total: Number(monthMap[m].total.toFixed(1))
        };
      });
    }

    // Mode 2: CUSTOM DATE RANGE
    if (range === 'custom') {
      let filteredDates = sortedDates;
      if (customStart) {
        filteredDates = filteredDates.filter(d => d >= customStart);
      }
      if (customEnd) {
        filteredDates = filteredDates.filter(d => d <= customEnd);
      }
      return filteredDates.map(d => ({
        date: formatDateLabel(d),
        fullDate: d,
        morning: Number(dailyMap[d].morning.toFixed(1)),
        evening: Number(dailyMap[d].evening.toFixed(1)),
        total: Number(dailyMap[d].total.toFixed(1))
      }));
    }

    // Mode 3: 7 DAYS (Last 7 calendar days up to latest record date or today)
    if (range === '7days') {
      const latestDateStr = sortedDates[sortedDates.length - 1];
      const latestDate = new Date(latestDateStr);
      const dayList = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(latestDate);
        d.setDate(d.getDate() - i);
        dayList.push(d.toISOString().slice(0, 10));
      }

      return dayList.map(d => {
        const entry = dailyMap[d] || { morning: 0, evening: 0, total: 0 };
        return {
          date: formatDateLabel(d),
          fullDate: d,
          morning: Number(entry.morning.toFixed(1)),
          evening: Number(entry.evening.toFixed(1)),
          total: Number(entry.total.toFixed(1))
        };
      });
    }

    // Mode 4: 30 DAYS (Last 30 calendar days)
    if (range === '30days') {
      const latestDateStr = sortedDates[sortedDates.length - 1];
      const latestDate = new Date(latestDateStr);
      const dayList = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(latestDate);
        d.setDate(d.getDate() - i);
        dayList.push(d.toISOString().slice(0, 10));
      }

      return dayList.map(d => {
        const entry = dailyMap[d] || { morning: 0, evening: 0, total: 0 };
        return {
          date: formatDateLabel(d),
          fullDate: d,
          morning: Number(entry.morning.toFixed(1)),
          evening: Number(entry.evening.toFixed(1)),
          total: Number(entry.total.toFixed(1))
        };
      });
    }

    // Mode 5: ALL TIME
    return sortedDates.map(d => ({
      date: formatDateLabel(d),
      fullDate: d,
      morning: Number(dailyMap[d].morning.toFixed(1)),
      evening: Number(dailyMap[d].evening.toFixed(1)),
      total: Number(dailyMap[d].total.toFixed(1))
    }));
  }, [animalFilteredRecords, range, customStart, customEnd]);

  // Overall KPI summary for current view
  const kpis = useMemo(() => {
    let total = 0;
    let morning = 0;
    let evening = 0;
    chartData.forEach(item => {
      total += Number(item.total || 0);
      morning += Number(item.morning || 0);
      evening += Number(item.evening || 0);
    });
    const daysWithYield = chartData.filter(i => i.total > 0).length || 1;
    const avgPerDay = total / daysWithYield;
    return {
      total: total.toFixed(1),
      morning: morning.toFixed(1),
      evening: evening.toFixed(1),
      avg: avgPerDay.toFixed(1)
    };
  }, [chartData]);

  return (
    <div className={`bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between ${className}`}>
      {/* Top Header Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">{title}</h3>
            {activeAnimal !== 'all' && (
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-[11px] font-bold">
                {activeAnimal}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {subtitle} • Total in view: <strong className="text-emerald-700">{kpis.total} {milkUnit}</strong> (Avg: <strong className="text-sky-700">{kpis.avg} {milkUnit}/day</strong>)
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Animal Dropdown Filter (shown when not forced from outside) */}
          {showAnimalFilter && externalSelectedAnimal === undefined && availableAnimals.length > 1 && (
            <div className="flex items-center space-x-1">
              <select
                value={internalAnimal}
                onChange={(e) => setInternalAnimal(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">All Animals</option>
                {availableAnimals.map(a => (
                  <option key={a.tagNo} value={a.tagNo}>
                    {a.tagNo} - {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Range Selector */}
          {showRangeFilter && (
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setRange('7days')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  range === '7days' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                7 Days
              </button>
              <button
                type="button"
                onClick={() => setRange('30days')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  range === '30days' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                30 Days
              </button>
              <button
                type="button"
                onClick={() => setRange('monthly')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  range === 'monthly' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setRange('custom')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  range === 'custom' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Custom
              </button>
              <button
                type="button"
                onClick={() => setRange('all')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  range === 'all' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All Time
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Custom Date Inputs (when 'custom' is active) */}
      {range === 'custom' && showRangeFilter && (
        <div className="flex flex-wrap items-center gap-2 mb-3 px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-bold text-slate-600 text-[11px] uppercase">Custom Period:</span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-700"
          />
          <span className="text-slate-400 font-bold">to</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 font-medium text-slate-700"
          />
          {(customStart || customEnd) && (
            <button
              type="button"
              onClick={() => { setCustomStart(''); setCustomEnd(''); }}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 ml-auto cursor-pointer"
            >
              Clear Range
            </button>
          )}
        </div>
      )}

      {/* Chart Canvas Area */}
      <div className="h-72 w-full min-h-[280px]">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="totalMilkColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="morningMilkColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="eveningMilkColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} unit={` ${milkUnit}`} />

              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px', padding: '10px 14px' }}
                formatter={(value, name) => [`${value} ${milkUnit}`, name]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0] && payload[0].payload && payload[0].payload.fullDate) {
                    return `Date: ${payload[0].payload.fullDate}`;
                  }
                  return label;
                }}
              />

              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

              <Area
                type="monotone"
                dataKey="morning"
                name="Morning Session"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#morningMilkColor)"
              />
              <Area
                type="monotone"
                dataKey="evening"
                name="Evening Session"
                stroke="#0284c7"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#eveningMilkColor)"
              />
              <Area
                type="monotone"
                dataKey="total"
                name="Total Milk"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#totalMilkColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Milk className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">No milk production data available</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              There are no recorded milking sessions matching the selected date range or animal filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
