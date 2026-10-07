// Comprehensive realistic seed data for Cattle Farm ERP (Pakistan PKR)

export const INITIAL_SETTINGS = {
  farmName: "GreenPastures Cattle Farm",
  ownerName: "Ahmad Khan",
  phone: "+92 300 1234567",
  email: "contact@greenpasturesfarm.com",
  address: "Plot 42, Agricultural Zone, Multan Road, Punjab, Pakistan",
  currency: "Rs.",
  weightUnit: "Kilogram",
  milkUnit: "Liter",
  dateFormat: "YYYY-MM-DD",
  animalTypes: ["Cow", "Buffalo", "Goat", "Sheep", "Calf", "Bull"],
  breeds: ["Holstein Friesian", "Sahiwal", "Nili Ravi", "Jersey", "Cholistani", "Teddy Goat", "Beetal Goat", "Kamori Goat", "Kajli Sheep", "Lahi Sheep", "Crossbreed"],
  feedCategories: ["Green Fodder", "Silage", "Hay", "Grain", "Concentrate", "Mineral Mix"],
  expenseCategories: ["Feed", "Medicine", "Veterinary", "Employee Salary", "Electricity", "Water", "Transportation", "Maintenance", "Equipment", "Other"],
  incomeCategories: ["Milk Sale", "Animal Sale", "Calf Sale", "Manure Sale", "Services", "Other"]
};

export const INITIAL_ANIMALS = [
  {
    id: "ANM-001",
    tagNo: "COW-101",
    name: "Bella",
    type: "Cow",
    breed: "Holstein Friesian",
    gender: "Female",
    dob: "2021-03-15",
    weight: 580,
    color: "Black & White",
    purchaseDate: "2022-01-10",
    purchasePrice: 380000,
    status: "Active",
    healthStatus: "Healthy",
    motherId: "COW-000",
    fatherId: "BULL-999",
    dailyAvgMilk: 26.5,
    notes: "High yield dairy cow, very calm demeanor.",
    image: "https://images.unsplash.com/photo-1546445317-29f4545f9d52?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "ANM-002",
    tagNo: "COW-102",
    name: "Daisy",
    type: "Cow",
    breed: "Jersey",
    gender: "Female",
    dob: "2021-07-20",
    weight: 490,
    color: "Light Brown",
    purchaseDate: "2022-04-12",
    purchasePrice: 290000,
    status: "Pregnant",
    healthStatus: "Healthy",
    motherId: "",
    fatherId: "",
    dailyAvgMilk: 21.0,
    notes: "High butterfat milk percentage.",
    image: "https://images.unsplash.com/photo-1570042707220-41d3b070498b?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "ANM-003",
    tagNo: "BUF-201",
    name: "Rani",
    type: "Buffalo",
    breed: "Nili Ravi",
    gender: "Female",
    dob: "2020-11-05",
    weight: 640,
    color: "Jet Black",
    purchaseDate: "2021-09-18",
    purchasePrice: 420000,
    status: "Active",
    healthStatus: "Healthy",
    motherId: "",
    fatherId: "",
    dailyAvgMilk: 18.0,
    notes: "Top grade Nili Ravi buffalo, fat content 7.2%.",
    image: "https://images.unsplash.com/photo-1596733430284-f7437764b1a9?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "ANM-004",
    tagNo: "COW-103",
    name: "Luna",
    type: "Cow",
    breed: "Sahiwal",
    gender: "Female",
    dob: "2022-02-14",
    weight: 510,
    color: "Reddish Brown",
    purchaseDate: "2023-02-01",
    purchasePrice: 310000,
    status: "Sick",
    healthStatus: "Sick",
    motherId: "",
    fatherId: "",
    dailyAvgMilk: 14.5,
    notes: "Under mastitis treatment, isolation stall #3.",
    image: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "ANM-005",
    tagNo: "BUF-202",
    name: "Sheena",
    type: "Buffalo",
    breed: "Nili Ravi",
    gender: "Female",
    dob: "2021-05-30",
    weight: 620,
    color: "Dark Gray",
    purchaseDate: "2022-08-15",
    purchasePrice: 390000,
    status: "Pregnant",
    healthStatus: "Healthy",
    motherId: "",
    fatherId: "",
    dailyAvgMilk: 16.5,
    notes: "Expected delivery in 12 days.",
    image: "https://images.unsplash.com/photo-1563281577-a7be47e20db9?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "ANM-006",
    tagNo: "CLF-301",
    name: "Bruno",
    type: "Calf",
    breed: "Holstein Friesian",
    gender: "Male",
    dob: "2024-03-10",
    weight: 125,
    color: "Black & White",
    purchaseDate: "",
    purchasePrice: 0,
    status: "Active",
    healthStatus: "Healthy",
    motherId: "COW-101",
    fatherId: "BULL-01",
    dailyAvgMilk: 0,
    notes: "Bred on farm. Healthy growth rate.",
    image: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "ANM-007",
    tagNo: "BULL-01",
    name: "Max",
    type: "Bull",
    breed: "Holstein Friesian",
    gender: "Male",
    dob: "2019-08-12",
    weight: 890,
    color: "Black",
    purchaseDate: "2020-05-10",
    purchasePrice: 550000,
    status: "Active",
    healthStatus: "Healthy",
    motherId: "",
    fatherId: "",
    dailyAvgMilk: 0,
    notes: "Primary breeding bull with high genetic score.",
    image: "https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "ANM-008",
    tagNo: "GOT-401",
    name: "Gulabi",
    type: "Goat",
    breed: "Beetal Goat",
    gender: "Female",
    dob: "2023-01-10",
    weight: 48,
    color: "White & Brown",
    purchaseDate: "2023-08-15",
    purchasePrice: 65000,
    status: "Active",
    healthStatus: "Healthy",
    motherId: "",
    fatherId: "",
    dailyAvgMilk: 3.5,
    notes: "High milk yielding Beetal goat.",
    image: "https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "ANM-009",
    tagNo: "SHP-501",
    name: "Mano",
    type: "Sheep",
    breed: "Kajli Sheep",
    gender: "Female",
    dob: "2023-04-12",
    weight: 42,
    color: "White with Black Eyes",
    purchaseDate: "2023-11-20",
    purchasePrice: 55000,
    status: "Active",
    healthStatus: "Healthy",
    motherId: "",
    fatherId: "",
    dailyAvgMilk: 1.8,
    notes: "Kajli sheep breed.",
    image: "https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?auto=format&fit=crop&q=80&w=400"
  }
];

