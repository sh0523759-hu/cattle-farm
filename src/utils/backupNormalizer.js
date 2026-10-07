/**
 * Cattle ERP - Universal Backup Parser, Normalizer & Entity Classifier
 * Accurately parses ANY JSON backup: full ERP exports, arrays of entities,
 * single animal/module objects, nested envelopes, MongoDB dumps, and legacy formats.
 */

export const normalizeUnitValue = (val, defaultUnit = 'Kilogram') => {
  if (!val) return defaultUnit;
  const s = String(val).trim().toLowerCase();
  if (['l', 'liter', 'liters', 'litre', 'litres'].includes(s)) return 'Liter';
  if (['kg', 'kgs', 'kilogram', 'kilograms', 'kilo', 'kilos'].includes(s)) return 'Kilogram';
  if (['gm', 'g', 'gram', 'grams'].includes(s)) return 'Gram';
  if (['ml', 'milliliter', 'milliliters'].includes(s)) return 'Milliliter';
  if (['pcs', 'piece', 'pieces', 'unit', 'units'].includes(s)) return 'Piece';
  if (['bag', 'bags', 'sack', 'sacks'].includes(s)) return 'Bag';
  return val;
};

export const parseCleanNumber = (val, defaultVal = 0) => {
  if (val === undefined || val === null || val === '') return defaultVal;
  if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
  if (typeof val === 'string') {
    let s = val.trim();
    // Remove words ending in dot or words in general (e.g. 'Rs.', 'PKR', 'USD', 'kg', 'Liter', etc.)
    s = s.replace(/[a-zA-Z]+[.:]?/g, '');
    // Remove common currency symbols
    s = s.replace(/[\$€£¥₹]/g, '');
    // Remove whitespace
    s = s.replace(/\s+/g, '');
    // Handle commas (e.g. '75,000' or '185,000.50')
    if (s.includes(',') && s.includes('.')) {
      if (s.lastIndexOf('.') > s.lastIndexOf(',')) {
        s = s.replace(/,/g, '');
      } else {
        s = s.replace(/\./g, '').replace(',', '.');
      }
    } else if (s.includes(',')) {
      s = s.replace(/,/g, '');
    }
    const cleaned = s.replace(/[^0-9.-]/g, '');
    if (cleaned === '' || cleaned === '-' || cleaned === '.') return defaultVal;
    const n = parseFloat(cleaned);
    return isNaN(n) ? defaultVal : n;
  }
  return defaultVal;
};

// Known collection keys with regex aliases
const COLLECTION_MATCHERS = {
  animals: /^(animals?|cattles?|cows?|livestocks?|buffalos?|animal_?records?)$/i,
  milkRecords: /^(milk_?records?|milks?|milkings?|milking_?records?|milk_?productions?|daily_?milks?)$/i,
  feedItems: /^(feed_?items?|feeds?|feed_?stocks?|feed_?inventory|feedstocks?|feed_?managements?)$/i,
  feedLogs: /^(feed_?logs?|feed_?usages?|feedings?|feed_?records?)$/i,
  healthRecords: /^(health_?records?|healths?|treatments?|medicals?|treatment_?records?|diseases?|health_?veterinar(y|ies)?)$/i,
  vaccinations: /^(vaccinations?|vaccines?|vaccination_?records?|vaccine_?records?)$/i,
  medicines: /^(medicines?|meds?|drugs?|pharmacy|medicine_?items?|medicine_?inventory)$/i,
  breedingRecords: /^(breeding_?records?|breedings?|inseminations?|matings?|reproductions?|ai_?records?|breeding_?pregnanc(y|ies)?)$/i,
  calves: /^(calves|calfs?|baby_?animals?|calf_?records?)$/i,
  inventory: /^(inventory|inventories|inventory_?items?|stocks?|items|general_?inventory)$/i,
  equipment: /^(equipments?|machinery|tools|machines|equipment_?items?)$/i,
  employees: /^(employees?|staffs?|workers?|team|laborers?|employee_?records?|staff_?records?)$/i,
  customers: /^(customers?|clients?|buyers?|customer_?records?)$/i,
  sales: /^(sales?|orders?|invoices?|sale_?records?)$/i,
  income: /^(incomes?|revenues?|earnings?|income_?records?)$/i,
  expenses: /^(expenses?|expenditures?|costs?|expense_?records?)$/i,
  accounts: /^(accounts?|banks?|bank_?accounts?|account_?records?)$/i,
  payroll: /^(payrolls?|salaries?|salary|payroll_?records?)$/i
};

/**
 * Intelligent single item signature inspector
 * Detects the ERP entity type for unknown flat/mixed JSON array items or single entity imports
 */
