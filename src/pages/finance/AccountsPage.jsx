import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DataTable } from '../../components/common/DataTable';
import { ExportButton } from '../../components/common/ExportButton';
import { formatDate, formatCurrency } from '../../utils/formatters';
import {
  Landmark,
  Wallet,
  CreditCard,
  PlusCircle,
  Edit,
  Trash2,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Building,
  ShieldCheck,
  History
} from 'lucide-react';

const COMMON_BANKS = [
  'Habib Bank Limited (HBL)',
  'Meezan Bank',
  'Allied Bank Limited (ABL)',
  'United Bank Limited (UBL)',
  'MCB Bank',
  'Bank Alfalah',
  'National Bank of Pakistan (NBP)',
  'Askari Bank',
  'Bank of Punjab (BOP)',
  'Faysal Bank',
  'JazzCash Business',
  'Easypaisa Merchant',
  'Other / Custom'
];

export const AccountsPage = () => {
  const { accounts = [], income = [], expenses = [], addAccount, updateAccount, deleteAccount, getAccountBalance, settings } = useFarm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accToEdit, setAccToEdit] = useState(null);
  const [accToDelete, setAccToDelete] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState('all');
  const [filteredLedger, setFilteredLedger] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    type: 'Bank',
    bankName: 'Habib Bank Limited (HBL)',
    accountTitle: '',
    accountNumber: '',
    iban: '',
    openingBalance: '',
    isActive: true
  });

  const handleOpenForm = (acc = null) => {
    if (acc) {
      setAccToEdit(acc);
      setFormData({
        name: acc.name || '',
        type: 'Bank',
        bankName: acc.bankName || 'Habib Bank Limited (HBL)',
        accountTitle: acc.accountTitle || '',
        accountNumber: acc.accountNumber || '',
        iban: acc.iban || '',
        openingBalance: acc.openingBalance || '',
        isActive: acc.isActive !== undefined ? acc.isActive : true
      });
    } else {
      setAccToEdit(null);
      setFormData({
        name: '',
        type: 'Bank',
        bankName: 'Habib Bank Limited (HBL)',
        accountTitle: settings.farmName || '',
        accountNumber: '',
        iban: '',
        openingBalance: '',
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const autoName = formData.accountTitle
      ? `${formData.bankName} - ${formData.accountTitle}`
      : (formData.bankName || 'Bank Account');

    const finalData = {
      ...formData,
      type: 'Bank',
      name: formData.name?.trim() || autoName,
      openingBalance: Number(formData.openingBalance || 0)
    };

    if (accToEdit) {
      updateAccount(accToEdit.id || accToEdit._id, finalData);
    } else {
      addAccount(finalData);
    }
    setIsModalOpen(false);
  };

  // KPIs
  const kpiStats = useMemo(() => {
    let totalLiquid = 0;
    let bankTotal = 0;
    let cashTotal = 0;
    let cardTotal = 0;

    accounts.forEach((acc) => {
      const bal = getAccountBalance(acc);
      totalLiquid += bal;
      if (acc.type === 'Bank') bankTotal += bal;
      else if (acc.type === 'Cash') cashTotal += bal;
      else if (acc.type === 'Card') cardTotal += bal;
    });

    return { totalLiquid, bankTotal, cashTotal, cardTotal };
  }, [accounts, getAccountBalance]);

  // Combined transactions for the selected account ledger
  const ledgerTransactions = useMemo(() => {
    const list = [];

    // Helper to check if an account matches
    const isAccMatch = (targetId, itemAccountId, paymentMethod, accType, isDefault) => {
      if (targetId === 'all') return true;
      if (itemAccountId && (itemAccountId === targetId)) return true;
      if (!itemAccountId) {
        const targetAcc = accounts.find(a => a.id === targetId || a._id === targetId);
        if (targetAcc) {
          if (targetAcc.type === 'Cash' && paymentMethod === 'Cash') return true;
          if (targetAcc.type === 'Bank' && (paymentMethod === 'Bank' || paymentMethod === 'Bank Transfer') && targetAcc.isDefault) return true;
        }
      }
      return false;
    };

    income.forEach((inc) => {
      if (isAccMatch(selectedAccountId, inc.accountId, inc.paymentMethod, 'Bank', false)) {
        list.push({
          id: `INC-${inc.id || inc._id}`,
          date: inc.date,
          type: 'inflow',
          category: inc.category,
          description: inc.description || inc.notes || (inc.customer ? `Payment from ${inc.customer}` : 'Income receipt'),
          method: inc.paymentMethod || 'Cash',
          amount: Number(inc.amount || 0)
        });
      }
    });

    expenses.forEach((exp) => {
      if (isAccMatch(selectedAccountId, exp.accountId, exp.paymentMethod, 'Bank', false)) {
        list.push({
          id: `EXP-${exp.id || exp._id}`,
          date: exp.date,
          type: 'outflow',
          category: exp.category,
          description: exp.description || exp.notes || 'Farm expense payment',
          method: exp.paymentMethod || 'Cash',
          amount: Number(exp.amount || 0)
        });
      }
    });

    return list.sort((a, b) => new Date(b.date || '1970-01-01') - new Date(a.date || '1970-01-01'));
  }, [selectedAccountId, income, expenses, accounts]);

  const selectedAccountObject = useMemo(() => {
    if (selectedAccountId === 'all') return null;
    return accounts.find(a => a.id === selectedAccountId || a._id === selectedAccountId);
  }, [selectedAccountId, accounts]);

  const ledgerColumns = [
    {
      header: 'Date',
      key: 'date',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-800 text-xs">{formatDate(row.date)}</span>
    },
    {
      header: 'Type',
      key: 'type',
      sortable: true,
      render: (row) => row.type === 'inflow' ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ArrowDownLeft className="w-3.5 h-3.5" /> Deposit / Inflow
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <ArrowUpRight className="w-3.5 h-3.5" /> Withdrawal / Outflow
        </span>
      )
    },
    {
      header: 'Particulars / Description',
      key: 'description',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 text-xs">{row.category}</span>
          <span className="text-xs text-slate-500 italic block">{row.description || '-'}</span>
        </div>
      )
    },
    {
      header: 'Payment Method',
      key: 'method',
      render: (row) => <span className="text-xs font-semibold text-slate-600">{row.method}</span>
    },
    {
      header: 'Amount',
      key: 'amount',
      sortable: true,
      render: (row) => (
        <span className={`font-black text-sm ${row.type === 'inflow' ? 'text-emerald-700' : 'text-rose-600'}`}>
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
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Accounts & Banking Manager</h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage cash drawers, commercial bank accounts, cards, and view live account ledgers
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <ExportButton
            data={filteredLedger.length > 0 ? filteredLedger : ledgerTransactions}
            filename="accounts-ledger.csv"
            columns={[
              { header: 'Date', key: 'date' },
              { header: 'Type', accessor: (r) => r.type === 'inflow' ? 'Deposit / Inflow' : 'Withdrawal / Outflow' },
              { header: 'Category', key: 'category' },
              { header: 'Description', key: 'description' },
              { header: 'Payment Method', key: 'method' },
              { header: `Amount (${settings.currency})`, accessor: (r) => `${r.type === 'inflow' ? '+' : '-'}${r.amount}` }
            ]}
          />

          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Account</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Liquid Funds"
          value={formatCurrency(kpiStats.totalLiquid, settings.currency)}
          subtext="Total available liquidity"
          icon={DollarSign}
          color="emerald"
        />
        <StatCard
          title="Total Bank Balance"
          value={formatCurrency(kpiStats.bankTotal, settings.currency)}
          subtext="Commercial bank accounts"
          icon={Landmark}
          color="blue"
        />
        <StatCard
          title="Farm Cash in Hand"
          value={formatCurrency(kpiStats.cashTotal, settings.currency)}
          subtext="Physical cash on premises"
          icon={Wallet}
          color="purple"
        />
        <StatCard
          title="Active Accounts"
          value={accounts.length}
          subtext="Configured payment accounts"
          icon={ShieldCheck}
          color="amber"
        />
      </div>

      {/* Accounts Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Configured Accounts</h3>
          <span className="text-xs text-slate-400 font-medium">Click an account to inspect its ledger</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const liveBalance = getAccountBalance(acc);
            const isSelected = selectedAccountId === (acc.id || acc._id);
            const isBank = acc.type === 'Bank';
            const isCash = acc.type === 'Cash';

            return (
              <div
                key={acc.id || acc._id}
                onClick={() => setSelectedAccountId(isSelected ? 'all' : (acc.id || acc._id))}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden bg-white ${
                  isSelected
                    ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md'
                    : 'border-slate-200/80 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      isBank ? 'bg-blue-50 text-blue-600' : isCash ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'
                    }`}>
                      {isBank ? <Landmark className="w-5 h-5" /> : isCash ? <Wallet className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-800 text-sm">
                          {acc.bankName || acc.name}
                        </h4>
                        {acc.isDefault && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium">{acc.name}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenForm(acc)}
                      className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg transition-colors cursor-pointer"
                      title="Edit Account"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {!acc.isDefault && (
                      <button
                        onClick={() => setAccToDelete(acc)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Account Details */}
                {isBank && (
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Title:</span>
                      <span className="font-bold text-slate-800 truncate block">{acc.accountTitle || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Account #:</span>
                      <span className="font-mono font-bold text-slate-800 truncate block">
                        {acc.accountNumber || 'N/A'}
                      </span>
                    </div>
                    {acc.iban && (
                      <div className="col-span-2">
                        <span className="text-[11px] text-slate-400 block font-medium">IBAN:</span>
                        <span className="font-mono font-bold text-slate-800 truncate block text-[11px]">
                          {acc.iban}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Balance Section */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Live Balance</span>
                  <span className={`text-lg font-black ${liveBalance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                    {formatCurrency(liveBalance, settings.currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Account Ledger Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-extrabold text-slate-800 text-base">
                {selectedAccountObject
                  ? `${selectedAccountObject.bankName || selectedAccountObject.name} Ledger`
                  : 'All Accounts Combined Ledger'}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {selectedAccountObject
                  ? `Real-time deposits and withdrawals for ${selectedAccountObject.name}`
                  : 'Displaying complete transactions across all bank and cash accounts'}
              </p>
            </div>
          </div>

          {selectedAccountId !== 'all' && (
            <button
              onClick={() => setSelectedAccountId('all')}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
            >
              Show All Accounts
            </button>
          )}
        </div>

        <DataTable
          columns={ledgerColumns}
          data={ledgerTransactions}
          searchPlaceholder="Search particulars, description..."
          emptyMessage="No transactions recorded for this account"
          initialSortColumn="date"
          onFilteredDataChange={setFilteredLedger}
        />
      </div>

      {/* Add / Edit Bank Account Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={accToEdit ? "Edit Bank Account Details" : "Add New Bank Account"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name *</label>
            <select
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500/20"
            >
              {COMMON_BANKS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Account Title *</label>
            <input
              type="text"
              required
              value={formData.accountTitle}
              onChange={(e) => setFormData({ ...formData, accountTitle: e.target.value })}
              placeholder="e.g. GreenPastures Dairy Farm"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Account Number *</label>
              <input
                type="text"
                required
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="e.g. 00427901234503"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">IBAN Number</label>
              <input
                type="text"
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                placeholder="e.g. PK36MEZN0001234567890123"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Opening Balance ({settings.currency})
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.openingBalance}
              onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20"
            />
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
              {accToEdit ? "Update Account" : "Save Account"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      {accToDelete && (
        <ConfirmDialog
          isOpen={!!accToDelete}
          onClose={() => setAccToDelete(null)}
          onConfirm={() => deleteAccount(accToDelete.id || accToDelete._id)}
          title="Delete Account"
          message={`Are you sure you want to remove the account "${accToDelete.name || accToDelete.bankName}"?`}
        />
      )}
    </div>
  );
};
