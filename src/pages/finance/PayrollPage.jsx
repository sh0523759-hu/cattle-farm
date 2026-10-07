import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { StatCard } from '../../components/common/StatCard';
import { DataTable } from '../../components/common/DataTable';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ExportButton } from '../../components/common/ExportButton';
import { formatDate, formatCurrency } from '../../utils/formatters';
import {
  Users,
  PlusCircle,
  Edit,
  Trash2,
  DollarSign,
  Printer,
  CheckCircle2,
  Clock,
  Landmark,
  Wallet,
  CreditCard,
  Building,
  Calendar,
  Sparkles,
  FileText
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
  'JazzCash',
  'Easypaisa',
  'Other / Custom'
];

export const PayrollPage = () => {
  const {
    payroll = [],
    employees = [],
    accounts = [],
    addPayroll,
    updatePayroll,
    deletePayroll,
    updateEmployee,
    settings
  } = useFarm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [payToEdit, setPayToEdit] = useState(null);
  const [payToDelete, setPayToDelete] = useState(null);
  const [slipToPrint, setSlipToPrint] = useState(null);
  const [tableFilteredPayroll, setTableFilteredPayroll] = useState([]);
  const [isEditingEmpBank, setIsEditingEmpBank] = useState(false);

  // Month & Status Filters
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [monthFilter, setMonthFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const bankAccounts = useMemo(() => {
    return accounts.filter(a => a.type === 'Bank' || a.type === 'Card');
  }, [accounts]);

  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    employeeBankName: '',
    employeeAccountTitle: '',
    employeeAccountNumber: '',
    employeeIban: '',
    month: currentMonthStr,
    baseSalary: '',
    bonus: 0,
    deductions: 0,
    netSalary: '',
    paymentDate: new Date().toISOString().slice(0, 10),
    paymentMethod: 'Cash',
    accountId: '',
    accountName: '',
    status: 'Paid',
    notes: ''
  });

  const handleOpenForm = (pay = null) => {
    setIsEditingEmpBank(false);
    if (pay) {
      setPayToEdit(pay);
      setFormData({
        employeeId: pay.employeeId || '',
        employeeName: pay.employeeName || '',
        employeeBankName: pay.employeeBankName || '',
        employeeAccountTitle: pay.employeeAccountTitle || '',
        employeeAccountNumber: pay.employeeAccountNumber || '',
        employeeIban: pay.employeeIban || '',
        month: pay.month || currentMonthStr,
        baseSalary: pay.baseSalary || '',
        bonus: pay.bonus || 0,
        deductions: pay.deductions || 0,
        netSalary: pay.netSalary || '',
        paymentDate: pay.paymentDate || new Date().toISOString().slice(0, 10),
        paymentMethod: pay.paymentMethod || 'Cash',
        accountId: pay.accountId || '',
        accountName: pay.accountName || '',
        status: pay.status || 'Paid',
        notes: pay.notes || ''
      });
    } else {
      setPayToEdit(null);
      const firstEmp = employees[0];
      const base = firstEmp ? Number(firstEmp.salary || 0) : '';
      setFormData({
        employeeId: firstEmp ? (firstEmp.id || firstEmp._id) : '',
        employeeName: firstEmp ? firstEmp.name : '',
        employeeBankName: firstEmp ? (firstEmp.bankName || '') : '',
        employeeAccountTitle: firstEmp ? (firstEmp.accountTitle || firstEmp.name || '') : '',
        employeeAccountNumber: firstEmp ? (firstEmp.accountNumber || '') : '',
        employeeIban: firstEmp ? (firstEmp.iban || '') : '',
        month: currentMonthStr,
        baseSalary: base,
        bonus: 0,
        deductions: 0,
        netSalary: base,
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentMethod: 'Cash',
        accountId: '',
        accountName: 'Cash in Hand',
        status: 'Paid',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleEmployeeChange = (e) => {
    const empId = e.target.value;
    const emp = employees.find(item => item.id === empId || item._id === empId);
    const base = emp ? Number(emp.salary || 0) : 0;
    const bonus = Number(formData.bonus || 0);
    const deductions = Number(formData.deductions || 0);

    setFormData(prev => ({
      ...prev,
      employeeId: empId,
      employeeName: emp ? emp.name : '',
      employeeBankName: emp ? (emp.bankName || '') : '',
      employeeAccountTitle: emp ? (emp.accountTitle || emp.name || '') : '',
      employeeAccountNumber: emp ? (emp.accountNumber || '') : '',
      employeeIban: emp ? (emp.iban || '') : '',
      baseSalary: base,
      netSalary: Math.max(0, base + bonus - deductions)
    }));
  };

  const handleSalaryCalc = (field, val) => {
    const numVal = Number(val || 0);
    const base = field === 'baseSalary' ? numVal : Number(formData.baseSalary || 0);
    const bonus = field === 'bonus' ? numVal : Number(formData.bonus || 0);
    const deductions = field === 'deductions' ? numVal : Number(formData.deductions || 0);
    const net = Math.max(0, base + bonus - deductions);

    setFormData(prev => ({
      ...prev,
      [field]: val,
      netSalary: net
    }));
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.employeeName) return;

    if (payToEdit) {
      updatePayroll(payToEdit.id || payToEdit._id, formData);
    } else {
      addPayroll(formData);
    }

    // Auto-sync bank details to employee profile
    if (formData.employeeId && (formData.employeeBankName || formData.employeeAccountNumber || formData.employeeIban)) {
      updateEmployee(formData.employeeId, {
        bankName: formData.employeeBankName,
        accountTitle: formData.employeeAccountTitle || formData.employeeName,
        accountNumber: formData.employeeAccountNumber,
        iban: formData.employeeIban
      });
    }

    setIsModalOpen(false);
  };

  const handleMarkAsPaid = (pay) => {
    updatePayroll(pay.id || pay._id, {
      ...pay,
      status: 'Paid',
      paymentDate: new Date().toISOString().slice(0, 10)
    });
  };

  // Filtered Payroll
  const filteredPayroll = useMemo(() => {
    return payroll.filter(p => {
      if (monthFilter !== 'all' && p.month !== monthFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      return true;
    });
  }, [payroll, monthFilter, statusFilter]);

  // KPIs
  const kpis = useMemo(() => {
    let totalPaid = 0;
    let totalPending = 0;

    payroll.forEach(p => {
      const net = Number(p.netSalary || p.baseSalary || 0);
      if (p.status === 'Paid') totalPaid += net;
      else totalPending += net;
    });

    const activeStaff = employees.length;

    return { totalPaid, totalPending, activeStaff };
  }, [payroll, employees]);

  // Unique Months for Filter
  const availableMonths = useMemo(() => {
    const set = new Set();
    payroll.forEach(p => { if (p.month) set.add(p.month); });
    set.add(currentMonthStr);
    return Array.from(set).sort().reverse();
  }, [payroll, currentMonthStr]);

  const columns = [
    {
      header: 'Employee & Receiving Bank',
      key: 'employeeName',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-extrabold text-slate-800 text-xs block">{row.employeeName}</span>
          {(row.employeeBankName || row.employeeAccountNumber) ? (
            <span className="text-[10px] text-blue-700 font-semibold flex items-center gap-1 mt-0.5">
              <Landmark className="w-3 h-3 text-blue-500 inline shrink-0" />
              <span>{row.employeeBankName}{row.employeeAccountNumber ? ` (${row.employeeAccountNumber})` : ''}</span>
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 font-medium">Month: {row.month}</span>
          )}
        </div>
      )
    },
    {
      header: 'Base Salary',
      key: 'baseSalary',
      sortable: true,
      render: (row) => <span className="text-xs font-semibold text-slate-700">{formatCurrency(row.baseSalary, settings.currency)}</span>
    },
    {
      header: 'Allowances / Bonus',
      key: 'bonus',
      render: (row) => (
        <span className="text-xs text-emerald-600 font-semibold">
          {Number(row.bonus) > 0 ? `+${formatCurrency(row.bonus, settings.currency)}` : '-'}
        </span>
      )
    },
    {
      header: 'Deductions',
      key: 'deductions',
      render: (row) => (
        <span className="text-xs text-rose-600 font-semibold">
          {Number(row.deductions) > 0 ? `-${formatCurrency(row.deductions, settings.currency)}` : '-'}
        </span>
      )
    },
    {
      header: 'Net Payable',
      key: 'netSalary',
      sortable: true,
      render: (row) => (
        <span className="font-black text-slate-900 text-sm">
          {formatCurrency(row.netSalary, settings.currency)}
        </span>
      )
    },
    {
      header: 'Payment Method',
      key: 'paymentMethod',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-700">{row.paymentMethod || 'Cash'}</span>
          {row.accountName && (
            <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{row.accountName}</span>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      render: (row) => row.status === 'Paid' ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" /> Paid
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3" /> Pending
        </span>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center space-x-1">
          {row.status !== 'Paid' && (
            <button
              onClick={() => handleMarkAsPaid(row)}
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors shadow-xs"
              title="Mark as Paid and record expense"
            >
              Pay Now
            </button>
          )}
          <button
            onClick={() => setSlipToPrint(row)}
            title="Print Salary Slip"
            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenForm(row)}
            title="Edit Salary"
            className="p-1.5 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPayToDelete(row)}
            title="Delete Salary"
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Staff Payroll & Salaries</h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage worker compensation, bonuses, deductions, and auto-record salary expenses
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <ExportButton
            data={tableFilteredPayroll.length > 0 ? tableFilteredPayroll : filteredPayroll}
            filename="payroll.csv"
            columns={[
              { header: 'Month', key: 'month' },
              { header: 'Employee Name', key: 'employeeName' },
              { header: `Base Salary (${settings.currency})`, key: 'baseSalary' },
              { header: `Bonus (${settings.currency})`, key: 'bonus' },
              { header: `Deductions (${settings.currency})`, key: 'deductions' },
              { header: `Net Salary (${settings.currency})`, key: 'netSalary' },
              { header: 'Payment Date', key: 'paymentDate' },
              { header: 'Payment Method', key: 'paymentMethod' },
              { header: 'Status', key: 'status' },
              { header: 'Notes', key: 'notes' }
            ]}
          />

          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Issue Salary Voucher</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Paid Salaries"
          value={formatCurrency(kpis.totalPaid, settings.currency)}
          subtext="Processed salary disbursements"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Pending Salary Liabilities"
          value={formatCurrency(kpis.totalPending, settings.currency)}
          subtext="Unpaid salary obligations"
          icon={Clock}
          color="rose"
        />
        <StatCard
          title="Active Farm Staff"
          value={kpis.activeStaff}
          subtext="Registered workers"
          icon={Users}
          color="blue"
        />
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700">Month:</label>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-700 font-medium"
          >
            <option value="all">All Months</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-700">Status:</label>
          <div className="flex rounded-xl border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
            {['all', 'Paid', 'Pending'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg cursor-pointer transition-all ${
                  statusFilter === st
                    ? 'bg-white shadow-xs text-slate-900 font-bold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st === 'all' ? 'All' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <DataTable
        columns={columns}
        data={filteredPayroll}
        searchPlaceholder="Search employee, month..."
        emptyMessage="No payroll records logged"
        initialSortColumn="paymentDate"
        onFilteredDataChange={setTableFilteredPayroll}
      />

      {/* Add / Edit Salary Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={payToEdit ? "Edit Salary Voucher" : "Issue Staff Salary"}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Employee *</label>
            <select
              required
              value={formData.employeeId}
              onChange={handleEmployeeChange}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
            >
              <option value="">-- Choose Employee --</option>
              {employees.map(emp => (
                <option key={emp.id || emp._id} value={emp.id || emp._id}>
                  {emp.name} ({emp.role || 'Staff'}) - Default: {formatCurrency(emp.salary || 0, settings.currency)}
                </option>
              ))}
            </select>
          </div>

          {/* Employee Bank Account Details Card */}
          {formData.employeeId && (
            <div className={`p-3.5 rounded-2xl border transition-all ${
              (formData.employeeBankName || formData.employeeAccountNumber)
                ? 'bg-blue-50/70 border-blue-200 text-blue-950'
                : 'bg-amber-50/70 border-amber-200 text-amber-950'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Landmark className={`w-4 h-4 ${
                    (formData.employeeBankName || formData.employeeAccountNumber) ? 'text-blue-700' : 'text-amber-700'
                  }`} />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Employee Bank Details (Salary Destination)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingEmpBank(prev => !prev)}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                >
                  {isEditingEmpBank ? 'Hide Form' : ((formData.employeeBankName || formData.employeeAccountNumber) ? 'Edit Bank' : '+ Add Bank Account')}
                </button>
              </div>

              {!isEditingEmpBank && (formData.employeeBankName || formData.employeeAccountNumber) ? (
                <div className="mt-2.5 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/95 p-2 rounded-xl border border-blue-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Bank Name</span>
                    <span className="font-extrabold text-slate-800 block truncate">{formData.employeeBankName || 'N/A'}</span>
                  </div>
                  <div className="bg-white/95 p-2 rounded-xl border border-blue-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Account Title</span>
                    <span className="font-extrabold text-slate-800 block truncate">{formData.employeeAccountTitle || formData.employeeName || 'N/A'}</span>
                  </div>
                  <div className="bg-white/95 p-2 rounded-xl border border-blue-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Account Number</span>
                    <span className="font-mono font-bold text-slate-800 block truncate">{formData.employeeAccountNumber || 'N/A'}</span>
                  </div>
                  <div className="bg-white/95 p-2 rounded-xl border border-blue-100 shadow-2xs">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">IBAN Number</span>
                    <span className="font-mono font-bold text-slate-800 block truncate text-[11px]">{formData.employeeIban || 'N/A'}</span>
                  </div>
                </div>
              ) : !isEditingEmpBank ? (
                <p className="mt-1 text-[11px] text-amber-800 font-medium">
                  ⚠️ No bank account registered for this employee yet. Click <strong>"+ Add Bank Account"</strong> to add their receiving bank details.
                </p>
              ) : null}

              {isEditingEmpBank && (
                <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Bank Name</label>
                    <select
                      value={formData.employeeBankName}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeBankName: e.target.value }))}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
                    >
                      <option value="">-- Choose Bank --</option>
                      {COMMON_BANKS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Account Title</label>
                    <input
                      type="text"
                      value={formData.employeeAccountTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeAccountTitle: e.target.value }))}
                      placeholder={formData.employeeName || "Account Title"}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Account Number</label>
                    <input
                      type="text"
                      value={formData.employeeAccountNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeAccountNumber: e.target.value }))}
                      placeholder="e.g. 00427901234503"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-0.5">IBAN Number</label>
                    <input
                      type="text"
                      value={formData.employeeIban}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeIban: e.target.value }))}
                      placeholder="e.g. PK36MEZN0001234567890123"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-xl bg-white font-mono uppercase"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Salary Month *</label>
              <input
                type="month"
                required
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Payment Date</label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Base Salary *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.baseSalary}
                onChange={(e) => handleSalaryCalc('baseSalary', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bonus/Allow.</label>
              <input
                type="number"
                step="0.01"
                value={formData.bonus}
                onChange={(e) => handleSalaryCalc('bonus', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Deductions</label>
              <input
                type="number"
                step="0.01"
                value={formData.deductions}
                onChange={(e) => handleSalaryCalc('deductions', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Net Salary Highlight */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Net Payable Amount:</span>
            <span className="text-base font-black text-emerald-700">
              {formatCurrency(formData.netSalary, settings.currency)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-bold"
              >
                <option value="Paid">Paid (Auto-records Expense)</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          {(formData.paymentMethod === 'Bank' || formData.paymentMethod === 'Card') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Paid From Farm Account (Debit) *</label>
              <select
                required
                value={formData.accountId}
                onChange={(e) => {
                  const acc = accounts.find(a => (a.id || a._id) === e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    accountId: e.target.value,
                    accountName: acc ? (acc.name || acc.bankName) : ''
                  }));
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
              >
                <option value="">-- Choose Account --</option>
                {bankAccounts.map(acc => (
                  <option key={acc.id || acc._id} value={acc.id || acc._id}>
                    {acc.bankName || acc.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Remarks / Notes</label>
            <textarea
              rows="2"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g. Overtime for Eid milk production"
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
              {payToEdit ? "Update Voucher" : "Save & Process"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Salary Slip Print Modal */}
      {slipToPrint && (
        <Modal
          isOpen={!!slipToPrint}
          onClose={() => setSlipToPrint(null)}
          title="Employee Salary Slip"
          maxWidth="max-w-md"
        >
          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4 print:border-none">
            {/* Header */}
            <div className="text-center border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">{settings.farmName || 'Cattle Farm'}</h3>
              <p className="text-xs text-slate-500 font-medium">Monthly Salary Payment Slip</p>
            </div>

            {/* Employee Info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Employee Name:</span>
                <span className="font-bold text-slate-800">{slipToPrint.employeeName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Salary Month:</span>
                <span className="font-bold text-slate-800">{slipToPrint.month}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Payment Date:</span>
                <span className="font-bold text-slate-800">{formatDate(slipToPrint.paymentDate)}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Payment Method:</span>
                <span className="font-bold text-slate-800">{slipToPrint.paymentMethod}</span>
              </div>
              {(slipToPrint.employeeBankName || slipToPrint.employeeAccountNumber) && (
                <div className="col-span-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 mt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                    Employee Bank (Destination):
                  </span>
                  <div className="font-bold text-slate-800">
                    {slipToPrint.employeeBankName || 'Bank'}
                    {slipToPrint.employeeAccountNumber && ` (Acc: ${slipToPrint.employeeAccountNumber})`}
                  </div>
                  {slipToPrint.employeeIban && (
                    <div className="text-[11px] font-mono text-slate-600">
                      IBAN: {slipToPrint.employeeIban}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Breakdown */}
            <div className="border-t border-b border-slate-100 py-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600">Base Salary:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(slipToPrint.baseSalary, settings.currency)}</span>
              </div>
              {Number(slipToPrint.bonus) > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Allowances / Bonus:</span>
                  <span className="font-semibold">+{formatCurrency(slipToPrint.bonus, settings.currency)}</span>
                </div>
              )}
              {Number(slipToPrint.deductions) > 0 && (
                <div className="flex justify-between text-rose-700">
                  <span>Deductions / Advances:</span>
                  <span className="font-semibold">-{formatCurrency(slipToPrint.deductions, settings.currency)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 font-black text-sm text-slate-900">
                <span>Net Salary Received:</span>
                <span className="text-emerald-700">{formatCurrency(slipToPrint.netSalary, settings.currency)}</span>
              </div>
            </div>

            <div className="pt-6 flex justify-between text-[11px] text-slate-400">
              <div className="border-t border-slate-300 pt-1 text-center w-28">
                Manager Signature
              </div>
              <div className="border-t border-slate-300 pt-1 text-center w-28">
                Employee Signature
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
              <button
                type="button"
                onClick={() => setSlipToPrint(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Dialog */}
      {payToDelete && (
        <ConfirmDialog
          isOpen={!!payToDelete}
          onClose={() => setPayToDelete(null)}
          onConfirm={() => deletePayroll(payToDelete.id || payToDelete._id)}
          title="Delete Salary Voucher"
          message={`Are you sure you want to delete the salary record for ${payToDelete.employeeName} (${payToDelete.month})?`}
        />
      )}
    </div>
  );
};