export const INITIAL_MILK_RECORDS = [
  { id: "MLK-001", date: "2026-08-25", animalTag: "COW-101", morningQty: 14.0, eveningQty: 12.5, totalQty: 26.5, fatPercentage: 4.1, notes: "Normal morning session" },
  { id: "MLK-002", date: "2026-08-25", animalTag: "COW-102", morningQty: 11.5, eveningQty: 10.0, totalQty: 21.5, fatPercentage: 4.8, notes: "Slight increase" },
  { id: "MLK-003", date: "2026-08-25", animalTag: "BUF-201", morningQty: 9.5, eveningQty: 8.5, totalQty: 18.0, fatPercentage: 7.2, notes: "High fat content" },
  { id: "MLK-004", date: "2026-08-25", animalTag: "BUF-202", morningQty: 8.5, eveningQty: 8.0, totalQty: 16.5, fatPercentage: 6.9, notes: "Good yield" },
  { id: "MLK-005", date: "2026-08-24", animalTag: "COW-101", morningQty: 13.5, eveningQty: 12.0, totalQty: 25.5, fatPercentage: 4.0, notes: "" },
  { id: "MLK-006", date: "2026-08-24", animalTag: "COW-102", morningQty: 11.0, eveningQty: 9.5, totalQty: 20.5, fatPercentage: 4.7, notes: "" },
  { id: "MLK-007", date: "2026-08-24", animalTag: "BUF-201", morningQty: 9.0, eveningQty: 8.5, totalQty: 17.5, fatPercentage: 7.1, notes: "" },
  { id: "MLK-008", date: "2026-08-23", animalTag: "COW-101", morningQty: 14.0, eveningQty: 12.0, totalQty: 26.0, fatPercentage: 4.1, notes: "" },
  { id: "MLK-009", date: "2026-08-23", animalTag: "BUF-201", morningQty: 9.5, eveningQty: 8.0, totalQty: 17.5, fatPercentage: 7.3, notes: "" },
];

