import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FarmProvider } from './context/FarmContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { MainLayout } from './components/layout/MainLayout';
import { hasFullErpAccess } from './components/layout/Sidebar';
import { PlanBLockedPage } from './components/common/PlanBLockedPage';

import { Dashboard } from './pages/Dashboard';
import { AnimalsList } from './pages/animals/AnimalsList';
import { AnimalDetail } from './pages/animals/AnimalDetail';
import { MilkList } from './pages/milk/MilkList';
import { FeedList } from './pages/feed/FeedList';
import { HealthList } from './pages/health/HealthList';
import { VaccinationsList } from './pages/health/VaccinationsList';
import { MedicinesList } from './pages/health/MedicinesList';
import { BreedingList } from './pages/breeding/BreedingList';
import { PregnancyList } from './pages/breeding/PregnancyList';
import { CalvesList } from './pages/calves/CalvesList';
import { SalesList } from './pages/sales/SalesList';
import { InventoryList } from './pages/inventory/InventoryList';
import { EquipmentList } from './pages/equipment/EquipmentList';
import { EmployeesList } from './pages/employees/EmployeesList';
import { CustomersList } from './pages/customers/CustomersList';
import { IncomeList } from './pages/finance/IncomeList';
import { ExpensesList } from './pages/finance/ExpensesList';
import { ProfitLoss } from './pages/finance/ProfitLoss';
import { CashFlow } from './pages/finance/CashFlow';
import { AccountsPage } from './pages/finance/AccountsPage';
import { PayrollPage } from './pages/finance/PayrollPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { NotFound } from './pages/NotFound';

import { ScrollToTop } from './components/common/ScrollToTop';

// Helper wrapper for Plan B restricted routes
const PlanBLockedRoute = ({ element, title }) => {
  const { user } = useAuth();
  if (!hasFullErpAccess(user)) {
    return <PlanBLockedPage title={title} />;
  }
  return element;
};

function App() {
  return (
    <AuthProvider>
      <FarmProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<MainLayout />}>
                {/* Unlocked for Plan A & Plan B (Farm Management Suite) */}
                <Route index element={<Dashboard />} />
                <Route path="animals" element={<AnimalsList />} />
                <Route path="animals/:id" element={<AnimalDetail />} />
                <Route path="milk" element={<MilkList />} />
                <Route path="feed" element={<FeedList />} />
                <Route path="health" element={<HealthList />} />
                <Route path="vaccinations" element={<VaccinationsList />} />
                <Route path="medicines" element={<MedicinesList />} />
                <Route path="breeding" element={<BreedingList />} />
                <Route path="pregnancy" element={<PregnancyList />} />
                <Route path="calves" element={<CalvesList />} />
                <Route path="sales" element={<SalesList />} />
                <Route path="settings" element={<SettingsPage />} />

                {/* Plan B & Custom Plan Exclusive Routes (Locked for Plan A) */}
                <Route path="inventory" element={<PlanBLockedRoute element={<InventoryList />} title="Inventory Management" />} />
                <Route path="equipment" element={<PlanBLockedRoute element={<EquipmentList />} title="Equipment Management" />} />
                <Route path="employees" element={<PlanBLockedRoute element={<EmployeesList />} title="Employees & Payroll" />} />
                <Route path="customers" element={<PlanBLockedRoute element={<CustomersList />} title="Customers Directory" />} />
                <Route path="cash-flow" element={<PlanBLockedRoute element={<CashFlow />} title="Cash Flow Ledger" />} />
                <Route path="cashflow" element={<PlanBLockedRoute element={<CashFlow />} title="Cash Flow Ledger" />} />
                <Route path="income" element={<PlanBLockedRoute element={<IncomeList />} title="Cash Flow & Income Tracker" />} />
                <Route path="expenses" element={<PlanBLockedRoute element={<ExpensesList />} title="Expense Management" />} />
                <Route path="accounts" element={<PlanBLockedRoute element={<AccountsPage />} title="Accounts & Banking Manager" />} />
                <Route path="payroll" element={<PlanBLockedRoute element={<PayrollPage />} title="Staff Payroll & Salaries" />} />
                <Route path="profit-loss" element={<PlanBLockedRoute element={<ProfitLoss />} title="Profit & Loss Accounting" />} />
                <Route path="reports" element={<PlanBLockedRoute element={<ReportsPage />} title="Analytics & Custom Reports" />} />

                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </FarmProvider>
    </AuthProvider>
  );
}

export default App;
