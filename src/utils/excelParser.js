/**
 * Cattle ERP - Universal Excel (.xlsx / .xls) Importer & Data Normalizer
 * Reads all rows and columns from Excel workbooks (multi-sheet or single-sheet),
 * maps columns with exhaustive header variations across all 18 ERP modules,
 * preserves data types (strings, numbers, dates, booleans, nulls, custom fields),
 * validates required fields with exact row & column error tracking,
 * and outputs the universal ERP backup structure for safe, deduplicated appending.
 */

import * as XLSX from 'xlsx';
import { classifyItemSignature, normalizeUnitValue, parseCleanNumber } from './backupNormalizer.js';

// Module Regex Matchers for Sheet Names
const SHEET_NAME_MATCHERS = {
  animals: /^(animals?|cattles?|cows?|livestocks?|buffalos?|herd)$/i,
  milkRecords: /^(milk_?records?|milks?|milkings?|milking_?records?|milk_?productions?|daily_?milks?|milk_?yield)$/i,
  feedItems: /^(feed_?items?|feeds?|feed_?stocks?|feed_?inventory|feedstocks?)$/i,
  feedLogs: /^(feed_?logs?|feed_?usages?|feedings?|feed_?records?|feed_?consumption)$/i,
  healthRecords: /^(health_?records?|healths?|treatments?|medicals?|treatment_?records?|diseases?)$/i,
  vaccinations: /^(vaccinations?|vaccines?|vaccination_?records?|vaccine_?records?)$/i,
  medicines: /^(medicines?|meds?|drugs?|pharmacy|medicine_?items?|medicine_?inventory)$/i,
  breedingRecords: /^(breeding_?records?|breedings?|inseminations?|matings?|reproductions?|ai_?records?)$/i,
  calves: /^(calves|calfs?|baby_?animals?|calf_?records?)$/i,
  inventory: /^(inventory|inventories|inventory_?items?|stocks?|items|general_?inventory)$/i,
  equipment: /^(equipments?|machinery|tools|machines|equipment_?items?)$/i,
  employees: /^(employees?|staffs?|workers?|team|laborers?|employee_?records?|staff_?records?)$/i,
  customers: /^(customers?|clients?|buyers?|customer_?records?)$/i,
  sales: /^(sales?|orders?|invoices?|sale_?records?)$/i,
  income: /^(incomes?|revenues?|earnings?|income_?records?)$/i,
  expenses: /^(expenses?|expenditures?|costs?|expense_?records?)$/i,
  accounts: /^(accounts?|banks?|bank_?accounts?|account_?records?)$/i,
  payroll: /^(payrolls?|salaries?|salary|payroll_?records?)$/i,
  settings: /^(settings?|farm_?settings?|profile)$/i
};

// Clean string for header matching: lowercase, strip all non-alphanumeric chars
export const cleanHeaderKey = (header) => {
  if (!header) return '';
  return String(header).toLowerCase().replace(/[^a-z0-9]/g, '');
};

// Convert camelCase or whatever string into camelCase for unmapped custom columns
export const toCamelCase = (str) => {
  if (!str) return 'customField';
  const clean = String(str).trim();
  return clean
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, c => c.toLowerCase());
};