export const INITIAL_FEED_ITEMS = [
  { id: "FED-001", feedName: "Alfalfa Green Fodder", category: "Green Fodder", quantity: 1800, unit: "Kilogram", minStock: 500, purchasePrice: 25, supplier: "AgriCrop Farms", purchaseDate: "2026-08-20", expiryDate: "2026-09-10", notes: "Freshly cut green fodder" },
  { id: "FED-002", feedName: "Corn Silage Bales", category: "Silage", quantity: 3200, unit: "Kilogram", minStock: 1000, purchasePrice: 42, supplier: "GreenValley Feeds", purchaseDate: "2026-08-15", expiryDate: "2026-11-30", notes: "High energy silage" },
  { id: "FED-003", feedName: "High Protein Dairy Mix 18%", category: "Concentrate", quantity: 240, unit: "Kilogram", minStock: 500, purchasePrice: 130, supplier: "NutriCattle Feed Co", purchaseDate: "2026-08-10", expiryDate: "2026-12-15", notes: "Low stock alert triggered!" },
  { id: "FED-004", feedName: "Rhodes Grass Hay", category: "Hay", quantity: 1200, unit: "Kilogram", minStock: 300, purchasePrice: 55, supplier: "Sunshine Agro", purchaseDate: "2026-08-01", expiryDate: "2027-01-30", notes: "Dry storage shed #2" },
  { id: "FED-005", feedName: "Mineral Block Supplements", category: "Mineral Mix", quantity: 45, unit: "Kilogram", minStock: 20, purchasePrice: 320, supplier: "VetMed Direct", purchaseDate: "2026-07-25", expiryDate: "2027-06-30", notes: "Essential trace minerals" }
];

export const INITIAL_HEALTH_RECORDS = [
  { id: "HLT-001", animalTag: "COW-103", date: "2026-08-22", problem: "Acute Mastitis", symptoms: "Udder swelling, fever, watery milk", diagnosis: "Bacterial Udder Infection", treatment: "Antibiotic infusion + Anti-inflammatory injection", medicineUsed: "Mastitis Treatment Tube + Flunixin", vetName: "Dr. Sarah Jenkins", cost: 8500, notes: "Isolate cow, discard milk during treatment." },
  { id: "HLT-002", animalTag: "COW-102", date: "2026-08-10", problem: "Routine Post-Calving Check", symptoms: "None", diagnosis: "Healthy recovery", treatment: "Calcium & Vitamin Boost", medicineUsed: "Multivitamin Drench", vetName: "Dr. Sarah Jenkins", cost: 3200, notes: "Cleared for normal milking." },
  { id: "HLT-003", animalTag: "BUF-201", date: "2026-07-14", problem: "Hoof Trimming & Maintenance", symptoms: "Mild limping left rear leg", diagnosis: "Overgrown hoof wall", treatment: "Trimmed & disinfected hoof", medicineUsed: "Copper Sulfate Spray", vetName: "Vet Assistant Tariq", cost: 2500, notes: "Resolved, fully mobile." }
];

export const INITIAL_VACCINATIONS = [
  { id: "VAC-001", animalTag: "COW-101", vaccineName: "FMD (Foot & Mouth Disease)", vaccinationDate: "2026-03-10", nextDueDate: "2026-09-10", vetName: "Dr. Sarah Jenkins", status: "Completed", notes: "Bi-annual booster" },
  { id: "VAC-002", animalTag: "COW-102", vaccineName: "FMD (Foot & Mouth Disease)", vaccinationDate: "2026-03-10", nextDueDate: "2026-08-28", vetName: "Dr. Sarah Jenkins", status: "Due Soon", notes: "Booster due in 3 days" },
  { id: "VAC-003", animalTag: "BUF-201", vaccineName: "Blackleg Vaccine", vaccinationDate: "2025-08-15", nextDueDate: "2026-08-15", vetName: "Dr. Sarah Jenkins", status: "Overdue", notes: "Urgent vaccination required" },
  { id: "VAC-004", animalTag: "BUF-202", vaccineName: "HS (Hemorrhagic Septicemia)", vaccinationDate: "2026-05-01", nextDueDate: "2026-11-01", vetName: "Dr. Sarah Jenkins", status: "Completed", notes: "" },
  { id: "VAC-005", animalTag: "CLF-301", vaccineName: "Calf Scours Vaccine", vaccinationDate: "2026-04-12", nextDueDate: "2026-10-12", vetName: "Dr. Sarah Jenkins", status: "Completed", notes: "First dose" }
];

