import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { DataTable } from '../../components/common/DataTable';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { ExportButton } from '../../components/common/ExportButton';
import { formatDate, formatCurrency } from '../../utils/formatters';
import {
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Landmark,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign
} from 'lucide-react';

export const CashFlow = () => {
  const { income = [], expenses = [], accounts = [], getAccountBalance, settings } = useFarm();

  // Filter States
  const [datePeriod, setDatePeriod] = useState('all');
  const [flowType, setFlowType] = useState('all'); // all, in, out
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Combine income and expenses into a single unified stream
  const combinedTransactions = useMemo(() => {
    const list = [];

    income.forEach((inc) => {
      list.push({
        id: `INC-${inc.id || inc._id}`,
        originalId: inc.id || inc._id,
        rawDate: inc.date || '1970-01-01',
        date: inc.date,
        type: 'inflow',
        typeLabel: 'Money In',
        category: inc.category || 'Income',
        title: inc.customer ? `${inc.category} (${inc.customer})` : inc.category,
        amount: Number(inc.amount || 0),
        paymentMethod: inc.paymentMethod || 'Cash',
        accountName: inc.accountName || (inc.paymentMethod === 'Cash' ? 'Cash in Hand' : 'Bank Account'),
        description: inc.description || inc.notes || '',
        reference: inc.saleId || inc.invoiceNo ? 'Auto from Sale' : 'Direct Revenue'
      });
    });

    expenses.forEach((exp) => {
      list.push({
        id: `EXP-${exp.id || exp._id}`,
        originalId: exp.id || exp._id,
        rawDate: exp.date || '1970-01-01',
        date: exp.date,
        type: 'outflow',
        typeLabel: 'Money Out',
        category: exp.category || 'Expense',
        title: exp.category || 'Operational Cost',
        amount: Number(exp.amount || 0),
        paymentMethod: exp.paymentMethod || 'Cash',
        accountName: exp.accountName || (exp.paymentMethod === 'Cash' ? 'Cash in Hand' : 'Bank Account'),
        description: exp.description || exp.notes || '',
        reference: exp.payrollId ? 'Auto from Payroll' : 'Farm Expense'
      });
    });

    // Sort newest date first
    return list.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
  }, [income, expenses]);

  // Apply Filters
  const filteredTransactions = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    const monthStr = todayStr.slice(0, 7);

    return combinedTransactions.filter((item) => {
      // 1. Date Filter
      if (datePeriod === 'today' && item.date !== todayStr) return false;
      if (datePeriod === 'yesterday' && item.date !== yesterdayStr) return false;
      if (datePeriod === 'this_week' && (item.date < weekStartStr || item.date > todayStr)) return false;
      if (datePeriod === 'this_month' && !(item.date || '').startsWith(monthStr)) return false;

      // 2. Flow Type Filter
      if (flowType === 'in' && item.type !== 'inflow') return false;
      if (flowType === 'out' && item.type !== 'outflow') return false;

      // 3. Payment Method Filter
      if (paymentMethodFilter !== 'all' && item.paymentMethod !== paymentMethodFilter) return false;

      // 4. Search Filter
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const cat = (item.category || '').toLowerCase();
        const title = (item.title || '').toLowerCase();
        const desc = (item.description || '').toLowerCase();
        const acc = (item.accountName || '').toLowerCase();
        const method = (item.paymentMethod || '').toLowerCase();

        if (
          !cat.includes(query) &&
          !title.includes(query) &&
          !desc.includes(query) &&
          !acc.includes(query) &&
          !method.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [combinedTransactions, datePeriod, flowType, paymentMethodFilter, searchTerm]);

  // KPI Calculations
  const kpis = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === 'inflow') totalIn += t.amount;
      else if (t.type === 'outflow') totalOut += t.amount;
    });

    const netFlow = totalIn - totalOut;

    // Total liquid balance across all active accounts
    const totalLiquid = accounts.reduce((sum, acc) => sum + getAccountBalance(acc), 0);

    return { totalIn, totalOut, netFlow, totalLiquid };
  }, [filteredTransactions, accounts, getAccountBalance]);

  // Unique payment methods for filter
  const paymentMethods = useMemo(() => {
    const set = new Set();
    combinedTransactions.forEach((t) => {
      if (t.paymentMethod) set.add(t.paymentMethod);
    });
    return Array.from(set);
  }, [combinedTransactions]);

  const columns = [
    {
      header: 'Date',
      key: 'date',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-slate-800 text-xs">{formatDate(row.date)}</span>
      )
    },
    {
      header: 'Flow Type',
      key: 'type',
      sortable: true,
      render: (row) =>
        row.type === 'inflow' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Money In</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Money Out</span>
          </span>
        )
    },
    {
      header: 'Category / Source',
      key: 'category',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 text-xs">{row.title}</span>
          {row.reference && (
            <div className="text-[10px] text-slate-400 font-medium">{row.reference}</div>
          )}
        </div>
      )
    },
    {
      header: 'Account / Method',
      key: 'paymentMethod',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
          {row.paymentMethod?.toLowerCase().includes('bank') ? (
            <Landmark className="w-3.5 h-3.5 text-blue-600" />
          ) : (
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
          )}
          <span>{row.paymentMethod}</span>
        </div>
      )
    },
    {
      header: 'Notes / Details',
      key: 'description',
      render: (row) => (
        <span className="text-xs text-slate-500 italic max-w-xs truncate block">
          {row.description || '-'}
        </span>
      )
    },
    {
      header: 'Amount',
      key: 'amount',
      sortable: true,
      render: (row) => (
        <span
          className={`font-black text-sm ${
            row.type === 'inflow' ? 'text-emerald-700' : 'text-rose-600'
          }`}
        >
          {row.type === 'inflow' ? '+' : '-'} {formatCurrency(row.amount, settings.currency)}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Cash Flow Ledger</h2>
          <p className="text-xs text-slate-500 font-medium">
            Unified money-in and money-out statement combining sales, farm expenses, and payroll
          </p>
        </div>

        <ExportButton
          data={filteredTransactions}
          filename="cash-flow.csv"
          columns={[
            { header: 'Date', key: 'date' },
            { header: 'Flow Type', key: 'typeLabel' },
            { header: 'Category', key: 'category' },
            { header: 'Particulars / Description', key: 'title' },
            { header: `Amount (${settings.currency})`, accessor: (r) => `${r.type === 'inflow' ? '+' : '-'}${r.amount}` },
            { header: 'Payment Method', key: 'paymentMethod' },
            { header: 'Account', key: 'accountName' },
            { header: 'Reference', key: 'reference' },
            { header: 'Notes', key: 'description' }
          ]}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Cash In (Inflow)"
          value={formatCurrency(kpis.totalIn, settings.currency)}
          subtext="Revenue & customer payments"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Total Cash Out (Outflow)"
          value={formatCurrency(kpis.totalOut, settings.currency)}
          subtext="Farm expenses & staff salaries"
          icon={TrendingDown}
          color="rose"
        />
        <StatCard
          title="Net Cash Flow"
          value={formatCurrency(kpis.netFlow, settings.currency)}
          subtext={kpis.netFlow >= 0 ? 'Surplus cash flow' : 'Cash deficit'}
          trend={kpis.netFlow >= 0 ? 'up' : 'down'}
          icon={ArrowLeftRight}
          color={kpis.netFlow >= 0 ? 'emerald' : 'rose'}
        />
        <StatCard
          title="Total Liquid Funds"
          value={formatCurrency(kpis.totalLiquid, settings.currency)}
          subtext="Live balance across all accounts"
          icon={Landmark}
          color="blue"
        />
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Period Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'this_week', label: 'Last 7 Days' },
            { id: 'this_month', label: 'This Month' }
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setDatePeriod(p.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
                datePeriod === p.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Type & Method Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Flow Type Toggle */}
          <div className="flex rounded-xl border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
            <button
              onClick={() => setFlowType('all')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                flowType === 'all' ? 'bg-white shadow-xs text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFlowType('in')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                flowType === 'in' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              + Inflow
            </button>
            <button
              onClick={() => setFlowType('out')}
              className={`px-2.5 py-1 rounded-lg cursor-pointer transition-all ${
                flowType === 'out' ? 'bg-rose-600 text-white font-bold shadow-xs' : 'text-slate-500 hover:text-rose-700'
              }`}
            >
              - Outflow
            </button>
          </div>

          {/* Payment Method Select */}
          <select
            value={paymentMethodFilter}
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 font-medium focus:outline-emerald-600"
          >
            <option value="all">All Payment Methods</option>
            {paymentMethods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <DataTable
        columns={columns}
        data={filteredTransactions}
        searchPlaceholder="Search category, account, notes..."
        emptyMessage="No cash flow transactions recorded"
        initialSortColumn="date"
      />
    </div>
  );
};
