import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import ProductsPage from './pages/ProductsPage';
import ProvisioningPage from './pages/ProvisioningPage';
import SettingsPage from './pages/SettingsPage';
import ProvisioningHistoryPage from './pages/ProvisioningHistoryPage';
import ProvisioningStatusPage from './pages/ProvisioningStatusPage';
import ProvisionProductPage from './pages/ProvisionProductPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailsPage />} />
          <Route path="/provisioning" element={<ProvisioningPage />} />
          <Route path="/provisioning/:productId" element={<ProvisionProductPage />} />
          <Route path="/history" element={<ProvisioningHistoryPage />} />
          <Route path="/history/:requestId" element={<ProvisioningStatusPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
