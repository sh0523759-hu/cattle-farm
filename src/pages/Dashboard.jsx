import React, { useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { StatCard } from '../components/common/StatCard';
import { MilkChart } from '../components/dashboard/MilkChart';
import { AlertList } from '../components/dashboard/AlertList';
import { formatCurrency } from '../utils/formatters';
import {
  Milk,
  Wheat,
  DollarSign,
  Layers
} from 'lucide-react';

export const Dashboard = () => {
  const {
    settings,
    animals,
    milkRecords,
    feedItems,
    income,
    expenses,
    alerts,
    totalMilkProduced,
    availableMilk
  } = useFarm();

  // Calculate essential KPI metrics
  const stats = useMemo(() => {
    const totalAnimals = animals.length;

    // Today's milk calculation
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayMilkTotal = milkRecords
      .filter(r => r.date === todayStr)
      .reduce((sum, r) => sum + Number(r.totalQty || 0), 0);

    // Feed stock total in Kg
    const totalFeedStockKg = feedItems.reduce((sum, f) => sum + Number(f.quantity || 0), 0);

    // Monthly profit calculation
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyIncome = income
      .filter(i => (i.date || '').startsWith(currentMonth))
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const monthlyExpenses = expenses
      .filter(e => (e.date || '').startsWith(currentMonth))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const netProfit = monthlyIncome - monthlyExpenses;

    return {
      totalAnimals,
      todayMilkTotal,
      totalFeedStockKg,
      netProfit
    };
  }, [animals, milkRecords, feedItems, income, expenses]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0b2519] to-[#15432e] text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Welcome Back</span>
          <h2 className="text-2xl font-extrabold tracking-tight mt-0.5">{settings.farmName || "My Cattle Farm"}</h2>
          <p className="text-xs text-slate-300 font-medium mt-1">
            Essential Cattle Operations & Daily Management Dashboard
          </p>
        </div>
      </div>

      {/* Key Summary Cards - 3 cards per row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Animals"
          value={stats.totalAnimals}
          subtext="Registered herd head count"
          icon={Milk}
          color="emerald"
        />
        <StatCard
          title="Total Milk Produced"
          value={`${totalMilkProduced.toLocaleString()} ${settings.milkUnit || 'Liter'}`}
          subtext="Cumulative farm yield"
          icon={Milk}
          color="blue"
        />
        <StatCard
          title="Available Milk Stock"
          value={`${availableMilk.toLocaleString()} ${settings.milkUnit || 'Liter'}`}
          subtext={availableMilk > 0 ? "Ready in stock for sales" : "Zero inventory remaining"}
          icon={Layers}
          color={availableMilk > 0 ? "purple" : "rose"}
        />
        <StatCard
          title="Today's Milk"
          value={`${stats.todayMilkTotal} ${settings.milkUnit || 'Liter'}`}
          subtext="Daily yield recorded"
          icon={Milk}
          color="blue"
        />
        <StatCard
          title="Feed Stock"
          value={`${stats.totalFeedStockKg.toLocaleString()} ${settings.weightUnit || 'Kilogram'}`}
          subtext="Available feed inventory"
          icon={Wheat}
          color="amber"
        />
        <StatCard
          title="Monthly Profit"
          value={formatCurrency(stats.netProfit, settings.currency)}
          subtext="Net income margin"
          trend={stats.netProfit >= 0 ? "up" : "down"}
          trendValue={stats.netProfit >= 0 ? "Positive" : "Deficit"}
          icon={DollarSign}
          color={stats.netProfit >= 0 ? "emerald" : "rose"}
        />
      </div>

      {/* Milk Production Trend Chart & Alerts & Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-full">
          <MilkChart records={milkRecords} milkUnit={settings.milkUnit} />
        </div>
        <div className="lg:col-span-1 h-full">
          <AlertList alerts={alerts} />
        </div>
      </div>
    </div>
  );
};