// Exhaustive Column Field Mapping Dictionaries per ERP Module
const MODULE_FIELD_MAPS = {
  animals: {
    tagno: 'tagNo',
    tag: 'tagNo',
    tagnum: 'tagNo',
    tagnumber: 'tagNo',
    animaltag: 'tagNo',
    eartag: 'tagNo',
    eartagno: 'tagNo',
    eartagnumber: 'tagNo',
    id: 'tagNo',
    animalid: 'tagNo',
    name: 'name',
    animalname: 'name',
    cowname: 'name',
    animal: 'name',
    type: 'type',
    animaltype: 'type',
    species: 'type',
    category: 'type',
    breed: 'breed',
    animalbreed: 'breed',
    gender: 'gender',
    sex: 'gender',
    dob: 'dob',
    birthdate: 'dob',
    dateofbirth: 'dob',
    birthday: 'dob',
    weight: 'weight',
    weightkg: 'weight',
    currentweight: 'weight',
    status: 'status',
    animalstatus: 'status',
    state: 'status',
    lactationstatus: 'lactationStatus',
    lactation: 'lactationStatus',
    milkingstatus: 'lactationStatus',
    purchasedate: 'purchaseDate',
    datepurchased: 'purchaseDate',
    buyingdate: 'purchaseDate',
    purchaseprice: 'purchasePrice',
    price: 'purchasePrice',
    cost: 'purchasePrice',
    buyingprice: 'purchasePrice',
    damtag: 'damTag',
    mothertag: 'damTag',
    dam: 'damTag',
    mother: 'damTag',
    siretag: 'sireTag',
    fathertag: 'sireTag',
    sire: 'sireTag',
    father: 'sireTag',
    notes: 'notes',
    remarks: 'notes',
    description: 'notes',
    comments: 'notes'
  },

  milkRecords: {
    animaltag: 'animalTag',
    tagno: 'animalTag',
    tag: 'animalTag',
    cowtag: 'animalTag',
    tagnumber: 'animalTag',
    date: 'date',
    milkingdate: 'date',
    recorddate: 'date',
    morningqty: 'morningQty',
    morning: 'morningQty',
    morningquantity: 'morningQty',
    morningl: 'morningQty',
    amqty: 'morningQty',
    eveningqty: 'eveningQty',
    evening: 'eveningQty',
    eveningquantity: 'eveningQty',
    eveningl: 'eveningQty',
    pmqty: 'eveningQty',
    totalqty: 'totalQty',
    total: 'totalQty',
    totalmilk: 'totalQty',
    totalquantity: 'totalQty',
    totall: 'totalQty',
    fatrate: 'fatRate',
    fat: 'fatRate',
    fatpercentage: 'fatRate',
    fatpercent: 'fatRate',
    notes: 'notes',
    remarks: 'notes'
  },

  feedItems: {
    feedname: 'feedName',
    name: 'feedName',
    itemname: 'feedName',
    feedtitle: 'feedName',
    feedtype: 'feedType',
    type: 'feedType',
    category: 'feedType',
    stockqty: 'stockQty',
    quantity: 'stockQty',
    currentstock: 'stockQty',
    stock: 'stockQty',
    qty: 'stockQty',
    unit: 'unit',
    uom: 'unit',
    costperunit: 'costPerUnit',
    unitcost: 'costPerUnit',
    unitprice: 'costPerUnit',
    priceperunit: 'costPerUnit',
    cost: 'costPerUnit',
    reorderlevel: 'reorderLevel',
    minstock: 'reorderLevel',
    minimumstock: 'reorderLevel',
    reorderpoint: 'reorderLevel',
    protein: 'protein',
    fiber: 'fiber',
    notes: 'notes',
    remarks: 'notes'
  },

  feedLogs: {
    animaltag: 'animalTag',
    tagno: 'animalTag',
    tag: 'animalTag',
    cowtag: 'animalTag',
    feeditemid: 'feedItemId',
    feedid: 'feedItemId',
    feeditem: 'feedItemId',
    feedname: 'feedName',
    feed: 'feedName',
    itemname: 'feedName',
    date: 'date',
    feedingdate: 'date',
    quantitygiven: 'quantityGiven',
    quantity: 'quantityGiven',
    qtygiven: 'quantityGiven',
    qty: 'quantityGiven',
    amountgiven: 'quantityGiven',
    unit: 'unit',
    cost: 'cost',
    totalcost: 'cost',
    feedcost: 'cost',
    notes: 'notes',
    remarks: 'notes'
  },

  healthRecords: {
    animaltag: 'animalTag',
    tagno: 'animalTag',
    tag: 'animalTag',
    cowtag: 'animalTag',
    date: 'date',
    diagnosisdate: 'date',
    checkupdate: 'date',
    treatmentdate: 'date',
    problem: 'problem',
    diagnosis: 'problem',
    issue: 'problem',
    condition: 'problem',
    disease: 'problem',
    illness: 'problem',
    symptoms: 'problem',
    treatment: 'treatment',
    medication: 'treatment',
    actiontaken: 'treatment',
    cure: 'treatment',
    vetname: 'vetName',
    veterinarian: 'vetName',
    doctor: 'vetName',
    doctorname: 'vetName',
    cost: 'cost',
    treatmentcost: 'cost',
    fee: 'cost',
    status: 'status',
    recoverystatus: 'status',
    notes: 'notes',
    remarks: 'notes'
  },

  vaccinations: {
    animaltag: 'animalTag',
    tagno: 'animalTag',
    tag: 'animalTag',
    cowtag: 'animalTag',
    date: 'date',
    vaccinationdate: 'date',
    vaccinename: 'vaccineName',
    vaccine: 'vaccineName',
    medicine: 'vaccineName',
    dose: 'dose',
    dosage: 'dose',
    doseqty: 'dose',
    dosequantity: 'dose',
    nextduedate: 'nextDueDate',
    nextdue: 'nextDueDate',
    duedate: 'nextDueDate',
    administeredby: 'administeredBy',
    givenby: 'administeredBy',
    vet: 'administeredBy',
    doctor: 'administeredBy',
    cost: 'cost',
    vaccinecost: 'cost',
    batchnumber: 'batchNumber',
    batch: 'batchNumber',
    notes: 'notes',
    remarks: 'notes'
  },

  medicines: {
    name: 'name',
    medicinename: 'name',
    drugname: 'name',
    itemname: 'name',
    genericname: 'genericName',
    formula: 'genericName',
    category: 'category',
    type: 'category',
    stock: 'stock',
    stockqty: 'stock',
    quantity: 'stock',
    currentstock: 'stock',
    unit: 'unit',
    uom: 'unit',
    costperunit: 'costPerUnit',
    unitcost: 'costPerUnit',
    unitprice: 'costPerUnit',
    cost: 'costPerUnit',
    expirydate: 'expiryDate',
    expiry: 'expiryDate',
    expirationdate: 'expiryDate',
    notes: 'notes',
    remarks: 'notes'
  },

  breedingRecords: {
    animaltag: 'animalTag',
    cowtag: 'animalTag',
    damtag: 'animalTag',
    tagno: 'animalTag',
    tag: 'animalTag',
    matingdate: 'matingDate',
    aidate: 'matingDate',
    inseminationdate: 'matingDate',
    date: 'matingDate',
    breedingtype: 'breedingType',
    type: 'breedingType',
    method: 'breedingType',
    siretag: 'sireTag',
    bulltag: 'sireTag',
    fathertag: 'sireTag',
    sire: 'sireTag',
    bullid: 'sireTag',
    semenstrawid: 'semenStrawId',
    strawid: 'semenStrawId',
    pregnancystatus: 'pregnancyStatus',
    status: 'pregnancyStatus',
    result: 'pregnancyStatus',
    expecteddeliverydate: 'expectedDeliveryDate',
    expectedcalvingdate: 'expectedDeliveryDate',
    deliverydate: 'expectedDeliveryDate',
    calvingdate: 'expectedDeliveryDate',
    notes: 'notes',
    remarks: 'notes'
  },

  calves: {
    tagno: 'tagNo',
    calftag: 'tagNo',
    tag: 'tagNo',
    tagnumber: 'tagNo',
    name: 'name',
    calfname: 'name',
    title: 'name',
    gender: 'gender',
    sex: 'gender',
    dob: 'dob',
    birthdate: 'dob',
    calvingdate: 'dob',
    damtag: 'damTag',
    mothertag: 'damTag',
    dam: 'damTag',
    mother: 'damTag',
    siretag: 'sireTag',
    fathertag: 'sireTag',
    sire: 'sireTag',
    father: 'sireTag',
    birthweight: 'birthWeight',
    weight: 'birthWeight',
    weightkg: 'birthWeight',
    breed: 'breed',
    status: 'status',
    healthstatus: 'status',
    notes: 'notes',
    remarks: 'notes'
  },

  inventory: {
    itemname: 'itemName',
    name: 'itemName',
    title: 'itemName',
    productname: 'itemName',
    category: 'category',
    type: 'category',
    stockqty: 'stockQty',
    quantity: 'stockQty',
    stock: 'stockQty',
    unit: 'unit',
    uom: 'unit',
    unitprice: 'unitPrice',
    price: 'unitPrice',
    cost: 'unitPrice',
    reorderlevel: 'reorderLevel',
    minstock: 'reorderLevel',
    notes: 'notes',
    remarks: 'notes'
  },

  equipment: {
    equipmentname: 'equipmentName',
    name: 'equipmentName',
    machinename: 'equipmentName',
    machineryname: 'equipmentName',
    model: 'model',
    modelno: 'model',
    serialnumber: 'serialNumber',
    serialno: 'serialNumber',
    serial: 'serialNumber',
    purchasedate: 'purchaseDate',
    buyingdate: 'purchaseDate',
    date: 'purchaseDate',
    purchaseprice: 'purchasePrice',
    price: 'purchasePrice',
    cost: 'purchasePrice',
    status: 'status',
    condition: 'status',
    notes: 'notes',
    remarks: 'notes'
  },

  employees: {
    name: 'name',
    employeename: 'name',
    fullname: 'name',
    staffname: 'name',
    workername: 'name',
    designation: 'designation',
    role: 'designation',
    jobtitle: 'designation',
    position: 'designation',
    department: 'department',
    dept: 'department',
    phone: 'phone',
    mobile: 'phone',
    contact: 'phone',
    phonenumber: 'phone',
    email: 'email',
    emailaddress: 'email',
    salary: 'salary',
    monthlysalary: 'salary',
    basicsalary: 'salary',
    wage: 'salary',
    joindate: 'joinDate',
    joiningdate: 'joinDate',
    hiredate: 'joinDate',
    cnic: 'cnic',
    nationalid: 'cnic',
    idcard: 'cnic',
    status: 'status',
    notes: 'notes',
    remarks: 'notes'
  },

  customers: {
    name: 'name',
    customername: 'name',
    clientname: 'name',
    buyername: 'name',
    fullname: 'name',
    customertype: 'customerType',
    type: 'customerType',
    clienttype: 'customerType',
    phone: 'phone',
    mobile: 'phone',
    contact: 'phone',
    phonenumber: 'phone',
    email: 'email',
    address: 'address',
    location: 'address',
    city: 'address',
    milkrate: 'milkRate',
    rate: 'milkRate',
    rateperliter: 'milkRate',
    balance: 'balance',
    openingbalance: 'balance',
    duebalance: 'balance',
    notes: 'notes',
    remarks: 'notes'
  },

  sales: {
    invoiceno: 'invoiceNo',
    invoicenumber: 'invoiceNo',
    billno: 'invoiceNo',
    customername: 'customerName',
    customer: 'customerName',
    buyer: 'customerName',
    client: 'customerName',
    date: 'date',
    saledate: 'date',
    itemtype: 'itemType',
    category: 'itemType',
    producttype: 'itemType',
    quantity: 'quantity',
    qty: 'quantity',
    liters: 'quantity',
    unitprice: 'unitPrice',
    rate: 'unitPrice',
    price: 'unitPrice',
    totalamount: 'totalAmount',
    total: 'totalAmount',
    amount: 'totalAmount',
    paymentstatus: 'paymentStatus',
    status: 'paymentStatus',
    notes: 'notes',
    remarks: 'notes'
  },

  income: {
    title: 'title',
    description: 'title',
    source: 'title',
    incomesource: 'title',
    category: 'category',
    incomecategory: 'category',
    amount: 'amount',
    totalamount: 'amount',
    value: 'amount',
    date: 'date',
    incomedate: 'date',
    paymentmethod: 'paymentMethod',
    account: 'paymentMethod',
    notes: 'notes',
    remarks: 'notes'
  },

  expenses: {
    title: 'title',
    description: 'title',
    expensetitle: 'title',
    category: 'category',
    expensecategory: 'category',
    amount: 'amount',
    cost: 'amount',
    totalamount: 'amount',
    date: 'date',
    expensedate: 'date',
    paidto: 'paidTo',
    vendor: 'paidTo',
    payee: 'paidTo',
    paymentmethod: 'paymentMethod',
    account: 'paymentMethod',
    notes: 'notes',
    remarks: 'notes'
  },

  accounts: {
    accountname: 'accountName',
    name: 'accountName',
    title: 'accountName',
    accounttitle: 'accountName',
    bankname: 'bankName',
    bank: 'bankName',
    accountnumber: 'accountNumber',
    accountno: 'accountNumber',
    iban: 'accountNumber',
    accounttype: 'accountType',
    type: 'accountType',
    initialbalance: 'initialBalance',
    balance: 'initialBalance',
    currentbalance: 'initialBalance',
    notes: 'notes',
    remarks: 'notes'
  },

  payroll: {
    employeename: 'employeeName',
    employee: 'employeeName',
    name: 'employeeName',
    designation: 'designation',
    role: 'designation',
    monthyear: 'monthYear',
    month: 'monthYear',
    salarymonth: 'monthYear',
    period: 'monthYear',
    basicsalary: 'basicSalary',
    salary: 'basicSalary',
    allowances: 'allowances',
    bonus: 'allowances',
    deductions: 'deductions',
    tax: 'deductions',
    netsalary: 'netSalary',
    netpay: 'netSalary',
    totalpay: 'netSalary',
    paymentdate: 'paymentDate',
    date: 'paymentDate',
    status: 'status',
    notes: 'notes',
    remarks: 'notes'
  },

  settings: {
    farmname: 'farmName',
    ownername: 'ownerName',
    email: 'email',
    phone: 'phone',
    address: 'address',
    currency: 'currency',
    milkunit: 'milkUnit',
    weightunit: 'weightUnit'
  }
};

