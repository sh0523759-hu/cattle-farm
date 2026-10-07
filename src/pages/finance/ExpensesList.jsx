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
import {
  TrendingDown,
  PlusCircle,
  Edit,
  Trash2,
  DollarSign,
  Printer,
  Landmark,
  Wallet,
  CreditCard,
  Sparkles,
  Users,
  Plus,
  X,
  Check
} from 'lucide-react';

const DEFAULT_EXPENSE_CATEGORIES = [
  'Feed',
  'Medicine',
  'Veterinary',
  'Employee Salary',
  'Electricity',
  'Water',
  'Transportation',
  'Maintenance',
  'Equipment',
  'Other'
];

export const ExpensesList = () => {
  const { expenses = [], animals = [], accounts = [], addExpense, updateExpense, deleteExpense, settings, updateSettings, showToast } = useFarm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expToEdit, setExpToEdit] = useState(null);
  const [expToDelete, setExpToDelete] = useState(null);
  const [expToPrint, setExpToPrint] = useState(null);
  const [filteredExp, setFilteredExp] = useState([]);

  // Category addition state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  const categories = useMemo(() => {
    if (settings?.expenseCategories && Array.isArray(settings.expenseCategories) && settings.expenseCategories.length > 0) {
      return settings.expenseCategories;
    }
    return DEFAULT_EXPENSE_CATEGORIES;
  }, [settings?.expenseCategories]);

  const bankAccounts = useMemo(() => {
    return accounts.filter(a => a.type === 'Bank' || a.type === 'Card');
  }, [accounts]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'Feed',
    amount: '',
    paymentMethod: 'Cash',
    accountId: '',
    accountName: '',
    animalTag: '',
    description: ''
  });

  const handleAddNewCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) {
      if (showToast) showToast('Please enter a category name', 'warning');
      return;
    }

    if (!categories.includes(trimmed)) {
      const updated = [...categories, trimmed];
      if (updateSettings) {
        updateSettings({ expenseCategories: updated });
      }
      if (showToast) showToast(`Category "${trimmed}" added!`, 'success');
    }
    setFormData(prev => ({ ...prev, category: trimmed }));
    setIsAddingCategory(false);
    setNewCategoryInput('');
  };

  const handleOpenForm = (exp = null) => {
    setIsAddingCategory(false);
    setNewCategoryInput('');
    const defaultCat = categories[0] || 'Feed';
    if (exp) {
      setExpToEdit(exp);
      setFormData({
        date: exp.date || new Date().toISOString().slice(0, 10),
        category: exp.category || defaultCat,
        amount: exp.amount || '',
        paymentMethod: exp.paymentMethod || 'Cash',
        accountId: exp.accountId || '',
        accountName: exp.accountName || '',
        animalTag: exp.animalTag || '',
        description: exp.description || ''
      });
    } else {
      setExpToEdit(null);
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        category: defaultCat,
        amount: '',
        paymentMethod: 'Cash',
        accountId: bankAccounts.length > 0 ? (bankAccounts[0].id || bankAccounts[0]._id) : '',
        accountName: bankAccounts.length > 0 ? (bankAccounts[0].name || bankAccounts[0].bankName) : '',
        animalTag: '',
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

    if (expToEdit) {
      updateExpense(expToEdit.id || expToEdit._id, formData);
    } else {
      addExpense(formData);
    }
    setIsModalOpen(false);
  };

  const stats = useMemo(() => {
    let total = 0;
    let feedCost = 0;
    let salaryCost = 0;
    let vetCost = 0;

    expenses.forEach((e) => {
      const amt = Number(e.amount || 0);
      total += amt;
      const cat = (e.category || '').toLowerCase();
      if (cat.includes('feed') || cat.includes('fodder') || cat.includes('silage')) feedCost += amt;
      else if (cat.includes('salary') || cat.includes('employee') || cat.includes('payroll')) salaryCost += amt;
      else if (cat.includes('medicine') || cat.includes('vet') || cat.includes('vaccin')) vetCost += amt;
    });

    return { total, feedCost, salaryCost, vetCost };
  }, [expenses]);

  const columns = [
    {
      header: 'Date',
      key: 'date',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-800 text-xs">{formatDate(row.date)}</span>
    },
    {
      header: 'Expense Category',
      key: 'category',
      sortable: true,
      render: (row) => {
        const isFromPayroll = !!(row.payrollId || (row.category === 'Employee Salary' && row.description?.includes('Salary for')));
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200 w-fit">
              {row.category}
            </span>
            {isFromPayroll && (
              <span className="inline-flex items-center gap-1 text-[10px] text-purple-600 font-semibold mt-0.5">
                <Users className="w-2.5 h-2.5" /> Auto-linked from Payroll
              </span>
            )}
          </div>
        );
      }
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
      render: (row) => <span className="font-black text-rose-600 text-sm">{formatCurrency(row.amount, settings.currency)}</span>
    },
    {
      header: 'Description / Particulars',
      key: 'description',
      render: (row) => (
        <div>
          <span className="text-xs text-slate-600 italic block max-w-xs truncate">{row.description || '-'}</span>
          {row.animalTag && (
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md mt-0.5 inline-block">
              Tag: {row.animalTag}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setExpToPrint(row)}
            title="Print Expense Voucher / Receipt"
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
            onClick={() => setExpToDelete(row)}
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
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Expense Logger</h2>
          <p className="text-xs text-slate-500 font-medium">
            Log operational costs for feed, medicines, staff salaries, power, and maintenance
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <ExportButton
            data={filteredExp.length > 0 ? filteredExp : expenses}
            filename="expenses.csv"
            columns={[
              { header: 'Date', key: 'date' },
              { header: 'Category', key: 'category' },
              { header: 'Particulars / Description', key: 'description' },
              { header: 'Animal Tag', key: 'animalTag' },
              { header: `Amount (${settings.currency})`, key: 'amount' },
              { header: 'Payment Method', key: 'paymentMethod' },
              { header: 'Account', key: 'accountName' }
            ]}
          />

          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Farm Expenses"
          value={formatCurrency(stats.total, settings.currency)}
          subtext="Total operating expenses"
          icon={TrendingDown}
          color="rose"
        />
        <StatCard
          title="Fodder & Feed Costs"
          value={formatCurrency(stats.feedCost, settings.currency)}
          subtext="Green fodder, silage & mix"
          icon={TrendingDown}
          color="amber"
        />
        <StatCard
          title="Staff Salaries Paid"
          value={formatCurrency(stats.salaryCost, settings.currency)}
          subtext="Farm labor compensation"
          icon={Users}
          color="purple"
        />
        <StatCard
          title="Medical & Vet Care"
          value={formatCurrency(stats.vetCost, settings.currency)}
          subtext="Medicines & treatment"
          icon={DollarSign}
          color="blue"
        />
      </div>

      <DataTable
        columns={columns}
        data={expenses}
        searchPlaceholder="Search category, account, particulars..."
        emptyMessage="No farm expenses recorded"
        filterOptions={[
          { key: 'category', label: 'Category', allLabel: 'All Categories', options: categories }
        ]}
        initialSortColumn="date"
        onFilteredDataChange={setFilteredExp}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={expToEdit ? "Edit Expense Record" : "Record Farm Expense"}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">Category *</label>
                {!isAddingCategory && (
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    + Add New
                  </button>
                )}
              </div>

              {isAddingCategory ? (
                <div className="relative flex items-center">
                  <input
                    type="text"
                    autoFocus
                    placeholder="New category name..."
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewCategory();
                      } else if (e.key === 'Escape') {
                        setIsAddingCategory(false);
                      }
                    }}
                    className="w-full pl-3 pr-16 py-2 text-xs border border-emerald-400 bg-emerald-50/40 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden text-slate-800 font-medium"
                  />
                  <div className="absolute right-1.5 flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={handleAddNewCategory}
                      className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <select
                  value={formData.category}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setIsAddingCategory(true);
                    } else {
                      setFormData({ ...formData, category: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden bg-white text-slate-800 font-medium"
                >
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="__NEW__">+ Add New Category...</option>
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Amount ({settings.currency}) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => handlePaymentMethodChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden bg-white"
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
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Link to Animal Tag (Optional)</label>
              <select
                value={formData.animalTag || ''}
                onChange={(e) => setFormData({ ...formData, animalTag: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden text-slate-800"
              >
                <option value="">-- General Farm Expense --</option>
                {animals.map(a => (
                  <option key={a.id || a.tagNo} value={a.tagNo}>
                    [{a.tagNo}] {a.name || 'Unnamed'} ({a.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description / Particulars</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Purchased 2000kg Alfalfa green fodder"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              {expToEdit ? "Update Expense" : "Save Expense"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      {expToPrint && (
        <ReceiptModal
          isOpen={!!expToPrint}
          onClose={() => setExpToPrint(null)}
          data={expToPrint}
          type="expense"
          settings={settings}
        />
      )}

      {expToDelete && (
        <ConfirmDialog
          isOpen={!!expToDelete}
          onClose={() => setExpToDelete(null)}
          onConfirm={() => deleteExpense(expToDelete.id)}
          title="Delete Expense Entry"
          message={`Are you sure you want to delete this expense of ${settings.currency}${expToDelete.amount}?`}
        />
      )}
    </div>
  );
};
