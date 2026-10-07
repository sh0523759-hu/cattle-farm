import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { DataTable } from '../../components/common/DataTable';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ExportButton } from '../../components/common/ExportButton';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { Wrench, PlusCircle, Edit, Trash2, AlertTriangle } from 'lucide-react';

export const EquipmentList = () => {
  const { equipment, addEquipment, updateEquipment, deleteEquipment, settings } = useFarm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eqpToEdit, setEqpToEdit] = useState(null);
  const [eqpToDelete, setEqpToDelete] = useState(null);
  const [filteredEqp, setFilteredEqp] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Milking Equipment',
    purchaseDate: new Date().toISOString().slice(0, 10),
    purchasePrice: 1500,
    condition: 'Good',
    lastMaintenance: new Date().toISOString().slice(0, 10),
    nextMaintenance: '',
    notes: ''
  });

  const handleOpenForm = (eqp = null) => {
    if (eqp) {
      setEqpToEdit(eqp);
      setFormData(eqp);
    } else {
      setEqpToEdit(null);
      setFormData({
        name: '',
        category: 'Milking Equipment',
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchasePrice: 1500,
        condition: 'Good',
        lastMaintenance: new Date().toISOString().slice(0, 10),
        nextMaintenance: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (eqpToEdit) {
      updateEquipment(eqpToEdit.id, formData);
    } else {
      addEquipment(formData);
    }
    setIsModalOpen(false);
  };

  const totalValue = equipment.reduce((sum, e) => sum + Number(e.purchasePrice || e.purchaseCost || e.cost || 0), 0);

  const columns = [
    {
      header: 'Equipment Name',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div className="font-extrabold text-slate-800 flex items-center space-x-2">
          <Wrench className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{row.name || row.equipmentName || 'Equipment'}</span>
        </div>
      )
    },
    {
      header: 'Category',
      key: 'category',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
          {row.category}
        </span>
      )
    },
    {
      header: 'Condition',
      key: 'condition',
      sortable: true,
      render: (row) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
          row.condition === 'Excellent' || row.condition === 'Good'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-amber-50 text-amber-800 border border-amber-200'
        }`}>
          {row.condition}
        </span>
      )
    },
    {
      header: 'Purchase Price',
      key: 'purchasePrice',
      sortable: true,
      render: (row) => <span className="font-semibold text-slate-700">{formatCurrency(row.purchasePrice ?? row.purchaseCost ?? row.cost ?? 0, settings.currency)}</span>
    },
    {
      header: 'Last Maintenance',
      key: 'lastMaintenance',
      sortable: true,
      render: (row) => <span className="text-slate-600">{formatDate(row.lastMaintenance)}</span>
    },
    {
      header: 'Next Maintenance',
      key: 'nextMaintenance',
      sortable: true,
      render: (row) => <span className="font-bold text-amber-700">{formatDate(row.nextMaintenance)}</span>
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
            onClick={() => setEqpToDelete(row)}
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
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Equipment & Machinery</h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage milking machines, chillers, tractors, feed mills, and maintenance schedules
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <ExportButton
            data={filteredEqp.length > 0 ? filteredEqp : equipment}
            filename="equipment.csv"
            columns={[
              { header: 'Equipment Name', key: 'name' },
              { header: 'Category', key: 'category' },
              { header: 'Condition', key: 'condition' },
              { header: `Purchase Price (${settings.currency})`, key: 'purchasePrice' },
              { header: 'Purchase Date', key: 'purchaseDate' },
              { header: 'Last Maintenance', key: 'lastMaintenance' },
              { header: 'Next Maintenance', key: 'nextMaintenance' },
              { header: 'Notes', key: 'notes' }
            ]}
          />

          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Equipment</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Equipment Units"
          value={equipment.length}
          subtext="Machines registered"
          icon={Wrench}
          color="emerald"
        />
        <StatCard
          title="Total Equipment Valuation"
          value={formatCurrency(totalValue, settings.currency)}
          subtext="Asset purchase value"
          icon={Wrench}
          color="blue"
        />
        <StatCard
          title="Maintenance Due Soon"
          value={equipment.length > 0 ? "1 Due" : "0 Due"}
          subtext="Routine service"
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      <DataTable
        columns={columns}
        data={equipment}
        searchPlaceholder="Search equipment name, category..."
        emptyMessage="No equipment records found"
        initialSortColumn="name"
        onFilteredDataChange={setFilteredEqp}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={eqpToEdit ? "Edit Equipment" : "Add Equipment"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Equipment Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Milking Machine 4-Bucket"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              >
                <option value="Milking Equipment">Milking Equipment</option>
                <option value="Cooling System">Cooling System</option>
                <option value="Feed Processing">Feed Processing</option>
                <option value="Vehicle">Vehicle</option>
                <option value="General Machine">General Machine</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Condition</label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              >
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Price ({settings.currency})</label>
              <input
                type="number"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Date</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Last Maintenance</label>
              <input
                type="date"
                value={formData.lastMaintenance}
                onChange={(e) => setFormData({ ...formData, lastMaintenance: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Next Maintenance Due</label>
              <input
                type="date"
                value={formData.nextMaintenance}
                onChange={(e) => setFormData({ ...formData, nextMaintenance: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
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
              {eqpToEdit ? "Update Equipment" : "Save Equipment"}
            </button>
          </div>
        </form>
      </Modal>

      {eqpToDelete && (
        <ConfirmDialog
          isOpen={!!eqpToDelete}
          onClose={() => setEqpToDelete(null)}
          onConfirm={() => deleteEquipment(eqpToDelete.id)}
          title={`Delete ${eqpToDelete.name}`}
          message={`Are you sure you want to remove ${eqpToDelete.name}?`}
        />
      )}
    </div>
  );
};
