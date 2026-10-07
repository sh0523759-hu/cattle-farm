import React, { useState } from 'react';
import { useFarm } from '../../context/FarmContext';
import { DataTable } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { AnimalFormModal } from './AnimalFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { ExportButton } from '../../components/common/ExportButton';
import { PlusCircle, Eye, Edit, Trash2, Milk } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';

export const AnimalsList = () => {
  const { animals, deleteAnimal, settings } = useFarm();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [animalToEdit, setAnimalToEdit] = useState(null);
  const [animalToDelete, setAnimalToDelete] = useState(null);
  const [filteredAnimals, setFilteredAnimals] = useState([]);

  const columns = [
    {
      header: 'Animal',
      key: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center space-x-3">
          <img
            src={row.image || 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?auto=format&fit=crop&q=80&w=400'}
            alt={row.name || 'Animal'}
            className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0"
          />
          <div>
            <div className="font-extrabold text-slate-800 flex items-center space-x-1.5">
              <span>{row.name || row.animalName || `Animal ${row.tagNo || ''}`}</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                {row.tagNo}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">{row.type || row.animalType || 'Cow'} • {row.breed || 'Crossbreed'}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Gender',
      key: 'gender',
      sortable: true,
      render: (row) => <span className="text-xs font-semibold text-slate-600">{row.gender}</span>
    },
    {
      header: 'Weight',
      key: 'weight',
      sortable: true,
      render: (row) => <span className="text-xs font-bold text-slate-700">{row.weight ?? row.weightKg ?? 0} {settings.weightUnit || 'Kilogram'}</span>
    },
    {
      header: 'Purchase Price',
      key: 'purchasePrice',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-bold text-slate-700">
          {formatCurrency(row.purchasePrice ?? row.cost ?? row.price ?? 0, settings.currency)}
        </span>
      )
    },
    {
      header: 'Daily Yield',
      key: 'dailyAvgMilk',
      sortable: true,
      render: (row) => {
        const yieldVal = row.dailyAvgMilk ?? row.milkYield ?? 0;
        return (
          <span className="text-xs font-bold text-emerald-700">
            {(row.gender === 'Female' || !row.gender) && Number(yieldVal) > 0 ? `${yieldVal} ${settings.milkUnit || 'Liter'}/day` : '-'}
          </span>
        );
      }
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      render: (row) => <Badge status={row.status} />
    },
    {
      header: 'Health',
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
            onClick={() => navigate(`/animals/${row.id}`)}
            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
            title="View Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setAnimalToEdit(row);
              setIsFormOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
            title="Edit Animal"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAnimalToDelete(row)}
            className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Animal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const filterOptions = [
    { key: 'type', label: 'Type', options: settings.animalTypes || ['Cow', 'Buffalo', 'Calf', 'Bull'] },
    { key: 'status', label: 'Status', options: ['Active', 'Pregnant', 'Dry', 'Sick', 'Sold Out'] },
    { key: 'healthStatus', label: 'Health', options: ['Healthy', 'Sick', 'Under Treatment'] }
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Animal Registry</h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage your livestock, view profiles, track health & lactation
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <ExportButton
            data={filteredAnimals.length > 0 ? filteredAnimals : animals}
            filename="animals.csv"
            columns={[
              { header: 'Tag No', key: 'tagNo' },
              { header: 'Name', key: 'name' },
              { header: 'Type', key: 'type' },
              { header: 'Breed', key: 'breed' },
              { header: 'Gender', key: 'gender' },
              { header: `Weight (${settings.weightUnit || 'Kilogram'})`, key: 'weight' },
              { header: `Daily Avg Milk (${settings.milkUnit || 'Liter'})`, key: 'dailyAvgMilk' },
              { header: 'Status', key: 'status' },
              { header: 'Health Status', key: 'healthStatus' },
              { header: 'Date of Birth', key: 'dob' },
              { header: 'Purchase Date', key: 'purchaseDate' },
              { header: 'Purchase Price', key: 'purchasePrice' },
              { header: 'Notes', key: 'notes' }
            ]}
          />

          <button
            onClick={() => {
              setAnimalToEdit(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Animal</span>
          </button>
        </div>
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={animals}
        searchPlaceholder="Search tag no, name, breed..."
        emptyMessage="No animals found"
        emptySubtext="Try adding a new animal or clearing search filters."
        filterOptions={filterOptions}
        initialSortColumn="name"
        onFilteredDataChange={setFilteredAnimals}
      />

      {/* Form Modal */}
      <AnimalFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        animalToEdit={animalToEdit}
      />

      {/* Delete Confirmation */}
      {animalToDelete && (
        <ConfirmDialog
          isOpen={!!animalToDelete}
          onClose={() => setAnimalToDelete(null)}
          onConfirm={() => deleteAnimal(animalToDelete.id)}
          title={`Delete Animal ${animalToDelete.tagNo}`}
          message={`Are you sure you want to delete ${animalToDelete.name} (${animalToDelete.tagNo})?`}
        />
      )}
    </div>
  );
};
