import React, { useState, useMemo } from 'react';
import { useFarm } from '../../context/FarmContext';
import { DataTable } from '../../components/common/DataTable';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { FeedUsageModal } from '../../components/feed/FeedUsageModal';
import { ExportButton } from '../../components/common/ExportButton';
import { formatDate, formatCurrency, formatUnit } from '../../utils/formatters';
import { Wheat, PlusCircle, Edit, Trash2, AlertTriangle, PackageCheck, History, User } from 'lucide-react';

const DEFAULT_FEED_CATEGORIES = [
  'Green Fodder',
  'Silage',
  'Hay',
  'Grain',
  'Concentrate',
  'Mineral Mix'
];

export const FeedList = () => {
  const { feedItems, feedLogs, addFeedItem, updateFeedItem, deleteFeedItem, deleteFeedLog, settings } = useFarm();

  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'usage'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFeedUsageModalOpen, setIsFeedUsageModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [filteredStock, setFilteredStock] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);

  const categories = useMemo(() => {
    if (settings?.feedCategories && Array.isArray(settings.feedCategories) && settings.feedCategories.length > 0) {
      return settings.feedCategories;
    }
    return DEFAULT_FEED_CATEGORIES;
  }, [settings?.feedCategories]);

  const [formData, setFormData] = useState({
    feedName: '',
    category: 'Green Fodder',
    quantity: 500,
    unit: 'Kilogram',
    minStock: 200,
    purchasePrice: 0.25,
    supplier: '',
    purchaseDate: new Date().toISOString().slice(0, 10),
    expiryDate: '',
    notes: ''
  });

  const handleOpenForm = (item = null) => {
    if (item) {
      setItemToEdit(item);
      setFormData(item);
    } else {
      setItemToEdit(null);
      setFormData({
        feedName: '',
        category: 'Green Fodder',
        quantity: 1000,
        unit: settings.weightUnit || 'Kilogram',
        minStock: 300,
        purchasePrice: 0.30,
        supplier: 'AgriCrop Feeds',
        purchaseDate: new Date().toISOString().slice(0, 10),
        expiryDate: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.feedName.trim()) return;

    if (itemToEdit) {
      updateFeedItem(itemToEdit.id, formData);
    } else {
      addFeedItem(formData);
    }
    setIsModalOpen(false);
  };

  // Stock Metrics
  const feedStats = useMemo(() => {
    const totalKg = feedItems.reduce((acc, f) => acc + Number(f.quantity || 0), 0);
    const lowStockCount = feedItems.filter(f => Number(f.quantity) <= Number(f.minStock)).length;
    const totalValue = feedItems.reduce((acc, f) => acc + (Number(f.quantity || 0) * Number(f.purchasePrice || 0)), 0);

    return { totalKg, lowStockCount, totalValue, totalTypes: feedItems.length };
  }, [feedItems]);

  const columns = [
    {
      header: 'Feed Item',
      key: 'feedName',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-extrabold text-slate-800 flex items-center space-x-2">
            <span>{row.feedName}</span>
            {Number(row.quantity) <= Number(row.minStock) && (
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-md flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>Low Stock</span>
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">{row.category} • Supplier: {row.supplier || 'N/A'}</div>
        </div>
      )
    },
    {
      header: 'Category',
      key: 'category',
      sortable: true,
      render: (row) => <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">{row.category}</span>
    },
    {
      header: 'Stock Level',
      key: 'quantity',
      sortable: true,
      render: (row) => (
        <div>
          <span className={`font-bold ${Number(row.quantity) <= Number(row.minStock) ? 'text-amber-600' : 'text-slate-800'}`}>
            {row.quantity} {formatUnit(row.unit || settings.weightUnit || 'Kilogram')}
          </span>
          <div className="text-[10px] text-slate-400">Min Threshold: {row.minStock} {formatUnit(row.unit || settings.weightUnit || 'Kilogram')}</div>
        </div>
      )
    },
    {
      header: 'Unit Price',
      key: 'purchasePrice',
      sortable: true,
      render: (row) => <span className="font-semibold text-slate-700">{formatCurrency(row.purchasePrice, settings.currency)}/{formatUnit(row.unit || settings.weightUnit || 'Kilogram')}</span>
    },
    {
      header: 'Purchase Date',
      key: 'purchaseDate',
      sortable: true,
      render: (row) => <span className="text-slate-600">{formatDate(row.purchaseDate)}</span>
    },
    {
      header: 'Expiry Date',
      key: 'expiryDate',
      sortable: true,
      render: (row) => <span className="text-slate-600">{formatDate(row.expiryDate)}</span>
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

  const usageColumns = [
    {
      header: 'Date',
      key: 'date',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-800">{formatDate(row.date)}</span>
    },
    {
      header: 'Animal',
      key: 'animalTag',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-extrabold text-emerald-800 font-mono">{row.animalTag}</span>
          {row.animalName && <span className="ml-1 text-slate-700 font-bold">({row.animalName})</span>}
        </div>
      )
    },
    {
      header: 'Feed Type',
      key: 'feedName',
      sortable: true,
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          {row.feedName}
        </span>
      )
    },
    {
      header: 'Quantity Given',
      key: 'quantityGiven',
      sortable: true,
      render: (row) => (
        <span className="font-extrabold text-emerald-700 font-mono text-sm">
          {row.quantityGiven} {formatUnit(row.unit || settings.weightUnit || 'Kilogram')}
        </span>
      )
    },
    {
      header: 'Recorded By',
      key: 'recordedBy',
      sortable: true,
      render: (row) => <span className="font-semibold text-slate-600">{row.recordedBy || 'Admin'}</span>
    },
    {
      header: 'Notes',
      key: 'notes',
      render: (row) => <span className="text-slate-500 italic text-xs">{row.notes || '-'}</span>
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (row) => (
        <button
          onClick={() => deleteFeedLog(row.id || row._id)}
          className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
          title="Delete record"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Feed Management & Stock</h2>
          <p className="text-xs text-slate-500 font-medium">
            Monitor fodder, silage, concentrates, low-stock warnings, purchase costs and animal feed usage history
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <ExportButton
            data={activeTab === 'stock' ? (filteredStock.length ? filteredStock : feedItems) : (filteredLogs.length ? filteredLogs : (feedLogs || []))}
            filename={activeTab === 'stock' ? 'feed-stock.csv' : 'feed-usage.csv'}
            columns={activeTab === 'stock' ? [
              { header: 'Feed Name', key: 'feedName' },
              { header: 'Category', key: 'category' },
              { header: `Quantity (${settings.weightUnit || 'Kilogram'})`, key: 'quantity' },
              { header: `Min Stock (${settings.weightUnit || 'Kilogram'})`, key: 'minStock' },
              { header: `Purchase Price (${settings.currency})`, key: 'purchasePrice' },
              { header: 'Supplier', key: 'supplier' },
              { header: 'Purchase Date', key: 'purchaseDate' },
              { header: 'Expiry Date', key: 'expiryDate' },
              { header: 'Notes', key: 'notes' }
            ] : [
              { header: 'Date', key: 'date' },
              { header: 'Animal Tag', key: 'animalTag' },
              { header: 'Feed Name', key: 'feedName' },
              { header: `Quantity Given (${settings.weightUnit || 'Kilogram'})`, key: 'quantityGiven' },
              { header: 'Recorded By', key: 'recordedBy' },
              { header: 'Notes', key: 'notes' }
            ]}
          />

          <button
            onClick={() => setIsFeedUsageModalOpen(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <Wheat className="w-4 h-4" />
            <span>Record Feed Usage</span>
          </button>

          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Feed Stock</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Stock On Hand"
          value={`${feedStats.totalKg.toLocaleString()} ${settings.weightUnit || 'Kilogram'}`}
          subtext={`Across ${feedStats.totalTypes} feed types`}
          icon={Wheat}
          color="emerald"
        />
        <StatCard
          title="Low Stock Items"
          value={feedStats.lowStockCount}
          subtext={feedStats.lowStockCount > 0 ? "Reorder recommended" : "All stocks healthy"}
          icon={AlertTriangle}
          color={feedStats.lowStockCount > 0 ? "amber" : "emerald"}
        />
        <StatCard
          title="Total Inventory Valuation"
          value={formatCurrency(feedStats.totalValue, settings.currency)}
          subtext="Purchase value"
          icon={PackageCheck}
          color="blue"
        />
        <StatCard
          title="Total Feed Consumed"
          value={`${(feedLogs || []).reduce((sum, l) => sum + Number(l.quantityGiven || 0), 0).toLocaleString()} ${settings.weightUnit || 'Kilogram'}`}
          subtext={`${(feedLogs || []).length} feed logs recorded`}
          icon={History}
          color="purple"
        />
      </div>

      {/* View Toggle Tabs */}
      <div className="flex space-x-1 bg-slate-200/60 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('stock')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'stock'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <PackageCheck className="w-3.5 h-3.5" />
          <span>Feed Stock Inventory</span>
          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px]">
            {feedItems.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('usage')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'usage'
              ? 'bg-white text-emerald-800 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Feed Usage History</span>
          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px]">
            {(feedLogs || []).length}
          </span>
        </button>
      </div>

      {/* Table */}
      {activeTab === 'stock' ? (
        <DataTable
          columns={columns}
          data={feedItems}
          searchPlaceholder="Search feed name, category, supplier..."
          emptyMessage="No feed items registered"
          filterOptions={[
            { key: 'category', label: 'Category', options: categories }
          ]}
          initialSortColumn="feedName"
          onFilteredDataChange={setFilteredStock}
        />
      ) : (
        <DataTable
          columns={usageColumns}
          data={feedLogs || []}
          searchPlaceholder="Search by animal tag, feed name, recorded by..."
          emptyMessage="No feed usage records logged yet"
          initialSortColumn="date"
          onFilteredDataChange={setFilteredLogs}
        />
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={itemToEdit ? "Edit Feed Stock Item" : "Add New Feed Stock Item"}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Feed Item Name *</label>
              <input
                type="text"
                required
                value={formData.feedName}
                onChange={(e) => setFormData({ ...formData, feedName: e.target.value })}
                placeholder="e.g. Alfalfa Green Fodder"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
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
                placeholder="Kilogram, bales, bags"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Min Stock Warning Level</label>
              <input
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit Price ({settings.currency})</label>
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
                placeholder="Supplier name"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Date</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
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
              {itemToEdit ? "Update Stock" : "Save Feed Stock"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Feed Usage Modal */}
      <FeedUsageModal
        isOpen={isFeedUsageModalOpen}
        onClose={() => setIsFeedUsageModalOpen(false)}
      />

      {/* Delete Confirmation */}
      {itemToDelete && (
        <ConfirmDialog
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={() => deleteFeedItem(itemToDelete.id)}
          title={`Delete Feed ${itemToDelete.feedName}`}
          message={`Are you sure you want to remove ${itemToDelete.feedName} from feed inventory?`}
        />
      )}
    </div>
  );
};