export const INITIAL_MEDICINES = [
  { id: "MED-001", name: "Oxytetracycline 200 LA", category: "Antibiotic", quantity: 8, unit: "Vials (100ml)", purchasePrice: 2800, supplier: "VetMed Direct", purchaseDate: "2026-06-10", expiryDate: "2026-09-05", notes: "Expiring soon!" },
  { id: "MED-002", name: "Ivermectin Pour-On", category: "Dewormer", quantity: 3, unit: "Bottles (1L)", purchasePrice: 4500, supplier: "AgriHealth Co", purchaseDate: "2026-05-15", expiryDate: "2027-11-20", notes: "For internal & external parasites" },
  { id: "MED-003", name: "Mastitis Intramammary Tubes", category: "Treatment", quantity: 2, unit: "Boxes (12 tubes)", purchasePrice: 3200, supplier: "VetMed Direct", purchaseDate: "2026-07-01", expiryDate: "2026-08-20", notes: "Low stock!" },
  { id: "MED-004", name: "Calcium Borogluconate 40%", category: "Injectable", quantity: 12, unit: "Bottles (500ml)", purchasePrice: 1400, supplier: "Pharma Vet", purchaseDate: "2026-08-05", expiryDate: "2028-02-15", notes: "For milk fever prevention" }
];

export const INITIAL_BREEDING = [
  { id: "BRD-001", femaleTag: "COW-102", maleTag: "BULL-01", method: "Artificial Insemination", breedingDate: "2025-11-20", expectedPregnancyCheck: "2025-12-25", pregnancyStatus: "Pregnant", expectedDeliveryDate: "2026-08-30", actualDeliveryDate: "", notes: "Expected delivery approaching (5 days remaining)" },
  { id: "BRD-002", femaleTag: "BUF-202", maleTag: "BUF-BULL-09", method: "Natural Breeding", breedingDate: "2025-10-15", expectedPregnancyCheck: "2025-11-20", pregnancyStatus: "Pregnant", expectedDeliveryDate: "2026-09-06", actualDeliveryDate: "", notes: "Buffalo gestation ~310 days" },
  { id: "BRD-003", femaleTag: "COW-101", maleTag: "BULL-01", method: "Artificial Insemination", breedingDate: "2026-07-10", expectedPregnancyCheck: "2026-08-15", pregnancyStatus: "Bred", expectedDeliveryDate: "2027-04-18", actualDeliveryDate: "", notes: "Pending pregnancy check" }
];

export const INITIAL_CALVES = [
  { id: "CLF-001", calfTag: "CLF-301", name: "Bruno", gender: "Male", birthDate: "2024-03-10", motherTag: "COW-101", fatherTag: "BULL-01", birthWeight: 38, currentWeight: 125, breed: "Holstein Friesian", healthStatus: "Healthy", notes: "Weaned successfully" },
  { id: "CLF-002", calfTag: "CLF-302", name: "Mimi", gender: "Female", birthDate: "2024-05-02", motherTag: "COW-102", fatherTag: "BULL-01", birthWeight: 34, currentWeight: 98, breed: "Jersey", healthStatus: "Healthy", notes: "Drinking 4L milk daily" }
];

export const INITIAL_INVENTORY = [
  { id: "INV-001", name: "Stainless Steel Milk Cans (40L)", category: "Equipment", quantity: 15, unit: "Pcs", minStock: 5, purchasePrice: 8500, supplier: "DairyTech Supplies", location: "Milking Parlor" },
  { id: "INV-002", name: "Teat Dip Sanitize Solution", category: "Cleaning Supplies", quantity: 8, unit: "Gallons", minStock: 10, purchasePrice: 3200, supplier: "CleanFarm Inc", location: "Chemical Store" },
  { id: "INV-003", name: "Rubber Stall Mats (6x4 ft)", category: "Tools", quantity: 30, unit: "Pcs", minStock: 5, purchasePrice: 4800, supplier: "AgriMat Co", location: "Barn 1" }
];

