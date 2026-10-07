import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { DataTable } from '../../components/common/DataTable';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { AttendanceModal } from './AttendanceModal';
import { ExportButton } from '../../components/common/ExportButton';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { Users, PlusCircle, Edit, Trash2, CheckSquare, DollarSign, Landmark } from 'lucide-react';

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

export const EmployeesList = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee, settings } = useFarm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [empToEdit, setEmpToEdit] = useState(null);
  const [empToDelete, setEmpToDelete] = useState(null);
  const [filteredEmps, setFilteredEmps] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    cnic: '',
    designation: 'Milker',
    joiningDate: new Date().toISOString().slice(0, 10),
    salary: 800,
    status: 'Active',
    address: '',
    bankName: '',
    accountTitle: '',
    accountNumber: '',
    iban: '',
    notes: ''
  });

  const handleOpenForm = (emp = null) => {
    if (emp) {
      setEmpToEdit(emp);
      setFormData({
        name: emp.name || '',
        phone: emp.phone || '',
        email: emp.email || '',
        cnic: emp.cnic || '',
        designation: emp.designation || emp.role || 'Milker',
        joiningDate: emp.joiningDate || emp.joinDate || new Date().toISOString().slice(0, 10),
        salary: emp.salary ?? emp.monthlySalary ?? 800,
        status: emp.status || 'Active',
        address: emp.address || '',
        bankName: emp.bankName || '',
        accountTitle: emp.accountTitle || emp.name || '',
        accountNumber: emp.accountNumber || '',
        iban: emp.iban || '',
        notes: emp.notes || ''
      });
    } else {
      setEmpToEdit(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        cnic: '',
        designation: 'Milker',
        joiningDate: new Date().toISOString().slice(0, 10),
        salary: 800,
        status: 'Active',
        address: '',
        bankName: '',
        accountTitle: '',
        accountNumber: '',
        iban: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (empToEdit) {
      updateEmployee(empToEdit.id, formData);
    } else {
      addEmployee(formData);
    }
    setIsModalOpen(false);
  };

  const totalPayroll = useMemo(() => {
    return employees.reduce((sum, e) => sum + Number(e.salary ?? e.monthlySalary ?? e.baseSalary ?? e.basicSalary ?? 0), 0);
  }, [employees]);

  const columns = [
    {
      header: 'Employee Name',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-extrabold text-slate-800">{row.name || row.employeeName || 'Employee'}</div>
          <div className="text-[11px] text-slate-400 font-medium">{row.phone} • {row.email || 'No email'}</div>
        </div>
      )
    },
    {
      header: 'Designation',
      key: 'designation',
      sortable: true,
      render: (row) => <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full">{row.designation || row.role || 'Staff'}</span>
    },
    {
      header: 'Monthly Salary',
      key: 'salary',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-800">{formatCurrency(row.salary ?? row.monthlySalary ?? row.baseSalary ?? row.basicSalary ?? 0, settings.currency)}</span>
    },
    {
      header: 'Today Attendance',
      key: 'attendanceToday',
      sortable: true,
      render: (row) => <Badge status={row.attendanceToday || 'Present'} />
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      render: (row) => <Badge status={row.status} />
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handleOpenForm(row)}
            className="p-1.5 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-lg"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setEmpToDelete(row)}
            className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
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
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Employee Directory & Attendance</h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage farm workers, herdsmen, salaries, and daily attendance logs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportButton
            data={filteredEmps.length > 0 ? filteredEmps : employees}
            filename="employees.csv"
            columns={[
              { header: 'Employee Name', key: 'name' },
              { header: 'Designation', key: 'designation' },
              { header: 'Phone', key: 'phone' },
              { header: 'Email', key: 'email' },
              { header: 'CNIC / National ID', key: 'cnic' },
              { header: 'Joining Date', key: 'joiningDate' },
              { header: `Base Salary (${settings.currency})`, key: 'salary' },
              { header: 'Status', key: 'status' },
              { header: 'Address', key: 'address' },
              { header: 'Notes', key: 'notes' }
            ]}
          />
          <button
            onClick={() => setIsAttendanceOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Mark Daily Attendance</span>
          </button>
          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Farm Staff"
          value={employees.length}
          subtext="Active workforce"
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Present Today"
          value={employees.filter(e => e.attendanceToday === 'Present').length}
          subtext="Marked on duty"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Monthly Payroll"
          value={formatCurrency(totalPayroll, settings.currency)}
          subtext="Monthly salaries"
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={employees}
        searchPlaceholder="Search employee name, designation, phone..."
        emptyMessage="No employees found"
        filterOptions={[
          { key: 'designation', label: 'Designation', options: ['Farm Manager', 'Veterinary Assistant', 'Head Milker', 'Herdsman', 'Milker'] },
          { key: 'status', label: 'Status', options: ['Active', 'Inactive'] }
        ]}
        initialSortColumn="name"
        onFilteredDataChange={setFilteredEmps}
      />

      {/* Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={empToEdit ? "Edit Employee Profile" : "Register New Employee"}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rashid Mahmood"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Designation</label>
              <select
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              >
                <option value="Farm Manager">Farm Manager</option>
                <option value="Veterinary Assistant">Veterinary Assistant</option>
                <option value="Head Milker">Head Milker</option>
                <option value="Milker">Milker</option>
                <option value="Herdsman">Herdsman</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Salary ({settings.currency})</label>
              <input
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 555-0000"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="worker@farm.com"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CNIC / Govt ID</label>
              <input
                type="text"
                value={formData.cnic}
                onChange={(e) => setFormData({ ...formData, cnic: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Joining Date</label>
              <input
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {/* Bank Details for Salary Transfer */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Bank Details (For Salary Transfer)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                <select
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                >
                  <option value="">-- Select Bank --</option>
                  {COMMON_BANKS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Title</label>
                <input
                  type="text"
                  value={formData.accountTitle}
                  onChange={(e) => setFormData({ ...formData, accountTitle: e.target.value })}
                  placeholder={formData.name || "Employee Account Title"}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Number</label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="e.g. 00427901234503"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">IBAN Number</label>
                <input
                  type="text"
                  value={formData.iban}
                  onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                  placeholder="e.g. PK36MEZN0001234567890123"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl font-mono uppercase"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs"
            >
              {empToEdit ? "Update Profile" : "Save Employee"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Attendance Modal */}
      <AttendanceModal
        isOpen={isAttendanceOpen}
        onClose={() => setIsAttendanceOpen(false)}
      />

      {/* Delete Confirmation */}
      {empToDelete && (
        <ConfirmDialog
          isOpen={!!empToDelete}
          onClose={() => setEmpToDelete(null)}
          onConfirm={() => deleteEmployee(empToDelete.id)}
          title={`Delete ${empToDelete.name}`}
          message={`Are you sure you want to remove ${empToDelete.name} from staff directory?`}
        />
      )}
    </div>
  );
};
