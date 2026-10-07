import React, { useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { StatCard } from '../../components/common/StatCard';
import { FinancialChart } from '../../components/dashboard/FinancialChart';
import { ExportButton } from '../../components/common/ExportButton';
import { formatCurrency } from '../../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieIcon,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Minus,
  Equal,
  Landmark,
  FileSpreadsheet
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export const ProfitLoss = () => {
  const { income = [], expenses = [], settings } = useFarm();

  const financeSummary = useMemo(() => {
    let totalInc = 0;
    let milkSales = 0;
    let animalSales = 0;
    let otherIncome = 0;

    income.forEach((i) => {
      const amt = Number(i.amount || 0);
      totalInc += amt;
      const cat = (i.category || '').toLowerCase();
      if (cat.includes('milk')) milkSales += amt;
      else if (cat.includes('animal') || cat.includes('calf') || cat.includes('cattle')) animalSales += amt;
      else otherIncome += amt;
    });

    let totalExp = 0;
    let feedExp = 0;
    let salaryExp = 0;
    let vetExp = 0;
    let otherExp = 0;

    const catMap = {};
    expenses.forEach((e) => {
      const amt = Number(e.amount || 0);
      totalExp += amt;
      const cat = e.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + amt;

      const lower = cat.toLowerCase();
      if (lower.includes('feed') || lower.includes('fodder') || lower.includes('silage')) feedExp += amt;
      else if (lower.includes('salary') || lower.includes('employee') || lower.includes('payroll')) salaryExp += amt;
      else if (lower.includes('medicine') || lower.includes('vet') || lower.includes('vaccin')) vetExp += amt;
      else otherExp += amt;
    });

    const netProfit = totalInc - totalExp;
    const profitMargin = totalInc > 0 ? ((netProfit / totalInc) * 100).toFixed(1) : '0';

    const colors = ['#10b981', '#f43f5e', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];
    const pieData = Object.keys(catMap).map((cat, i) => ({
      name: cat,
      value: catMap[cat],
      color: colors[i % colors.length]
    }));

    return {
      totalInc,
      milkSales,
      animalSales,
      otherIncome,
      totalExp,
      feedExp,
      salaryExp,
      vetExp,
      otherExp,
      netProfit,
      profitMargin,
      pieData
    };
  }, [income, expenses]);

  const pnlExportData = useMemo(() => {
    const rows = [];
    rows.push({ section: 'Revenue', item: 'Milk Sales Revenue', amount: financeSummary.milkSales });
    rows.push({ section: 'Revenue', item: 'Animal & Calf Sales', amount: financeSummary.animalSales });
    rows.push({ section: 'Revenue', item: 'Other Farm Income', amount: financeSummary.otherIncome });
    rows.push({ section: 'Revenue', item: 'TOTAL REVENUE', amount: financeSummary.totalInc });

    rows.push({ section: 'Expenses', item: 'Feed & Fodder Cost', amount: financeSummary.feedExp });
    rows.push({ section: 'Expenses', item: 'Staff Salaries & Payroll', amount: financeSummary.salaryExp });
    rows.push({ section: 'Expenses', item: 'Veterinary & Medicine Cost', amount: financeSummary.vetExp });
    rows.push({ section: 'Expenses', item: 'Other Operating Expenses', amount: financeSummary.otherExp });
    rows.push({ section: 'Expenses', item: 'TOTAL EXPENSES', amount: financeSummary.totalExp });

    rows.push({ section: 'Summary', item: 'NET PROFIT / LOSS', amount: financeSummary.netProfit });
    rows.push({ section: 'Summary', item: 'NET PROFIT MARGIN (%)', amount: `${financeSummary.profitMargin}%` });
    return rows;
  }, [financeSummary]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Financial Profit & Loss Statement</h2>
          <p className="text-xs text-slate-500 font-medium">
            Complete farm P&L equation: Total Income - Total Expenses = Net Profit/Loss (including staff payroll & sales)
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto no-print">
          <ExportButton
            data={pnlExportData}
            filename="profit-loss.csv"
            columns={[
              { header: 'Statement Section', key: 'section' },
              { header: 'Line Item', key: 'item' },
              { header: `Amount (${settings.currency})`, key: 'amount' }
            ]}
          />
        </div>
      </div>

      {/* Visual Profit & Loss Equation Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-3">
          Executive Financial Equation
        </span>
        <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-3">
          {/* Income */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">Total Income</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-emerald-700 mt-1">
              +{formatCurrency(financeSummary.totalInc, settings.currency)}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Sales & Revenue</span>
          </div>

          {/* Minus Operator */}
          <div className="hidden md:flex justify-center text-slate-300">
            <Minus className="w-6 h-6" />
          </div>

          {/* Expenses */}
          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800">Total Expenses</span>
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl font-black text-rose-600 mt-1">
              -{formatCurrency(financeSummary.totalExp, settings.currency)}
            </div>
            <span className="text-[11px] text-rose-600 font-medium">Farm Costs & Salaries</span>
          </div>

          {/* Equals Operator */}
          <div className="hidden md:flex justify-center text-slate-300">
            <Equal className="w-6 h-6" />
          </div>

          {/* Net Profit / Loss */}
          <div className={`p-4 rounded-xl border ${
            financeSummary.netProfit >= 0
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
              : 'bg-rose-600 text-white border-rose-700 shadow-sm'
          }`}>
            <div className="flex items-center justify-between text-white/90">
              <span className="text-xs font-extrabold uppercase tracking-wide">
                {financeSummary.netProfit >= 0 ? 'Net Profit' : 'Net Loss'}
              </span>
              {financeSummary.netProfit >= 0 ? (
                <CheckCircle2 className="w-4 h-4 text-white" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="text-2xl font-black text-white mt-1">
              {formatCurrency(financeSummary.netProfit, settings.currency)}
            </div>
            <span className="text-[11px] text-white/80 font-medium">
              Margin: {financeSummary.profitMargin}%
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Gross Revenue"
          value={formatCurrency(financeSummary.totalInc, settings.currency)}
          subtext="Milk, animals & other"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(financeSummary.totalExp, settings.currency)}
          subtext="Operational + payroll"
          icon={TrendingDown}
          color="rose"
        />
        <StatCard
          title="Net Operating Profit"
          value={formatCurrency(financeSummary.netProfit, settings.currency)}
          subtext={financeSummary.netProfit >= 0 ? "Surplus operational profit" : "Operating cash loss"}
          trend={financeSummary.netProfit >= 0 ? "up" : "down"}
          trendValue={`${financeSummary.profitMargin}%`}
          icon={DollarSign}
          color={financeSummary.netProfit >= 0 ? "emerald" : "rose"}
        />
        <StatCard
          title="Net Profit Margin"
          value={`${financeSummary.profitMargin}%`}
          subtext="Return on gross revenue"
          icon={PieIcon}
          color="blue"
        />
      </div>

      {/* Detailed Revenue & Expense Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Streams */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Income Breakdown</h3>
              <p className="text-xs text-slate-400 font-medium">Revenue sources performance</p>
            </div>
            <span className="font-black text-emerald-700 text-sm">
              +{formatCurrency(financeSummary.totalInc, settings.currency)}
            </span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Milk Production Sales', amount: financeSummary.milkSales, color: 'bg-emerald-500' },
              { label: 'Animal & Calves Sales', amount: financeSummary.animalSales, color: 'bg-blue-500' },
              { label: 'Other Farm Income', amount: financeSummary.otherIncome, color: 'bg-purple-500' }
            ].map((item) => {
              const pct = financeSummary.totalInc > 0 ? ((item.amount / financeSummary.totalInc) * 100).toFixed(1) : 0;
              return (
                <div key={item.label} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-bold text-slate-700">{item.label}</span>
                    <span className="font-extrabold text-slate-900">{formatCurrency(item.amount, settings.currency)}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className={`${item.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-right text-[10px] text-slate-400 font-semibold mt-1">{pct}% of revenue</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense Streams */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">Expense Breakdown</h3>
              <p className="text-xs text-slate-400 font-medium">Cost distribution across farm operations</p>
            </div>
            <span className="font-black text-rose-600 text-sm">
              -{formatCurrency(financeSummary.totalExp, settings.currency)}
            </span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Fodder, Silage & Feed', amount: financeSummary.feedExp, color: 'bg-amber-500' },
              { label: 'Staff Salaries & Payroll', amount: financeSummary.salaryExp, color: 'bg-purple-500' },
              { label: 'Veterinary, Medicines & Care', amount: financeSummary.vetExp, color: 'bg-rose-500' },
              { label: 'Utilities, Maintenance & Other', amount: financeSummary.otherExp, color: 'bg-slate-500' }
            ].map((item) => {
              const pct = financeSummary.totalExp > 0 ? ((item.amount / financeSummary.totalExp) * 100).toFixed(1) : 0;
              return (
                <div key={item.label} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-bold text-slate-700">{item.label}</span>
                    <span className="font-extrabold text-slate-900">{formatCurrency(item.amount, settings.currency)}</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className={`${item.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="text-right text-[10px] text-slate-400 font-semibold mt-1">{pct}% of costs</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FinancialChart income={income} expenses={expenses} currency={settings.currency} />

        {/* Expense Breakdown Donut */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Expense Category Distribution</h3>
            <p className="text-xs text-slate-400 font-medium">Cost allocation breakdown</p>
          </div>

          <div className="h-64 w-full relative flex items-center justify-center">
            {financeSummary.pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={financeSummary.pieData}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {financeSummary.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    formatter={(val) => formatCurrency(val, settings.currency)}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No expense records available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