export const classifyItemSignature = (item) => {
  if (!item || typeof item !== 'object') return null;

  // 1. Explicit entity/table indicator
  const explicitType = item.type || item.entity || item.collection || item.table || item.model;
  if (typeof explicitType === 'string') {
    for (const [col, regex] of Object.entries(COLLECTION_MATCHERS)) {
      if (regex.test(explicitType)) return col;
    }
  }

  // 2. Calf: check before animal
  if (
    item.calfTag || item.calf_tag ||
    item.isCalf === true ||
    (item.birthWeight && (item.damTag || item.motherTag || item.gender) && !item.morningQty && !item.lactationStatus)
  ) {
    return 'calves';
  }

  // 3. Animal: includes animalName, animalType, weightKg, purchaseDate, etc.
  if (
    item.tagNo || item.tag_no || item.earTag || item.ear_tag || item.tagNumber ||
    item.animalName || item.animal_name || item.animalType || item.animal_type ||
    item.weightKg || item.weight_kg || item.lactationStatus ||
    (item.breed && (item.species || item.gender || item.dob || item.lactationStatus || item.animalType || item.type || item.purchaseDate))
  ) {
    return 'animals';
  }

  // 4. Milk Record
  if (
    item.morningQty !== undefined || item.eveningQty !== undefined ||
    item.morning_qty !== undefined || item.evening_qty !== undefined ||
    item.milkQuantity !== undefined ||
    (item.liters !== undefined && (item.animalTag || item.milkingDate || item.fatRate)) ||
    (item.animalTag && item.totalQty !== undefined)
  ) {
    return 'milkRecords';
  }

  // 5. Feed Item
  if (
    item.feedName || item.feed_name || item.feedType || item.feed_type ||
    (item.protein !== undefined && item.fiber !== undefined) ||
    (item.costPerUnit !== undefined && item.reorderLevel !== undefined)
  ) {
    return 'feedItems';
  }

  // 6. Feed Log
  if (
    item.feedItemId || item.feed_item_id ||
    item.quantityGiven !== undefined || item.quantity_given !== undefined ||
    (item.animalTag && item.feedName && (item.totalCost !== undefined || item.notes))
  ) {
    return 'feedLogs';
  }

  // 7. Vaccination
  if (
    item.vaccineName || item.vaccine_name || item.vaccine ||
    (item.dose !== undefined && (item.nextDueDate || item.batchNumber))
  ) {
    return 'vaccinations';
  }

  // 8. Health Record
  if (
    item.problem || item.diagnosis || item.symptoms ||
    item.vetName || item.vet_name || item.veterinarian ||
    (item.treatment && item.animalTag && !item.vaccineName)
  ) {
    return 'healthRecords';
  }

  // 9. Medicine
  if (
    item.medicineName || item.medicine_name || item.genericName || item.generic_name ||
    (item.dosage && item.expiryDate) ||
    (item.medicine && item.stock !== undefined)
  ) {
    return 'medicines';
  }

  // 10. Breeding Record
  if (
    item.sireTag || item.sire_tag || item.inseminationDate || item.insemination_date ||
    item.semenStrawId || item.pregnancyStatus || item.expectedDeliveryDate ||
    item.aiDate || item.matingDate
  ) {
    return 'breedingRecords';
  }

  // 11. Bank Account
  if (
    item.accountNumber || item.account_number || item.bankName || item.bank_name ||
    (item.accountName && (item.accountType || item.initialBalance !== undefined))
  ) {
    return 'accounts';
  }

  // 12. Payroll
  if (
    item.salaryMonth || item.salary_month ||
    (item.employeeId && (item.basicSalary !== undefined || item.netSalary !== undefined || item.monthYear)) ||
    (item.designation && item.netSalary !== undefined)
  ) {
    return 'payroll';
  }

  // 13. Employee (robust signature detection)
  if (
    item.employeeName || item.employee_name || item.staffName || item.workerName ||
    item.designation || item.jobTitle || item.position ||
    item.joinDate || item.join_date || item.joiningDate || item.joining_date || item.hireDate || item.hire_date ||
    item.attendanceToday || item.attendance ||
    (item.role && !item.userType && (item.salary !== undefined || item.monthlySalary !== undefined || item.phone || item.cnic || item.department || item.name)) ||
    (item.monthlySalary !== undefined && !item.salaryMonth && !item.monthYear && !item.paymentDate) ||
    ((item.salary !== undefined || item.wage !== undefined) && (item.department || item.role || item.designation || item.cnic || item.phone || item.bankName || item.employeeId)) ||
    (item.cnic && (item.phone || item.role || item.designation || item.salary !== undefined || item.monthlySalary !== undefined))
  ) {
    return 'employees';
  }

  // 14. Customer or Sale
  if (item.invoiceNo || item.invoice_no) {
    return 'sales';
  }
  if (
    item.customerName || item.customer_name || item.buyerName || item.buyer_name ||
    (item.contact && (item.customerType || item.milkRate))
  ) {
    if (item.totalAmount !== undefined || item.items || item.quantity) {
      return 'sales';
    }
    return 'customers';
  }
  if (item.totalAmount !== undefined && (item.unitPrice || item.items || item.customer)) {
    return 'sales';
  }

  // 15. Income / Expense
  if (item.amount !== undefined && (item.category || item.description || item.date)) {
    const isExplicitIncome =
      item.type?.toLowerCase() === 'income' ||
      item.transactionType?.toLowerCase() === 'income' ||
      item.isIncome === true ||
      /sale|milk|revenue|profit|earning|credit/i.test(String(item.category || item.description || ''));

    const isExplicitExpense =
      item.type?.toLowerCase() === 'expense' ||
      item.transactionType?.toLowerCase() === 'expense' ||
      item.paidTo || item.vendor ||
      /feed|salary|med|vet|bill|electric|maintenance|fuel|purchase|debit/i.test(String(item.category || item.description || ''));

    if (isExplicitIncome && !isExplicitExpense) return 'income';
    if (isExplicitExpense) return 'expenses';
    return item.amount >= 0 ? 'income' : 'expenses';
  }

  // 16. Equipment
  if (
    item.equipmentName || item.equipment_name ||
    item.serialNumber || item.serial_no || item.model ||
    (item.purchasePrice !== undefined && item.warranty !== undefined)
  ) {
    return 'equipment';
  }

  // 17. Inventory Item
  if (
    item.itemName || item.item_name ||
    (item.stockQty !== undefined && item.unitPrice !== undefined) ||
    (item.minStock !== undefined && item.unit !== undefined)
  ) {
    return 'inventory';
  }

  // 18. Default fallback based on common properties
  if (item.breed || item.species || item.tagNo || item.tag) {
    return 'animals';
  }

  return null;
};