export const INITIAL_EQUIPMENT = [
  { id: "EQP-001", name: "Double Bucket Milking Machine", category: "Milking Equipment", purchaseDate: "2023-04-15", purchasePrice: 280000, condition: "Good", lastMaintenance: "2026-07-10", nextMaintenance: "2026-10-10", notes: "Pulsator checked & oiled" },
  { id: "EQP-002", name: "Bulk Milk Chiller Tank 1000L", category: "Cooling System", purchaseDate: "2022-09-01", purchasePrice: 650000, condition: "Excellent", lastMaintenance: "2026-06-01", nextMaintenance: "2026-09-01", notes: "Maintains 3.8°C temperature" },
  { id: "EQP-003", name: "Chaff Cutter & Feed Mill 10HP", category: "Feed Processing", purchaseDate: "2021-11-20", purchasePrice: 320000, condition: "Fair", lastMaintenance: "2026-05-15", nextMaintenance: "2026-08-15", notes: "Blades scheduled for sharpening - Overdue maintenance" }
];

export const INITIAL_EMPLOYEES = [
  { id: "EMP-001", name: "Rashid Mahmood", phone: "+92 301 5550143", email: "rashid@farm.com", cnic: "35202-1234567-1", designation: "Farm Manager", joiningDate: "2021-01-15", salary: 55000, status: "Active", address: "Green Village", attendanceToday: "Present" },
  { id: "EMP-002", name: "Tariq Aziz", phone: "+92 302 5550188", email: "tariq@farm.com", cnic: "35202-7654321-3", designation: "Veterinary Assistant", joiningDate: "2022-03-01", salary: 38000, status: "Active", address: "Near Agri Market", attendanceToday: "Present" },
  { id: "EMP-003", name: "Ali Raza", phone: "+92 303 5550199", email: "ali@farm.com", cnic: "35202-9988776-5", designation: "Head Milker", joiningDate: "2022-08-10", salary: 30000, status: "Active", address: "Farm Quarter #2", attendanceToday: "Present" },
  { id: "EMP-004", name: "Usman Ghani", phone: "+92 304 5550122", email: "usman@farm.com", cnic: "35202-3344556-7", designation: "Herdsman", joiningDate: "2023-05-20", salary: 26000, status: "Active", address: "Farm Quarter #3", attendanceToday: "Leave" }
];

export const INITIAL_CUSTOMERS = [
  { id: "CUST-001", name: "Fresh Pure Dairy Ltd", phone: "+92 300 8811223", address: "Industrial Estate, Sector 4, Lahore", milkQtyDaily: 50, pricePerLiter: 190, balance: 45000.00, notes: "Daily morning pickup" },
  { id: "CUST-002", name: "Metro Sweet & Bakers", phone: "+92 321 9922334", address: "Main Commercial Market, Multan", milkQtyDaily: 25, pricePerLiter: 220, balance: 18500.00, notes: "High fat buffalo milk" },
  { id: "CUST-003", name: "Green Valley Cafe", phone: "+92 333 4433221", address: "Mall Road 12", milkQtyDaily: 10, pricePerLiter: 200, balance: 0.00, notes: "Paid via weekly transfer" }
];

export const INITIAL_INCOME = [
  { id: "INC-001", date: "2026-08-25", category: "Milk Sale", customer: "Fresh Pure Dairy Ltd", amount: 125000.00, paymentMethod: "Bank Transfer", description: "Weekly milk batch supply" },
  { id: "INC-002", date: "2026-08-22", category: "Milk Sale", customer: "Metro Sweet & Bakers", amount: 65000.00, paymentMethod: "Cash", description: "Buffalo milk delivery" },
  { id: "INC-003", date: "2026-08-18", category: "Manure Sale", customer: "Organic Fertilizer Producer", amount: 35000.00, paymentMethod: "Cash", description: "Organic compost 3 tractor trolleys" },
  { id: "INC-004", date: "2026-08-05", category: "Animal Sale", customer: "Al-Noor Livestock Farm", amount: 320000.00, paymentMethod: "Bank Transfer", description: "Sale of 1 dry cow tag COW-099" }
];

