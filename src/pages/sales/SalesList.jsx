import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { DataTable } from '../../components/common/DataTable';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { SaleFormModal } from '../../components/sales/SaleFormModal';
import { CreditPaymentModal } from '../../components/sales/CreditPaymentModal';
import { SalesReceiptModal } from '../../components/sales/SalesReceiptModal';
import { ExportButton } from '../../components/common/ExportButton';
import { formatDate, formatCurrency } from '../../utils/formatters';
import {
  ShoppingCart,
  PlusCircle,
  Printer,
  DollarSign,
  Trash2,
  Filter,
  FilterX,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Milk,
  Layers
} from 'lucide-react';

export const SalesList = () => {
  const { sales = [], deleteSale, settings, totalMilkSold, availableMilk } = useFarm();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState(null);
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState(null);
  const [saleToDelete, setSaleToDelete] = useState(null);

  // Filter States
  const [datePeriod, setDatePeriod] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtered Sales List
  const filteredSales = useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);
    const weekStartStr = weekStart.toISOString().slice(0, 10);

    const monthStr = todayStr.slice(0, 7);

    return sales.filter(s => {
      // 1. Date Period Filter
      if (datePeriod === 'today' && s.date !== todayStr) return false;
      if (datePeriod === 'yesterday' && s.date !== yesterdayStr) return false;
      if (datePeriod === 'this_week' && (s.date < weekStartStr || s.date > todayStr)) return false;
      if (datePeriod === 'this_month' && !(s.date || '').startsWith(monthStr)) return false;

      // 2. Category Filter
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;

      // 3. Payment Status Filter
      if (statusFilter !== 'all' && s.paymentStatus !== statusFilter) return false;

      // 4. Search Keyword Filter
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const invStr = (s.invoiceNo || '').toLowerCase();
        const custName = (s.customerName || '').toLowerCase();
        const custPhone = (s.customerPhone || '').toLowerCase();
        const notes = (s.notes || '').toLowerCase();

        if (!invStr.includes(query) && !custName.includes(query) && !custPhone.includes(query) && !notes.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [sales, datePeriod, categoryFilter, statusFilter, searchTerm]);

  // KPI Calculations
  const kpiStats = useMemo(() => {
    let totalSales = 0;
    let totalPaid = 0;
    let totalRemaining = 0;

    filteredSales.forEach(s => {
      totalSales += Number(s.totalAmount || 0);
      totalPaid += Number(s.paidAmount || 0);
      totalRemaining += Number(s.remainingAmount || 0);
    });

    return {
      totalSales,
      totalPaid,
      totalRemaining,
      count: filteredSales.length
    };
  }, [filteredSales]);

  // Handle New Sale Callback (Auto-opens receipt preview)
  const handleSaleCreated = (newSale) => {
    if (newSale) {
      setSelectedSaleForReceipt(newSale);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Paid</span>;
      case 'Partial':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200"><Clock className="w-3 h-3 mr-1" /> Partial</span>;
      case 'Credit':
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200"><AlertCircle className="w-3 h-3 mr-1" /> Credit</span>;
    }
  };

  const columns = [
    {
      header: 'Invoice No',
      key: 'invoiceNo',
      sortable: true,
      render: (row) => (
        <span className="font-extrabold text-slate-800 font-mono text-xs px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg">
          {row.invoiceNo}
        </span>
      )
    },
    {
      header: 'Date',
      key: 'date',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-700 text-xs">{formatDate(row.date)}</span>
    },
    {
      header: 'Customer',
      key: 'customerName',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-extrabold text-slate-800 text-xs">{row.customerName || 'Walk-in Customer'}</div>
          {row.customerPhone && <div className="text-[11px] text-slate-400">{row.customerPhone}</div>}
        </div>
      )
    },
    {
      header: 'Sale Type',
      key: 'category',
      sortable: true,
      render: (row) => (
        <span className={`whitespace-nowrap px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${row.category === 'Milk' ? 'bg-sky-50 text-sky-800 border-sky-200' : 'bg-purple-50 text-purple-800 border-purple-200'}`}>
          {row.category} Sale
        </span>
      )
    },
    {
      header: 'Total Amount',
      key: 'totalAmount',
      sortable: true,
      render: (row) => <span className="font-extrabold text-slate-900 text-xs">{formatCurrency(row.totalAmount, settings.currency)}</span>
    },
    {
      header: 'Paid Amount',
      key: 'paidAmount',
      sortable: true,
      render: (row) => <span className="font-bold text-emerald-700 text-xs">{formatCurrency(row.paidAmount, settings.currency)}</span>
    },
    {
      header: 'Remaining / Credit',
      key: 'remainingAmount',
      sortable: true,
      render: (row) => (
        <span className={`font-bold text-xs ${Number(row.remainingAmount) > 0 ? 'text-rose-600 font-extrabold' : 'text-slate-400'}`}>
          {Number(row.remainingAmount) > 0 ? formatCurrency(row.remainingAmount, settings.currency) : formatCurrency(0, settings.currency)}
        </span>
      )
    },
    {
      header: 'Payment Status',
      key: 'paymentStatus',
      sortable: true,
      render: (row) => getStatusBadge(row.paymentStatus)
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setSelectedSaleForReceipt(row)}
            title="View & Print Receipt"
            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
          </button>

          {Number(row.remainingAmount) > 0 && (
            <button
              onClick={() => setSelectedSaleForPayment(row)}
              title="Record Credit Payment"
              className="p-1.5 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
            >
              <DollarSign className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setSaleToDelete(row)}
            title="Delete Sale Invoice"
            className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const resetAllFilters = () => {
    setDatePeriod('all');
    setCategoryFilter('all');
    setStatusFilter('all');
    setSearchTerm('');
  };

  const isFilterActive = datePeriod !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all' || searchTerm !== '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Sales Management</h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage milk & animal sales, customer credit udhaar, and print thermal receipts
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <ExportButton
            data={filteredSales}
            filename="sales.csv"
            columns={[
              { header: 'Date', key: 'date' },
              { header: 'Invoice No', key: 'invoiceNo' },
              { header: 'Customer Name', key: 'customerName' },
              { header: 'Customer Phone', key: 'customerPhone' },
              { header: 'Category', key: 'category' },
              { header: 'Items / Details', accessor: (s) => (s.items && s.items.length) ? s.items.map(i => `${i.description} (x${i.quantity || 1})`).join('; ') : `${s.category} Sale` },
              { header: `Total Amount (${settings.currency})`, key: 'totalAmount' },
              { header: `Paid Amount (${settings.currency})`, key: 'paidAmount' },
              { header: `Remaining / Credit (${settings.currency})`, key: 'remainingAmount' },
              { header: 'Payment Method', key: 'paymentMethod' },
              { header: 'Payment Status', key: 'paymentStatus' },
              { header: 'Account', key: 'accountName' },
              { header: 'Notes', key: 'notes' }
            ]}
          />

          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Sale Invoice</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sales Revenue"
          value={formatCurrency(kpiStats.totalSales, settings.currency)}
          subtext={`${kpiStats.count} Total Invoices`}
          icon={ShoppingCart}
          color="emerald"
        />
        <StatCard
          title="Paid Amount Collected"
          value={formatCurrency(kpiStats.totalPaid, settings.currency)}
          subtext="Total Cash & Bank Received"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Total Milk Sold"
          value={`${totalMilkSold.toLocaleString()} ${settings.milkUnit || 'Liter'}`}
          subtext="Total Volume Dispatched"
          icon={Milk}
          color="purple"
        />
        <StatCard
          title="Available Milk Stock"
          value={`${availableMilk.toLocaleString()} ${settings.milkUnit || 'Liter'}`}
          subtext={availableMilk > 0 ? "In stock & ready to sell" : "Zero inventory remaining"}
          icon={Layers}
          color={availableMilk > 0 ? "emerald" : "rose"}
        />
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span>Filter Sales Records</span>
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
          {/* Search */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Search Invoice / Customer
            </label>
            <input
              type="text"
              placeholder="Invoice #, Name, Phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:outline-hidden font-medium"
            />
          </div>

          {/* Date Period */}
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
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Sale Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:outline-hidden font-medium"
            >
              <option value="all">All Categories</option>
              <option value="Milk">Milk Sales</option>
              <option value="Animal">Animal Sales</option>
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Payment Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white focus:outline-hidden font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="Paid">Fully Paid</option>
              <option value="Partial">Partial Payment</option>
              <option value="Credit">Credit / Unpaid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredSales}
        searchPlaceholder="Search sales..."
        emptyMessage="No sales records found"
        emptySubtext={isFilterActive ? "No sales match the active filter criteria. Try clearing filters." : "Create your first sale invoice using the button above."}
        initialSortColumn="date"
      />

      {/* New Sale Modal */}
      <SaleFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaleCreated={handleSaleCreated}
      />

      {/* Record Credit Payment Modal */}
      {selectedSaleForPayment && (
        <CreditPaymentModal
          isOpen={!!selectedSaleForPayment}
          onClose={() => setSelectedSaleForPayment(null)}
          sale={selectedSaleForPayment}
        />
      )}

      {/* Thermal Receipt Modal */}
      {selectedSaleForReceipt && (
        <SalesReceiptModal
          isOpen={!!selectedSaleForReceipt}
          onClose={() => setSelectedSaleForReceipt(null)}
          sale={selectedSaleForReceipt}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {saleToDelete && (
        <ConfirmDialog
          isOpen={!!saleToDelete}
          onClose={() => setSaleToDelete(null)}
          onConfirm={() => {
            deleteSale(saleToDelete.id || saleToDelete._id);
            setSaleToDelete(null);
          }}
          title="Delete Sale Record"
          message={`Are you sure you want to delete invoice ${saleToDelete.invoiceNo} (${saleToDelete.customerName})?`}
        />
      )}
    </div>
  );
};