/**
 * Parses and formats cell date values accurately.
 * Handles Excel serial numbers, JS Date objects, and diverse date strings.
 */
export const parseExcelDate = (val) => {
  if (val === null || val === undefined || val === '') return null;

  // 1. JS Date object
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      return val.toISOString().slice(0, 10);
    }
    return null;
  }

  // 2. Numeric Excel serial date (typically 1000 - 90000)
  if (typeof val === 'number' && !isNaN(val) && val > 1000 && val < 90000) {
    try {
      // Excel epoch begins at 1899-12-30 (taking leap year bug into account)
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }
    } catch {
      // Fallback
    }
  }

  // 3. String representation
  const s = String(val).trim();
  if (!s) return null;

  // Match ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Match DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Match YYYY/MM/DD
  const ymd = s.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Generic Date.parse
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return s;
};

/**
 * Intelligently converts Excel cell values to exact database types
 * (numbers, booleans, strings, dates, nulls)
 */
export const normalizeExcelCellValue = (fieldName, rawVal) => {
  if (rawVal === null || rawVal === undefined) return null;

  // String cleaning
  if (typeof rawVal === 'string') {
    const trimmed = rawVal.trim();
    if (trimmed === '' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'n/a') {
      return null;
    }
  }

  const sVal = String(rawVal).trim();
  const lowerField = fieldName.toLowerCase();

  // 1. Date Fields
  if (
    lowerField.includes('date') || lowerField.includes('dob') ||
    lowerField.includes('birthday') || lowerField === 'monthyear'
  ) {
    const parsedDate = parseExcelDate(rawVal);
    if (parsedDate) return parsedDate;
  }

  // 2. Numeric Fields
  const isNumericField = [
    'weight', 'weightkg', 'birthweight', 'currentweight', 'morningqty', 'eveningqty', 'totalqty',
    'fatrate', 'costperunit', 'reorderlevel', 'quantity', 'stockqty', 'stock',
    'dose', 'purchaseprice', 'price', 'cost', 'unitprice', 'totalamount', 'amount',
    'salary', 'basicsalary', 'allowances', 'deductions', 'netsalary', 'milkrate',
    'initialbalance', 'balance', 'protein', 'fiber', 'quantitygiven', 'paidamount',
    'remainingamount', 'milkqtydaily', 'priceperliter', 'openingbalance', 'currentbalance'
  ].some(nf => lowerField.includes(nf) || lowerField === nf);

  if (isNumericField) {
    if (typeof rawVal === 'number' && !isNaN(rawVal)) {
      return rawVal;
    }
    const num = parseCleanNumber(rawVal, null);
    return num !== null && !isNaN(num) ? num : null;
  }

  // 3. Boolean Fields
  if (typeof rawVal === 'boolean') return rawVal;
  if (/^(true|yes|1)$/i.test(sVal)) return true;
  if (/^(false|no|0)$/i.test(sVal)) return false;

  // 4. Unit Normalization
  if (lowerField === 'unit' || lowerField === 'milkunit' || lowerField === 'weightunit') {
    return normalizeUnitValue(sVal);
  }

  // 5. Default text / object
  return typeof rawVal === 'string' ? rawVal.trim() : rawVal;
};

