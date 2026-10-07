import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { DataTable } from '../../components/common/DataTable';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ReceiptModal } from '../../components/common/ReceiptModal';
import { ExportButton } from '../../components/common/ExportButton';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { TrendingUp, PlusCircle, Edit, Trash2, DollarSign, Printer, Landmark, Wallet, CreditCard, Sparkles } from 'lucide-react';

const DEFAULT_INCOME_CATEGORIES = [
  'Milk Sale',
  'Animal Sale',
  'Calf Sale',
  'Manure Sale',
  'Services',
  'Other'
];

export const IncomeList = () => {
  const { income = [], accounts = [], addIncome, updateIncome, deleteIncome, settings } = useFarm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [incToEdit, setIncToEdit] = useState(null);
  const [incToDelete, setIncToDelete] = useState(null);
  const [incToPrint, setIncToPrint] = useState(null);
  const [filteredInc, setFilteredInc] = useState([]);

  const categories = useMemo(() => {
    if (settings?.incomeCategories && Array.isArray(settings.incomeCategories) && settings.incomeCategories.length > 0) {
      return settings.incomeCategories;
    }
    return DEFAULT_INCOME_CATEGORIES;
  }, [settings?.incomeCategories]);

  const bankAccounts = useMemo(() => {
    return accounts.filter(a => a.type === 'Bank' || a.type === 'Card');
  }, [accounts]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'Milk Sale',
    customer: 'Walk-in Buyer',
    amount: '',
    paymentMethod: 'Cash',
    accountId: '',
    accountName: '',
    description: ''
  });

  const handleOpenForm = (inc = null) => {
    const defaultCat = categories[0] || 'Milk Sale';
    if (inc) {
      setIncToEdit(inc);
      setFormData({
        date: inc.date || new Date().toISOString().slice(0, 10),
        category: inc.category || defaultCat,
        customer: inc.customer || '',
        amount: inc.amount || '',
        paymentMethod: inc.paymentMethod || 'Cash',
        accountId: inc.accountId || '',
        accountName: inc.accountName || '',
        description: inc.description || ''
      });
    } else {
      setIncToEdit(null);
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        category: defaultCat,
        customer: 'Walk-in Buyer',
        amount: '',
        paymentMethod: 'Cash',
        accountId: bankAccounts.length > 0 ? (bankAccounts[0].id || bankAccounts[0]._id) : '',
        accountName: bankAccounts.length > 0 ? (bankAccounts[0].name || bankAccounts[0].bankName) : '',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handlePaymentMethodChange = (method) => {
    let accId = '';
    let accName = '';

    if (method === 'Bank') {
      const firstBank = accounts.find(a => a.type === 'Bank') || accounts[0];
      if (firstBank) {
        accId = firstBank.id || firstBank._id;
        accName = firstBank.name || firstBank.bankName;
      }
    } else if (method === 'Card') {
      const firstCard = accounts.find(a => a.type === 'Card') || accounts[0];
      if (firstCard) {
        accId = firstCard.id || firstCard._id;
        accName = firstCard.name || firstCard.bankName;
      }
    } else if (method === 'Cash') {
      const cashAcc = accounts.find(a => a.type === 'Cash');
      if (cashAcc) {
        accId = cashAcc.id || cashAcc._id;
        accName = cashAcc.name;
      }
    }

    setFormData(prev => ({
      ...prev,
      paymentMethod: method,
      accountId: accId,
      accountName: accName
    }));
  };

  const handleAccountSelect = (e) => {
    const accId = e.target.value;
    const selected = accounts.find(a => a.id === accId || a._id === accId);
    setFormData(prev => ({
      ...prev,
      accountId: accId,
      accountName: selected ? (selected.name || selected.bankName) : ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) return;

    if (incToEdit) {
      updateIncome(incToEdit.id || incToEdit._id, formData);
    } else {
      addIncome(formData);
    }
    setIsModalOpen(false);
  };

  const stats = useMemo(() => {
    let total = 0;
    let milkRevenue = 0;
    let animalRevenue = 0;
    let otherRevenue = 0;

    income.forEach((i) => {
      const amt = Number(i.amount || 0);
      total += amt;
      const cat = (i.category || '').toLowerCase();
      if (cat.includes('milk')) milkRevenue += amt;
      else if (cat.includes('animal') || cat.includes('calf') || cat.includes('cattle')) animalRevenue += amt;
      else otherRevenue += amt;
    });

    return { total, milkRevenue, animalRevenue, otherRevenue };
  }, [income]);

  const columns = [
    {
      header: 'Date',
      key: 'date',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-800 text-xs">{formatDate(row.date)}</span>
    },
    {
      header: 'Income Source',
      key: 'category',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 w-fit">
          {row.category}
        </span>
      )
    },
    {
      header: 'Customer / Buyer',
      key: 'customer',
      sortable: true,
      render: (row) => <span className="font-semibold text-slate-700 text-xs">{row.customer || 'Walk-in Buyer'}</span>
    },
    {
      header: 'Payment Method & Account',
      key: 'paymentMethod',
      sortable: true,
      render: (row) => {
        const method = row.paymentMethod || 'Cash';
        const isBank = method.toLowerCase().includes('bank');
        const isCard = method.toLowerCase().includes('card');
        return (
          <div className="flex flex-col">
            <div className="flex items-center gap-1 text-xs text-slate-700 font-bold">
              {isBank ? (
                <Landmark className="w-3.5 h-3.5 text-blue-600" />
              ) : isCard ? (
                <CreditCard className="w-3.5 h-3.5 text-purple-600" />
              ) : (
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>{method}</span>
            </div>
            {(row.accountName || (isBank && 'Main Bank')) && (
              <span className="text-[11px] text-slate-400 font-medium">
                {row.accountName || 'Bank Account'}
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Amount',
      key: 'amount',
      sortable: true,
      render: (row) => <span className="font-black text-emerald-700 text-sm">{formatCurrency(row.amount, settings.currency)}</span>
    },
    {
      header: 'Notes / Description',
      key: 'description',
      render: (row) => <span className="text-xs text-slate-400 italic max-w-xs truncate block">{row.description || '-'}</span>
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setIncToPrint(row)}
            title="Print Invoice / Receipt"
            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenForm(row)}
            title="Edit Record"
            className="p-1.5 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIncToDelete(row)}
            title="Delete Record"
            className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Income & Sales Manager</h2>
          <p className="text-xs text-slate-500 font-medium">
            Record revenue streams from milk sales, animal sales, calves, and manure
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <ExportButton
            data={filteredInc.length > 0 ? filteredInc : income}
            filename="income.csv"
            columns={[
              { header: 'Date', key: 'date' },
              { header: 'Category', key: 'category' },
              { header: 'Customer / Buyer', key: 'customer' },
              { header: `Amount (${settings.currency})`, key: 'amount' },
              { header: 'Payment Method', key: 'paymentMethod' },
              { header: 'Account', key: 'accountName' },
              { header: 'Description / Notes', key: 'description' }
            ]}
          />

          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Income</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income Recorded"
          value={formatCurrency(stats.total, settings.currency)}
          subtext="Cumulative revenue"
          icon={TrendingUp}
          color="emerald"
        />
        <StatCard
          title="Milk Sales Income"
          value={formatCurrency(stats.milkRevenue, settings.currency)}
          subtext="Milk production sales"
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Animal Sales Income"
          value={formatCurrency(stats.animalRevenue, settings.currency)}
          subtext="Livestock & calves sold"
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title="Transactions Logged"
          value={income.length}
          subtext="Total revenue entries"
          icon={DollarSign}
          color="amber"
        />
      </div>

      <DataTable
        columns={columns}
        data={income}
        searchPlaceholder="Search category, buyer, account..."
        emptyMessage="No income records logged"
        filterOptions={[
          { key: 'category', label: 'Category', allLabel: 'All Categories', options: categories }
        ]}
        initialSortColumn="date"
        onFilteredDataChange={setFilteredInc}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={incToEdit ? "Edit Revenue Record" : "Record New Income"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Amount ({settings.currency}) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => handlePaymentMethodChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Card">Card</option>
              </select>
            </div>
          </div>

          {(formData.paymentMethod === 'Bank' || formData.paymentMethod === 'Card') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Bank / Card Account *
              </label>
              <select
                required
                value={formData.accountId}
                onChange={handleAccountSelect}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium"
              >
                <option value="">-- Choose Account --</option>
                {bankAccounts.map((acc) => (
                  <option key={acc.id || acc._id} value={acc.id || acc._id}>
                    {acc.bankName ? `${acc.bankName} - ${acc.accountTitle || acc.name}` : acc.name} ({acc.accountNumber ? `...${acc.accountNumber.slice(-4)}` : acc.type})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Customer / Buyer</label>
            <input
              type="text"
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              placeholder="e.g. Fresh Pure Dairy"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
            <textarea
              rows="2"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs cursor-pointer"
            >
              {incToEdit ? "Update Income" : "Save Income"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      {incToPrint && (
        <ReceiptModal
          isOpen={!!incToPrint}
          onClose={() => setIncToPrint(null)}
          data={incToPrint}
          type="income"
          settings={settings}
        />
      )}

      {incToDelete && (
        <ConfirmDialog
          isOpen={!!incToDelete}
          onClose={() => setIncToDelete(null)}
          onConfirm={() => deleteIncome(incToDelete.id)}
          title="Delete Income Entry"
          message={`Are you sure you want to delete this income entry of ${settings.currency}${incToDelete.amount}?`}
        />
      )}
    </div>
  );
};
