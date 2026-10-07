import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { DataTable } from '../../components/common/DataTable';
import { StatCard } from '../../components/common/StatCard';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ExportButton } from '../../components/common/ExportButton';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { Stethoscope, PlusCircle, Edit, Trash2, DollarSign, Activity } from 'lucide-react';

export const HealthList = () => {
  const { healthRecords, animals, addHealthRecord, updateHealthRecord, deleteHealthRecord, settings } = useFarm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState(null);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [filteredHealth, setFilteredHealth] = useState([]);

  const [formData, setFormData] = useState({
    animalTag: '',
    date: new Date().toISOString().slice(0, 10),
    problem: '',
    symptoms: '',
    diagnosis: '',
    treatment: '',
    medicineUsed: '',
    vetName: 'Dr. Sarah Jenkins',
    cost: 50,
    notes: ''
  });

  const handleOpenForm = (record = null) => {
    if (record) {
      setRecordToEdit(record);
      setFormData(record);
    } else {
      setRecordToEdit(null);
      setFormData({
        animalTag: animals.length > 0 ? animals[0].tagNo : '',
        date: new Date().toISOString().slice(0, 10),
        problem: '',
        symptoms: '',
        diagnosis: '',
        treatment: '',
        medicineUsed: '',
        vetName: 'Dr. Sarah Jenkins',
        cost: 50,
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.animalTag || !formData.problem) return;

    if (recordToEdit) {
      updateHealthRecord(recordToEdit.id, formData);
    } else {
      addHealthRecord(formData);
    }
    setIsModalOpen(false);
  };

  const totalCost = healthRecords.reduce((acc, h) => acc + Number(h.cost || 0), 0);
  const sickAnimalsCount = animals.filter(a => a.healthStatus === 'Sick').length;

  const columns = [
    {
      header: 'Date',
      key: 'date',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-800">{formatDate(row.date)}</span>
    },
    {
      header: 'Animal Tag',
      key: 'animalTag',
      sortable: true,
      render: (row) => (
        <span className="font-extrabold text-emerald-800 font-mono px-2 py-0.5 bg-emerald-50 rounded-md">
          {row.animalTag}
        </span>
      )
    },
    {
      header: 'Problem / Disease',
      key: 'problem',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-bold text-rose-700">{row.problem}</div>
          <div className="text-[11px] text-slate-500 font-medium">Symptoms: {row.symptoms || 'N/A'}</div>
        </div>
      )
    },
    {
      header: 'Diagnosis & Treatment',
      key: 'diagnosis',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-800">{row.diagnosis}</div>
          <div className="text-[11px] text-slate-500">{row.treatment} ({row.medicineUsed})</div>
        </div>
      )
    },
    {
      header: 'Vet Name',
      key: 'vetName',
      sortable: true,
      render: (row) => <span className="text-slate-700">{row.vetName}</span>
    },
    {
      header: 'Vet Cost',
      key: 'cost',
      sortable: true,
      render: (row) => <span className="font-bold text-rose-600">{formatCurrency(row.cost, settings.currency)}</span>
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
            onClick={() => setRecordToDelete(row)}
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
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Health & Veterinary Care</h2>
          <p className="text-xs text-slate-500 font-medium">
            Log medical records, diagnoses, treatments, vet visits, and costs
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <ExportButton
            data={filteredHealth.length > 0 ? filteredHealth : healthRecords}
            filename="health-veterinary.csv"
            columns={[
              { header: 'Date', key: 'date' },
              { header: 'Animal Tag', key: 'animalTag' },
              { header: 'Problem / Condition', key: 'problem' },
              { header: 'Symptoms', key: 'symptoms' },
              { header: 'Diagnosis', key: 'diagnosis' },
              { header: 'Treatment', key: 'treatment' },
              { header: 'Medicine Used', key: 'medicineUsed' },
              { header: 'Veterinarian', key: 'vetName' },
              { header: `Cost (${settings.currency})`, key: 'cost' },
              { header: 'Notes', key: 'notes' }
            ]}
          />

          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Health Record</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Medical Logged"
          value={healthRecords.length}
          subtext="Health checkups"
          icon={Stethoscope}
          color="emerald"
        />
        <StatCard
          title="Sick Animals Currently"
          value={sickAnimalsCount}
          subtext={sickAnimalsCount > 0 ? "Under medical observation" : "No sick animals"}
          icon={Activity}
          color={sickAnimalsCount > 0 ? "rose" : "emerald"}
        />
        <StatCard
          title="Cumulative Vet Expenses"
          value={formatCurrency(totalCost, settings.currency)}
          subtext="Total treatment cost"
          icon={DollarSign}
          color="amber"
        />
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={healthRecords}
        searchPlaceholder="Search animal tag, disease, vet..."
        emptyMessage="No health records logged"
        initialSortColumn="date"
        onFilteredDataChange={setFilteredHealth}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={recordToEdit ? "Edit Health Record" : "Add Veterinary Health Record"}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Animal Tag *</label>
              <select
                required
                value={formData.animalTag}
                onChange={(e) => setFormData({ ...formData, animalTag: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              >
                <option value="">-- Choose Animal --</option>
                {animals.map(a => (
                  <option key={a.id} value={a.tagNo}>{a.tagNo} - {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Checkup Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Problem / Disease *</label>
              <input
                type="text"
                required
                value={formData.problem}
                onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                placeholder="e.g. Acute Mastitis, Hoof Rot"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Symptoms</label>
              <input
                type="text"
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                placeholder="e.g. Fever, swelling"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Diagnosis</label>
              <input
                type="text"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                placeholder="Vet diagnosis"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Treatment Plan</label>
              <input
                type="text"
                value={formData.treatment}
                onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                placeholder="e.g. Antibiotics infusion"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Medicine Used</label>
              <input
                type="text"
                value={formData.medicineUsed}
                onChange={(e) => setFormData({ ...formData, medicineUsed: e.target.value })}
                placeholder="e.g. Oxytetracycline"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vet Doctor Name</label>
              <input
                type="text"
                value={formData.vetName}
                onChange={(e) => setFormData({ ...formData, vetName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Treatment Cost ({settings.currency})</label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
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
              {recordToEdit ? "Update Health Record" : "Save Record"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      {recordToDelete && (
        <ConfirmDialog
          isOpen={!!recordToDelete}
          onClose={() => setRecordToDelete(null)}
          onConfirm={() => deleteHealthRecord(recordToDelete.id)}
          title="Delete Medical Record"
          message={`Are you sure you want to delete this medical record for ${recordToDelete.animalTag}?`}
        />
      )}
    </div>
  );
};
