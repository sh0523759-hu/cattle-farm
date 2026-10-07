import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { DataTable } from '../../components/common/DataTable';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ExportButton } from '../../components/common/ExportButton';
import { formatDate } from '../../utils/formatters';
import { Baby, PlusCircle, Edit, Trash2 } from 'lucide-react';

export const CalvesList = () => {
  const { calves, animals, addCalf, updateCalf, deleteCalf, settings } = useFarm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [calfToEdit, setCalfToEdit] = useState(null);
  const [calfToDelete, setCalfToDelete] = useState(null);
  const [filteredCalves, setFilteredCalves] = useState([]);

  const [formData, setFormData] = useState({
    calfTag: '',
    name: '',
    gender: 'Male',
    birthDate: new Date().toISOString().slice(0, 10),
    motherTag: '',
    fatherTag: '',
    birthWeight: 35,
    currentWeight: 45,
    breed: 'Holstein Friesian',
    healthStatus: 'Healthy',
    notes: ''
  });

  const handleOpenForm = (calf = null) => {
    if (calf) {
      setCalfToEdit(calf);
      setFormData(calf);
    } else {
      setCalfToEdit(null);
      setFormData({
        calfTag: `CLF-${Math.floor(300 + Math.random() * 900)}`,
        name: '',
        gender: 'Male',
        birthDate: new Date().toISOString().slice(0, 10),
        motherTag: '',
        fatherTag: '',
        birthWeight: 35,
        currentWeight: 45,
        breed: 'Holstein Friesian',
        healthStatus: 'Healthy',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.calfTag || !formData.name) return;

    if (calfToEdit) {
      updateCalf(calfToEdit.id, formData);
    } else {
      addCalf(formData);
    }
    setIsModalOpen(false);
  };

  const columns = [
    {
      header: 'Calf Tag & Name',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
            <Baby className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-slate-800">{row.name} ({row.calfTag})</div>
            <div className="text-[11px] text-slate-400">{row.breed} • {row.gender}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Parents (Dam / Sire)',
      key: 'motherTag',
      render: (row) => (
        <div className="text-xs text-slate-600">
          <div>Dam: <strong className="font-mono text-emerald-800">{row.motherTag || 'N/A'}</strong></div>
          <div>Sire: <strong className="font-mono text-slate-700">{row.fatherTag || 'N/A'}</strong></div>
        </div>
      )
    },
    {
      header: 'Birth Date',
      key: 'birthDate',
      sortable: true,
      render: (row) => <span className="text-slate-700">{formatDate(row.birthDate)}</span>
    },
    {
      header: 'Weight Growth',
      key: 'currentWeight',
      sortable: true,
      render: (row) => (
        <div className="text-xs">
          <span className="font-bold text-slate-800">{row.currentWeight} {settings.weightUnit || 'Kilogram'}</span>
          <span className="text-[10px] text-slate-400 block">Birth: {row.birthWeight} {settings.weightUnit || 'Kilogram'}</span>
        </div>
      )
    },
    {
      header: 'Health Status',
      key: 'healthStatus',
      sortable: true,
      render: (row) => <Badge status={row.healthStatus} />
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
            onClick={() => setCalfToDelete(row)}
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
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Calf Management</h2>
          <p className="text-xs text-slate-500 font-medium">
            Register newborn calves, track growth weight, parent lineage, and calf health
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <ExportButton
            data={filteredCalves.length > 0 ? filteredCalves : calves}
            filename="calves.csv"
            columns={[
              { header: 'Calf Tag', key: 'calfTag' },
              { header: 'Name', key: 'name' },
              { header: 'Gender', key: 'gender' },
              { header: 'Breed', key: 'breed' },
              { header: 'Birth Date', key: 'birthDate' },
              { header: 'Mother Tag (Dam)', key: 'motherTag' },
              { header: 'Father Tag (Sire)', key: 'fatherTag' },
              { header: `Birth Weight (${settings.weightUnit || 'Kilogram'})`, key: 'birthWeight' },
              { header: `Current Weight (${settings.weightUnit || 'Kilogram'})`, key: 'currentWeight' },
              { header: 'Health Status', key: 'healthStatus' },
              { header: 'Notes', key: 'notes' }
            ]}
          />

          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register New Calf</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Registered Calves"
          value={calves.length}
          subtext="Offspring head count"
          icon={Baby}
          color="purple"
        />
        <StatCard
          title="Male Calves"
          value={calves.filter(c => c.gender === 'Male').length}
          subtext="Bull calves"
          icon={Baby}
          color="blue"
        />
        <StatCard
          title="Female Calves"
          value={calves.filter(c => c.gender === 'Female').length}
          subtext="Heifer calves"
          icon={Baby}
          color="emerald"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={calves}
        searchPlaceholder="Search calf tag, name, mother..."
        emptyMessage="No calves registered"
        initialSortColumn="birthDate"
        onFilteredDataChange={setFilteredCalves}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={calfToEdit ? "Edit Calf Profile" : "Register New Newborn Calf"}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Calf Tag / ID *</label>
              <input
                type="text"
                required
                value={formData.calfTag}
                onChange={(e) => setFormData({ ...formData, calfTag: e.target.value })}
                placeholder="e.g. CLF-305"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Calf Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Bruno"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Birth Date</label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mother Tag (Dam)</label>
              <select
                value={formData.motherTag}
                onChange={(e) => setFormData({ ...formData, motherTag: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              >
                <option value="">-- Choose Mother --</option>
                {animals.filter(a => a.gender === 'Female').map(a => (
                  <option key={a.id} value={a.tagNo}>{a.tagNo} - {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Father Tag (Sire)</label>
              <input
                type="text"
                value={formData.fatherTag}
                onChange={(e) => setFormData({ ...formData, fatherTag: e.target.value })}
                placeholder="e.g. BULL-01"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Birth Weight ({settings.weightUnit || 'Kilogram'})</label>
              <input
                type="number"
                value={formData.birthWeight}
                onChange={(e) => setFormData({ ...formData, birthWeight: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Current Weight ({settings.weightUnit || 'Kilogram'})</label>
              <input
                type="number"
                value={formData.currentWeight}
                onChange={(e) => setFormData({ ...formData, currentWeight: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Breed</label>
              <select
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              >
                {settings.breeds?.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Health Status</label>
              <select
                value={formData.healthStatus}
                onChange={(e) => setFormData({ ...formData, healthStatus: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              >
                <option value="Healthy">Healthy</option>
                <option value="Sick">Sick</option>
              </select>
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
              {calfToEdit ? "Update Calf" : "Register Calf"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      {calfToDelete && (
        <ConfirmDialog
          isOpen={!!calfToDelete}
          onClose={() => setCalfToDelete(null)}
          onConfirm={() => deleteCalf(calfToDelete.id)}
          title={`Delete ${calfToDelete.name}`}
          message={`Are you sure you want to delete calf ${calfToDelete.name} (${calfToDelete.calfTag})?`}
        />
      )}
    </div>
  );
};
