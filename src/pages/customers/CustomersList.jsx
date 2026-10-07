import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { DataTable } from '../../components/common/DataTable';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ExportButton } from '../../components/common/ExportButton';
import { formatCurrency } from '../../utils/formatters';
import { UserCheck, PlusCircle, Edit, Trash2, DollarSign } from 'lucide-react';

export const CustomersList = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, settings } = useFarm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [custToEdit, setCustToEdit] = useState(null);
  const [custToDelete, setCustToDelete] = useState(null);
  const [filteredCusts, setFilteredCusts] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    milkQtyDaily: 20,
    pricePerLiter: 1.25,
    balance: 0.00,
    notes: ''
  });

  const handleOpenForm = (cust = null) => {
    if (cust) {
      setCustToEdit(cust);
      setFormData(cust);
    } else {
      setCustToEdit(null);
      setFormData({
        name: '',
        phone: '',
        address: '',
        milkQtyDaily: 20,
        pricePerLiter: 1.25,
        balance: 0.00,
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (custToEdit) {
      updateCustomer(custToEdit.id, formData);
    } else {
      addCustomer(formData);
    }
    setIsModalOpen(false);
  };

  const totalOutstanding = customers.reduce((sum, c) => sum + Number(c.balance ?? c.totalBalance ?? 0), 0);

  const columns = [
    {
      header: 'Buyer Name',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-extrabold text-slate-800">{row.name || row.customerName || 'Customer'}</div>
          <div className="text-[11px] text-slate-400 font-medium">{row.phone} • {row.address}</div>
        </div>
      )
    },
    {
      header: 'Daily Quota',
      key: 'milkQtyDaily',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-700">{row.milkQtyDaily ?? row.dailyMilkQty ?? 0} {settings.milkUnit || 'Liter'}/day</span>
    },
    {
      header: `Price / ${settings.milkUnit || 'Liter'}`,
      key: 'pricePerLiter',
      sortable: true,
      render: (row) => <span className="font-semibold text-slate-700">{formatCurrency(row.pricePerLiter ?? row.dailyMilkRate ?? row.milkRate ?? 0, settings.currency)}</span>
    },
    {
      header: 'Outstanding Balance',
      key: 'balance',
      sortable: true,
      render: (row) => (
        <span className={`font-extrabold ${Number(row.balance ?? row.totalBalance ?? 0) > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
          {formatCurrency(row.balance ?? row.totalBalance ?? 0, settings.currency)}
        </span>
      )
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
            onClick={() => setCustToDelete(row)}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Customer Directory & Milk Buyers</h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage buyer contracts, daily milk quotas, pricing per liter, and outstanding balances
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <ExportButton
            data={filteredCusts.length > 0 ? filteredCusts : customers}
            filename="customers.csv"
            columns={[
              { header: 'Customer / Buyer Name', key: 'name' },
              { header: 'Phone', key: 'phone' },
              { header: 'Address', key: 'address' },
              { header: `Daily Milk Quota (${settings.milkUnit || 'Liter'})`, key: 'milkQtyDaily' },
              { header: `Price Per Liter (${settings.currency})`, key: 'pricePerLiter' },
              { header: `Outstanding Balance (${settings.currency})`, key: 'balance' },
              { header: 'Notes', key: 'notes' }
            ]}
          />

          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Milk Buyer</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Milk Buyers"
          value={customers.length}
          subtext="Regular clients"
          icon={UserCheck}
          color="emerald"
        />
        <StatCard
          title="Total Daily Quota"
          value={`${customers.reduce((sum, c) => sum + Number(c.milkQtyDaily || 0), 0)} ${settings.milkUnit || 'Liter'}`}
          subtext="Contracted daily supply"
          icon={UserCheck}
          color="blue"
        />
        <StatCard
          title="Total Outstanding Receivables"
          value={formatCurrency(totalOutstanding, settings.currency)}
          subtext={totalOutstanding > 0 ? "Pending buyer payments" : "All accounts clear"}
          icon={DollarSign}
          color={totalOutstanding > 0 ? "amber" : "emerald"}
        />
      </div>

      <DataTable
        columns={columns}
        data={customers}
        searchPlaceholder="Search buyer name, phone..."
        emptyMessage="No customer buyers registered"
        initialSortColumn="name"
        onFilteredDataChange={setFilteredCusts}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={custToEdit ? "Edit Customer Buyer" : "Add Milk Buyer"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Customer / Company Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Fresh Pure Dairy Ltd"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Daily Quota ({settings.milkUnit || 'Liter'})</label>
              <input
                type="number"
                value={formData.milkQtyDaily}
                onChange={(e) => setFormData({ ...formData, milkQtyDaily: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Price / {settings.milkUnit || 'Liter'} ({settings.currency})</label>
              <input
                type="number"
                step="0.05"
                value={formData.pricePerLiter}
                onChange={(e) => setFormData({ ...formData, pricePerLiter: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Outstanding Balance ({settings.currency})</label>
              <input
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Address"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
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
              {custToEdit ? "Update Customer" : "Save Customer"}
            </button>
          </div>
        </form>
      </Modal>

      {custToDelete && (
        <ConfirmDialog
          isOpen={!!custToDelete}
          onClose={() => setCustToDelete(null)}
          onConfirm={() => deleteCustomer(custToDelete.id)}
          title={`Delete ${custToDelete.name}`}
          message={`Are you sure you want to remove buyer ${custToDelete.name}?`}
        />
      )}
    </div>
  );
};