/**
 * Determines the target ERP module for a given worksheet.
 * Inspects sheet name first, then headers, and finally sample row values.
 */
export const detectWorksheetModule = (sheetName, headerRow = [], sampleRows = []) => {
  // 1. Match by sheet name
  for (const [modKey, regex] of Object.entries(SHEET_NAME_MATCHERS)) {
    if (regex.test(sheetName)) return modKey;
  }

  // Clean headers
  const cleanedHeaders = headerRow.map(h => cleanHeaderKey(h)).filter(Boolean);

  // 2. Score against each module's field dictionary
  let bestMod = null;
  let maxScore = 0;

  for (const [modKey, fieldMap] of Object.entries(MODULE_FIELD_MAPS)) {
    let score = 0;
    for (const h of cleanedHeaders) {
      if (fieldMap[h]) {
        score += 1;
        // Boost score for unique module signature columns
        if (
          (modKey === 'animals' && (h.includes('tag') || h.includes('breed') || h.includes('lactation'))) ||
          (modKey === 'milkRecords' && (h.includes('morning') || h.includes('evening') || h.includes('fat'))) ||
          (modKey === 'employees' && (h.includes('salary') || h.includes('designation') || h.includes('cnic'))) ||
          (modKey === 'customers' && (h.includes('customer') || h.includes('milkrate'))) ||
          (modKey === 'feedItems' && (h.includes('feed') || h.includes('reorder'))) ||
          (modKey === 'healthRecords' && (h.includes('problem') || h.includes('diagnosis') || h.includes('treatment'))) ||
          (modKey === 'vaccinations' && (h.includes('vaccine') || h.includes('nextdue') || h.includes('dose'))) ||
          (modKey === 'calves' && (h.includes('calf') || h.includes('birthweight'))) ||
          (modKey === 'accounts' && (h.includes('accountnumber') || h.includes('bankname'))) ||
          (modKey === 'sales' && (h.includes('invoice') || h.includes('totalamount')))
        ) {
          score += 2;
        }
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestMod = modKey;
    }
  }

  if (bestMod && maxScore >= 2) {
    return bestMod;
  }

  // 3. Fallback: inspect sample rows using classifyItemSignature
  if (sampleRows && sampleRows.length > 0) {
    for (const sample of sampleRows) {
      const detected = classifyItemSignature(sample);
      if (detected) return detected;
    }
  }

  // Default to animals if ambiguous headers contain tag
  if (cleanedHeaders.some(h => h.includes('tag'))) {
    return 'animals';
  }

  return bestMod || 'animals';
};

/**
 * Validates a single mapped row for required fields.
 * Returns an error object if required fields are missing, or null if valid.
 */
export const validateMappedRow = (moduleKey, rowData, sheetName, rowNumber) => {
  switch (moduleKey) {
    case 'animals':
      if (!rowData.tagNo && !rowData.name) {
        return {
          sheet: sheetName,
          row: rowNumber,
          column: 'Tag No / Name',
          message: `Row ${rowNumber}: Missing animal Tag Number or Name.`
        };
      }
      break;

    case 'employees':
      if (!rowData.name) {
        return {
          sheet: sheetName,
          row: rowNumber,
          column: 'Employee Name',
          message: `Row ${rowNumber}: Missing Employee Name.`
        };
      }
      break;

    case 'customers':
      if (!rowData.name) {
        return {
          sheet: sheetName,
          row: rowNumber,
          column: 'Customer Name',
          message: `Row ${rowNumber}: Missing Customer Name.`
        };
      }
      break;

    case 'milkRecords':
      if (!rowData.animalTag) {
        return {
          sheet: sheetName,
          row: rowNumber,
          column: 'Animal Tag',
          message: `Row ${rowNumber}: Missing Animal Tag for milk production record.`
        };
      }
      break;

    case 'feedItems':
      if (!rowData.feedName && !rowData.name) {
        return {
          sheet: sheetName,
          row: rowNumber,
          column: 'Feed Name',
          message: `Row ${rowNumber}: Missing Feed / Item Name.`
        };
      }
      break;

    case 'feedLogs':
      if (!rowData.animalTag && !rowData.feedItemId && !rowData.feedName) {
        return {
          sheet: sheetName,
          row: rowNumber,
          column: 'Animal Tag / Feed Name',
          message: `Row ${rowNumber}: Missing Animal Tag or Feed Name for feeding log.`
        };
      }
      break;

    case 'healthRecords':
      if (!rowData.animalTag) {
        return {
          sheet: sheetName,
          row: rowNumber,
          column: 'Animal Tag',
          message: `Row ${rowNumber}: Missing Animal Tag for health record.`
        };
      }
      if (!rowData.problem && !rowData.treatment) {
        return {
          sheet: sheetName,
          row: rowNumber,
          column: 'Problem / Treatment',
          message: `Row ${rowNumber}: Missing health Problem or Treatment details.`
        };
      }
      break;

    case 'vaccinations':
      if (!rowData.animalTag) {
        return {
          sheet: sheetName,
          row: rowNumber,
          column: 'Animal Tag',
          message: `Row ${rowNumber}: Missing Animal Tag for vaccination record.`
        };
      }
      if (!rowData.vaccineName) {
        return {
          sheet: sheetName,
          row: rowNumber,
          column: 'Vaccine Name',
          message: `Row ${rowNumber}: Missing Vaccine Name.`
        };
      }
      break;

    case 'medicines':
      if (!rowData.name) {
        return {
          sheet: sheetName,
          row: rowNumber,
          column: 'Medicine Name',
          message: `Row ${rowNumber}: Missing Medicine Name.`
        };
      }
      break;

    case 'breedingRecords':
      if (!rowData.animalTag) {
        return {
          sheet: sheetName,
          row: rowNumber,
          column: 'Animal Tag',
          message: `Row ${rowNumber}: Missing Cow/Animal Tag for breeding record.`
        };
      }
      break;

    case 'calves':
      if (!rowData.tagNo && !rowData.name) {
        return {
          sheet: sheetName,
          row: rowNumber,
          column: 'Calf Tag / Name',
          message: `Row ${rowNumber}: Missing Calf Tag Number or Name.`
        };
      }
      break;

    case 'accounts':
      if (!rowData.accountName && !rowData.accountNumber) {
        return {
          sheet: sheetName,
          row: rowNumber,
          column: 'Account Name / Number',
          message: `Row ${rowNumber}: Missing Bank Account Name or Account Number.`
        };
      }
      break;

    case 'payroll':
      if (!rowData.employeeName && !rowData.name) {
        return {
          sheet: sheetName,
          row: rowNumber,
          column: 'Employee Name',
          message: `Row ${rowNumber}: Missing Employee Name for payroll record.`
        };
      }
      break;

    case 'sales':
      if (!rowData.customerName && !rowData.invoiceNo) {
        return {
          sheet: sheetName,
          row: rowNumber,
          column: 'Customer Name / Invoice No',
          message: `Row ${rowNumber}: Missing Customer Name or Invoice Number for sales record.`
        };
      }
      break;

    case 'income':
    case 'expenses':
      if (rowData.amount === null || rowData.amount === undefined) {
        return {
          sheet: sheetName,
          row: rowNumber,
          column: 'Amount',
          message: `Row ${rowNumber}: Missing transaction Amount.`
        };
      }
      break;

    default:
      break;
  }
  return null;
};

/**
 * Universal Excel Workbook Parser
 * Reads ArrayBuffer / Uint8Array of .xlsx or .xls file,
 * extracts all sheets and rows, maps headers accurately,
 * preserves custom fields and data types,
 * runs validation with exact row/col tracking,
 * and compiles the standard normalized Cattle ERP backup structure.
 */
export const parseExcelBackup = (fileBuffer, options = {}) => {
  // Read workbook using SheetJS
  const workbook = XLSX.read(fileBuffer, {
    type: 'array',
    cellDates: true,
    raw: false,
    dateNF: 'yyyy-mm-dd'
  });

  if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('The uploaded Excel file contains no worksheets.');
  }

  // Target backup container
  const normalized = {
    version: '2.0.0',
    exportDate: new Date().toISOString(),
    isExcelImport: true,
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
    sales: [],
    income: [],
    expenses: [],
    accounts: [],
    payroll: [],
    settings: null,
    totalRecords: 0,
    hasSettings: false,
    counts: {}
  };

  const rowErrors = [];
  const warnings = [];
  const processedSheets = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Convert sheet to array of rows (header: 1 gives raw 2D array: [ [col1, col2], [row1_c1, row1_c2], ... ])
    const rawMatrix = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      blankrows: false
    });

    if (!rawMatrix || rawMatrix.length === 0) continue;

    // 1. Locate header row (first non-empty row)
    let headerRowIdx = 0;
    while (headerRowIdx < rawMatrix.length && (!rawMatrix[headerRowIdx] || rawMatrix[headerRowIdx].every(c => c === null || c === ''))) {
      headerRowIdx++;
    }

    if (headerRowIdx >= rawMatrix.length) continue;

    const rawHeaders = rawMatrix[headerRowIdx];
    const dataRows = rawMatrix.slice(headerRowIdx + 1);

    if (dataRows.length === 0) continue;

    // Build header column map
    const columnDefinitions = rawHeaders.map((header, colIdx) => ({
      index: colIdx,
      original: header ? String(header).trim() : `Column_${colIdx + 1}`,
      cleanKey: cleanHeaderKey(header)
    }));

    // Detect module for this worksheet
    const detectedModule = detectWorksheetModule(sheetName, rawHeaders, []);

    // Get mapping dictionary for this module
    const fieldMap = MODULE_FIELD_MAPS[detectedModule] || MODULE_FIELD_MAPS.animals;

    processedSheets.push({
      sheetName,
      module: detectedModule,
      rowCount: dataRows.length,
      columnCount: rawHeaders.length
    });

    // Process each row
    for (let i = 0; i < dataRows.length; i++) {
      const rawRow = dataRows[i];
      if (!rawRow || rawRow.every(c => c === null || c === '')) {
        // Skip purely empty rows
        continue;
      }

      // Exact human-readable row index (1-based: header is row 1, data starts row 2 + headerRowIdx)
      const excelRowNumber = headerRowIdx + 2 + i;

      const rowObject = {};
      const unmappedFields = {};

      // Map every column
      for (const col of columnDefinitions) {
        const rawVal = rawRow[col.index];
        if (rawVal === null || rawVal === undefined || rawVal === '') continue;

        const mappedDbField = fieldMap[col.cleanKey];

        if (mappedDbField) {
          rowObject[mappedDbField] = normalizeExcelCellValue(mappedDbField, rawVal);
        } else {
          // Preserve unmapped/custom columns without losing any data!
          const customKey = toCamelCase(col.original);
          unmappedFields[customKey] = typeof rawVal === 'string' ? rawVal.trim() : rawVal;
        }
      }

      // Merge custom/unmapped columns onto rowObject so nothing is skipped
      Object.assign(rowObject, unmappedFields);

      // Validate required fields
      const error = validateMappedRow(detectedModule, rowObject, sheetName, excelRowNumber);
      if (error) {
        rowErrors.push(error);
        continue; // Do not add invalid row to import batch
      }

      // Module-specific fallbacks & enhancements
      if (detectedModule === 'animals') {
        if (!rowObject.name && rowObject.tagNo) rowObject.name = `Animal ${rowObject.tagNo}`;
        if (!rowObject.tagNo && rowObject.name) rowObject.tagNo = String(rowObject.name).toUpperCase().replace(/\s+/g, '-');
        if (!rowObject.type) rowObject.type = 'Cow';
        if (!rowObject.gender) rowObject.gender = 'Female';
        if (!rowObject.status) rowObject.status = 'Active';
      } else if (detectedModule === 'milkRecords') {
        if (!rowObject.date) rowObject.date = new Date().toISOString().slice(0, 10);
        if (rowObject.morningQty === undefined && rowObject.eveningQty === undefined && rowObject.totalQty !== undefined) {
          rowObject.morningQty = Number((rowObject.totalQty / 2).toFixed(2));
          rowObject.eveningQty = Number((rowObject.totalQty / 2).toFixed(2));
        }
        if (rowObject.totalQty === undefined) {
          rowObject.totalQty = (Number(rowObject.morningQty) || 0) + (Number(rowObject.eveningQty) || 0);
        }
      } else if (detectedModule === 'employees') {
        if (!rowObject.status) rowObject.status = 'Active';
        if (!rowObject.role && rowObject.designation) rowObject.role = rowObject.designation;
      } else if (detectedModule === 'customers') {
        if (!rowObject.customerType) rowObject.customerType = 'Individual';
      } else if (detectedModule === 'calves') {
        if (!rowObject.name && rowObject.tagNo) rowObject.name = `Calf ${rowObject.tagNo}`;
        if (!rowObject.gender) rowObject.gender = 'Male';
      }

      // Append to the normalized collection
      if (detectedModule === 'settings') {
        normalized.settings = { ...(normalized.settings || {}), ...rowObject };
        normalized.hasSettings = true;
      } else if (Array.isArray(normalized[detectedModule])) {
        normalized[detectedModule].push(rowObject);
      }
    }
  }

  // Calculate totals and counts
  let totalRecords = 0;
  for (const key of Object.keys(MODULE_FIELD_MAPS)) {
    if (key === 'settings') continue;
    const len = normalized[key]?.length || 0;
    normalized.counts[key] = len;
    totalRecords += len;
  }
  normalized.totalRecords = totalRecords;

  return {
    normalized,
    rowErrors,
    warnings,
    processedSheets,
    totalValid: totalRecords,
    totalFailed: rowErrors.length
  };
};
