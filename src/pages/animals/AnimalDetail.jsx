import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFarm } from '../../context/FarmContext';
import { Badge } from '../../components/common/Badge';
import { formatDate, formatCurrency, formatUnit } from '../../utils/formatters';
import {
  ArrowLeft,
  Milk,
  Stethoscope,
  Syringe,
  Heart,
  Baby,
  Wheat,
  DollarSign,
  Info,
  Edit,
  Trash2,
  Calendar,
  Tag
} from 'lucide-react';
import { AnimalFormModal } from './AnimalFormModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { MilkChart } from '../../components/dashboard/MilkChart';

export const AnimalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    animals,
    milkRecords,
    healthRecords,
    vaccinations,
    breedingRecords,
    calves,
    expenses,
    feedLogs,
    deleteAnimal,
    settings
  } = useFarm();

  const animal = animals.find(a => a.id === id || a.tagNo === id);

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (!animal) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">Animal Profile Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">The requested animal record does not exist or has been removed.</p>
        <button
          onClick={() => navigate('/animals')}
          className="mt-4 px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl"
        >
          Back to Animal List
        </button>
      </div>
    );
  }

  // Filter child records for this animal
  const animalMilk = useMemo(() => {
    const targetTag = String(animal.tagNo || '').trim().toUpperCase();
    const targetId = String(animal.id || '').trim();
    return (milkRecords || []).filter(m => {
      const tag = String(m.animalTag || '').trim().toUpperCase();
      const idMatch = m.animalId && String(m.animalId).trim() === targetId;
      return (tag && tag === targetTag) || idMatch;
    }).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [milkRecords, animal.tagNo, animal.id]);
  const animalHealth = healthRecords.filter(h => h.animalTag === animal.tagNo);
  const animalVac = vaccinations.filter(v => v.animalTag === animal.tagNo);
  const animalBreeding = breedingRecords.filter(b => b.femaleTag === animal.tagNo || b.maleTag === animal.tagNo);
  const animalCalves = calves.filter(c => c.motherTag === animal.tagNo || c.fatherTag === animal.tagNo);
  const animalFeedLogs = (feedLogs || []).filter(f => f.animalTag === animal.tagNo);

  // Synchronized Direct Animal Expenses (Vaccinations, Medical Treatments, Breeding, Direct Expenses)
  const animalExpensesList = useMemo(() => {
    const list = [];
    const seenIds = new Set();

    // 1. Direct expenses linked by animalTag / animalId / tag string in description
    expenses.forEach(e => {
      const matchTag = e.animalTag && e.animalTag === animal.tagNo;
      const matchId = e.animalId && e.animalId === animal.id;
      const matchDesc = e.description && e.description.includes(animal.tagNo);

      if (matchTag || matchId || matchDesc) {
        const idKey = e.id || e._id;
        if (!seenIds.has(idKey)) {
          seenIds.add(idKey);
          list.push({
            id: idKey,
            date: e.date,
            type: e.category || 'Direct Expense',
            description: e.description || `Expense logged for ${animal.tagNo}`,
            amount: Number(e.amount || 0)
          });
        }
      }
    });

    // 2. Vaccinations with cost for this animal
    animalVac.forEach(v => {
      if (Number(v.cost || 0) > 0) {
        const vacExpId = `vac_${v.id || v._id}`;
        const isAlreadyCovered = list.some(l => 
          l.date === (v.vaccinationDate || v.dateAdministered) && 
          Number(l.amount) === Number(v.cost) &&
          l.description.toLowerCase().includes('vaccination')
        );

        if (!isAlreadyCovered && !seenIds.has(vacExpId)) {
          seenIds.add(vacExpId);
          list.push({
            id: vacExpId,
            date: v.vaccinationDate || v.dateAdministered || new Date().toISOString().slice(0, 10),
            type: 'Vaccination',
            description: `Vaccination: ${v.vaccineName} (${animal.tagNo})`,
            amount: Number(v.cost)
          });
        }
      }
    });

    // 3. Health & Medical treatments with cost for this animal
    animalHealth.forEach(h => {
      if (Number(h.cost || 0) > 0) {
        const healthExpId = `hlt_${h.id || h._id}`;
        const isAlreadyCovered = list.some(l => 
          l.date === h.date && 
          Number(l.amount) === Number(h.cost) &&
          (l.description.toLowerCase().includes('treatment') || l.description.toLowerCase().includes('medical'))
        );

        if (!isAlreadyCovered && !seenIds.has(healthExpId)) {
          seenIds.add(healthExpId);
          list.push({
            id: healthExpId,
            date: h.date,
            type: 'Health & Medical',
            description: `Medical Treatment: ${h.problem || h.diagnosis || 'Veterinary Care'} (${animal.tagNo})`,
            amount: Number(h.cost)
          });
        }
      }
    });

    // 4. Breeding & Insemination records with cost
    animalBreeding.forEach(b => {
      if (Number(b.cost || 0) > 0) {
        const brdExpId = `brd_${b.id || b._id}`;
        const isAlreadyCovered = list.some(l => 
          l.date === b.breedingDate && 
          Number(l.amount) === Number(b.cost) &&
          l.description.toLowerCase().includes('breeding')
        );

        if (!isAlreadyCovered && !seenIds.has(brdExpId)) {
          seenIds.add(brdExpId);
          list.push({
            id: brdExpId,
            date: b.breedingDate,
            type: 'Breeding',
            description: `Breeding Service: ${b.method || 'Insemination'} (${animal.tagNo})`,
            amount: Number(b.cost)
          });
        }
      }
    });

    return list.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [expenses, animalVac, animalHealth, animalBreeding, animal]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    ...(animal.gender === 'Female' ? [{ id: 'milk', label: 'Milk Yield', icon: Milk, count: animalMilk.length }] : []),
    { id: 'feed', label: 'Feed History', icon: Wheat, count: animalFeedLogs.length },
    { id: 'health', label: 'Health', icon: Stethoscope, count: animalHealth.length },
    { id: 'vaccinations', label: 'Vaccinations', icon: Syringe, count: animalVac.length },
    { id: 'breeding', label: 'Breeding', icon: Heart, count: animalBreeding.length },
    { id: 'calves', label: 'Calves', icon: Baby, count: animalCalves.length },
    { id: 'expenses', label: 'Expenses', icon: DollarSign, count: animalExpensesList.length }
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/animals')}
          className="flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Animal Registry</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl flex items-center space-x-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Profile Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
        <div className="w-32 h-32 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 shadow-inner">
          <img
            src={animal.image || 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?auto=format&fit=crop&q=80&w=400'}
            alt={animal.name}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-lg font-mono">
              {animal.tagNo}
            </span>
            <Badge status={animal.status} />
            <Badge status={animal.healthStatus} />
          </div>

          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            {animal.name} <span className="text-sm font-semibold text-slate-400">({animal.type})</span>
          </h1>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 text-xs font-medium text-slate-600">
            <span>Breed: <strong className="text-slate-800">{animal.breed}</strong></span>
            <span>Gender: <strong className="text-slate-800">{animal.gender}</strong></span>
            <span>Weight: <strong className="text-slate-800">{animal.weight} {settings.weightUnit || 'Kilogram'}</strong></span>
            {animal.gender === 'Female' && (
              <span>Daily Yield: <strong className="text-emerald-700">{animal.dailyAvgMilk} {settings.milkUnit || 'Liter'}/day</strong></span>
            )}
          </div>

          <p className="text-xs text-slate-500 pt-1 italic">{animal.notes || "No additional notes logged."}</p>
        </div>
      </div>

      {/* Interactive Tabs Header */}
      <div className="flex space-x-1 bg-slate-200/60 p-1 rounded-2xl overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px]">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Physical Specifications</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Date of Birth</span>
                  <span className="font-bold text-slate-800">{formatDate(animal.dob)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Color & Marking</span>
                  <span className="font-bold text-slate-800">{animal.color || 'Standard'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Weight</span>
                  <span className="font-bold text-slate-800">{animal.weight} {settings.weightUnit || 'Kilogram'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2">Purchase & Valuation</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Purchase Date</span>
                  <span className="font-bold text-slate-800">{formatDate(animal.purchaseDate)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Purchase Price</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(animal.purchasePrice, settings.currency)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">System Record ID</span>
                  <span className="font-mono text-slate-600">{animal.id}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Milk Yield */}
        {activeTab === 'milk' && (
          <div className="space-y-4">
            <MilkChart
              records={animalMilk}
              milkUnit={settings.milkUnit}
              title={`Milk Yield Trend - ${animal.name} (${animal.tagNo})`}
              subtitle="Historical daily milking logs"
              showAnimalFilter={false}
            />
            <h3 className="text-sm font-bold text-slate-800">Milk Yield Log ({animal.tagNo})</h3>
            {animalMilk.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Morning</th>
                      <th className="p-3">Evening</th>
                      <th className="p-3">Total Daily</th>
                      <th className="p-3">Fat %</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {animalMilk.map((m, idx) => (
                      <tr key={m.id || m._id || idx}>
                        <td className="p-3">{formatDate(m.date)}</td>
                        <td className="p-3">{m.morningQty || 0} {settings.milkUnit || 'Liter'}</td>
                        <td className="p-3">{m.eveningQty || 0} {settings.milkUnit || 'Liter'}</td>
                        <td className="p-3 font-bold text-emerald-700">{m.totalQty ?? ((m.morningQty || 0) + (m.eveningQty || 0))} {settings.milkUnit || 'Liter'}</td>
                        <td className="p-3">{m.fatPercentage !== undefined ? `${m.fatPercentage}%` : '-'}</td>
                        <td className="p-3 text-slate-400">{m.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">No milk yield logs recorded for this animal.</div>
            )}
          </div>
        )}

        {/* Tab: Feed History */}
        {activeTab === 'feed' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Animal Feed History ({animal.tagNo})</h3>
              <span className="text-xs text-slate-500 font-medium">
                Total Feed Received: <strong className="text-emerald-700">{animalFeedLogs.reduce((sum, log) => sum + Number(log.quantityGiven || 0), 0)} {settings.weightUnit || 'Kilogram'}</strong>
              </span>
            </div>
            {animalFeedLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200/80">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Feed Type</th>
                      <th className="p-3">Quantity Given</th>
                      <th className="p-3">Recorded By</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {animalFeedLogs.map((f, idx) => (
                      <tr key={f.id || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 text-slate-700 font-bold">{formatDate(f.date)}</td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 font-bold text-[11px] rounded-md border border-amber-200">
                            {f.feedName}
                          </span>
                        </td>
                        <td className="p-3 font-extrabold text-emerald-700 font-mono text-sm">
                          {f.quantityGiven} {formatUnit(f.unit || settings.weightUnit || 'Kilogram')}
                        </td>
                        <td className="p-3 text-slate-600 font-semibold">{f.recordedBy || 'Admin'}</td>
                        <td className="p-3 text-slate-500">{f.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                No feed history recorded for animal {animal.tagNo} yet.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Health */}
        {activeTab === 'health' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Medical History ({animal.tagNo})</h3>
            {animalHealth.length > 0 ? (
              <div className="space-y-3">
                {animalHealth.map(h => (
                  <div key={h.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-rose-700">{h.problem}</span>
                      <span className="text-slate-400">{formatDate(h.date)}</span>
                    </div>
                    <p className="text-xs text-slate-600">Diagnosis: <strong>{h.diagnosis}</strong></p>
                    <p className="text-xs text-slate-600">Treatment: {h.treatment} ({h.medicineUsed})</p>
                    <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                      <span>Vet: {h.vetName}</span>
                      <span className="font-bold text-slate-700">Cost: {formatCurrency(h.cost, settings.currency)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">No health issues logged for this animal.</div>
            )}
          </div>
        )}

        {/* Tab 4: Vaccinations */}
        {activeTab === 'vaccinations' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Vaccination History</h3>
            {animalVac.length > 0 ? (
              <div className="space-y-3">
                {animalVac.map(v => (
                  <div key={v.id} className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <h4 className="font-bold text-slate-800">{v.vaccineName}</h4>
                      <p className="text-slate-400">Administered: {formatDate(v.vaccinationDate)} | Next Due: {formatDate(v.nextDueDate)}</p>
                    </div>
                    <Badge status={v.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">No vaccination history recorded.</div>
            )}
          </div>
        )}

        {/* Tab 5: Breeding */}
        {activeTab === 'breeding' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Breeding & Reproduction Log</h3>
            {animalBreeding.length > 0 ? (
              <div className="space-y-3">
                {animalBreeding.map(b => (
                  <div key={b.id} className="p-4 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold">
                      <span>Method: {b.method}</span>
                      <Badge status={b.pregnancyStatus} />
                    </div>
                    <p className="text-slate-600">Insemination Date: {formatDate(b.breedingDate)}</p>
                    <p className="text-slate-600 font-bold text-emerald-700">Expected Delivery: {formatDate(b.expectedDeliveryDate)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">No breeding records for this animal.</div>
            )}
          </div>
        )}

        {/* Tab 6: Calves */}
        {activeTab === 'calves' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Registered Calves</h3>
            {animalCalves.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {animalCalves.map(c => (
                  <div key={c.id} className="p-3 border rounded-xl flex items-center space-x-3 text-xs">
                    <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                      <Baby className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{c.name} ({c.calfTag})</h4>
                      <p className="text-slate-400">DOB: {formatDate(c.birthDate)} | Weight: {c.currentWeight} {settings.weightUnit || 'Kilogram'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">No offspring calves recorded for this animal.</div>
            )}
          </div>
        )}

        {/* Tab 7: Expenses */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-rose-50/70 p-4 rounded-xl border border-rose-200">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Direct Animal Expenses ({animal.tagNo})</h3>
                <p className="text-xs text-slate-500">Includes vaccination costs, veterinary treatments, breeding, and direct costs</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block uppercase font-bold">Total Spent</span>
                <span className="text-lg font-extrabold text-rose-700">
                  {formatCurrency(
                    animalExpensesList.reduce((sum, e) => sum + Number(e.amount || 0), 0),
                    settings.currency
                  )}
                </span>
              </div>
            </div>

            {animalExpensesList.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200/80">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Expense Type</th>
                      <th className="p-3">Description / Particulars</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {animalExpensesList.map((e, idx) => (
                      <tr key={e.id || idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 text-slate-700 font-bold">{formatDate(e.date)}</td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold text-[11px] rounded-md border border-slate-200">
                            {e.type}
                          </span>
                        </td>
                        <td className="p-3 text-slate-700">{e.description}</td>
                        <td className="p-3 text-right font-extrabold text-rose-600 font-mono text-sm">
                          {formatCurrency(e.amount, settings.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                No direct expenses, vaccinations, or treatment costs logged for animal {animal.tagNo}.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Form Modal */}
      <AnimalFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        animalToEdit={animal}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => {
          deleteAnimal(animal.id);
          navigate('/animals');
        }}
        title={`Delete Animal ${animal.tagNo}`}
        message={`Are you sure you want to delete ${animal.name} (${animal.tagNo})? All local state will be updated.`}
      />
    </div>
  );
};
