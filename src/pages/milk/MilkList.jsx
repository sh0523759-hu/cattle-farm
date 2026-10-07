import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { DataTable } from '../../components/common/DataTable';
import { StatCard } from '../../components/common/StatCard';
import { MilkChart } from '../../components/dashboard/MilkChart';
import { MilkFormModal } from './MilkFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ExportButton } from '../../components/common/ExportButton';
import { formatDate } from '../../utils/formatters';
import { PlusCircle, Edit, Trash2, Milk, Calendar, Filter, FilterX, Sun, Moon, Hash, ShoppingCart, Layers } from 'lucide-react';

export const MilkList = () => {
  const { milkRecords, deleteMilkRecord, settings, animals, totalMilkProduced, totalMilkSold, availableMilk } = useFarm();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Filter States
  const [datePeriod, setDatePeriod] = useState('all'); // 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedAnimalTag, setSelectedAnimalTag] = useState('all');
  const [selectedAnimalType, setSelectedAnimalType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Map animals by tagNo for fast O(1) lookup
  const animalMap = useMemo(() => {
    const map = {};
    animals.forEach(a => {
      if (a.tagNo) {
        map[a.tagNo] = a;
        map[String(a.tagNo).trim().toUpperCase()] = a;
      }
      if (a.id) map[String(a.id)] = a;
      if (a._id) map[String(a._id)] = a;
    });
    return map;
  }, [animals]);

  // Milk-producing animals for dropdown (strictly exclude Sold Out or Sold animals)
  const milkProducingAnimals = useMemo(() => {
    return animals.filter(a => {
      const isFemale = a.gender === 'Female';
      const typeLower = (a.type || '').toLowerCase();
      const statusLower = (a.status || '').toLowerCase();
      const isMilkingType = !['bull', 'male calf'].includes(typeLower);
      const isAvailable = !['sold out', 'sold', 'deceased'].includes(statusLower);
      return isFemale && isMilkingType && isAvailable;
    });
  }, [animals]);

  // Available animal types from milking animals
  const availableTypes = useMemo(() => {
    const typesSet = new Set();
    milkProducingAnimals.forEach(a => {
      if (a.type) typesSet.add(a.type);
    });
    return Array.from(typesSet);
  }, [milkProducingAnimals]);

  // Filtered Milk Records matching ALL selected criteria together
  const filteredRecords = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    const monthStr = todayStr.slice(0, 7);

    return milkRecords.filter(r => {
      const animal = animalMap[r.animalTag];
      const animalType = animal?.type || '';
      const animalName = animal?.name || '';

      // 1. Date Period Filter
      if (datePeriod === 'today' && r.date !== todayStr) return false;
      if (datePeriod === 'yesterday' && r.date !== yesterdayStr) return false;
      if (datePeriod === 'this_week' && (r.date < weekStartStr || r.date > todayStr)) return false;
      if (datePeriod === 'this_month' && !r.date.startsWith(monthStr)) return false;
      if (datePeriod === 'custom') {
        if (customStartDate && r.date < customStartDate) return false;
        if (customEndDate && r.date > customEndDate) return false;
      }

      // 2. Specific Animal Filter
      if (selectedAnimalTag !== 'all' && r.animalTag !== selectedAnimalTag) return false;

      // 3. Animal Type Filter
      if (selectedAnimalType !== 'all' && animalType !== selectedAnimalType) return false;

      // 4. Free Text Search Term (Supports Tag No, ID, Last 3 Digits, Name, Type, Date, Notes)
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const cleanQuery = query.replace(/[^a-z0-9]/g, '');

        const tagStr = (r.animalTag || '').toLowerCase();
        const cleanTag = tagStr.replace(/[^a-z0-9]/g, '');

        const recIdStr = (r.id || r._id || '').toLowerCase();
        const cleanRecId = recIdStr.replace(/[^a-z0-9]/g, '');

        const animalIdStr = (animal?.id || animal?._id || '').toLowerCase();
        const cleanAnimalId = animalIdStr.replace(/[^a-z0-9]/g, '');

        const matchTag = tagStr.includes(query) || (cleanQuery && cleanTag.includes(cleanQuery));
        const matchRecId = recIdStr.includes(query) || (cleanQuery && cleanRecId.includes(cleanQuery));
        const matchAnimalId = animalIdStr.includes(query) || (cleanQuery && cleanAnimalId.includes(cleanQuery));
        const matchName = animalName.toLowerCase().includes(query);
        const matchType = animalType.toLowerCase().includes(query);
        const matchDate = (r.date || '').includes(query);
        const matchNotes = (r.notes || '').toLowerCase().includes(query);

        if (!matchTag && !matchRecId && !matchAnimalId && !matchName && !matchType && !matchDate && !matchNotes) {
          return false;
        }
      }

      return true;
    });
  }, [milkRecords, animalMap, datePeriod, customStartDate, customEndDate, selectedAnimalTag, selectedAnimalType, searchTerm]);

  // Dynamic Summary Cards updating according to active filters
  const kpiStats = useMemo(() => {
    let totalMilk = 0;
    let morningMilk = 0;
    let eveningMilk = 0;

    filteredRecords.forEach(r => {
      const morning = Number(r.morningQty ?? r.morning ?? 0);
      const evening = Number(r.eveningQty ?? r.evening ?? 0);
      const total = Number(r.totalQty ?? r.quantity ?? r.liters ?? (morning + evening));
      morningMilk += morning;
      eveningMilk += evening;
      totalMilk += total;
    });

    return {
      totalMilk: totalMilk.toFixed(1),
      morningMilk: morningMilk.toFixed(1),
      eveningMilk: eveningMilk.toFixed(1),
      recordsCount: filteredRecords.length
    };
  }, [filteredRecords]);

  // Table Columns
  const columns = [
    {
      header: 'Date',
      key: 'date',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-800">{formatDate(row.date)}</span>
    },
    {
      header: 'Animal Tag',
      key: 'animalTag',
      sortable: true,
      render: (row) => (
        <span className="font-extrabold text-emerald-800 font-mono px-2.5 py-1 bg-emerald-50 border border-emerald-200/60 rounded-lg text-xs">
          {row.animalTag || row.tagNo || '-'}
        </span>
      )
    },
    {
      header: 'Animal Name',
      key: 'animalName',
      sortable: true,
      render: (row) => {
        const tagKey = String(row.animalTag || row.tagNo || '').trim().toUpperCase();
        const animal = animalMap[row.animalTag] || animalMap[tagKey] || animalMap[row.animalId];
        return <span className="font-bold text-slate-800">{row.animalName || animal?.name || animal?.animalName || row.name || 'Unnamed'}</span>;
      }
    },
    {
      header: 'Animal Type',
      key: 'animalType',
      sortable: true,
      render: (row) => {
        const tagKey = String(row.animalTag || row.tagNo || '').trim().toUpperCase();
        const animal = animalMap[row.animalTag] || animalMap[tagKey] || animalMap[row.animalId];
        return (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md">
            {row.animalType || animal?.type || animal?.animalType || 'Cow'}
          </span>
        );
      }
    },
    {
      header: 'Morning Milk',
      key: 'morningQty',
      sortable: true,
      render: (row) => <span className="text-slate-700 font-medium">{row.morningQty ?? row.morning ?? 0} {settings.milkUnit}</span>
    },
    {
      header: 'Evening Milk',
      key: 'eveningQty',
      sortable: true,
      render: (row) => <span className="text-slate-700 font-medium">{row.eveningQty ?? row.evening ?? 0} {settings.milkUnit}</span>
    },
    {
      header: 'Total Milk',
      key: 'totalQty',
      sortable: true,
      render: (row) => {
        const morning = Number(row.morningQty ?? row.morning ?? 0);
        const evening = Number(row.eveningQty ?? row.evening ?? 0);
        const total = (row.totalQty !== undefined && row.totalQty !== null && row.totalQty !== '')
          ? row.totalQty
          : (row.quantity ?? row.liters ?? (morning + evening));
        return (
          <span className="font-extrabold text-emerald-700 text-sm">
            {total} {settings.milkUnit}
          </span>
        );
      }
    },
    {
      header: 'Notes',
      key: 'notes',
      render: (row) => <span className="text-slate-400 text-xs italic">{row.notes || '-'}</span>
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center space-x-1">
          <button
            onClick={() => {
              setRecordToEdit(row);
              setIsFormOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
            title="Edit record"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setRecordToDelete(row)}
            className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete record"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const resetAllFilters = () => {
    setDatePeriod('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedAnimalTag('all');
    setSelectedAnimalType('all');
    setSearchTerm('');
  };

  const isFilterActive = datePeriod !== 'all' || selectedAnimalTag !== 'all' || selectedAnimalType !== 'all' || searchTerm !== '' || customStartDate !== '' || customEndDate !== '';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Milk Production Management</h2>
          <p className="text-xs text-slate-500 font-medium">
            Track daily morning & evening milk yields per animal with real-time analytics
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <ExportButton
            data={filteredRecords}
            filename="milk-production.csv"
            columns={[
              { header: 'Date', key: 'date' },
              { header: 'Animal Tag', key: 'animalTag' },
              { header: 'Animal Name', accessor: (r) => animalMap[r.animalTag]?.name || '-' },
              { header: 'Animal Type', accessor: (r) => animalMap[r.animalTag]?.type || 'Cow' },
              { header: `Morning (${settings.milkUnit || 'Liter'})`, key: 'morningQty' },
              { header: `Evening (${settings.milkUnit || 'Liter'})`, key: 'eveningQty' },
              { header: `Total Milk (${settings.milkUnit || 'Liter'})`, accessor: (r) => r.totalQty || (Number(r.morningQty || 0) + Number(r.eveningQty || 0)) },
              { header: 'Notes', key: 'notes' }
            ]}
          />

          <button
            onClick={() => {
              setRecordToEdit(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Milk Yield</span>
          </button>
        </div>
      </div>

      {/* Dynamic Filter Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>Filter Milk Records</span>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Date Period Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Date Period
            </label>
            <select
              value={datePeriod}
              onChange={(e) => setDatePeriod(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:outline-hidden font-medium"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This Week (Last 7 Days)</option>
              <option value="this_month">This Month</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Animal Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Specific Animal
            </label>
            <select
              value={selectedAnimalTag}
              onChange={(e) => setSelectedAnimalTag(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:outline-hidden font-medium"
            >
              <option value="all">All Milking Animals</option>
              {milkProducingAnimals.map(a => (
                <option key={a.id || a._id || a.tagNo} value={a.tagNo}>
                  {a.tagNo} - {a.name || 'Unnamed'} ({a.type})
                </option>
              ))}
            </select>
          </div>

          {/* Animal Type Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Animal Type
            </label>
            <select
              value={selectedAnimalType}
              onChange={(e) => setSelectedAnimalType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:outline-hidden font-medium"
            >
              <option value="all">All Types (Cow, Buffalo, etc.)</option>
              {availableTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Search Keywords
            </label>
            <input
              type="text"
              placeholder="Tag, Name, Notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:outline-hidden font-medium"
            />
          </div>
        </div>

        {/* Custom Date Pickers (Shown if Custom Date Range selected) */}
        {datePeriod === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* Farm Milk Inventory Synchronization Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Milk Produced"
          value={`${totalMilkProduced.toLocaleString()} ${settings.milkUnit || 'Liter'}`}
          subtext="Cumulative farm yield"
          icon={Milk}
          color="emerald"
        />
        <StatCard
          title="Total Milk Sold"
          value={`${totalMilkSold.toLocaleString()} ${settings.milkUnit || 'Liter'}`}
          subtext="Deducted via sales invoices"
          icon={ShoppingCart}
          color="blue"
        />
        <StatCard
          title="Available Milk Stock"
          value={`${availableMilk.toLocaleString()} ${settings.milkUnit || 'Liter'}`}
          subtext={availableMilk > 0 ? "Available for new sales" : "Zero inventory remaining"}
          icon={Layers}
          color={availableMilk > 0 ? "purple" : "rose"}
        />
      </div>

      {/* Dynamic Summary KPI Cards (Updated in real-time by active filters) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Milk"
          value={`${kpiStats.totalMilk} ${settings.milkUnit}`}
          subtext={isFilterActive ? "Filtered Total Yield" : "Overall Recorded Milk"}
          icon={Milk}
          color="emerald"
        />
        <StatCard
          title="Morning Milk"
          value={`${kpiStats.morningMilk} ${settings.milkUnit}`}
          subtext="Morning Session Yield"
          icon={Sun}
          color="amber"
        />
        <StatCard
          title="Evening Milk"
          value={`${kpiStats.eveningMilk} ${settings.milkUnit}`}
          subtext="Evening Session Yield"
          icon={Moon}
          color="blue"
        />
        <StatCard
          title="Records Count"
          value={kpiStats.recordsCount}
          subtext="Total Matching Entries"
          icon={Hash}
          color="purple"
        />
      </div>

      {/* Production Chart (Filtered Dataset) */}
      <MilkChart records={filteredRecords} milkUnit={settings.milkUnit} selectedAnimal={selectedAnimalTag} />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredRecords}
        searchPlaceholder="Filter records table..."
        emptyMessage="No milk records found"
        emptySubtext={isFilterActive ? "No milk records match the selected filter criteria. Try resetting your filters." : "Record your first milking session using the button above."}
        initialSortColumn="date"
      />

      {/* Record Form Modal */}
      <MilkFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        recordToEdit={recordToEdit}
      />

      {/* Delete Confirmation */}
      {recordToDelete && (
        <ConfirmDialog
          isOpen={!!recordToDelete}
          onClose={() => setRecordToDelete(null)}
          onConfirm={() => {
            deleteMilkRecord(recordToDelete.id || recordToDelete._id);
            setRecordToDelete(null);
          }}
          title="Delete Milk Record"
          message={`Are you sure you want to delete the milk record for ${recordToDelete.animalTag} on ${recordToDelete.date}?`}
        />
      )}
    </div>
  );
};