export const INITIAL_EXPENSES = [
  { id: "EXP-001", date: "2026-08-24", category: "Feed", amount: 68000.00, paymentMethod: "Bank Transfer", description: "Purchased 2000kg Alfalfa green fodder" },
  { id: "EXP-002", date: "2026-08-22", category: "Medicine", amount: 18500.00, paymentMethod: "Cash", description: "Mastitis tubes & antibiotic vials" },
  { id: "EXP-003", date: "2026-08-20", category: "Employee Salary", amount: 149000.00, paymentMethod: "Bank Transfer", description: "Monthly staff salary payout" },
  { id: "EXP-004", date: "2026-08-15", category: "Electricity", amount: 42000.00, paymentMethod: "Online", description: "Farm power bill for chiller & pumps" },
  { id: "EXP-005", date: "2026-08-10", category: "Maintenance", amount: 15000.00, paymentMethod: "Cash", description: "Repair of milking machine pulsator" }
];

export const INITIAL_SALES = [
  {
    id: "SALE-001",
    invoiceNo: "INV-1001",
    date: "2026-08-25",
    category: "Milk",
    customerId: "CUST-001",
    customerName: "Fresh Pure Dairy Ltd",
    customerPhone: "+92 300 8811223",
    items: [
      { id: "item-1", description: "Fresh Daily Milk Yield", quantity: 80, rate: 200, total: 16000 }
    ],
    quantity: 80,
    unitPrice: 200,
    totalAmount: 16000,
    paidAmount: 16000,
    remainingAmount: 0,
    paymentMethod: "Bank Transfer",
    paymentStatus: "Paid",
    notes: "Regular morning bulk milk delivery"
  },
  {
    id: "SALE-002",
    invoiceNo: "INV-1002",
    date: "2026-08-22",
    category: "Animal",
    customerId: "CUST-002",
    customerName: "Metro Sweet & Bakers",
    customerPhone: "+92 321 9922334",
    items: [
      { id: "item-2", animalTag: "COW-099", animalName: "Bella", animalType: "Cow", quantity: 1, rate: 320000, total: 320000, description: "Milking Sahiwal Cow (COW-099)" }
    ],
    totalAmount: 320000,
    paidAmount: 200000,
    remainingAmount: 120000,
    paymentMethod: "Cash",
    paymentStatus: "Partial",
    notes: "Remaining balance to be cleared next month"
  }
];

export const INITIAL_FEED_LOGS = [
  {
    id: "FDL-001",
    date: "2026-08-25",
    animalTag: "COW-101",
    animalName: "Bella",
    feedItemId: "FED-001",
    feedName: "Alfalfa Green Fodder",
    quantityGiven: 12,
    unit: "Kilogram",
    recordedBy: "Admin",
    unitPrice: 25,
    totalCost: 300,
    notes: "Morning feeding schedule"
  },
  {
    id: "FDL-002",
    date: "2026-08-25",
    animalTag: "COW-102",
    animalName: "Daisy",
    feedItemId: "FED-003",
    feedName: "High Protein Dairy Mix 18%",
    quantityGiven: 5,
    unit: "Kilogram",
    recordedBy: "Tariq Aziz",
    unitPrice: 130,
    totalCost: 650,
    notes: "Concentrate supplement"
  },
  {
    id: "FDL-003",
    date: "2026-08-24",
    animalTag: "BUF-201",
    animalName: "Rani",
    feedItemId: "FED-002",
    feedName: "Corn Silage Bales",
    quantityGiven: 20,
    unit: "Kilogram",
    recordedBy: "Rashid Manager",
    unitPrice: 42,
    totalCost: 840,
    notes: "Evening silage intake"
  },
  {
    id: "FDL-004",
    date: "2026-08-23",
    animalTag: "COW-101",
    animalName: "Bella",
    feedItemId: "FED-002",
    feedName: "Corn Silage Bales",
    quantityGiven: 15,
    unit: "Kilogram",
    recordedBy: "Admin",
    unitPrice: 42,
    totalCost: 630,
    notes: "Regular silage feed"
  }
];

