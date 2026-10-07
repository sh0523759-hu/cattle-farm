import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { useFarm } from '../../context/FarmContext';

export const MilkFormModal = ({ isOpen, onClose, recordToEdit = null }) => {
  const { animals, milkRecords, addMilkRecord, updateMilkRecord, settings } = useFarm();

  // Filter only milk-producing animals (Female, excluding Bull/Male, and excluding Sold Out animals)
  const milkProducingAnimals = React.useMemo(() => {
    return animals.filter(a => {
      const isFemale = a.gender === 'Female';
      const typeLower = (a.type || '').toLowerCase();
      const statusLower = (a.status || '').toLowerCase();
      const isMilkingType = !['bull', 'male calf'].includes(typeLower);
      const isAvailable = !['sold out', 'sold', 'deceased'].includes(statusLower);
      return isFemale && isMilkingType && isAvailable;
    });
  }, [animals]);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    animalTag: '',
    morningQty: 12.0,
    eveningQty: 10.0,
    notes: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (recordToEdit) {
      setFormData(recordToEdit);
    } else {
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        animalTag: milkProducingAnimals.length > 0 ? milkProducingAnimals[0].tagNo : '',
        morningQty: 12.0,
        eveningQty: 10.0,
        notes: ''
      });
    }
    setErrors({});
  }, [recordToEdit, isOpen, milkProducingAnimals]);

  const totalQty = (Number(formData.morningQty || 0) + Number(formData.eveningQty || 0)).toFixed(1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.animalTag) newErrors.animalTag = 'Animal tag is required';
    if (formData.morningQty === '' || Number(formData.morningQty) < 0) {
      newErrors.morningQty = 'Morning milk quantity cannot be negative';
    }
    if (formData.eveningQty === '' || Number(formData.eveningQty) < 0) {
      newErrors.eveningQty = 'Evening milk quantity cannot be negative';
    }

    // Prevent duplicate entries for the same animal tag and date
    const isDuplicate = milkRecords.some(r => 
      r.animalTag === formData.animalTag && 
      r.date === formData.date && 
      (recordToEdit ? (r.id !== recordToEdit.id && r._id !== recordToEdit._id) : true)
    );

    if (isDuplicate) {
      newErrors.animalTag = `A milk record for ${formData.animalTag} on ${formData.date} already exists.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const morning = Number(formData.morningQty || 0);
    const evening = Number(formData.eveningQty || 0);
    const calculatedTotal = Number((morning + evening).toFixed(1));

    const payload = {
      ...formData,
      morningQty: morning,
      eveningQty: evening,
      totalQty: calculatedTotal
    };

    if (recordToEdit) {
      updateMilkRecord(recordToEdit.id || recordToEdit._id, payload);
    } else {
      addMilkRecord(payload);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={recordToEdit ? "Edit Milk Record" : "Record Daily Milk Yield"}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.animalTag && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
            {errors.animalTag}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden ${
                errors.date ? 'border-rose-500 bg-rose-50' : 'border-slate-200'
              }`}
            />
            {errors.date && <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.date}</p>}
          </div>

          {/* Animal Tag */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Milk-Producing Animal *</label>
            <select
              name="animalTag"
              value={formData.animalTag}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden ${
                errors.animalTag ? 'border-rose-500 bg-rose-50' : 'border-slate-200'
              }`}
            >
              <option value="">-- Choose Milking Animal --</option>
              {milkProducingAnimals.map(a => (
                <option key={a.id || a._id || a.tagNo} value={a.tagNo}>
                  {a.tagNo} - {a.name || 'Unnamed'} ({a.type})
                </option>
              ))}
            </select>
          </div>

          {/* Morning Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Morning Milk ({settings.milkUnit || 'Liter'}) *</label>
            <input
              type="number"
              step="0.1"
              min="0"
              name="morningQty"
              value={formData.morningQty}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden ${
                errors.morningQty ? 'border-rose-500 bg-rose-50' : 'border-slate-200'
              }`}
            />
            {errors.morningQty && <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.morningQty}</p>}
          </div>

          {/* Evening Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Evening Milk ({settings.milkUnit || 'Liter'}) *</label>
            <input
              type="number"
              step="0.1"
              min="0"
              name="eveningQty"
              value={formData.eveningQty}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden ${
                errors.eveningQty ? 'border-rose-500 bg-rose-50' : 'border-slate-200'
              }`}
            />
            {errors.eveningQty && <p className="text-[11px] text-rose-500 font-medium mt-1">{errors.eveningQty}</p>}
          </div>

          {/* Calculated Total Display */}
          <div className="sm:col-span-2 bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-900">Total Milk (Morning + Evening):</span>
            <span className="text-base font-extrabold text-emerald-700">{totalQty} {settings.milkUnit || 'Liter'}</span>
          </div>

          {/* Notes */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Observations</label>
            <input
              type="text"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="e.g. Good yield after new alfalfa feed"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs cursor-pointer"
          >
            {recordToEdit ? "Update Record" : "Save Milk Record"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
