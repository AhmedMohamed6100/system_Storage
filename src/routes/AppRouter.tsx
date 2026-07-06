import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import MainLayout from '../components/layout/MainLayout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import CategoriesPage from '../pages/CategoriesPage';
import UnitsPage from '../pages/UnitsPage';
import WarehousePage from '../pages/WarehousePage';
import InvoicesPage from '../pages/InvoicesPage';
import PurchasesPage from '../pages/PurchasesPage';
import MovementHistoryPage from '../pages/MovementHistoryPage';
import TransfersPage from '../pages/TransfersPage';
import SuppliersPage from '../pages/SuppliersPage';
import ExpensesPage from '../pages/ExpensesPage';
import ReportsPage from '../pages/ReportsPage';
import UsersPage from '../pages/UsersPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="units" element={<UnitsPage />} />
        <Route path="warehouse" element={<WarehousePage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="movements" element={<MovementHistoryPage />} />
        <Route path="transfers" element={<TransfersPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
