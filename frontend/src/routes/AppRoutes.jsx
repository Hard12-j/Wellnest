import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import VerifyEmail from '../pages/VerifyEmail';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import Dashboard from '../pages/Dashboard';
import TrainerDashboard from '../pages/TrainerDashboard';
import Profile from '../pages/Profile';
import TrainerProfile from '../pages/TrainerProfile';
import Tracker from '../pages/Tracker';
import Analytics from '../pages/Analytics';
import Trainers from '../pages/Trainers';
import Community from '../pages/Community';
import ProtectedRoute from '../components/ProtectedRoute';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';

const AppRoutes = () => {
  const { user } = useAuth();
  const isTrainer = user?.role === 'TRAINER';

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected Application Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              {isTrainer ? <TrainerDashboard /> : <Dashboard />}
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <AppLayout>
              {isTrainer ? <TrainerProfile /> : <Profile />}
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tracker"
        element={
          <ProtectedRoute>
            {isTrainer ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AppLayout>
                <Tracker />
              </AppLayout>
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            {isTrainer ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AppLayout>
                <Analytics />
              </AppLayout>
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/trainers"
        element={
          <ProtectedRoute>
            {isTrainer ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AppLayout>
                <Trainers />
              </AppLayout>
            )}
          </ProtectedRoute>
        }
      />
      <Route
        path="/community"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Community />
            </AppLayout>
          </ProtectedRoute>
        }
      />


      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;
