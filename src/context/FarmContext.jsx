import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  INITIAL_SETTINGS,
  INITIAL_ANIMALS,
  INITIAL_MILK_RECORDS,
  INITIAL_FEED_ITEMS,
  INITIAL_HEALTH_RECORDS,
  INITIAL_VACCINATIONS,
  INITIAL_MEDICINES,
  INITIAL_BREEDING,
  INITIAL_CALVES,
  INITIAL_INVENTORY,
  INITIAL_EQUIPMENT,
  INITIAL_EMPLOYEES,
  INITIAL_CUSTOMERS,
  INITIAL_INCOME,
  INITIAL_EXPENSES,
  INITIAL_SALES,
  INITIAL_FEED_LOGS
} from '../data/seedData';
import { getTenantStorageData, setTenantStorageData, clearAllStorageData } from '../utils/storage';
import { normalizeAndClassifyBackup, validateBackupPayload } from '../utils/backupNormalizer';
import { setGlobalFormatSettings } from '../utils/formatters';

const FarmContext = createContext(null);

export const FarmProvider = ({ children }) => {
  const { user } = useAuth();

  // Tenant ID from logged-in user
  const tenantId = user?._id || user?.id || 'usr_admin';

  // Normalize short unit symbols to full unit names
  const normalizeUnit = (u, defaultUnit) => {
    if (!u) return defaultUnit;
    const str = String(u).trim();
    if (str.toLowerCase() === 'l' || str.toLowerCase() === 'ltr' || str.toLowerCase() === 'liter' || str.toLowerCase() === 'liters') return 'Liter';
    if (str.toLowerCase() === 'kg' || str.toLowerCase() === 'kgs' || str.toLowerCase() === 'kilogram' || str.toLowerCase() === 'kilograms') return 'Kilogram';
    return str;
  };

  // Compute default settings scoped to current logged-in user
  const getInitialTenantSettings = (tId) => {
    return {
      ...INITIAL_SETTINGS,
      farmName: user?.farmName || INITIAL_SETTINGS.farmName,
      ownerName: user?.fullName || user?.name || INITIAL_SETTINGS.ownerName,
      email: user?.email || INITIAL_SETTINGS.email,
      currency: 'Rs.',
      milkUnit: 'Liter',
      weightUnit: 'Kilogram'
    };
  };

  // Default accounts for farm operations
  const getDefaultAccounts = () => [
    {
      id: 'ACC-CASH',
      name: 'Farm Cash in Hand',
      type: 'Cash',
      openingBalance: 150000,
      currentBalance: 150000,
      isDefault: true,
      isActive: true,
      notes: 'Physical cash at farm'
    },
    {
      id: 'ACC-BANK',
      name: 'Main Farm Bank Account',
      type: 'Bank',
      bankName: 'Habib Bank Limited (HBL)',
      accountTitle: 'Farm Account',
      accountNumber: '00123456789',
      branchName: 'Main Branch',
      openingBalance: 500000,
      currentBalance: 500000,
      isDefault: false,
      isActive: true,
      notes: 'Primary business bank account'
    }
  ];

  // Helper to load stored data or seed initial dataset if brand new tenant
  const loadOrSeedData = (key, defaultData) => {
    if (!tenantId) return defaultData;
    const stored = getTenantStorageData(tenantId, key, null);
    if (stored !== null && stored !== undefined) {
      return stored;
    }
    // Seed initial dataset for this tenant and persist to storage
    setTenantStorageData(tenantId, key, defaultData);
    return defaultData;
  };

  // ── State slices initialized with stored or realistic seed data ────────────
  const [settings, setSettingsState] = useState(() => {
    const initial = getInitialTenantSettings(tenantId);
    const loaded = getTenantStorageData(tenantId, 'settings', null);
    if (!loaded) {
      setTenantStorageData(tenantId, 'settings', initial);
      return initial;
    }
    return {
      ...initial,
      ...loaded,
      milkUnit: normalizeUnit(loaded.milkUnit, 'Liter'),
      weightUnit: normalizeUnit(loaded.weightUnit, 'Kilogram'),
      expenseCategories: (loaded.expenseCategories && loaded.expenseCategories.length > 0) ? loaded.expenseCategories : initial.expenseCategories,
      incomeCategories: (loaded.incomeCategories && loaded.incomeCategories.length > 0) ? loaded.incomeCategories : initial.incomeCategories,
      animalTypes: (loaded.animalTypes && loaded.animalTypes.length > 0) ? loaded.animalTypes : initial.animalTypes,
      breeds: (loaded.breeds && loaded.breeds.length > 0) ? loaded.breeds : initial.breeds,
      feedCategories: (loaded.feedCategories && loaded.feedCategories.length > 0) ? loaded.feedCategories : initial.feedCategories,
    };
  });

  const [animals, setAnimalsState] = useState(() => loadOrSeedData('animals', INITIAL_ANIMALS));
  const [milkRecords, setMilkRecordsState] = useState(() => loadOrSeedData('milkRecords', INITIAL_MILK_RECORDS));
  const [feedItems, setFeedItemsState] = useState(() => loadOrSeedData('feedItems', INITIAL_FEED_ITEMS));
  const [healthRecords, setHealthRecordsState] = useState(() => loadOrSeedData('healthRecords', INITIAL_HEALTH_RECORDS));
  const [vaccinations, setVaccinationsState] = useState(() => loadOrSeedData('vaccinations', INITIAL_VACCINATIONS));
  const [medicines, setMedicinesState] = useState(() => loadOrSeedData('medicines', INITIAL_MEDICINES));
  const [breedingRecords, setBreedingRecordsState] = useState(() => loadOrSeedData('breedingRecords', INITIAL_BREEDING));
  const [calves, setCalvesState] = useState(() => loadOrSeedData('calves', INITIAL_CALVES));
  const [inventory, setInventoryState] = useState(() => loadOrSeedData('inventory', INITIAL_INVENTORY));
  const [equipment, setEquipmentState] = useState(() => loadOrSeedData('equipment', INITIAL_EQUIPMENT));
  const [employees, setEmployeesState] = useState(() => loadOrSeedData('employees', INITIAL_EMPLOYEES));
  const [customers, setCustomersState] = useState(() => loadOrSeedData('customers', INITIAL_CUSTOMERS));
  const [income, setIncomeState] = useState(() => loadOrSeedData('income', INITIAL_INCOME));
  const [expenses, setExpensesState] = useState(() => loadOrSeedData('expenses', INITIAL_EXPENSES));
  const [sales, setSalesState] = useState(() => loadOrSeedData('sales', INITIAL_SALES));
  const [feedLogs, setFeedLogsState] = useState(() => loadOrSeedData('feedLogs', INITIAL_FEED_LOGS));
  const [accounts, setAccountsState] = useState(() => loadOrSeedData('accounts', getDefaultAccounts()));
  const [payroll, setPayrollState] = useState(() => loadOrSeedData('payroll', []));

  // Sync state when tenant switches
  useEffect(() => {
    if (!tenantId) return;
    const initSettings = getInitialTenantSettings(tenantId);
    const loadedSettings = getTenantStorageData(tenantId, 'settings', initSettings);
    setSettingsState(loadedSettings);
    setAnimalsState(loadOrSeedData('animals', INITIAL_ANIMALS));
    setMilkRecordsState(loadOrSeedData('milkRecords', INITIAL_MILK_RECORDS));
    setFeedItemsState(loadOrSeedData('feedItems', INITIAL_FEED_ITEMS));
    setHealthRecordsState(loadOrSeedData('healthRecords', INITIAL_HEALTH_RECORDS));
    setVaccinationsState(loadOrSeedData('vaccinations', INITIAL_VACCINATIONS));
    setMedicinesState(loadOrSeedData('medicines', INITIAL_MEDICINES));
    setBreedingRecordsState(loadOrSeedData('breedingRecords', INITIAL_BREEDING));
    setCalvesState(loadOrSeedData('calves', INITIAL_CALVES));
    setInventoryState(loadOrSeedData('inventory', INITIAL_INVENTORY));
    setEquipmentState(loadOrSeedData('equipment', INITIAL_EQUIPMENT));
    setEmployeesState(loadOrSeedData('employees', INITIAL_EMPLOYEES));
    setCustomersState(loadOrSeedData('customers', INITIAL_CUSTOMERS));
    setIncomeState(loadOrSeedData('income', INITIAL_INCOME));
    setExpensesState(loadOrSeedData('expenses', INITIAL_EXPENSES));
    setSalesState(loadOrSeedData('sales', INITIAL_SALES));
    setFeedLogsState(loadOrSeedData('feedLogs', INITIAL_FEED_LOGS));
    setAccountsState(loadOrSeedData('accounts', getDefaultAccounts()));
    setPayrollState(loadOrSeedData('payroll', []));
  }, [tenantId]);

  // Keep global formatters in sync with active settings
  useEffect(() => {
    if (settings) {
      setGlobalFormatSettings(settings);
    }
  }, [settings]);

  // Cross-tab instant storage sync
  useEffect(() => {
    if (!tenantId) return;
    const handleStorage = (e) => {
      if (!e.key || !e.key.startsWith(`cattle_erp_${tenantId}_`)) return;
      const key = e.key.replace(`cattle_erp_${tenantId}_`, '');
      try {
        const fresh = JSON.parse(e.newValue);
        if (key === 'animals') setAnimalsState(fresh);
        else if (key === 'milkRecords') setMilkRecordsState(fresh);
        else if (key === 'feedItems') setFeedItemsState(fresh);
        else if (key === 'feedLogs') setFeedLogsState(fresh);
        else if (key === 'healthRecords') setHealthRecordsState(fresh);
        else if (key === 'vaccinations') setVaccinationsState(fresh);
        else if (key === 'medicines') setMedicinesState(fresh);
        else if (key === 'breedingRecords') setBreedingRecordsState(fresh);
        else if (key === 'calves') setCalvesState(fresh);
        else if (key === 'inventory') setInventoryState(fresh);
        else if (key === 'equipment') setEquipmentState(fresh);
        else if (key === 'employees') setEmployeesState(fresh);
        else if (key === 'customers') setCustomersState(fresh);
        else if (key === 'income') setIncomeState(fresh);
        else if (key === 'expenses') setExpensesState(fresh);
        else if (key === 'sales') setSalesState(fresh);
        else if (key === 'accounts') setAccountsState(fresh);
        else if (key === 'payroll') setPayrollState(fresh);
        else if (key === 'settings') setSettingsState(fresh);
      } catch (err) {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [tenantId]);

  // Toast Notification System
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Helper matcher to check if record matches ID (supports mongo _id and custom id)
  const isMatchId = (item, id) => {
    if (!item || !id) return false;
    return item.id === id || item._id === id || String(item._id) === String(id) || String(item.id) === String(id);
  };

  // Client-Side sync handler (no network calls needed)
  const syncFromApi = useCallback(async () => {
    return { success: true };
  }, []);

  // ── Animals CRUD ──────────────────────────────────────────────
  const addAnimal = async (animalData) => {
    const savedItem = {
      ...animalData,
      id: animalData.id || `ANM-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      dailyAvgMilk: Number(animalData.dailyAvgMilk || 0)
    };

    setAnimalsState(prev => {
      const filtered = prev.filter(item => !isMatchId(item, savedItem._id || savedItem.id));
      const next = [savedItem, ...filtered];
      setTenantStorageData(tenantId, 'animals', next);
      return next;
    });

    showToast(`Animal ${savedItem.tagNo || savedItem.name} added successfully!`, 'success');
    return savedItem;
  };

  const updateAnimal = async (id, updatedData) => {
    setAnimalsState(prev => {
      const next = prev.map(item => isMatchId(item, id) ? { ...item, ...updatedData } : item);
      setTenantStorageData(tenantId, 'animals', next);
      return next;
    });

    showToast(`Animal details updated successfully!`, 'info');
  };

  const deleteAnimal = async (id) => {
    let tag = '';
    setAnimalsState(prev => {
      const target = prev.find(a => isMatchId(a, id));
      if (target) tag = target.tagNo;
      const next = prev.filter(item => !isMatchId(item, id));
      setTenantStorageData(tenantId, 'animals', next);
      return next;
    });

    showToast(`Animal ${tag} deleted successfully`, 'warning');
  };

  // ── Milk Records CRUD ─────────────────────────────────────────
  const addMilkRecord = async (recordData) => {
    const morning = Number(recordData.morningQty || 0);
    const evening = Number(recordData.eveningQty || 0);
    const total = morning + evening;
    const savedItem = {
      ...recordData,
      id: recordData.id || `MLK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      morningQty: morning,
      eveningQty: evening,
      totalQty: total,
      fatPercentage: Number(recordData.fatPercentage || 0)
    };

    setMilkRecordsState(prev => {
      const filtered = prev.filter(item => !isMatchId(item, savedItem._id || savedItem.id));
      const next = [savedItem, ...filtered];
      setTenantStorageData(tenantId, 'milkRecords', next);
      return next;
    });

    const animal = animals.find(a => a.tagNo === recordData.animalTag);
    if (animal) {
      updateAnimal(animal.id || animal._id, { dailyAvgMilk: total });
    }

    showToast(`Milk record saved successfully! (${total} L)`, 'success');
    return savedItem;
  };

  const updateMilkRecord = async (id, updatedData) => {
    const morning = Number(updatedData.morningQty || 0);
    const evening = Number(updatedData.eveningQty || 0);
    const total = morning + evening;
    const savedItem = { ...updatedData, morningQty: morning, eveningQty: evening, totalQty: total };

    setMilkRecordsState(prev => {
      const next = prev.map(item => isMatchId(item, id) ? { ...item, ...savedItem } : item);
      setTenantStorageData(tenantId, 'milkRecords', next);
      return next;
    });

    showToast(`Milk record updated!`, 'info');
    return savedItem;
  };

  const deleteMilkRecord = async (id) => {
    setMilkRecordsState(prev => {
      const next = prev.filter(item => !isMatchId(item, id));
      setTenantStorageData(tenantId, 'milkRecords', next);
      return next;
    });

    showToast(`Milk record deleted!`, 'warning');
  };

  // ── Feed Items CRUD ───────────────────────────────────────────
  const addFeedItem = async (data) => {
    const savedItem = {
      ...data,
      id: data.id || `FED-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      quantity: Number(data.quantity || 0),
      purchasePrice: Number(data.purchasePrice || 0)
    };

    setFeedItemsState(prev => {
      const filtered = prev.filter(item => !isMatchId(item, savedItem._id || savedItem.id));
      const next = [savedItem, ...filtered];
      setTenantStorageData(tenantId, 'feedItems', next);
      return next;
    });

    showToast(`Feed item "${data.feedName}" added!`, 'success');
    return savedItem;
  };

  const updateFeedItem = async (id, data) => {
    setFeedItemsState(prev => {
      const next = prev.map(item => isMatchId(item, id) ? { ...item, ...data } : item);
      setTenantStorageData(tenantId, 'feedItems', next);
      return next;
    });

    showToast(`Feed item updated!`, 'info');
  };

  const deleteFeedItem = async (id) => {
    setFeedItemsState(prev => {
      const next = prev.filter(item => !isMatchId(item, id));
      setTenantStorageData(tenantId, 'feedItems', next);
      return next;
    });

    showToast(`Feed item removed`, 'warning');
  };

  // Feed Usage Logging & Stock Deduction
  const recordFeedUsage = async (usageData) => {
    const qtyToDeduct = Number(usageData.quantityGiven || 0);
    if (qtyToDeduct <= 0) {
      showToast('Please enter a valid quantity given.', 'warning');
      return false;
    }

    const feedItem = feedItems.find(f => isMatchId(f, usageData.feedItemId));
    if (!feedItem) {
      showToast('Selected feed item not found in stock.', 'error');
      return false;
    }

    const currentStock = Number(feedItem.quantity || 0);
    if (qtyToDeduct > currentStock) {
      showToast(`Cannot give more feed than available stock (${currentStock} ${feedItem.unit || 'Kilogram'}).`, 'error');
      return false;
    }

    const updatedStock = Math.max(0, Number((currentStock - qtyToDeduct).toFixed(2)));

    // 1. Update feed item stock in state & storage
    const updatedFeedItem = { ...feedItem, quantity: updatedStock };
    setFeedItemsState(prev => {
      const next = prev.map(item => isMatchId(item, feedItem.id || feedItem._id) ? updatedFeedItem : item);
      setTenantStorageData(tenantId, 'feedItems', next);
      return next;
    });

    const unitPrice = Number(feedItem.purchasePrice || feedItem.costPerUnit || 0);
    const totalCost = Number((qtyToDeduct * unitPrice).toFixed(2));

    // 2. Create feed log entry
    const savedLog = {
      id: `FDL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      date: usageData.date || new Date().toISOString().slice(0, 10),
      animalTag: usageData.animalTag,
      animalName: usageData.animalName || '',
      feedItemId: usageData.feedItemId,
      feedName: usageData.feedName || feedItem.feedName,
      quantityGiven: qtyToDeduct,
      unit: normalizeUnit(usageData.unit || feedItem.unit || 'Kilogram', 'Kilogram'),
      recordedBy: usageData.recordedBy || user?.name || 'Admin',
      unitPrice,
      totalCost,
      notes: usageData.notes || ''
    };

    setFeedLogsState(prev => {
      const filtered = prev.filter(item => !isMatchId(item, savedLog._id || savedLog.id));
      const next = [savedLog, ...filtered];
      setTenantStorageData(tenantId, 'feedLogs', next);
      return next;
    });

    showToast("Feed usage recorded successfully.", "success");
    return true;
  };

  const deleteFeedLog = async (id) => {
    setFeedLogsState(prev => {
      const next = prev.filter(item => !isMatchId(item, id));
      setTenantStorageData(tenantId, 'feedLogs', next);
      return next;
    });

    showToast("Feed log entry removed.", "warning");
  };

  // ── Health Records CRUD ───────────────────────────────────────
  const addHealthRecord = async (data) => {
    const costAmount = Number(data.cost || 0);
    const savedItem = {
      ...data,
      id: data.id || `HLT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      cost: costAmount
    };

    setHealthRecordsState(prev => {
      const filtered = prev.filter(item => !isMatchId(item, savedItem._id || savedItem.id));
      const next = [savedItem, ...filtered];
      setTenantStorageData(tenantId, 'healthRecords', next);
      return next;
    });

    const animal = animals.find(a => a.tagNo === data.animalTag);
    if (animal && data.problem) {
      updateAnimal(animal.id || animal._id, { healthStatus: 'Sick' });
    }

    if (costAmount > 0) {
      const expData = {
        id: `EXP-HLT-${savedItem.id || Date.now()}`,
        date: data.date || new Date().toISOString().slice(0, 10),
        category: 'Health & Medical',
        amount: costAmount,
        paymentMethod: 'Cash',
        paidTo: data.vetName || 'Vet Doctor',
        animalTag: data.animalTag,
        description: `Medical Treatment: ${data.problem || data.diagnosis || 'Health Treatment'} (${data.animalTag})`,
        notes: data.notes || `Treatment cost logged for ${data.animalTag}`
      };

      setExpensesState(prev => {
        const filteredExp = prev.filter(e => !isMatchId(e, expData.id));
        const nextExp = [expData, ...filteredExp];
        setTenantStorageData(tenantId, 'expenses', nextExp);
        return nextExp;
      });
    }

    showToast(`Health record logged!${costAmount > 0 ? ` (Expense logged: ${settings.currency}${costAmount})` : ''}`, 'success');
    return savedItem;
  };

  const updateHealthRecord = async (id, data) => {
    setHealthRecordsState(prev => {
      const next = prev.map(item => isMatchId(item, id) ? { ...item, ...data } : item);
      setTenantStorageData(tenantId, 'healthRecords', next);
      return next;
    });

    showToast(`Health record updated!`, 'info');
  };

  const deleteHealthRecord = async (id) => {
    setHealthRecordsState(prev => {
      const next = prev.filter(item => !isMatchId(item, id));
      setTenantStorageData(tenantId, 'healthRecords', next);
      return next;
    });

    showToast(`Health record deleted`, 'warning');
  };

  // ── Vaccinations CRUD ─────────────────────────────────────────
  const addVaccination = async (data) => {
    const costAmount = Number(data.cost || 0);
    const savedItem = {
      ...data,
      id: data.id || `VAC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      cost: costAmount
    };

    setVaccinationsState(prev => {
      const filtered = prev.filter(item => !isMatchId(item, savedItem._id || savedItem.id));
      const next = [savedItem, ...filtered];
      setTenantStorageData(tenantId, 'vaccinations', next);
      return next;
    });

    if (costAmount > 0) {
      const expData = {
        id: `EXP-VAC-${savedItem.id || Date.now()}`,
        date: data.vaccinationDate || new Date().toISOString().slice(0, 10),
        category: 'Medical & Vaccination',
        amount: costAmount,
        paymentMethod: 'Cash',
        paidTo: data.vetName || 'Vet Doctor',
        animalTag: data.animalTag,
        description: `Vaccination: ${data.vaccineName} (${data.animalTag})`,
        notes: data.notes || `Vaccination cost logged for ${data.animalTag}`
      };

      setExpensesState(prev => {
        const filteredExp = prev.filter(e => !isMatchId(e, expData.id));
        const nextExp = [expData, ...filteredExp];
        setTenantStorageData(tenantId, 'expenses', nextExp);
        return nextExp;
      });
    }

    showToast(`Vaccination record added!${costAmount > 0 ? ` (Expense logged: ${settings.currency}${costAmount})` : ''}`, 'success');
    return savedItem;
  };

  const updateVaccination = async (id, data) => {
    const costAmount = Number(data.cost || 0);
    const updatedVac = { ...data, cost: costAmount };

    setVaccinationsState(prev => {
      const next = prev.map(item => isMatchId(item, id) ? { ...item, ...updatedVac } : item);
      setTenantStorageData(tenantId, 'vaccinations', next);
      return next;
    });

    if (costAmount > 0) {
      const expData = {
        id: `EXP-VAC-${id}`,
        date: data.vaccinationDate || new Date().toISOString().slice(0, 10),
        category: 'Medical & Vaccination',
        amount: costAmount,
        paymentMethod: 'Cash',
        paidTo: data.vetName || 'Vet Doctor',
        animalTag: data.animalTag,
        description: `Vaccination: ${data.vaccineName} (${data.animalTag})`,
        notes: data.notes || `Vaccination cost updated for ${data.animalTag}`
      };
      setExpensesState(prev => {
        const filteredExp = prev.filter(e => e.id !== expData.id && e._id !== expData.id);
        const nextExp = [expData, ...filteredExp];
        setTenantStorageData(tenantId, 'expenses', nextExp);
        return nextExp;
      });
    }

    showToast(`Vaccination updated!`, 'info');
  };

  const deleteVaccination = async (id) => {
    setVaccinationsState(prev => {
      const next = prev.filter(item => !isMatchId(item, id));
      setTenantStorageData(tenantId, 'vaccinations', next);
      return next;
    });

    showToast(`Vaccination deleted`, 'warning');
  };

  // ── Medicines CRUD ────────────────────────────────────────────
  const addMedicine = async (data) => {
    const savedItem = {
      ...data,
      id: data.id || `MED-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
    };

    setMedicinesState(prev => {
      const filtered = prev.filter(item => !isMatchId(item, savedItem._id || savedItem.id));
      const next = [savedItem, ...filtered];
      setTenantStorageData(tenantId, 'medicines', next);
      return next;
    });

    showToast(`Medicine "${data.name}" added to inventory!`, 'success');
    return savedItem;
  };

  const updateMedicine = async (id, data) => {
    setMedicinesState(prev => {
      const next = prev.map(item => isMatchId(item, id) ? { ...item, ...data } : item);
      setTenantStorageData(tenantId, 'medicines', next);
      return next;
    });

    showToast(`Medicine inventory updated!`, 'info');
  };

  const deleteMedicine = async (id) => {
    setMedicinesState(prev => {
      const next = prev.filter(item => !isMatchId(item, id));
      setTenantStorageData(tenantId, 'medicines', next);
      return next;
    });

    showToast(`Medicine item removed`, 'warning');
  };

  // ── Breeding & Pregnancy CRUD ─────────────────────────────────
  const addBreeding = async (data) => {
    const savedItem = {
      ...data,
      id: data.id || `BRD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
    };

    setBreedingRecordsState(prev => {
      const filtered = prev.filter(item => !isMatchId(item, savedItem._id || savedItem.id));
      const next = [savedItem, ...filtered];
      setTenantStorageData(tenantId, 'breedingRecords', next);
      return next;
    });

    if (data.pregnancyStatus === 'Pregnant') {
      const animal = animals.find(a => a.tagNo === data.femaleTag);
      if (animal) updateAnimal(animal.id || animal._id, { status: 'Pregnant' });
    }

    showToast(`Breeding record logged!`, 'success');
    return savedItem;
  };

  const updateBreeding = async (id, data) => {
    setBreedingRecordsState(prev => {
      const next = prev.map(item => isMatchId(item, id) ? { ...item, ...data } : item);
      setTenantStorageData(tenantId, 'breedingRecords', next);
      return next;
    });

    showToast(`Breeding record updated!`, 'info');
  };

  const deleteBreeding = async (id) => {
    setBreedingRecordsState(prev => {
      const next = prev.filter(item => !isMatchId(item, id));
      setTenantStorageData(tenantId, 'breedingRecords', next);
      return next;
    });

    showToast(`Breeding record deleted`, 'warning');
  };

  // ── Calves CRUD ───────────────────────────────────────────────
  const addCalf = async (data) => {
    const savedItem = {
      ...data,
      id: data.id || `CLF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
    };

    setCalvesState(prev => {
      const filtered = prev.filter(item => !isMatchId(item, savedItem._id || savedItem.id));
      const next = [savedItem, ...filtered];
      setTenantStorageData(tenantId, 'calves', next);
      return next;
    });

    await addAnimal({
      tagNo: data.calfTag,
      name: data.name,
      type: 'Calf',
      breed: data.breed || 'Crossbreed',
      gender: data.gender || 'Female',
      dob: data.birthDate,
      weight: data.birthWeight,
      color: 'Standard',
      status: 'Active',
      healthStatus: data.healthStatus || 'Healthy',
      motherId: data.motherTag,
      fatherId: data.fatherTag,
      notes: data.notes,
      image: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&q=80&w=400"
    });

    showToast(`New calf "${data.name}" registered!`, 'success');
    return savedItem;
  };

  const updateCalf = async (id, data) => {
    setCalvesState(prev => {
      const next = prev.map(item => isMatchId(item, id) ? { ...item, ...data } : item);
      setTenantStorageData(tenantId, 'calves', next);
      return next;
    });

    showToast(`Calf details updated!`, 'info');
  };

  const deleteCalf = async (id) => {
    setCalvesState(prev => {
      const next = prev.filter(item => !isMatchId(item, id));
      setTenantStorageData(tenantId, 'calves', next);
      return next;
    });

    showToast(`Calf record deleted`, 'warning');
  };

  // ── Inventory CRUD ────────────────────────────────────────────
  const addInventoryItem = async (data) => {
    const savedItem = {
      ...data,
      id: data.id || `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
    };

    setInventoryState(prev => {
      const filtered = prev.filter(item => !isMatchId(item, savedItem._id || savedItem.id));
      const next = [savedItem, ...filtered];
      setTenantStorageData(tenantId, 'inventory', next);
      return next;
    });

    showToast(`Inventory item added!`, 'success');
    return savedItem;
  };

  const updateInventoryItem = async (id, data) => {
    setInventoryState(prev => {
      const next = prev.map(item => isMatchId(item, id) ? { ...item, ...data } : item);
      setTenantStorageData(tenantId, 'inventory', next);
      return next;
    });

    showToast(`Inventory item updated!`, 'info');
  };

  const deleteInventoryItem = async (id) => {
    setInventoryState(prev => {
      const next = prev.filter(item => !isMatchId(item, id));
      setTenantStorageData(tenantId, 'inventory', next);
      return next;
    });

    showToast(`Inventory item removed`, 'warning');
  };

  // ── Equipment CRUD ────────────────────────────────────────────
  const addEquipment = async (data) => {
    const savedItem = {
      ...data,
      id: data.id || `EQP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`
    };

    setEquipmentState(prev => {
      const filtered = prev.filter(item => !isMatchId(item, savedItem._id || savedItem.id));
      const next = [savedItem, ...filtered];
      setTenantStorageData(tenantId, 'equipment', next);
      return next;
    });

    showToast(`Equipment added!`, 'success');
    return savedItem;
  };

  const updateEquipment = async (id, data) => {
    setEquipmentState(prev => {
      const next = prev.map(item => isMatchId(item, id) ? { ...item, ...data } : item);
      setTenantStorageData(tenantId, 'equipment', next);
      return next;
    });

    showToast(`Equipment details updated!`, 'info');
  };

  const deleteEquipment = async (id) => {
    setEquipmentState(prev => {
      const next = prev.filter(item => !isMatchId(item, id));
      setTenantStorageData(tenantId, 'equipment', next);
      return next;
    });

    showToast(`Equipment removed`, 'warning');
  };

  // ── Employees CRUD ────────────────────────────────────────────
  const addEmployee = async (data) => {
    const savedItem = {
      ...data,
      id: data.id || `EMP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      role: data.role || data.designation || 'Laborer',
      designation: data.designation || data.role || 'Laborer',
      salary: Number(data.salary ?? data.monthlySalary ?? 0),
      monthlySalary: Number(data.monthlySalary ?? data.salary ?? 0),
      joinDate: data.joinDate || data.joiningDate || new Date().toISOString().slice(0, 10),
      joiningDate: data.joiningDate || data.joinDate
    };

    setEmployeesState(prev => {
      const filtered = prev.filter(item => !isMatchId(item, savedItem._id || savedItem.id));
      const next = [savedItem, ...filtered];
      setTenantStorageData(tenantId, 'employees', next);
      return next;
    });

    showToast(`Employee "${data.name}" added!`, 'success');
    return savedItem;
  };

  const updateEmployee = async (id, data) => {
    const payload = {
      ...data,
      role: data.role || data.designation || 'Laborer',
      designation: data.designation || data.role || 'Laborer',
      salary: Number(data.salary ?? data.monthlySalary ?? 0),
      monthlySalary: Number(data.monthlySalary ?? data.salary ?? 0)
    };

    setEmployeesState(prev => {
      const next = prev.map(item => isMatchId(item, id) ? { ...item, ...payload } : item);
      setTenantStorageData(tenantId, 'employees', next);
      return next;
    });

    showToast(`Employee profile updated!`, 'info');
  };

  const deleteEmployee = async (id) => {
    setEmployeesState(prev => {
      const next = prev.filter(item => !isMatchId(item, id));
      setTenantStorageData(tenantId, 'employees', next);
      return next;
    });

    showToast(`Employee removed`, 'warning');
  };

  // ── Customers CRUD ────────────────────────────────────────────
  const addCustomer = async (data) => {
    const savedItem = {
      ...data,
      id: data.id || `CUST-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      balance: Number(data.balance || 0)
    };

    setCustomersState(prev => {
      const filtered = prev.filter(item => !isMatchId(item, savedItem._id || savedItem.id));
      const next = [savedItem, ...filtered];
      setTenantStorageData(tenantId, 'customers', next);
      return next;
    });

    showToast(`Customer "${data.name}" registered!`, 'success');
    return savedItem;
  };

  const updateCustomer = async (id, data) => {
    setCustomersState(prev => {
      const next = prev.map(item => isMatchId(item, id) ? { ...item, ...data } : item);
      setTenantStorageData(tenantId, 'customers', next);
      return next;
    });

    showToast(`Customer info updated!`, 'info');
  };

  const deleteCustomer = async (id) => {
    setCustomersState(prev => {
      const next = prev.filter(item => !isMatchId(item, id));
      setTenantStorageData(tenantId, 'customers', next);
      return next;
    });

    showToast(`Customer removed`, 'warning');
  };

  // ── Finance: Income & Expenses ────────────────────────────────
  const addIncome = async (data) => {
    const savedItem = {
      ...data,
      id: data.id || `INC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      amount: Number(data.amount || 0)
    };

    setIncomeState(prev => {
      const filtered = prev.filter(item => !isMatchId(item, savedItem._id || savedItem.id));
      const next = [savedItem, ...filtered];
      setTenantStorageData(tenantId, 'income', next);
      return next;
    });

    showToast(`Income entry of ${settings.currency}${data.amount} saved!`, 'success');
    return savedItem;
  };

  const updateIncome = async (id, data) => {
    const dataToSave = { ...data, amount: Number(data.amount || 0) };

    setIncomeState(prev => {
      const next = prev.map(item => isMatchId(item, id) ? { ...item, ...dataToSave } : item);
      setTenantStorageData(tenantId, 'income', next);
      return next;
    });

    showToast(`Income entry updated!`, 'info');
  };

  const deleteIncome = async (id) => {
    setIncomeState(prev => {
      const next = prev.filter(item => !isMatchId(item, id));
      setTenantStorageData(tenantId, 'income', next);
      return next;
    });

    showToast(`Income record deleted`, 'warning');
  };

  const addExpense = async (data) => {
    const savedItem = {
      ...data,
      id: data.id || `EXP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      amount: Number(data.amount || 0)
    };

    setExpensesState(prev => {
      const filtered = prev.filter(item => !isMatchId(item, savedItem._id || savedItem.id));
      const next = [savedItem, ...filtered];
      setTenantStorageData(tenantId, 'expenses', next);
      return next;
    });

    showToast(`Expense entry of ${settings.currency}${data.amount} logged!`, 'success');
    return savedItem;
  };

  const updateExpense = async (id, data) => {
    const dataToSave = { ...data, amount: Number(data.amount || 0) };

    setExpensesState(prev => {
      const next = prev.map(item => isMatchId(item, id) ? { ...item, ...dataToSave } : item);
      setTenantStorageData(tenantId, 'expenses', next);
      return next;
    });

    showToast(`Expense entry updated!`, 'info');
  };

  const deleteExpense = async (id) => {
    setExpensesState(prev => {
      const next = prev.filter(item => !isMatchId(item, id));
      setTenantStorageData(tenantId, 'expenses', next);
      return next;
    });

    showToast(`Expense record deleted`, 'warning');
  };

  // Helper to extract milk quantity (in Liters) from a sale record
  const getMilkSaleQuantity = useCallback((s) => {
    if (!s) return 0;
    const cat = (s.category || '').toLowerCase();
    const itemType = (s.itemType || '').toLowerCase();
    const hasMilkItem = Array.isArray(s.items) && s.items.some(i => (i.description || '').toLowerCase().includes('milk'));
    const isMilk = cat === 'milk' || itemType === 'milk' || hasMilkItem;
    if (!isMilk) return 0;

    if (Array.isArray(s.items) && s.items.length > 0) {
      const itemQty = s.items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
      if (itemQty > 0) return itemQty;
    }
    return Number(s.quantity) || 0;
  }, []);

  // Milk Inventory Sync: Produced, Sold, and Available Stock
  const totalMilkProduced = useMemo(() => {
    return (milkRecords || []).reduce((sum, r) => {
      let q = Number(r.totalQty);
      if (isNaN(q) || q <= 0) {
        q = Number(r.morningQty || 0) + Number(r.eveningQty || 0);
      }
      return sum + (Number(q) || 0);
    }, 0);
  }, [milkRecords]);

  const totalMilkSold = useMemo(() => {
    return (sales || []).reduce((sum, s) => sum + getMilkSaleQuantity(s), 0);
  }, [sales, getMilkSaleQuantity]);

  const availableMilk = useMemo(() => {
    return Math.max(0, Number((totalMilkProduced - totalMilkSold).toFixed(2)));
  }, [totalMilkProduced, totalMilkSold]);

  // ── Sales Module CRUD & Credit Management ─────────────────────
  const addSale = async (data) => {
    if ((data.category || '').toLowerCase() === 'milk') {
      const milkSoldQty = getMilkSaleQuantity(data);
      if (milkSoldQty > availableMilk) {
        showToast(`Insufficient milk available for this sale. (Available: ${availableMilk} ${settings.milkUnit || 'Liter'}, Requested: ${milkSoldQty} ${settings.milkUnit || 'Liter'})`, 'error');
        return null;
      }
    }
    const total = Number(data.totalAmount || 0);
    const paid = Number(data.paidAmount || 0);
    const remaining = Math.max(0, Number((total - paid).toFixed(2)));

    let status = 'Paid';
    if (remaining === 0) status = 'Paid';
    else if (paid === 0) status = 'Credit';
    else status = 'Partial';

    const count = sales.length + 1;
    const invNum = data.invoiceNo || `INV-${1000 + count}`;

    const savedItem = {
      ...data,
      id: data.id || `SALE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      invoiceNo: invNum,
      totalAmount: total,
      paidAmount: paid,
      remainingAmount: remaining,
      paymentStatus: status
    };

    setSalesState(prev => {
      const filtered = prev.filter(item => !isMatchId(item, savedItem._id || savedItem.id));
      const next = [savedItem, ...filtered];
      setTenantStorageData(tenantId, 'sales', next);
      return next;
    });

    // 1. If Animal Sale, mark sold animals as 'Sold Out'
    if (data.category === 'Animal' && Array.isArray(data.items)) {
      for (const item of data.items) {
        const animal = animals.find(a => 
          (item.animalTag && a.tagNo === item.animalTag) || 
          (item.animalId && isMatchId(a, item.animalId))
        );
        if (animal) {
          await updateAnimal(animal.id || animal._id, {
            status: 'Sold Out',
            soldDate: data.date || new Date().toISOString().slice(0, 10),
            soldPrice: item.rate || item.total || total,
            soldTo: data.customerName || 'Customer',
            saleInvoiceNo: invNum
          });
        }
      }
    }

    // 2. Automatically create or update Customer record with balance
    if (data.customerName && data.customerName.trim()) {
      let targetCust = null;
      if (data.customerId) {
        targetCust = customers.find(c => isMatchId(c, data.customerId));
      }
      if (!targetCust && data.customerName) {
        const cleanName = data.customerName.trim().toLowerCase();
        targetCust = customers.find(c => c.name && c.name.trim().toLowerCase() === cleanName);
      }
      if (!targetCust && data.customerPhone) {
        const cleanPhone = data.customerPhone.trim();
        targetCust = customers.find(c => c.phone && c.phone.trim() === cleanPhone);
      }

      if (targetCust) {
        const prevBal = Number(targetCust.balance || 0);
        const newBal = Number((prevBal + remaining).toFixed(2));
        await updateCustomer(targetCust.id || targetCust._id, {
          phone: data.customerPhone || targetCust.phone,
          address: data.customerAddress || targetCust.address,
          balance: newBal,
          notes: targetCust.notes || `Customer of ${data.category} sale (${invNum})`
        });
      } else {
        await addCustomer({
          name: data.customerName.trim(),
          phone: data.customerPhone ? data.customerPhone.trim() : '',
          address: data.customerAddress ? data.customerAddress.trim() : '',
          balance: remaining,
          status: 'Active',
          notes: `Customer auto-created from ${data.category} Sale (${invNum})`
        });
      }
    }

    // 3. Automatically log Income for paid amount
    if (paid > 0) {
      const incomeCategory = data.category === 'Animal' ? 'Animal Sale' : 'Milk Sale';
      const incomePayload = {
        date: data.date || new Date().toISOString().slice(0, 10),
        category: incomeCategory,
        customer: data.customerName || 'Customer',
        amount: paid,
        paymentMethod: data.paymentMethod || 'Cash',
        accountId: data.accountId,
        accountName: data.accountName,
        saleId: savedItem.id || savedItem._id,
        invoiceNo: invNum,
        description: data.category === 'Animal'
          ? `Animal Sale Income (${invNum}) - ${data.items?.[0]?.description || 'Livestock Sold'}`
          : `Milk Sale Income (${invNum})`
      };

      const existingIncome = income.find(i => 
        (i.saleId && isMatchId({ id: i.saleId }, savedItem.id || savedItem._id)) || 
        (i.invoiceNo && i.invoiceNo === invNum)
      );

      if (existingIncome) {
        await updateIncome(existingIncome.id || existingIncome._id, incomePayload);
      } else {
        await addIncome(incomePayload);
      }
    }

    showToast(`Invoice ${invNum} saved successfully!`, 'success');
    return savedItem;
  };

  const updateSale = async (id, data) => {
    const existing = sales.find(s => isMatchId(s, id));
    if ((data.category || '').toLowerCase() === 'milk') {
      const oldQty = existing ? getMilkSaleQuantity(existing) : 0;
      const newQty = getMilkSaleQuantity(data);
      const effectiveAvailable = availableMilk + oldQty;
      if (newQty > effectiveAvailable) {
        showToast(`Insufficient milk available for this sale. (Available: ${effectiveAvailable.toFixed(1)} ${settings.milkUnit || 'Liter'}, Requested: ${newQty} ${settings.milkUnit || 'Liter'})`, 'error');
        return null;
      }
    }

    setSalesState(prev => {
      const next = prev.map(item => isMatchId(item, id) ? { ...item, ...data } : item);
      setTenantStorageData(tenantId, 'sales', next);
      return next;
    });

    const paid = Number(data.paidAmount || 0);
    const existingIncome = income.find(i => 
      (i.saleId && isMatchId({ id: i.saleId }, id)) || 
      (data.invoiceNo && i.invoiceNo === data.invoiceNo)
    );

    if (paid > 0) {
      const incomeCategory = data.category === 'Animal' ? 'Animal Sale' : 'Milk Sale';
      const incomePayload = {
        date: data.date || new Date().toISOString().slice(0, 10),
        category: incomeCategory,
        customer: data.customerName || 'Customer',
        amount: paid,
        paymentMethod: data.paymentMethod || 'Cash',
        accountId: data.accountId,
        accountName: data.accountName,
        saleId: id,
        invoiceNo: data.invoiceNo,
        description: data.category === 'Animal'
          ? `Animal Sale Income (${data.invoiceNo}) - ${data.items?.[0]?.description || 'Livestock Sold'}`
          : `Milk Sale Income (${data.invoiceNo})`
      };

      if (existingIncome) {
        await updateIncome(existingIncome.id || existingIncome._id, incomePayload);
      } else {
        await addIncome(incomePayload);
      }
    } else if (existingIncome) {
      await deleteIncome(existingIncome.id || existingIncome._id);
    }

    showToast(`Sale invoice updated!`, 'info');
  };

  const deleteSale = async (id) => {
    setSalesState(prev => {
      const next = prev.filter(item => !isMatchId(item, id));
      setTenantStorageData(tenantId, 'sales', next);
      return next;
    });

    const existingIncome = income.find(i => i.saleId && isMatchId({ id: i.saleId }, id));
    if (existingIncome) {
      await deleteIncome(existingIncome.id || existingIncome._id);
    }

    showToast(`Sale invoice deleted`, 'warning');
  };

  const recordCreditPayment = async (saleId, amountReceived, paymentMethod = 'Cash', date = new Date().toISOString().slice(0, 10), notes = '') => {
    const sale = sales.find(s => isMatchId(s, saleId));
    if (!sale) return;

    const recv = Number(amountReceived || 0);
    if (recv <= 0) return;

    const newPaid = Number((Number(sale.paidAmount || 0) + recv).toFixed(2));
    const newRemaining = Math.max(0, Number((Number(sale.totalAmount || 0) - newPaid).toFixed(2)));

    let newStatus = 'Paid';
    if (newRemaining === 0) newStatus = 'Paid';
    else if (newPaid === 0) newStatus = 'Credit';
    else newStatus = 'Partial';

    const updatedSale = {
      ...sale,
      paidAmount: newPaid,
      remainingAmount: newRemaining,
      paymentStatus: newStatus
    };

    setSalesState(prev => {
      const next = prev.map(item => isMatchId(item, saleId) ? updatedSale : item);
      setTenantStorageData(tenantId, 'sales', next);
      return next;
    });

    await addIncome({
      date: date,
      category: sale.category === 'Animal' ? 'Animal Sale' : 'Milk Sale',
      customer: sale.customerName || 'Customer',
      amount: recv,
      paymentMethod: paymentMethod,
      saleId: saleId,
      invoiceNo: sale.invoiceNo,
      description: `Credit Payment received for ${sale.invoiceNo} (${sale.customerName})`
    });

    if (sale.customerId || sale.customerName) {
      const cust = customers.find(c => isMatchId(c, sale.customerId) || c.name === sale.customerName);
      if (cust) {
        const newBal = Math.max(0, Number((Number(cust.balance || 0) - recv).toFixed(2)));
        await updateCustomer(cust.id || cust._id, { balance: newBal });
      }
    }

    showToast(`Credit payment of ${settings.currency}${recv} logged for ${sale.invoiceNo}!`, 'success');
  };

  // ── Accounts Module CRUD ──────────────────────────────────────
  const addAccount = async (data) => {
    const opening = Number(data.openingBalance || 0);
    const savedItem = {
      ...data,
      id: data.id || `ACC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      openingBalance: opening,
      currentBalance: opening,
      isActive: data.isActive !== undefined ? data.isActive : true
    };

    setAccountsState(prev => {
      const filtered = prev.filter(item => !isMatchId(item, savedItem._id || savedItem.id));
      const next = [savedItem, ...filtered];
      setTenantStorageData(tenantId, 'accounts', next);
      return next;
    });

    showToast(`Account "${savedItem.name || savedItem.bankName}" created!`, 'success');
    return savedItem;
  };

  const updateAccount = async (id, data) => {
    setAccountsState(prev => {
      const next = prev.map(item => isMatchId(item, id) ? { ...item, ...data } : item);
      setTenantStorageData(tenantId, 'accounts', next);
      return next;
    });

    showToast(`Account updated!`, 'info');
    return data;
  };

  const deleteAccount = async (id) => {
    setAccountsState(prev => {
      const next = prev.filter(item => !isMatchId(item, id));
      setTenantStorageData(tenantId, 'accounts', next);
      return next;
    });

    showToast(`Account removed`, 'warning');
  };

  // Live balance calculation for account
  const getAccountBalance = useCallback((accountOrId) => {
    const acc = typeof accountOrId === 'object' && accountOrId !== null
      ? accountOrId
      : accounts.find(a => isMatchId(a, accountOrId));
    if (!acc) return 0;

    const opening = Number(acc.openingBalance || 0);

    const inflow = income.reduce((sum, inc) => {
      const amt = Number(inc.amount || 0);
      if (inc.accountId && isMatchId(acc, inc.accountId)) return sum + amt;
      if (!inc.accountId) {
        if (acc.type === 'Cash' && inc.paymentMethod === 'Cash' && acc.isDefault) return sum + amt;
        if (acc.type === 'Bank' && (inc.paymentMethod === 'Bank' || inc.paymentMethod === 'Bank Transfer') && acc.isDefault) return sum + amt;
      }
      return sum;
    }, 0);

    const outflow = expenses.reduce((sum, exp) => {
      const amt = Number(exp.amount || 0);
      if (exp.accountId && isMatchId(acc, exp.accountId)) return sum + amt;
      if (!exp.accountId) {
        if (acc.type === 'Cash' && exp.paymentMethod === 'Cash' && acc.isDefault) return sum + amt;
        if (acc.type === 'Bank' && (exp.paymentMethod === 'Bank' || exp.paymentMethod === 'Bank Transfer') && acc.isDefault) return sum + amt;
      }
      return sum;
    }, 0);

    return opening + inflow - outflow;
  }, [accounts, income, expenses]);

  // ── Payroll Module CRUD ───────────────────────────────────────
  const addPayroll = async (data) => {
    const base = Number(data.baseSalary || 0);
    const bonus = Number(data.bonus || 0);
    const deductions = Number(data.deductions || 0);
    const net = Number(data.netSalary !== undefined ? data.netSalary : (base + bonus - deductions));

    const savedItem = {
      ...data,
      id: data.id || `PAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      baseSalary: base,
      bonus: bonus,
      deductions: deductions,
      netSalary: net,
      status: data.status || 'Pending'
    };

    setPayrollState(prev => {
      const filtered = prev.filter(item => !isMatchId(item, savedItem._id || savedItem.id));
      const next = [savedItem, ...filtered];
      setTenantStorageData(tenantId, 'payroll', next);
      return next;
    });

    if (savedItem.status === 'Paid' && net > 0) {
      await addExpense({
        date: savedItem.paymentDate || new Date().toISOString().slice(0, 10),
        category: 'Employee Salary',
        amount: net,
        paymentMethod: savedItem.paymentMethod || 'Cash',
        accountId: savedItem.accountId,
        accountName: savedItem.accountName,
        payrollId: savedItem.id || savedItem._id,
        description: `Salary for ${savedItem.employeeName} (${savedItem.month || 'Current Month'})`
      });
    }

    showToast(`Payroll entry for ${savedItem.employeeName} created!`, 'success');
    return savedItem;
  };

  const updatePayroll = async (id, data) => {
    const base = Number(data.baseSalary || 0);
    const bonus = Number(data.bonus || 0);
    const deductions = Number(data.deductions || 0);
    const net = Number(data.netSalary !== undefined ? data.netSalary : (base + bonus - deductions));

    const updatedData = {
      ...data,
      baseSalary: base,
      bonus: bonus,
      deductions: deductions,
      netSalary: net
    };

    setPayrollState(prev => {
      const next = prev.map(item => isMatchId(item, id) ? { ...item, ...updatedData } : item);
      setTenantStorageData(tenantId, 'payroll', next);
      return next;
    });

    const existingExpense = expenses.find(e => e.payrollId === id || (e._id && e.payrollId === e._id));
    if (updatedData.status === 'Paid') {
      if (existingExpense) {
        await updateExpense(existingExpense.id || existingExpense._id, {
          date: updatedData.paymentDate || existingExpense.date,
          category: 'Employee Salary',
          amount: net,
          paymentMethod: updatedData.paymentMethod || existingExpense.paymentMethod,
          accountId: updatedData.accountId,
          accountName: updatedData.accountName,
          payrollId: id,
          description: `Salary for ${updatedData.employeeName} (${updatedData.month || 'Month'})`
        });
      } else {
        await addExpense({
          date: updatedData.paymentDate || new Date().toISOString().slice(0, 10),
          category: 'Employee Salary',
          amount: net,
          paymentMethod: updatedData.paymentMethod || 'Cash',
          accountId: updatedData.accountId,
          accountName: updatedData.accountName,
          payrollId: id,
          description: `Salary for ${updatedData.employeeName} (${updatedData.month || 'Month'})`
        });
      }
    } else if (existingExpense) {
      await deleteExpense(existingExpense.id || existingExpense._id);
    }

    showToast(`Payroll record updated!`, 'info');
    return updatedData;
  };

  const deletePayroll = async (id) => {
    setPayrollState(prev => {
      const next = prev.filter(item => !isMatchId(item, id));
      setTenantStorageData(tenantId, 'payroll', next);
      return next;
    });

    const existingExpense = expenses.find(e => e.payrollId === id);
    if (existingExpense) {
      await deleteExpense(existingExpense.id || existingExpense._id);
    }

    showToast(`Payroll record deleted`, 'warning');
  };

  // ── Settings & Demo Reset ─────────────────────────────────────
  const updateSettings = async (newSettings) => {
    const updated = {
      ...settings,
      ...newSettings,
      currency: (newSettings.currency !== undefined ? String(newSettings.currency).trim() : settings.currency) || 'Rs.',
      milkUnit: (newSettings.milkUnit !== undefined ? String(newSettings.milkUnit).trim() : settings.milkUnit) || 'Liter',
      weightUnit: (newSettings.weightUnit !== undefined ? String(newSettings.weightUnit).trim() : settings.weightUnit) || 'Kilogram'
    };
    setSettingsState(updated);
    setGlobalFormatSettings(updated);
    setTenantStorageData(tenantId, 'settings', updated);
    showToast(`Farm settings saved!`, 'success');
  };

  const resetDemoData = () => {
    const initSettings = getInitialTenantSettings(tenantId);
    const defaultAccs = getDefaultAccounts();

    setSettingsState(initSettings);
    setTenantStorageData(tenantId, 'settings', initSettings);

    setAnimalsState(INITIAL_ANIMALS);
    setTenantStorageData(tenantId, 'animals', INITIAL_ANIMALS);

    setMilkRecordsState(INITIAL_MILK_RECORDS);
    setTenantStorageData(tenantId, 'milkRecords', INITIAL_MILK_RECORDS);

    setFeedItemsState(INITIAL_FEED_ITEMS);
    setTenantStorageData(tenantId, 'feedItems', INITIAL_FEED_ITEMS);

    setFeedLogsState(INITIAL_FEED_LOGS);
    setTenantStorageData(tenantId, 'feedLogs', INITIAL_FEED_LOGS);

    setHealthRecordsState(INITIAL_HEALTH_RECORDS);
    setTenantStorageData(tenantId, 'healthRecords', INITIAL_HEALTH_RECORDS);

    setVaccinationsState(INITIAL_VACCINATIONS);
    setTenantStorageData(tenantId, 'vaccinations', INITIAL_VACCINATIONS);

    setMedicinesState(INITIAL_MEDICINES);
    setTenantStorageData(tenantId, 'medicines', INITIAL_MEDICINES);

    setBreedingRecordsState(INITIAL_BREEDING);
    setTenantStorageData(tenantId, 'breedingRecords', INITIAL_BREEDING);

    setCalvesState(INITIAL_CALVES);
    setTenantStorageData(tenantId, 'calves', INITIAL_CALVES);

    setInventoryState(INITIAL_INVENTORY);
    setTenantStorageData(tenantId, 'inventory', INITIAL_INVENTORY);

    setEquipmentState(INITIAL_EQUIPMENT);
    setTenantStorageData(tenantId, 'equipment', INITIAL_EQUIPMENT);

    setEmployeesState(INITIAL_EMPLOYEES);
    setTenantStorageData(tenantId, 'employees', INITIAL_EMPLOYEES);

    setCustomersState(INITIAL_CUSTOMERS);
    setTenantStorageData(tenantId, 'customers', INITIAL_CUSTOMERS);

    setIncomeState(INITIAL_INCOME);
    setTenantStorageData(tenantId, 'income', INITIAL_INCOME);

    setExpensesState(INITIAL_EXPENSES);
    setTenantStorageData(tenantId, 'expenses', INITIAL_EXPENSES);

    setSalesState(INITIAL_SALES);
    setTenantStorageData(tenantId, 'sales', INITIAL_SALES);

    setAccountsState(defaultAccs);
    setTenantStorageData(tenantId, 'accounts', defaultAccs);

    setPayrollState([]);
    setTenantStorageData(tenantId, 'payroll', []);

    showToast(`Application reset to full original demo dataset!`, 'info');
  };

  // ── Export & Import Data ──────────────────────────────────────
  const exportAllData = async () => {
    const fullData = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      farmName: settings?.farmName || 'Cattle ERP',
      settings,
      animals: animals || [],
      milkRecords: milkRecords || [],
      feedItems: feedItems || [],
      feedLogs: feedLogs || [],
      healthRecords: healthRecords || [],
      vaccinations: vaccinations || [],
      medicines: medicines || [],
      breedingRecords: breedingRecords || [],
      calves: calves || [],
      inventory: inventory || [],
      equipment: equipment || [],
      employees: employees || [],
      customers: customers || [],
      income: income || [],
      expenses: expenses || [],
      sales: sales || [],
      accounts: accounts || [],
      payroll: payroll || []
    };

    const jsonStr = JSON.stringify(fullData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cattle_ERP_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast(`Full backup file generated & downloaded!`, 'success');
  };

  const importAllData = async (jsonData, options = { mode: 'merge' }) => {
    if (!jsonData || typeof jsonData !== 'object') {
      showToast('Invalid backup file format.', 'error');
      return { success: false, message: 'Invalid backup file format.' };
    }

    const mode = options?.mode || 'merge';
    const isReplace = mode === 'replace';

    const normalized = (jsonData.counts && Array.isArray(jsonData.animals))
      ? jsonData
      : normalizeAndClassifyBackup(jsonData);

    const validation = validateBackupPayload(normalized);
    if (!validation.valid) {
      showToast(validation.message, 'error');
      return { success: false, message: validation.message };
    }

    const processCollection = (incomingList, existingList, keyFn, prefix) => {
      const incoming = Array.isArray(incomingList) ? incomingList : [];
      const existing = Array.isArray(existingList) ? existingList : [];

      if (isReplace) {
        return incoming.map((item, idx) => ({
          ...item,
          id: item.id || `${prefix}-${Date.now()}-${idx}`
        }));
      }

      const seen = new Set();
      const result = [...existing];
      existing.forEach(item => {
        const k = keyFn(item);
        if (k) seen.add(k);
      });

      incoming.forEach((item, idx) => {
        const clean = {
          ...item,
          id: item.id || `${prefix}-${Date.now()}-${idx}`
        };
        const k = keyFn(clean);
        if (k && !seen.has(k)) {
          seen.add(k);
          result.push(clean);
        } else if (!k) {
          result.push(clean);
        }
      });

      return result;
    };

    try {
      const mergedSettings = { ...settings, ...(normalized.settings || {}) };
      setSettingsState(mergedSettings);
      setTenantStorageData(tenantId, 'settings', mergedSettings);

      const pAnimals = processCollection(normalized.animals, animals, a => a.tagNo, 'ANM');
      setAnimalsState(pAnimals);
      setTenantStorageData(tenantId, 'animals', pAnimals);

      const pMilk = processCollection(normalized.milkRecords, milkRecords, m => `${m.date}_${m.animalTag}`, 'MLK');
      setMilkRecordsState(pMilk);
      setTenantStorageData(tenantId, 'milkRecords', pMilk);

      const pFeed = processCollection(normalized.feedItems, feedItems, f => (f.feedName || '').toLowerCase(), 'FED');
      setFeedItemsState(pFeed);
      setTenantStorageData(tenantId, 'feedItems', pFeed);

      const pHealth = processCollection(normalized.healthRecords, healthRecords, h => `${h.date}_${h.animalTag}_${h.problem}`, 'HLT');
      setHealthRecordsState(pHealth);
      setTenantStorageData(tenantId, 'healthRecords', pHealth);

      const pVac = processCollection(normalized.vaccinations, vaccinations, v => `${v.animalTag}_${v.vaccineName}_${v.vaccinationDate}`, 'VAC');
      setVaccinationsState(pVac);
      setTenantStorageData(tenantId, 'vaccinations', pVac);

      const pMed = processCollection(normalized.medicines, medicines, m => (m.name || '').toLowerCase(), 'MED');
      setMedicinesState(pMed);
      setTenantStorageData(tenantId, 'medicines', pMed);

      const pBrd = processCollection(normalized.breedingRecords, breedingRecords, b => `${b.femaleTag}_${b.breedingDate}`, 'BRD');
      setBreedingRecordsState(pBrd);
      setTenantStorageData(tenantId, 'breedingRecords', pBrd);

      const pCalves = processCollection(normalized.calves, calves, c => c.calfTag, 'CLF');
      setCalvesState(pCalves);
      setTenantStorageData(tenantId, 'calves', pCalves);

      const pInv = processCollection(normalized.inventory, inventory, i => (i.name || '').toLowerCase(), 'INV');
      setInventoryState(pInv);
      setTenantStorageData(tenantId, 'inventory', pInv);

      const pEqp = processCollection(normalized.equipment, equipment, e => (e.name || '').toLowerCase(), 'EQP');
      setEquipmentState(pEqp);
      setTenantStorageData(tenantId, 'equipment', pEqp);

      const pEmp = processCollection(normalized.employees, employees, e => (e.cnic || e.phone || e.name || '').toLowerCase(), 'EMP');
      setEmployeesState(pEmp);
      setTenantStorageData(tenantId, 'employees', pEmp);

      const pCust = processCollection(normalized.customers, customers, c => (c.phone || c.name || '').toLowerCase(), 'CUST');
      setCustomersState(pCust);
      setTenantStorageData(tenantId, 'customers', pCust);

      const pInc = processCollection(normalized.income, income, i => `${i.date}_${i.amount}_${i.description}`, 'INC');
      setIncomeState(pInc);
      setTenantStorageData(tenantId, 'income', pInc);

      const pExp = processCollection(normalized.expenses, expenses, e => `${e.date}_${e.amount}_${e.description}`, 'EXP');
      setExpensesState(pExp);
      setTenantStorageData(tenantId, 'expenses', pExp);

      const pSales = processCollection(normalized.sales, sales, s => s.invoiceNo, 'SALE');
      setSalesState(pSales);
      setTenantStorageData(tenantId, 'sales', pSales);

      const pFdl = processCollection(normalized.feedLogs, feedLogs, f => `${f.date}_${f.animalTag}_${f.feedItemId}`, 'FDL');
      setFeedLogsState(pFdl);
      setTenantStorageData(tenantId, 'feedLogs', pFdl);

      showToast(`Data restored successfully!`, 'success');
      return { success: true };
    } catch (e) {
      console.error('Import backup failed:', e);
      showToast('Import failed: ' + (e.message || 'Error processing data'), 'error');
      return { success: false, message: e.message };
    }
  };

  // ── Dynamic Computed Alerts for Dashboard & Header ───────────
  const alerts = useMemo(() => {
    const list = [];

    // 1. Vaccinations due soon or overdue
    (vaccinations || []).forEach(vac => {
      if (vac.status === 'Due Soon' || vac.status === 'Overdue') {
        list.push({
          id: `alert-vac-${vac.id || vac._id}`,
          type: vac.status === 'Overdue' ? 'danger' : 'warning',
          title: `Vaccination ${vac.status}`,
          message: `${vac.vaccineName} for ${vac.animalTag} is ${vac.status.toLowerCase()} (Due: ${vac.nextDueDate})`,
          link: '/vaccinations'
        });
      }
    });

    // 2. Pregnancy delivery within 14 days
    (breedingRecords || []).forEach(brd => {
      if (brd.pregnancyStatus === 'Pregnant' && brd.expectedDeliveryDate) {
        const diffDays = Math.ceil((new Date(brd.expectedDeliveryDate) - new Date()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 14) {
          list.push({
            id: `alert-del-${brd.id || brd._id}`,
            type: diffDays <= 7 ? 'danger' : 'warning',
            title: 'Delivery Approaching',
            message: `Female ${brd.femaleTag} expected delivery in ${diffDays} days (${brd.expectedDeliveryDate})`,
            link: '/pregnancy'
          });
        }
      }
    });

    // 3. Low feed stock
    (feedItems || []).forEach(feed => {
      if (Number(feed.quantity) <= Number(feed.minStock)) {
        list.push({
          id: `alert-feed-${feed.id || feed._id}`,
          type: 'warning',
          title: 'Low Feed Stock',
          message: `"${feed.feedName}" stock is low (${feed.quantity} ${feed.unit} remaining)`,
          link: '/feed'
        });
      }
    });

    // 4. Medicine expiring or low stock
    (medicines || []).forEach(med => {
      if (med.expiryDate) {
        const expDays = Math.ceil((new Date(med.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        if (expDays <= 30 && expDays >= 0) {
          list.push({
            id: `alert-med-${med.id || med._id}`,
            type: 'danger',
            title: 'Medicine Expiring Soon',
            message: `"${med.name}" expires in ${expDays} days (${med.expiryDate})`,
            link: '/medicines'
          });
        }
      }
    });

    // 5. Sick animals
    (animals || []).forEach(anm => {
      if (anm.healthStatus === 'Sick') {
        list.push({
          id: `alert-sick-${anm.id || anm._id}`,
          type: 'danger',
          title: 'Sick Animal Alert',
          message: `Animal ${anm.tagNo} (${anm.name}) requires veterinary care`,
          link: `/animals/${anm.id || anm._id}`
        });
      }
    });

    return list;
  }, [vaccinations, breedingRecords, feedItems, medicines, animals]);

  const value = useMemo(() => ({
    settings,
    animals,
    milkRecords,
    feedItems,
    healthRecords,
    vaccinations,
    medicines,
    breedingRecords,
    calves,
    inventory,
    equipment,
    employees,
    customers,
    income,
    expenses,
    sales,
    feedLogs,
    accounts,
    payroll,
    alerts,
    toast,
    showToast,
    syncFromApi,
    addAnimal,
    updateAnimal,
    deleteAnimal,
    addMilkRecord,
    updateMilkRecord,
    deleteMilkRecord,
    addFeedItem,
    updateFeedItem,
    deleteFeedItem,
    recordFeedUsage,
    deleteFeedLog,
    addHealthRecord,
    updateHealthRecord,
    deleteHealthRecord,
    addVaccination,
    updateVaccination,
    deleteVaccination,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    addBreeding,
    updateBreeding,
    deleteBreeding,
    addBreedingRecord: addBreeding,
    updateBreedingRecord: updateBreeding,
    deleteBreedingRecord: deleteBreeding,
    addCalf,
    updateCalf,
    deleteCalf,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
    addAccount,
    updateAccount,
    deleteAccount,
    getAccountBalance,
    addPayroll,
    updatePayroll,
    deletePayroll,
    addSale,
    updateSale,
    deleteSale,
    totalMilkProduced,
    totalMilkSold,
    availableMilk,
    getMilkSaleQuantity,
    recordCreditPayment,
    updateSettings,
    resetDemoData,
    exportAllData,
    importAllData
  }), [
    settings,
    animals,
    milkRecords,
    totalMilkProduced,
    totalMilkSold,
    availableMilk,
    getMilkSaleQuantity,
    feedItems,
    healthRecords,
    vaccinations,
    medicines,
    breedingRecords,
    calves,
    inventory,
    equipment,
    employees,
    customers,
    income,
    expenses,
    sales,
    feedLogs,
    accounts,
    payroll,
    alerts,
    toast,
    syncFromApi,
    getAccountBalance
  ]);

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};
