import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { DataTable } from '../../components/common/DataTable';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { Pill, PlusCircle, Edit, Trash2, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

export const MedicinesList = () => {
  const { medicines, addMedicine, updateMedicine, deleteMedicine, settings } = useFarm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [medToEdit, setMedToEdit] = useState(null);
  const [medToDelete, setMedToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Antibiotic',
    quantity: 5,
    unit: 'Vials',
    purchasePrice: 20.00,
    supplier: 'VetMed Direct',
    purchaseDate: new Date().toISOString().slice(0, 10),
    expiryDate: '',
    notes: ''
  });

  const handleOpenForm = (med = null) => {
    if (med) {
      setMedToEdit(med);
      setFormData(med);
    } else {
      setMedToEdit(null);
      setFormData({
        name: '',
        category: 'Antibiotic',
        quantity: 5,
        unit: 'Vials (100ml)',
        purchasePrice: 25.00,
        supplier: 'VetMed Direct',
        purchaseDate: new Date().toISOString().slice(0, 10),
        expiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (medToEdit) {
      updateMedicine(medToEdit.id, formData);
    } else {
      addMedicine(formData);
    }
    setIsModalOpen(false);
  };

  // Medicine Expiry & Stock status helper
  const getMedStatus = (med) => {
    if (Number(med.quantity) <= 2) return 'Low Stock';
    if (med.expiryDate) {
      const days = Math.ceil((new Date(med.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (days < 0) return 'Expired';
      if (days <= 30) return 'Expiring Soon';
    }
    return 'Available';
  };

  const medStats = useMemo(() => {
    let lowStock = 0;
    let expiringSoon = 0;
    let expired = 0;

    medicines.forEach(m => {
      const st = getMedStatus(m);
      if (st === 'Low Stock') lowStock++;
      if (st === 'Expiring Soon') expiringSoon++;
      if (st === 'Expired') expired++;
    });

    return { total: medicines.length, lowStock, expiringSoon, expired };
  }, [medicines]);

  const columns = [
    {
      header: 'Medicine Name',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-extrabold text-slate-800">{row.name}</div>
          <div className="text-[11px] text-slate-400 font-medium">{row.category} • Supplier: {row.supplier}</div>
        </div>
      )
    },
    {
      header: 'Quantity In Stock',
      key: 'quantity',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-slate-800">
          {row.quantity} {row.unit}
        </span>
      )
    },
    {
      header: 'Unit Price',
      key: 'purchasePrice',
      sortable: true,
      render: (row) => <span className="font-semibold text-slate-700">{formatCurrency(row.purchasePrice, settings.currency)}</span>
    },
    {
      header: 'Expiry Date',
      key: 'expiryDate',
      sortable: true,
      render: (row) => <span className="font-medium text-slate-600">{formatDate(row.expiryDate)}</span>
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <Badge status={getMedStatus(row)} />
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
            onClick={() => setMedToDelete(row)}
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
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Medicine Inventory & Expiry Control</h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage pharmaceutical stock, active antibiotics, dewormers, and expiry warnings
          </p>
        </div>

        <button
          onClick={() => handleOpenForm()}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Medicine</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={medStats.total}
          subtext="In medicine chest"
          icon={Pill}
          color="emerald"
        />
        <StatCard
          title="Low Stock Warning"
          value={medStats.lowStock}
          subtext={medStats.lowStock > 0 ? "Replenish supply" : "Stock healthy"}
          icon={AlertTriangle}
          color={medStats.lowStock > 0 ? "amber" : "slate"}
        />
        <StatCard
          title="Expiring Soon"
          value={medStats.expiringSoon}
          subtext="Expires within 30 days"
          icon={AlertCircle}
          color={medStats.expiringSoon > 0 ? "rose" : "slate"}
        />
        <StatCard
          title="Expired Items"
          value={medStats.expired}
          subtext={medStats.expired > 0 ? "Safe disposal required" : "Zero expired"}
          icon={AlertCircle}
          color={medStats.expired > 0 ? "rose" : "emerald"}
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={medicines}
        searchPlaceholder="Search medicine name, category, supplier..."
        emptyMessage="No medicine inventory found"
        initialSortColumn="name"
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={medToEdit ? "Edit Medicine Record" : "Add Medicine to Inventory"}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Medicine Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Oxytetracycline 200 LA"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              >
                <option value="Antibiotic">Antibiotic</option>
                <option value="Dewormer">Dewormer</option>
                <option value="Treatment">Treatment</option>
                <option value="Supplement">Supplement</option>
                <option value="Vaccine">Vaccine</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="Bottles, Vials, Tubes"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Price ({settings.currency})</label>
              <input
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                placeholder="e.g. VetMed Direct"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
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
              {medToEdit ? "Update Medicine" : "Save Medicine"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      {medToDelete && (
        <ConfirmDialog
          isOpen={!!medToDelete}
          onClose={() => setMedToDelete(null)}
          onConfirm={() => deleteMedicine(medToDelete.id)}
          title={`Delete ${medToDelete.name}`}
          message={`Are you sure you want to delete ${medToDelete.name} from medicine inventory?`}
        />
      )}
    </div>
  );
};
