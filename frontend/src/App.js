import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/common/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InstitutionsPage from './pages/masters/InstitutionsPage';
import CampusesPage from './pages/masters/CampusesPage';
import DepartmentsPage from './pages/masters/DepartmentsPage';
import AcademicYearsPage from './pages/masters/AcademicYearsPage';
import ProgramsPage from './pages/masters/ProgramsPage';
import SeatMatrixPage from './pages/masters/SeatMatrixPage';
import ApplicantsPage from './pages/ApplicantsPage';
import ApplicantDetailPage from './pages/ApplicantDetailPage';
import AdmissionsPage from './pages/AdmissionsPage';
import UsersPage from './pages/UsersPage';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="masters/institutions" element={<ProtectedRoute roles={['admin']}><InstitutionsPage /></ProtectedRoute>} />
        <Route path="masters/campuses" element={<ProtectedRoute roles={['admin']}><CampusesPage /></ProtectedRoute>} />
        <Route path="masters/departments" element={<ProtectedRoute roles={['admin']}><DepartmentsPage /></ProtectedRoute>} />
        <Route path="masters/academic-years" element={<ProtectedRoute roles={['admin']}><AcademicYearsPage /></ProtectedRoute>} />
        <Route path="masters/programs" element={<ProtectedRoute roles={['admin']}><ProgramsPage /></ProtectedRoute>} />
        <Route path="seat-matrix" element={<SeatMatrixPage />} />
        <Route path="applicants" element={<ProtectedRoute roles={['admin','admission_officer']}><ApplicantsPage /></ProtectedRoute>} />
        <Route path="applicants/:id" element={<ProtectedRoute roles={['admin','admission_officer']}><ApplicantDetailPage /></ProtectedRoute>} />
        <Route path="admissions" element={<AdmissionsPage />} />
        <Route path="users" element={<ProtectedRoute roles={['admin']}><UsersPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{ duration: 3500, style: { fontSize: '0.875rem' } }} />
      </BrowserRouter>
    </AuthProvider>
  );
}