/**
 * Validates the structure and required fields of a normalized backup payload
 */
export const validateBackupPayload = (normalized) => {
  if (!normalized || typeof normalized !== 'object') {
    return { valid: false, message: 'Invalid JSON file structure.' };
  }

  if (normalized.totalRecords === 0 && !normalized.hasSettings) {
    return { valid: false, message: 'No recognizable Cattle ERP farm records found in this JSON backup file.' };
  }

  const errors = [];

  // Validate animals if present
  if (normalized.animals && normalized.animals.length > 0) {
    for (let i = 0; i < normalized.animals.length; i++) {
      const a = normalized.animals[i];
      const hasIdentifier = Boolean(
        a.name || a.animalName || a.tagNo || a.tag || a.breed || a.type || a.animalType || a.weight || a.weightKg
      );
      if (!hasIdentifier) {
        errors.push(`Animals record #${i + 1}: Missing identifier (animalName/name, tagNo, breed, or animalType).`);
      }
    }
  }

  // Validate employees if present
  if (normalized.employees && normalized.employees.length > 0) {
    for (let i = 0; i < normalized.employees.length; i++) {
      const e = normalized.employees[i];
      const hasName = Boolean(
        e.name || e.employeeName || e.employee_name || e.fullName || e.staffName || e.workerName || e.phone || e.cnic
      );
      if (!hasName) {
        errors.push(`Employees record #${i + 1}: Missing required employee name or phone/CNIC.`);
      }
    }
  }

  // Validate customers if present
  if (normalized.customers && normalized.customers.length > 0) {
    for (let i = 0; i < normalized.customers.length; i++) {
      const c = normalized.customers[i];
      const hasName = Boolean(c.name || c.customerName || c.customer_name || c.buyerName || c.phone);
      if (!hasName) {
        errors.push(`Customers record #${i + 1}: Missing required customer name or phone.`);
      }
    }
  }

  // Validate accounts if present
  if (normalized.accounts && normalized.accounts.length > 0) {
    for (let i = 0; i < normalized.accounts.length; i++) {
      const acc = normalized.accounts[i];
      const hasName = Boolean(acc.name || acc.accountName || acc.bankName || acc.accountNumber);
      if (!hasName) {
        errors.push(`Accounts record #${i + 1}: Missing account name or bank title.`);
      }
    }
  }

  if (errors.length > 0) {
    return {
      valid: false,
      message: errors.slice(0, 3).join(' ') + (errors.length > 3 ? ` (+${errors.length - 3} more errors)` : ''),
      errors
    };
  }

  return {
    valid: true,
    totalRecords: normalized.totalRecords,
    counts: normalized.counts
  };
};

