import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { DataTable } from '../../components/common/DataTable';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ExportButton } from '../../components/common/ExportButton';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { Syringe, PlusCircle, Edit, Trash2, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const VaccinationsList = () => {
  const { vaccinations, animals, addVaccination, updateVaccination, deleteVaccination, settings } = useFarm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vacToEdit, setVacToEdit] = useState(null);
  const [vacToDelete, setVacToDelete] = useState(null);
  const [filteredVac, setFilteredVac] = useState([]);

  const [formData, setFormData] = useState({
    animalTag: '',
    vaccineName: 'FMD (Foot & Mouth Disease)',
    vaccinationDate: new Date().toISOString().slice(0, 10),
    nextDueDate: '',
    vetName: 'Dr. Sarah Jenkins',
    cost: 0,
    status: 'Completed',
    notes: ''
  });

  const handleOpenForm = (vac = null) => {
    if (vac) {
      setVacToEdit(vac);
      setFormData(vac);
    } else {
      setVacToEdit(null);
      setFormData({
        animalTag: animals.length > 0 ? animals[0].tagNo : '',
        vaccineName: 'FMD (Foot & Mouth Disease)',
        vaccinationDate: new Date().toISOString().slice(0, 10),
        nextDueDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        vetName: 'Dr. Sarah Jenkins',
        cost: 0,
        status: 'Completed',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.animalTag || !formData.vaccineName) return;

    if (vacToEdit) {
      updateVaccination(vacToEdit.id, formData);
    } else {
      addVaccination(formData);
    }
    setIsModalOpen(false);
  };

  const completedCount = vaccinations.filter(v => v.status === 'Completed').length;
  const dueSoonCount = vaccinations.filter(v => v.status === 'Due Soon').length;
  const overdueCount = vaccinations.filter(v => v.status === 'Overdue').length;

  const columns = [
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
      header: 'Vaccine Name',
      key: 'vaccineName',
      sortable: true,
      render: (row) => <span className="font-bold text-slate-800">{row.vaccineName}</span>
    },
    {
      header: 'Vaccinated On',
      key: 'vaccinationDate',
      sortable: true,
      render: (row) => <span className="text-slate-600">{formatDate(row.vaccinationDate)}</span>
    },
    {
      header: 'Next Due Date',
      key: 'nextDueDate',
      sortable: true,
      render: (row) => (
        <span className={`font-bold ${row.status === 'Overdue' ? 'text-rose-600' : row.status === 'Due Soon' ? 'text-amber-600' : 'text-slate-700'}`}>
          {formatDate(row.nextDueDate)}
        </span>
      )
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      render: (row) => <Badge status={row.status} />
    },
    {
      header: 'Vet Doctor',
      key: 'vetName',
      sortable: true,
      render: (row) => <span className="text-slate-600">{row.vetName}</span>
    },
    {
      header: 'Expense / Cost',
      key: 'cost',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-rose-600">
          {row.cost ? formatCurrency(row.cost, settings.currency) : '-'}
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
            onClick={() => setVacToDelete(row)}
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
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Vaccination Management</h2>
          <p className="text-xs text-slate-500 font-medium">
            Schedule immunizations, track booster due dates, and monitor overdue warnings
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <ExportButton
            data={filteredVac.length > 0 ? filteredVac : vaccinations}
            filename="vaccinations.csv"
            columns={[
              { header: 'Vaccination Date', key: 'vaccinationDate' },
              { header: 'Animal Tag', key: 'animalTag' },
              { header: 'Vaccine Name', key: 'vaccineName' },
              { header: 'Next Due Date', key: 'nextDueDate' },
              { header: 'Veterinarian', key: 'vetName' },
              { header: `Cost (${settings.currency})`, key: 'cost' },
              { header: 'Status', key: 'status' },
              { header: 'Notes', key: 'notes' }
            ]}
          />

          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Record Vaccination</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Completed Immunizations"
          value={completedCount}
          subtext="Protected animals"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Due Soon (Next 14 Days)"
          value={dueSoonCount}
          subtext="Scheduled boosters"
          icon={AlertTriangle}
          color={dueSoonCount > 0 ? "amber" : "slate"}
        />
        <StatCard
          title="Overdue Vaccinations"
          value={overdueCount}
          subtext={overdueCount > 0 ? "Requires urgent injection" : "Zero overdue"}
          icon={AlertCircle}
          color={overdueCount > 0 ? "rose" : "emerald"}
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={vaccinations}
        searchPlaceholder="Search vaccine, animal tag..."
        emptyMessage="No vaccination records found"
        filterOptions={[
          { key: 'status', label: 'Status', options: ['Completed', 'Due Soon', 'Overdue'] }
        ]}
        initialSortColumn="nextDueDate"
        onFilteredDataChange={setFilteredVac}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={vacToEdit ? "Edit Vaccination Record" : "Schedule New Vaccination"}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Animal Tag *</label>
            <select
              required
              value={formData.animalTag}
              onChange={(e) => setFormData({ ...formData, animalTag: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
            >
              <option value="">-- Select Animal --</option>
              {animals.map(a => (
                <option key={a.id} value={a.tagNo}>{a.tagNo} - {a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Vaccine Name *</label>
            <input
              type="text"
              required
              value={formData.vaccineName}
              onChange={(e) => setFormData({ ...formData, vaccineName: e.target.value })}
              placeholder="e.g. FMD, Blackleg, Anthrax"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vaccination Date</label>
              <input
                type="date"
                value={formData.vaccinationDate}
                onChange={(e) => setFormData({ ...formData, vaccinationDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Next Booster Due</label>
              <input
                type="date"
                value={formData.nextDueDate}
                onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              >
                <option value="Completed">Completed</option>
                <option value="Due Soon">Due Soon</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vet Doctor</label>
              <input
                type="text"
                value={formData.vetName}
                onChange={(e) => setFormData({ ...formData, vetName: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Vaccination Cost / Expense ({settings.currency})</label>
            <input
              type="number"
              min="0"
              step="any"
              placeholder="e.g. 7000"
              value={formData.cost || ''}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
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
              {vacToEdit ? "Update Schedule" : "Save Vaccination"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      {vacToDelete && (
        <ConfirmDialog
          isOpen={!!vacToDelete}
          onClose={() => setVacToDelete(null)}
          onConfirm={() => deleteVaccination(vacToDelete.id)}
          title="Delete Vaccination Record"
          message={`Are you sure you want to remove the ${vacToDelete.vaccineName} record for ${vacToDelete.animalTag}?`}
        />
      )}
    </div>
  );
};
