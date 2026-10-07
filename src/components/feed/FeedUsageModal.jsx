import React, { useState, useMemo, useEffect } from 'react';
import { useFarm } from '../../context/FarmContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { Wheat, Search, AlertTriangle, Check, Calendar, Tag, Scale, FileText, Plus, X } from 'lucide-react';
import { formatUnit } from '../../utils/formatters';

export const FeedUsageModal = ({ isOpen, onClose }) => {
  const { animals, feedItems, recordFeedUsage, addFeedItem, settings, showToast } = useFarm();
  const { user } = useAuth();

  const [animalSearch, setAnimalSearch] = useState('');
  const [animalTag, setAnimalTag] = useState('');
  const [feedItemId, setFeedItemId] = useState('');
  const [quantityGiven, setQuantityGiven] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Feed Type inline creator state
  const [isAddingNewFeed, setIsAddingNewFeed] = useState(false);
  const [newFeedName, setNewFeedName] = useState('');
  const [newFeedCategory, setNewFeedCategory] = useState('Green Fodder');
  const [newFeedStock, setNewFeedStock] = useState('');
  const [newFeedUnit, setNewFeedUnit] = useState('Kilogram');
  const [isCreatingFeed, setIsCreatingFeed] = useState(false);

  const feedCategoriesList = useMemo(() => {
    if (settings?.feedCategories && Array.isArray(settings.feedCategories) && settings.feedCategories.length > 0) {
      return settings.feedCategories;
    }
    return ['Green Fodder', 'Silage', 'Hay', 'Grain', 'Concentrate', 'Mineral Mix'];
  }, [settings?.feedCategories]);

  // Filter animals based on search query
  const filteredAnimals = useMemo(() => {
    if (!animalSearch.trim()) return animals;
    const q = animalSearch.toLowerCase();
    return animals.filter(
      a => (a.tagNo && a.tagNo.toLowerCase().includes(q)) || (a.name && a.name.toLowerCase().includes(q))
    );
  }, [animals, animalSearch]);

  // Reset & initialize default selections when modal opens
  useEffect(() => {
    if (isOpen) {
      setDate(new Date().toISOString().slice(0, 10));
      setQuantityGiven('');
      setNotes('');
      setAnimalSearch('');
      setIsAddingNewFeed(false);
      setNewFeedName('');
      setNewFeedStock('');

      if (animals && animals.length > 0) {
        setAnimalTag(animals[0].tagNo);
      } else {
        setAnimalTag('');
      }

      if (feedItems && feedItems.length > 0) {
        setFeedItemId(feedItems[0].id || feedItems[0]._id);
      } else {
        setFeedItemId('');
      }
    }
  }, [isOpen]);

  const selectedAnimal = useMemo(() => {
    if (!animals || animals.length === 0) return null;
    return animals.find(a => a.tagNo === animalTag) || animals[0];
  }, [animals, animalTag]);

  const selectedFeed = useMemo(() => {
    if (!feedItems || feedItems.length === 0) return null;
    return feedItems.find(f => (f.id && f.id === feedItemId) || (f._id && f._id === feedItemId)) || feedItems[0];
  }, [feedItems, feedItemId]);

  const availableStock = selectedFeed ? Number(selectedFeed.quantity || 0) : 0;
  const numQuantity = Number(quantityGiven || 0);
  const isExceedingStock = numQuantity > availableStock;
  const isValidQuantity = numQuantity > 0 && !isExceedingStock;

  // Handle creating a new Feed Type directly from the form
  const handleCreateFeedType = async (e) => {
    e.preventDefault();
    if (!newFeedName.trim()) {
      showToast('Please enter a feed name', 'warning');
      return;
    }
    const initialStock = Number(newFeedStock || 0);
    if (initialStock <= 0) {
      showToast('Please enter initial stock quantity greater than 0', 'warning');
      return;
    }

    setIsCreatingFeed(true);
    try {
      const created = await addFeedItem({
        feedName: newFeedName.trim(),
        category: newFeedCategory,
        quantity: initialStock,
        unit: formatUnit(newFeedUnit || settings?.weightUnit || 'Kilogram'),
        minStock: Math.max(10, Math.floor(initialStock * 0.2)),
        purchasePrice: 0,
        purchaseDate: date || new Date().toISOString().slice(0, 10),
        notes: 'Added from Record Feed Usage form'
      });

      if (created) {
        setFeedItemId(created.id || created._id);
        setIsAddingNewFeed(false);
        setNewFeedName('');
        setNewFeedStock('');
      }
    } finally {
      setIsCreatingFeed(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAnimal || !selectedFeed || !isValidQuantity || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await recordFeedUsage({
        animalTag: selectedAnimal.tagNo,
        animalName: selectedAnimal.name || '',
        feedItemId: selectedFeed.id || selectedFeed._id,
        feedName: selectedFeed.feedName,
        quantityGiven: numQuantity,
        unit: formatUnit(selectedFeed.unit || 'Kilogram'),
        recordedBy: user?.name || 'Admin',
        date,
        notes
      });

      if (success !== false) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Feed Usage"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. Animal Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Tag className="w-3.5 h-3.5 text-emerald-700" />
              <span>Animal (Tag & Name) *</span>
            </span>
            {selectedAnimal && (
              <span className="text-[11px] font-medium text-slate-500">
                Type: {selectedAnimal.type} ({selectedAnimal.breed || 'Standard'})
              </span>
            )}
          </label>

          {/* Quick Search Input */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by tag no or name..."
              value={animalSearch}
              onChange={(e) => setAnimalSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
            />
          </div>

          <select
            value={animalTag || selectedAnimal?.tagNo || ''}
            onChange={(e) => setAnimalTag(e.target.value)}
            required
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden bg-white font-medium text-slate-800"
          >
            {filteredAnimals.length > 0 ? (
              filteredAnimals.map(a => (
                <option key={a.id || a.tagNo} value={a.tagNo}>
                  [{a.tagNo}] {a.name} — {a.type} ({a.healthStatus})
                </option>
              ))
            ) : (
              <option value="" disabled>No animals found matching "{animalSearch}"</option>
            )}
          </select>
        </div>

        {/* 2. Feed Type Selection & Add New Feed Type */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <Wheat className="w-3.5 h-3.5 text-amber-600" />
              <span>Feed Type *</span>
            </label>
            {!isAddingNewFeed && (
              <button
                type="button"
                onClick={() => setIsAddingNewFeed(true)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add New Feed Type</span>
              </button>
            )}
          </div>

          {/* Inline Add New Feed Type Box */}
          {isAddingNewFeed ? (
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3 mb-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
                  <Wheat className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Create New Feed Type</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNewFeed(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                  title="Cancel adding new feed"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Feed Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wheat Bran (Choker)"
                    value={newFeedName}
                    onChange={(e) => setNewFeedName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newFeedCategory}
                    onChange={(e) => setNewFeedCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                  >
                    {feedCategoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Initial Stock Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    required
                    placeholder="e.g. 50"
                    value={newFeedStock}
                    onChange={(e) => setNewFeedStock(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Unit</label>
                  <select
                    value={newFeedUnit}
                    onChange={(e) => setNewFeedUnit(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
                  >
                    <option value="Kilogram">Kilogram</option>
                    <option value="Liter">Liter</option>
                    <option value="Bags">Bags</option>
                    <option value="Bundle">Bundle</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNewFeed(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateFeedType}
                  disabled={isCreatingFeed}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-2xs transition-all flex items-center space-x-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isCreatingFeed ? 'Saving...' : 'Save & Select Feed'}</span>
                </button>
              </div>
            </div>
          ) : (
            <select
              value={feedItemId || selectedFeed?.id || selectedFeed?._id || ''}
              onChange={(e) => {
                if (e.target.value === '__NEW__') {
                  setIsAddingNewFeed(true);
                } else {
                  setFeedItemId(e.target.value);
                }
              }}
              required
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden bg-white font-medium text-slate-800"
            >
              {feedItems.length > 0 ? (
                <>
                  {feedItems.map(f => (
                    <option key={f.id || f._id} value={f.id || f._id}>
                      {f.feedName} — ({f.category}) | Available: {f.quantity} {formatUnit(f.unit || 'Kilogram')}
                    </option>
                  ))}
                  <option value="__NEW__">+ Add New Feed Type...</option>
                </>
              ) : (
                <option value="__NEW__">+ Add New Feed Type (No feed in stock)...</option>
              )}
            </select>
          )}

          {/* Available Stock Indicator */}
          {selectedFeed && !isAddingNewFeed && (
            <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium px-1">
              <span className="text-slate-500">
                Category: <strong className="text-slate-700">{selectedFeed.category}</strong>
              </span>
              <span className={`font-bold ${availableStock <= Number(selectedFeed.minStock || 0) ? 'text-amber-600' : 'text-emerald-700'}`}>
                Available Stock: {availableStock} {formatUnit(selectedFeed.unit || 'Kilogram')}
              </span>
            </div>
          )}
        </div>

        {/* 3. Quantity Given & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5 text-emerald-700" />
              <span>Quantity Given ({formatUnit(selectedFeed?.unit || 'Kilogram')}) *</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max={availableStock > 0 ? availableStock : 0}
              required
              value={quantityGiven}
              onChange={(e) => setQuantityGiven(e.target.value)}
              placeholder={`e.g. 10 ${formatUnit(selectedFeed?.unit || 'Kilogram')}`}
              className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:outline-hidden font-bold ${
                isExceedingStock
                  ? 'border-rose-300 bg-rose-50 text-rose-800 focus:ring-rose-500/20'
                  : 'border-slate-200 focus:ring-emerald-500/20 text-slate-800'
              }`}
            />
            {isExceedingStock && (
              <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>Exceeds available stock ({availableStock} {formatUnit(selectedFeed?.unit || 'Kilogram')}). Allocation prevented.</span>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Date *</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden text-slate-800"
            />
          </div>
        </div>

        {/* 4. Notes (Optional) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Notes (Optional)</span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Morning ration / regular feeding"
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden text-slate-800"
          />
        </div>

        {/* Action Buttons: Simple Cancel / Save */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValidQuantity || isSubmitting || isAddingNewFeed}
            className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer ${
              !isValidQuantity || isSubmitting || isAddingNewFeed
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-emerald-700 hover:bg-emerald-800 active:scale-95'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Save Usage'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FeedUsageModal;