/**
 * Normalizes an arbitrary parsed JSON backup into a standardized Cattle ERP structure.
 */
export const normalizeAndClassifyBackup = (parsed) => {
  const result = {
    settings: null,
    animals: [],
    milkRecords: [],
    feedItems: [],
    feedLogs: [],
    healthRecords: [],
    vaccinations: [],
    medicines: [],
    breedingRecords: [],
    calves: [],
    inventory: [],
    equipment: [],
    employees: [],
    customers: [],
    income: [],
    expenses: [],
    sales: [],
    accounts: [],
    payroll: [],
    counts: {},
    totalRecords: 0,
    hasSettings: false,
    farmName: null,
    exportDate: null
  };

  if (!parsed || typeof parsed !== 'object') {
    return result;
  }

  // Iteratively unwrap outer envelopes (backup, data, records, export, etc.)
  let raw = parsed;
  const envelopeKeys = ['backup', 'data', 'records', 'items', 'database', 'db', 'export', 'payload', 'result', 'results', 'tables', 'collections', 'state', 'store', 'cattle_erp', 'cattleErp', 'CattleERP'];
  
  for (let depth = 0; depth < 4; depth++) {
    if (Array.isArray(raw)) break; // raw is already an array, stop unwrapping
    if (!raw || typeof raw !== 'object') break;

    // Check if this object directly contains recognized collection keys
    const directKeys = Object.keys(raw);
    const hasDirectCollection = directKeys.some(k => 
      Object.values(COLLECTION_MATCHERS).some(regex => regex.test(k))
    );

    if (hasDirectCollection) {
      break;
    }

    // Try to drill down into a known envelope key
    let drilled = false;
    for (const envKey of envelopeKeys) {
      if (raw[envKey] && (typeof raw[envKey] === 'object')) {
        raw = raw[envKey];
        drilled = true;
        break;
      }
    }
    if (!drilled) break;
  }

  // Extract settings, farmName, exportDate if present
  if (parsed.exportDate || raw.exportDate) {
    result.exportDate = parsed.exportDate || raw.exportDate;
  }
  if (parsed.farmName || raw.farmName || raw.settings?.farmName || parsed.settings?.farmName) {
    result.farmName = parsed.farmName || raw.farmName || raw.settings?.farmName || parsed.settings?.farmName;
  }

  const rawSettings = raw.settings || parsed.settings || raw.farmSettings || parsed.farmSettings;
  if (rawSettings && typeof rawSettings === 'object' && !Array.isArray(rawSettings)) {
    result.settings = { ...rawSettings };
    if (result.settings.milkUnit) result.settings.milkUnit = normalizeUnitValue(result.settings.milkUnit, 'Liter');
    if (result.settings.weightUnit) result.settings.weightUnit = normalizeUnitValue(result.settings.weightUnit, 'Kilogram');
    result.hasSettings = true;
  }

  // Helper to push and thoroughly normalize an item per collection
  const addItem = (targetCol, item, defaultPrefix = 'ITM') => {
    if (!item || typeof item !== 'object') return;
    const clean = { ...item };
    if (clean.unit) {
      clean.unit = normalizeUnitValue(clean.unit, clean.unit);
    }

    if (targetCol === 'animals') {
      clean.name = clean.name || clean.animalName || clean.animal_name || clean.title || 'Animal';
      clean.animalName = clean.name;
      clean.type = clean.type || clean.animalType || clean.animal_type || clean.species || 'Cow';
      clean.animalType = clean.type;
      clean.breed = clean.breed || clean.animalBreed || clean.animal_breed || 'Crossbreed';
      
      let g = clean.gender || clean.sex || 'Female';
      if (String(g).toLowerCase().startsWith('m')) clean.gender = 'Male';
      else if (String(g).toLowerCase().startsWith('f')) clean.gender = 'Female';
      else clean.gender = g;

      clean.weight = parseCleanNumber(clean.weight ?? clean.weightKg ?? clean.weight_kg ?? clean.weight_lbs ?? 0);
      clean.weightKg = clean.weight;
      clean.purchaseDate = clean.purchaseDate || clean.purchase_date || clean.boughtDate || clean.date || '';
      clean.purchasePrice = parseCleanNumber(clean.purchasePrice ?? clean.purchasePricePKR ?? clean.purchase_price ?? clean.purchase_price_pkr ?? clean.cost ?? clean.price ?? 0);
      clean.cost = clean.price = clean.purchasePrice;
      clean.status = clean.status || 'Active';
      clean.healthStatus = clean.healthStatus || clean.health_status || 'Healthy';
      clean.color = clean.color || '';
      clean.dob = clean.dob || clean.dateOfBirth || clean.birthDate || '';
      clean.dailyAvgMilk = parseCleanNumber(clean.dailyAvgMilk ?? clean.dailyAvgYieldL ?? clean.daily_avg_yield_l ?? clean.daily_avg_milk ?? clean.milkYield ?? clean.avgMilk ?? 0);
      clean.milkYield = clean.dailyAvgMilk;
      clean.notes = clean.notes || clean.description || '';
      clean.image = clean.image || clean.photo || clean.imageUrl || 'https://images.unsplash.com/photo-1546445317-29f4545f9d52?auto=format&fit=crop&q=80&w=400';

      const tagVal = clean.tagNo || clean.tag_no || clean.tag || clean.tagNumber || clean.earTag || clean.animalTag || clean.id || clean.animalId;
      clean.tagNo = String(tagVal || `TAG-${Math.floor(1000 + Math.random() * 9000)}`).trim().toUpperCase();
      if (!clean.id) {
        clean.id = `ANM-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else if (targetCol === 'milkRecords') {
      clean.date = clean.date || clean.milkingDate || new Date().toISOString().slice(0, 10);
      clean.animalTag = String(clean.animalTag || clean.animalId || clean.tagNo || clean.tag || 'ALL').trim().toUpperCase();
      clean.animalName = clean.animalName || clean.name || '';
      clean.morningQty = parseCleanNumber(clean.morningQty ?? clean.morningYieldL ?? clean.morning_yield_l ?? clean.morning_qty ?? clean.morning ?? 0);
      clean.eveningQty = parseCleanNumber(clean.eveningQty ?? clean.eveningYieldL ?? clean.evening_yield_l ?? clean.evening_qty ?? clean.evening ?? 0);
      const computedTotal = (clean.morningQty || 0) + (clean.eveningQty || 0);
      clean.totalQty = parseCleanNumber(clean.totalQty ?? clean.totalYieldL ?? clean.total_yield_l ?? clean.total_qty ?? (computedTotal > 0 ? computedTotal : null) ?? clean.quantity ?? clean.liters ?? 0);
      clean.quantity = clean.liters = clean.totalQty;
      if (!clean.id) {
        clean.id = `MLK-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else if (targetCol === 'employees') {
      clean.name = clean.name || clean.employeeName || clean.employee_name || clean.fullName || clean.staffName || clean.workerName || clean.title || 'Employee';
      clean.employeeName = clean.name;
      clean.role = clean.role || clean.designation || clean.position || clean.jobTitle || 'Laborer';
      clean.designation = clean.designation || clean.role || 'Laborer';
      clean.phone = clean.phone || clean.contact || clean.mobile || clean.phoneNumber || clean.contactNo || '';
      clean.email = clean.email || clean.mail || '';
      clean.salary = parseCleanNumber(clean.salary ?? clean.monthlySalaryPKR ?? clean.monthly_salary_pkr ?? clean.monthlySalary ?? clean.basicSalaryPKR ?? clean.basicSalary ?? clean.baseSalary ?? clean.wage ?? 0);
      clean.monthlySalary = clean.salary;
      clean.baseSalary = clean.salary;
      clean.basicSalary = clean.salary;
      clean.joinDate = clean.joinDate || clean.joiningDate || clean.join_date || clean.hireDate || clean.startDate || new Date().toISOString().slice(0, 10);
      clean.joiningDate = clean.joiningDate || clean.joinDate;
      clean.cnic = clean.cnic || clean.cnicGovtId || clean.cnic_govt_id || clean.nationalId || clean.national_id || clean.idCard || clean.nic || '';
      clean.address = clean.address || clean.city || clean.location || '';
      clean.status = clean.status || 'Active';
      clean.bankName = clean.bankName || clean.bank || '';
      clean.accountTitle = clean.accountTitle || clean.account_title || clean.name || '';
      clean.accountNumber = clean.accountNumber || clean.account_number || '';
      clean.iban = clean.iban || '';
      clean.notes = clean.notes || clean.description || '';
      if (!clean.id) {
        clean.id = `EMP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else if (targetCol === 'customers') {
      clean.name = clean.name || clean.customerName || clean.customer_name || clean.buyerName || clean.clientName || 'Customer';
      clean.customerName = clean.customerName || clean.name;
      clean.phone = clean.phone || clean.contact || clean.mobile || '';
      clean.address = clean.address || clean.city || '';
      clean.status = clean.status || 'Active';
      clean.milkQtyDaily = parseCleanNumber(clean.milkQtyDaily ?? clean.dailyMilkQty ?? clean.daily_milk_qty ?? clean.dailyQuota ?? clean.quota ?? 0);
      clean.dailyMilkQty = clean.milkQtyDaily;
      clean.pricePerLiter = parseCleanNumber(clean.pricePerLiter ?? clean.dailyMilkRate ?? clean.daily_milk_rate ?? clean.ratePerLiter ?? clean.rate ?? clean.price ?? 0);
      clean.dailyMilkRate = clean.pricePerLiter;
      clean.balance = parseCleanNumber(clean.balance ?? clean.currentBalancePKR ?? clean.current_balance_pkr ?? clean.currentBalance ?? clean.openingBalancePKR ?? clean.totalBalance ?? clean.outstandingBalance ?? 0);
      clean.totalBalance = clean.balance;
      if (!clean.id) {
        clean.id = `CST-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else if (targetCol === 'feedItems') {
      clean.name = clean.name || clean.feedName || clean.feed_name || clean.itemName || 'Feed';
      clean.feedName = clean.feedName || clean.name;
      clean.category = clean.category || clean.feedType || 'Green Fodder';
      clean.stockQty = parseCleanNumber(clean.stockQty ?? clean.quantityKg ?? clean.quantity_kg ?? clean.quantity ?? clean.stock ?? clean.qty ?? 0);
      clean.quantity = clean.stockQty;
      clean.unit = normalizeUnitValue(clean.unit || 'Kilogram', 'Kilogram');
      clean.costPerUnit = parseCleanNumber(clean.costPerUnit ?? clean.unitPricePKR ?? clean.unit_price_pkr ?? clean.unitPrice ?? clean.cost ?? clean.price ?? clean.purchasePrice ?? clean.purchasePricePKR ?? 0);
      clean.purchasePrice = clean.costPerUnit;
      clean.minStock = clean.reorderLevel = parseCleanNumber(clean.minStock ?? clean.minimumStockKg ?? clean.minimum_stock_kg ?? clean.minimumStock ?? clean.reorderLevel ?? 10);
      if (!clean.id) {
        clean.id = `FED-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else if (targetCol === 'feedLogs') {
      clean.animalTag = clean.animalTag || clean.animalId || clean.tagNo || clean.tag || 'ALL';
      clean.feedName = clean.feedName || clean.name || 'Feed';
      clean.date = clean.date || new Date().toISOString().slice(0, 10);
      clean.quantityGiven = parseCleanNumber(clean.quantityGiven ?? clean.quantityKg ?? clean.quantity ?? clean.qty ?? 0);
      clean.unit = normalizeUnitValue(clean.unit || 'Kilogram', 'Kilogram');
      if (!clean.id) {
        clean.id = `FLG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else if (targetCol === 'healthRecords') {
      clean.animalTag = clean.animalTag || clean.animalId || clean.tagNo || clean.tag || clean.tag_no || 'UNKNOWN';
      clean.diagnosis = clean.diagnosis || clean.problem || clean.disease || clean.symptoms || 'General Checkup';
      clean.checkupDate = clean.checkupDate || clean.date || clean.treatmentDate || new Date().toISOString().slice(0, 10);
      clean.date = clean.checkupDate;
      clean.vetName = clean.vetName || clean.veterinarian || clean.doctor || '';
      clean.cost = parseCleanNumber(clean.cost ?? clean.medicineCostPKR ?? clean.medicine_cost_pkr ?? clean.price ?? 0);
      if (!clean.id) {
        clean.id = `HLT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else if (targetCol === 'vaccinations') {
      clean.animalTag = clean.animalTag || clean.animalId || clean.tagNo || clean.tag || clean.tag_no || 'UNKNOWN';
      clean.vaccineName = clean.vaccineName || clean.vaccine || clean.name || 'Vaccine';
      clean.vaccinationDate = clean.vaccinationDate || clean.date || new Date().toISOString().slice(0, 10);
      clean.date = clean.vaccinationDate;
      clean.cost = parseCleanNumber(clean.cost ?? clean.price ?? 0);
      if (!clean.id) {
        clean.id = `VAC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else if (targetCol === 'medicines') {
      clean.name = clean.name || clean.medicineName || clean.medicine_name || clean.genericName || 'Medicine';
      clean.stockQty = parseCleanNumber(clean.stockQty ?? clean.quantity ?? clean.stock ?? 0);
      clean.costPerUnit = parseCleanNumber(clean.costPerUnit ?? clean.cost ?? clean.price ?? clean.purchasePrice ?? clean.purchasePricePKR ?? 0);
      clean.purchasePrice = clean.costPerUnit;
      if (!clean.id) {
        clean.id = `MED-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else if (targetCol === 'breedingRecords') {
      clean.femaleTag = clean.femaleTag || clean.animalTag || clean.animalId || clean.cowTag || clean.damTag || clean.tagNo || clean.tag || 'UNKNOWN';
      clean.breedingDate = clean.breedingDate || clean.inseminationDate || clean.date || new Date().toISOString().slice(0, 10);
      clean.inseminationDate = clean.inseminationDate || clean.breedingDate;
      if (!clean.id) {
        clean.id = `BRD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else if (targetCol === 'calves') {
      clean.calfTag = clean.calfTag || clean.tagNo || clean.tag || clean.tag_no || `CLF-${Math.floor(1000 + Math.random() * 9000)}`;
      clean.birthDate = clean.birthDate || clean.dob || clean.date || new Date().toISOString().slice(0, 10);
      clean.name = clean.name || clean.calfName || 'Calf';
      clean.gender = clean.gender || clean.sex || 'Male';
      clean.birthWeight = parseCleanNumber(clean.birthWeight ?? clean.birthWeightKg ?? clean.birth_weight_kg ?? clean.birth_weight ?? 0);
      clean.currentWeight = parseCleanNumber(clean.currentWeight ?? clean.currentWeightKg ?? clean.current_weight_kg ?? clean.current_weight ?? clean.weight ?? 0);
      if (!clean.id) {
        clean.id = `CLF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else if (targetCol === 'equipment') {
      clean.name = clean.name || clean.equipmentName || clean.equipment_name || clean.itemName || 'Equipment';
      clean.equipmentName = clean.name;
      clean.purchasePrice = parseCleanNumber(clean.purchasePrice ?? clean.purchasePricePKR ?? clean.purchase_price_pkr ?? clean.purchaseCost ?? clean.cost ?? clean.price ?? 0);
      clean.purchaseCost = clean.purchasePrice;
      clean.cost = clean.purchasePrice;
      if (!clean.id) {
        clean.id = `EQP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else if (targetCol === 'inventory') {
      clean.name = clean.name || clean.itemName || clean.item_name || 'Inventory Item';
      clean.itemName = clean.name;
      clean.stockQty = clean.quantity = parseCleanNumber(clean.stockQty ?? clean.quantity ?? clean.stock ?? clean.qty ?? 0);
      clean.purchasePrice = clean.unitPrice = clean.cost = parseCleanNumber(clean.purchasePrice ?? clean.purchasePricePKR ?? clean.purchase_price_pkr ?? clean.unitPrice ?? clean.unitPricePKR ?? clean.cost ?? clean.price ?? 0);
      clean.reorderLevel = clean.minStock = parseCleanNumber(clean.reorderLevel ?? clean.minStock ?? 10);
      clean.unit = clean.unit || 'Piece';
      if (!clean.id) {
        clean.id = `INV-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else if (targetCol === 'accounts') {
      clean.name = clean.name || clean.accountName || clean.bankName || 'Main Account';
      clean.type = clean.type || (clean.bankName ? 'Bank' : 'Cash');
      clean.openingBalance = parseCleanNumber(clean.openingBalance ?? clean.openingBalancePKR ?? clean.opening_balance_pkr ?? clean.initialBalance ?? clean.balance ?? 0);
      clean.currentBalance = parseCleanNumber(clean.currentBalance ?? clean.currentBalancePKR ?? clean.current_balance_pkr ?? clean.balance ?? clean.openingBalance ?? 0);
      if (!clean.id) {
        clean.id = `ACC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else if (targetCol === 'payroll') {
      clean.employeeName = clean.employeeName || clean.name || clean.employee || 'Employee';
      clean.month = clean.month || clean.monthYear || clean.salaryMonth || new Date().toISOString().slice(0, 7);
      clean.paymentDate = clean.paymentDate || clean.date || new Date().toISOString().slice(0, 10);
      clean.netSalary = parseCleanNumber(clean.netSalary ?? clean.netSalaryPKR ?? clean.net_salary_pkr ?? clean.salary ?? clean.amount ?? clean.baseSalary ?? 0);
      clean.baseSalary = parseCleanNumber(clean.baseSalary ?? clean.basicSalaryPKR ?? clean.basic_salary_pkr ?? clean.basicSalary ?? clean.netSalary ?? 0);
      clean.bonus = parseCleanNumber(clean.bonus ?? clean.allowancePKR ?? clean.allowance_pkr ?? clean.allowances ?? 0);
      clean.deductions = parseCleanNumber(clean.deductions ?? clean.deductionPKR ?? clean.deduction_pkr ?? 0);
      if (!clean.id) {
        clean.id = `PAY-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else if (targetCol === 'sales') {
      clean.customerName = clean.customerName || clean.customer || clean.buyerName || clean.buyer || 'Customer';
      clean.date = clean.date || new Date().toISOString().slice(0, 10);
      clean.totalAmount = parseCleanNumber(clean.totalAmount ?? clean.totalAmountPKR ?? clean.total_amount_pkr ?? clean.amount ?? clean.total ?? 0);
      clean.paidAmount = parseCleanNumber(clean.paidAmount ?? clean.paid ?? (String(clean.paymentStatus).toLowerCase() === 'paid' ? (clean.totalAmount || clean.totalAmountPKR || 0) : 0));
      clean.remainingAmount = parseCleanNumber(clean.remainingAmount ?? clean.balance ?? ((clean.totalAmount || 0) - (clean.paidAmount || 0)));
      clean.quantity = parseCleanNumber(clean.quantity ?? clean.quantityL ?? clean.quantity_l ?? clean.qty ?? 0);
      clean.unitPrice = parseCleanNumber(clean.unitPrice ?? clean.unitPricePKR ?? clean.unit_price_pkr ?? clean.rate ?? 0);
      if (!clean.id) {
        clean.id = `SAL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else if (targetCol === 'income') {
      clean.date = clean.date || new Date().toISOString().slice(0, 10);
      clean.category = clean.category || 'Income';
      clean.amount = parseCleanNumber(clean.amount ?? clean.amountPKR ?? clean.amount_pkr ?? clean.total ?? 0);
      if (!clean.id) {
        clean.id = `INC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else if (targetCol === 'expenses') {
      clean.date = clean.date || new Date().toISOString().slice(0, 10);
      clean.category = clean.category || 'Expense';
      clean.amount = parseCleanNumber(clean.amount ?? clean.amountPKR ?? clean.amount_pkr ?? clean.total ?? 0);
      if (!clean.id) {
        clean.id = `EXP-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      }
    } else {
      if (!clean.id && !clean._id) {
        clean.id = `${defaultPrefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      }
    }

    result[targetCol].push(clean);
  };

  // Case 1: Raw is a top-level ARRAY (or unwrapped to an array)
  if (Array.isArray(raw)) {
    raw.forEach(item => {
      const targetCol = classifyItemSignature(item) || 'animals';
      addItem(targetCol, item, targetCol.slice(0, 3).toUpperCase());
    });
  } else {
    // Case 2: Raw is an OBJECT with key-value pairs
    // First, scan keys that match our collection aliases
    const matchedKeys = new Set();

    for (const [key, val] of Object.entries(raw)) {
      if (key === 'settings' || key === 'farmSettings') continue;

      let matchedCol = null;
      for (const [colName, regex] of Object.entries(COLLECTION_MATCHERS)) {
        if (regex.test(key)) {
          matchedCol = colName;
          break;
        }
      }

      if (matchedCol && Array.isArray(val)) {
        matchedKeys.add(key);
        val.forEach(item => addItem(matchedCol, item, matchedCol.slice(0, 3).toUpperCase()));
      } else if (matchedCol && val && typeof val === 'object') {
        // Single object under a collection key
        matchedKeys.add(key);
        addItem(matchedCol, val, matchedCol.slice(0, 3).toUpperCase());
      }
    }

    // Second, if there are unmatched arrays or items under custom keys (e.g. "records", "data", "sheet1")
    for (const [key, val] of Object.entries(raw)) {
      if (matchedKeys.has(key) || key === 'settings' || key === 'farmSettings' || key === 'exportDate' || key === 'farmName' || key === 'version') {
        continue;
      }

      if (Array.isArray(val)) {
        val.forEach(item => {
          const detected = classifyItemSignature(item);
          if (detected) {
            addItem(detected, item, detected.slice(0, 3).toUpperCase());
          }
        });
      } else if (val && typeof val === 'object') {
        // Might be a single entity
        const detected = classifyItemSignature(val);
        if (detected) {
          addItem(detected, val, detected.slice(0, 3).toUpperCase());
        }
      }
    }

    // Third, what if raw itself is a single record object (e.g. `{ animalName: "Bella", animalType: "Cow", breed: "Holstein", gender: "Female", weightKg: 450, purchaseDate: "2024-01-15" }`)?
    const totalFoundSoFar = Object.keys(COLLECTION_MATCHERS).reduce((sum, col) => sum + result[col].length, 0);
    if (totalFoundSoFar === 0 && !result.hasSettings) {
      const singleDetected = classifyItemSignature(raw) || 'animals';
      addItem(singleDetected, raw, singleDetected.slice(0, 3).toUpperCase());
    }
  }

  // Populate counts and totalRecords
  let total = 0;
  for (const colName of Object.keys(COLLECTION_MATCHERS)) {
    const len = result[colName].length;
    result.counts[colName] = len;
    total += len;
  }
  result.totalRecords = total;

  return result;
};
