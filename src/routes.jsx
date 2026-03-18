import React from 'react';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '@/route-protection/protected-route';
import RootRedirect from '@/route-protection/root-redirect';
import Dashboard from './pages/dashboard-page';
import SubmitLeadPage from './pages/submit-lead-page';
import LeadDetailPage from './pages/lead-detail-page';
import ProfilePage from './pages/profile-page';

const Login = React.lazy(() => import('@/pages/auth/login'));
const DashboardPage = React.lazy(() => import('@/pages/Dashboard'));
/**
 * Application routes configuration using React Router's useRoutes hook
 *
 * Route structure:
 * - / → Redirects based on auth status
 * - /login → Public route (redirects to /dashboard if authenticated)
 * - /dashboard, /submit-lead, etc. → Protected routes (require authentication)
 */
const routes = [
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '/login',
    element: (
      <ProtectedRoute requireAuth={false}>
        <Login />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/submissions',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/submit-lead',
    element: (
      <ProtectedRoute>
        <SubmitLeadPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/submissions/:id',
    element: (
      <ProtectedRoute>
        <LeadDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to='/' replace />,
  },
];

export default routes;
