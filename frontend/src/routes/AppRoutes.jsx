import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import AppLayout from '../components/layout/AppLayout.jsx';
import LoginPage from '../pages/LoginPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import ForestMapPage from '../pages/ForestMapPage.jsx';
import ObservationsPage from '../pages/ObservationsPage.jsx';
import VegetationPage from '../pages/VegetationPage.jsx';
import IncidentsPage from '../pages/IncidentsPage.jsx';
import PatrolsPage from '../pages/PatrolsPage.jsx';
import AlertsPage from '../pages/AlertsPage.jsx';
import ReportsPage from '../pages/ReportsPage.jsx';
import DataModelsPage from '../pages/DataModelsPage.jsx';
import SettingsPage from '../pages/SettingsPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/forest-map" element={<ForestMapPage />} />
          <Route path="/observations" element={<ObservationsPage />} />
          <Route path="/vegetation" element={<VegetationPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/patrols" element={<PatrolsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/data-models" element={<DataModelsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
