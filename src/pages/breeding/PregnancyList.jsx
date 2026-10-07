import React from 'react';
import { useFarm } from '../../context/FarmContext';
import { DataTable } from '../../components/common/DataTable';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { ExportButton } from '../../components/common/ExportButton';
import { formatDate, calculateDaysRemaining } from '../../utils/formatters';
import { Heart, AlertCircle, Calendar, CheckCircle2 } from 'lucide-react';

export const PregnancyList = () => {
  const { breedingRecords, animals, settings } = useFarm();
  const [filteredPreg, setFilteredPreg] = React.useState([]);

  // Filter only pregnant animals
  const pregnantRecords = React.useMemo(() => {
    return breedingRecords.filter(b => b.pregnancyStatus === 'Pregnant');
  }, [breedingRecords]);

  // Urgent delivery count (< 7 days)
  const urgentDeliveries = React.useMemo(() => {
    return pregnantRecords.filter(b => {
      const days = calculateDaysRemaining(b.expectedDeliveryDate);
      return days !== null && days >= 0 && days <= 7;
    });
  }, [pregnantRecords]);

  const columns = [
    {
      header: 'Female Animal',
      key: 'femaleTag',
      sortable: true,
      render: (row) => {
        const animal = animals.find(a => a.tagNo === row.femaleTag);
        return (
          <div>
            <div className="font-extrabold text-emerald-800 font-mono px-2 py-0.5 bg-emerald-50 rounded-md inline-block">
              {row.femaleTag}
            </div>
            {animal && <div className="text-[11px] text-slate-500 font-medium">{animal.name} ({animal.breed})</div>}
          </div>
        );
      }
    },
    {
      header: 'Breeding Date',
      key: 'breedingDate',
      sortable: true,
      render: (row) => <span className="text-slate-700">{formatDate(row.breedingDate)}</span>
    },
    {
      header: 'Expected Delivery Date',
      key: 'expectedDeliveryDate',
      sortable: true,
      render: (row) => <span className="font-bold text-purple-700">{formatDate(row.expectedDeliveryDate)}</span>
    },
    {
      header: 'Days Remaining',
      key: 'daysRemaining',
      render: (row) => {
        const days = calculateDaysRemaining(row.expectedDeliveryDate);
        if (days === null) return '-';
        if (days <= 7) {
          return (
            <span className="px-2.5 py-1 bg-rose-100 text-rose-800 text-xs font-extrabold rounded-lg animate-pulse flex items-center space-x-1 w-fit">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{days} Days (Urgent)</span>
            </span>
          );
        }
        return <span className="font-bold text-slate-800">{days} Days</span>;
      }
    },
    {
      header: 'Gestation Stage',
      key: 'stage',
      render: (row) => {
        const days = calculateDaysRemaining(row.expectedDeliveryDate);
        if (days === null) return 'In Gestation';
        if (days <= 30) return <span className="text-xs font-bold text-amber-700">Third Trimester (Late)</span>;
        if (days <= 120) return <span className="text-xs font-semibold text-slate-700">Second Trimester</span>;
        return <span className="text-xs text-slate-500">First Trimester</span>;
      }
    },
    {
      header: 'Notes',
      key: 'notes',
      render: (row) => <span className="text-xs text-slate-400 italic">{row.notes || '-'}</span>
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Pregnancy & Gestation Monitoring</h2>
          <p className="text-xs text-slate-500 font-medium">
            Track pregnant cows & buffaloes, calculate remaining gestation days, and receive delivery alerts
          </p>
        </div>

        <ExportButton
          data={filteredPreg.length > 0 ? filteredPreg : pregnantRecords}
          filename="pregnancy-monitoring.csv"
          columns={[
            { header: 'Female Animal Tag', key: 'femaleTag' },
            { header: 'Breeding Date', key: 'breedingDate' },
            { header: 'Expected Delivery Date', key: 'expectedDeliveryDate' },
            { header: 'Notes', key: 'notes' }
          ]}
        />
      </div>

      {/* Urgent Delivery Banner if any */}
      {urgentDeliveries.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0 animate-bounce" />
            <div>
              <h4 className="text-sm font-extrabold">Delivery Expected Within 7 Days!</h4>
              <p className="text-xs font-medium text-rose-700">
                {urgentDeliveries.map(u => u.femaleTag).join(', ')} are in late-stage gestation. Prepare calving stall and veterinary kit.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Pregnant Herd"
          value={pregnantRecords.length}
          subtext="Active gestations"
          icon={Heart}
          color="purple"
        />
        <StatCard
          title="Delivery Due < 7 Days"
          value={urgentDeliveries.length}
          subtext={urgentDeliveries.length > 0 ? "High priority" : "Zero due this week"}
          icon={AlertCircle}
          color={urgentDeliveries.length > 0 ? "rose" : "emerald"}
        />
        <StatCard
          title="Average Gestation Period"
          value="283 / 310 Days"
          subtext="Cow (~283d) / Buffalo (~310d)"
          icon={Calendar}
          color="blue"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={pregnantRecords}
        searchPlaceholder="Search female tag..."
        emptyMessage="No pregnant animals recorded"
        emptySubtext="When you record pregnant status in Breeding management, records appear here."
        onFilteredDataChange={setFilteredPreg}
      />
    </div>
  );
};
