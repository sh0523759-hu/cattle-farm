import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { useFarm } from '../../context/FarmContext';
import { Upload, Image as ImageIcon, Check } from 'lucide-react';

const DEFAULT_ANIMAL_TYPES = ["Cow", "Buffalo", "Goat", "Sheep", "Calf", "Bull"];
const DEFAULT_BREEDS = ["Holstein Friesian", "Sahiwal", "Nili Ravi", "Jersey", "Cholistani", "Teddy Goat", "Beetal Goat", "Kamori Goat", "Kajli Sheep", "Lahi Sheep", "Crossbreed"];

export const AnimalFormModal = ({ isOpen, onClose, animalToEdit = null }) => {
  const { settings, addAnimal, updateAnimal } = useFarm();

  const animalTypesList = (settings?.animalTypes && settings.animalTypes.includes('Goat')) 
    ? settings.animalTypes 
    : DEFAULT_ANIMAL_TYPES;

  const breedsList = (settings?.breeds && settings.breeds.includes('Teddy Goat')) 
    ? settings.breeds 
    : DEFAULT_BREEDS;

  const [formData, setFormData] = useState({
    tagNo: '',
    name: '',
    type: 'Cow',
    breed: 'Holstein Friesian',
    gender: 'Female',
    dob: '',
    weight: 450,
    color: 'Black & White',
    purchaseDate: '',
    purchasePrice: 0,
    status: 'Active',
    healthStatus: 'Healthy',
    motherId: '',
    fatherId: '',
    dailyAvgMilk: 0,
    notes: '',
    image: 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?auto=format&fit=crop&q=80&w=400'
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (animalToEdit) {
      setFormData(animalToEdit);
    } else {
      setFormData({
        tagNo: `COW-${Math.floor(100 + Math.random() * 900)}`,
        name: '',
        type: 'Cow',
        breed: 'Holstein Friesian',
        gender: 'Female',
        dob: new Date().toISOString().slice(0, 10),
        weight: 450,
        color: 'Black & White',
        purchaseDate: new Date().toISOString().slice(0, 10),
        purchasePrice: 1500,
        status: 'Active',
        healthStatus: 'Healthy',
        motherId: '',
        fatherId: '',
        dailyAvgMilk: 18,
        notes: '',
        image: 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?auto=format&fit=crop&q=80&w=400'
      });
    }
    setErrors({});
  }, [animalToEdit, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'gender' && value === 'Male') {
        updated.dailyAvgMilk = 0;
      }
      return updated;
    });
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('File size is too large. Please select an image under 8MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setFormData(prev => ({ ...prev, image: uploadEvent.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Animal name is required';
    if (formData.weight < 0) newErrors.weight = 'Weight cannot be negative';
    if (formData.purchasePrice < 0) newErrors.purchasePrice = 'Price cannot be negative';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const generatedTag = formData.tagNo || animalToEdit?.tagNo || `${(formData.type || 'COW').toUpperCase().slice(0, 3)}-${Math.floor(100 + Math.random() * 900)}`;

    const dataToSave = {
      ...formData,
      tagNo: generatedTag,
      dailyAvgMilk: formData.gender === 'Male' ? 0 : Number(formData.dailyAvgMilk || 0)
    };

    if (animalToEdit) {
      updateAnimal(animalToEdit.id, dataToSave);
    } else {
      addAnimal(dataToSave);
    }
    onClose();
  };

  const sampleImages = [
    { label: 'Cow 1', url: 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?auto=format&fit=crop&q=80&w=400' },
    { label: 'Cow 2', url: 'https://images.unsplash.com/photo-1570042707220-41d3b070498b?auto=format&fit=crop&q=80&w=400' },
    { label: 'Buffalo 1', url: 'https://images.unsplash.com/photo-1596733430284-f7437764b1a9?auto=format&fit=crop&q=80&w=400' },
    { label: 'Calf 1', url: 'https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&q=80&w=400' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={animalToEdit ? `Edit Animal - ${animalToEdit.tagNo}` : "Register New Animal"}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Animal Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Daisy"
              className={`w-full px-3 py-2 text-xs border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden ${
                errors.name ? 'border-rose-500 bg-rose-50' : 'border-slate-200'
              }`}
            />
            {errors.name && <p className="text-[10px] text-rose-500 mt-0.5">{errors.name}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Animal Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
            >
              {animalTypesList.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Breed */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Breed</label>
            <select
              name="breed"
              value={formData.breed}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
            >
              {breedsList.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
            >
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </div>

          {/* Weight */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Weight ({settings.weightUnit || 'Kilogram'})</label>
            <input
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Color / Marking</label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              placeholder="e.g. Black & White"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Current Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
            >
              <option value="Active">Active</option>
              <option value="Pregnant">Pregnant</option>
              <option value="Dry">Dry</option>
              <option value="Sold">Sold</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Health Status */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Health Status</label>
            <select
              name="healthStatus"
              value={formData.healthStatus}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
            >
              <option value="Healthy">Healthy</option>
              <option value="Sick">Sick</option>
              <option value="Under Treatment">Under Treatment</option>
            </select>
          </div>

          {/* Purchase Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Date</label>
            <input
              type="date"
              name="purchaseDate"
              value={formData.purchaseDate}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
            />
          </div>

          {/* Purchase Price */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Purchase Price ({settings.currency})</label>
            <input
              type="number"
              name="purchasePrice"
              value={formData.purchasePrice}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
            />
          </div>

          {/* Daily Avg Milk - Only shown for Female animals */}
          {formData.gender === 'Female' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Daily Avg Yield ({settings.milkUnit || 'Liter'})</label>
              <input
                type="number"
                step="0.5"
                name="dailyAvgMilk"
                value={formData.dailyAvgMilk}
                onChange={handleChange}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>
          )}
        </div>

        {/* Image Selection - System File Upload ONLY */}
        <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
          <label className="block text-xs font-bold text-slate-800">Animal Photo</label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Image Preview */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border-2 border-emerald-500/30 shadow-xs flex-shrink-0 relative">
              <img
                src={formData.image || 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?auto=format&fit=crop&q=80&w=400'}
                alt="Animal preview"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 space-y-1.5 w-full">
              {/* System Upload Button */}
              <div>
                <label className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center space-x-2 shadow-xs">
                  <Upload className="w-4 h-4 text-emerald-200" />
                  <span>Upload Photo from System / Computer</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Select JPG, PNG, WEBP photo directly from your device</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Description</label>
          <textarea
            name="notes"
            rows="2"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Behavioral traits, special diets, or medical history..."
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
          ></textarea>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs transition-colors"
          >
            {animalToEdit ? "Update Animal" : "Save Animal"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
