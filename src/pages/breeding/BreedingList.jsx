import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { DataTable } from '../../components/common/DataTable';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ExportButton } from '../../components/common/ExportButton';
import { formatDate } from '../../utils/formatters';
import { Heart, PlusCircle, Edit, Trash2, Calendar } from 'lucide-react';

export const BreedingList = () => {
  const { breedingRecords, animals, addBreeding, updateBreeding, deleteBreeding } = useFarm();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [brdToEdit, setBrdToEdit] = useState(null);
  const [brdToDelete, setBrdToDelete] = useState(null);
  const [filteredBrd, setFilteredBrd] = useState([]);

  const [formData, setFormData] = useState({
    femaleTag: '',
    maleTag: 'BULL-01',
    method: 'Artificial Insemination',
    breedingDate: new Date().toISOString().slice(0, 10),
    expectedPregnancyCheck: '',
    pregnancyStatus: 'Bred',
    expectedDeliveryDate: '',
    actualDeliveryDate: '',
    notes: ''
  });

  const handleOpenForm = (brd = null) => {
    if (brd) {
      setBrdToEdit(brd);
      setFormData(brd);
    } else {
      const today = new Date();
      const breedDateStr = today.toISOString().slice(0, 10);
      const deliveryDate = new Date(today.getTime() + 283 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const checkDate = new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      setBrdToEdit(null);
      setFormData({
        femaleTag: animals.length > 0 ? animals[0].tagNo : '',
        maleTag: 'BULL-01',
        method: 'Artificial Insemination',
        breedingDate: breedDateStr,
        expectedPregnancyCheck: checkDate,
        pregnancyStatus: 'Bred',
        expectedDeliveryDate: deliveryDate,
        actualDeliveryDate: '',
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleBreedingDateChange = (dateStr) => {
    const breedDate = new Date(dateStr);
    if (!isNaN(breedDate.getTime())) {
      // Auto calculate expected delivery (~283 days for cow)
      const deliveryDate = new Date(breedDate.getTime() + 283 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const checkDate = new Date(breedDate.getTime() + 35 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      setFormData(prev => ({
        ...prev,
        breedingDate: dateStr,
        expectedDeliveryDate: deliveryDate,
        expectedPregnancyCheck: checkDate
      }));
    } else {
      setFormData(prev => ({ ...prev, breedingDate: dateStr }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.femaleTag) return;

    if (brdToEdit) {
      updateBreeding(brdToEdit.id, formData);
    } else {
      addBreeding(formData);
    }
    setIsModalOpen(false);
  };

  const pregnantCount = breedingRecords.filter(b => b.pregnancyStatus === 'Pregnant').length;
  const bredCount = breedingRecords.filter(b => b.pregnancyStatus === 'Bred').length;

  const columns = [
    {
      header: 'Female (Dam)',
      key: 'femaleTag',
      sortable: true,
      render: (row) => (
        <span className="font-extrabold text-emerald-800 font-mono px-2 py-0.5 bg-emerald-50 rounded-md">
          {row.femaleTag}
        </span>
      )
    },
    {
      header: 'Male / Sire',
      key: 'maleTag',
      sortable: true,
      render: (row) => <span className="font-mono text-slate-700">{row.maleTag}</span>
    },
    {
      header: 'Breeding Method',
      key: 'method',
      sortable: true,
      render: (row) => <span className="text-xs font-semibold text-slate-600">{row.method}</span>
    },
    {
      header: 'Breeding Date',
      key: 'breedingDate',
      sortable: true,
      render: (row) => <span className="text-slate-700">{formatDate(row.breedingDate)}</span>
    },
    {
      header: 'Pregnancy Status',
      key: 'pregnancyStatus',
      sortable: true,
      render: (row) => <Badge status={row.pregnancyStatus} />
    },
    {
      header: 'Expected Delivery',
      key: 'expectedDeliveryDate',
      sortable: true,
      render: (row) => <span className="font-bold text-purple-700">{formatDate(row.expectedDeliveryDate)}</span>
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
            onClick={() => setBrdToDelete(row)}
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
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Breeding & Pregnancy Records</h2>
          <p className="text-xs text-slate-500 font-medium">
            Track breeding records, pregnancy status checks, and calculated delivery dates
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <ExportButton
            data={filteredBrd.length > 0 ? filteredBrd : breedingRecords}
            filename="breeding-records.csv"
            columns={[
              { header: 'Breeding Date', key: 'breedingDate' },
              { header: 'Female Tag (Dam)', key: 'femaleTag' },
              { header: 'Male Tag (Sire)', key: 'maleTag' },
              { header: 'Breeding Method', key: 'method' },
              { header: 'Pregnancy Status', key: 'pregnancyStatus' },
              { header: 'Expected Check Date', key: 'expectedPregnancyCheck' },
              { header: 'Expected Delivery Date', key: 'expectedDeliveryDate' },
              { header: 'Actual Delivery Date', key: 'actualDeliveryDate' },
              { header: 'Notes', key: 'notes' }
            ]}
          />

          <button
            onClick={() => handleOpenForm()}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Breeding Record</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Breeding Records"
          value={breedingRecords.length}
          subtext="Logged pairings"
          icon={Heart}
          color="emerald"
        />
        <StatCard
          title="Confirmed Pregnant"
          value={pregnantCount}
          subtext="In gestation stage"
          icon={Heart}
          color="purple"
        />
        <StatCard
          title="Pending Pregnancy Check"
          value={bredCount}
          subtext="Bred, awaiting confirmation"
          icon={Heart}
          color="amber"
        />
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={breedingRecords}
        searchPlaceholder="Search dam, sire tag..."
        emptyMessage="No breeding records logged"
        filterOptions={[
          { key: 'pregnancyStatus', label: 'Status', options: ['Planned', 'Bred', 'Pregnant', 'Delivered', 'Failed'] }
        ]}
        initialSortColumn="breedingDate"
        onFilteredDataChange={setFilteredBrd}
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={brdToEdit ? "Edit Breeding Record" : "Add Breeding Record"}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Female Tag (Dam) *</label>
              <select
                required
                value={formData.femaleTag}
                onChange={(e) => setFormData({ ...formData, femaleTag: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              >
                <option value="">-- Choose Female --</option>
                {animals.filter(a => a.gender === 'Female').map(a => (
                  <option key={a.id} value={a.tagNo}>{a.tagNo} - {a.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Male / Bull Tag (Sire)</label>
              <input
                type="text"
                value={formData.maleTag}
                onChange={(e) => setFormData({ ...formData, maleTag: e.target.value })}
                placeholder="e.g. BULL-01"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Breeding Method</label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              >
                <option value="Artificial Insemination">Artificial Insemination (AI)</option>
                <option value="Natural Breeding">Natural Breeding</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pregnancy Status</label>
              <select
                value={formData.pregnancyStatus}
                onChange={(e) => setFormData({ ...formData, pregnancyStatus: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              >
                <option value="Bred">Bred (Pending Check)</option>
                <option value="Pregnant">Pregnant</option>
                <option value="Delivered">Delivered</option>
                <option value="Failed">Failed</option>
                <option value="Planned">Planned</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Breeding Date</label>
              <input
                type="date"
                value={formData.breedingDate}
                onChange={(e) => handleBreedingDateChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expected Delivery Date (Auto)</label>
              <input
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-purple-50 text-purple-900 font-bold focus:ring-2 focus:ring-emerald-500/20 focus:outline-hidden"
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
              {brdToEdit ? "Update Breeding" : "Save Record"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      {brdToDelete && (
        <ConfirmDialog
          isOpen={!!brdToDelete}
          onClose={() => setBrdToDelete(null)}
          onConfirm={() => deleteBreeding(brdToDelete.id)}
          title="Delete Breeding Record"
          message={`Are you sure you want to delete breeding record for female ${brdToDelete.femaleTag}?`}
        />
      )}
    </div>
  );
};
