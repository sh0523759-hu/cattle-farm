import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { DataTable } from '../../components/common/DataTable';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ExportButton } from '../../components/common/ExportButton';
import { formatCurrency } from '../../utils/formatters';
import { Package, PlusCircle, Edit, Trash2, AlertTriangle } from 'lucide-react';

export const InventoryList = () => {
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, settings } = useFarm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [filteredInv, setFilteredInv] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Equipment',
    quantity: 10,
    unit: 'Pcs',
    minStock: 5,
    purchasePrice: 50,
    supplier: '',
    location: 'Main Barn'
  });

  const handleOpenForm = (item = null) => {
    if (item) {
      setItemToEdit(item);
      setFormData(item);
    } else {
      setItemToEdit(null);
      setFormData({
        name: '',
        category: 'Equipment',
        quantity: 10,
        unit: 'Pcs',
        minStock: 5,
        purchasePrice: 50,
        supplier: '',
        location: 'Main Barn'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (itemToEdit) {
      updateInventoryItem(itemToEdit.id, formData);
    } else {
      addInventoryItem(formData);
    }
    setIsModalOpen(false);
  };

  const columns = [
    {
      header: 'Item Name',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-extrabold text-slate-800 flex items-center space-x-2">
            <span>{row.name || row.itemName || 'Inventory Item'}</span>
            {Number(row.quantity ?? row.stockQty ?? 0) <= Number(row.minStock ?? row.reorderLevel ?? 5) && (
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">Low Stock</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Location: {row.location || 'Store'}</div>
        </div>
      )
    },
    {
      header: 'Category',
      key: 'category',
      sortable: true,
      render: (row) => <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full border">{row.category || 'General'}</span>
    },
    {
      header: 'Stock Level',
      key: 'quantity',
      sortable: true,
      render: (row) => {
        const qty = row.quantity ?? row.stockQty ?? 0;
        const min = row.minStock ?? row.reorderLevel ?? 5;
        return (
          <span className={`font-bold ${Number(qty) <= Number(min) ? 'text-amber-600' : 'text-slate-800'}`}>
            {qty} {row.unit || 'Piece'}
          </span>
        );
      }
    },
    {
      header: 'Unit Price',
      key: 'purchasePrice',
      sortable: true,
      render: (row) => <span className="font-semibold text-slate-700">{formatCurrency(row.purchasePrice ?? row.unitPrice ?? row.cost ?? 0, settings.currency)}</span>
    },
    {
      header: 'Supplier',
      key: 'supplier',
      sortable: true,
      render: (row) => <span className="text-slate-600">{row.supplier || 'N/A'}</span>
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
            onClick={() => setItemToDelete(row)}
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
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">General Farm Inventory</h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage general supplies, tools, cleaning solutions, and farm assets
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <ExportButton
            data={filteredInv.length > 0 ? filteredInv : inventory}
            filename="inventory.csv"
            columns={[
              { header: 'Item Name', key: 'name' },
              { header: 'Category', key: 'category' },
              { header: 'Quantity', key: 'quantity' },
              { header: 'Unit', key: 'unit' },
              { header: 'Min Stock Alert', key: 'minStock' },
              { header: `Purchase Price (${settings.currency})`, key: 'purchasePrice' },
              { header: 'Supplier', key: 'supplier' },
              { header: 'Location', key: 'location' }
            ]}
          />

          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Inventory Item</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title="Total Registered Items"
          value={inventory.length}
          subtext="Supplies & tools"
          icon={Package}
          color="emerald"
        />
        <StatCard
          title="Low Stock Warning"
          value={inventory.filter(i => Number(i.quantity ?? i.stockQty ?? 0) <= Number(i.minStock ?? i.reorderLevel ?? 5)).length}
          subtext="Reorder threshold"
          icon={AlertTriangle}
          color="amber"
        />
      </div>

      <DataTable
        columns={columns}
        data={inventory}
        searchPlaceholder="Search inventory item, supplier..."
        emptyMessage="No inventory items found"
        filterOptions={[
          { key: 'category', label: 'Category', options: ['Equipment', 'Cleaning Supplies', 'Tools', 'Feed', 'Other'] }
        ]}
        initialSortColumn="name"
        onFilteredDataChange={setFilteredInv}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={itemToEdit ? "Edit Inventory Item" : "Add Inventory Item"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Item Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Milk Cans"
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
                <option value="Equipment">Equipment</option>
                <option value="Cleaning Supplies">Cleaning Supplies</option>
                <option value="Tools">Tools</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="Pcs, Gallons"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Min Stock Warning</label>
              <input
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
              />
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Supplier</label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
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
              {itemToEdit ? "Update Item" : "Save Item"}
            </button>
          </div>
        </form>
      </Modal>

      {itemToDelete && (
        <ConfirmDialog
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={() => deleteInventoryItem(itemToDelete.id)}
          title={`Delete ${itemToDelete.name}`}
          message={`Are you sure you want to delete ${itemToDelete.name}?`}
        />
      )}
    </div>
  );
};
