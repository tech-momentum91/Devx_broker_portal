import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../contexts/auth-context';
import * as Button from '@/components/ui/button';
import { RiAlertFill } from 'react-icons/ri';
import { fetchCenterAccess, selectCenterAccess } from '@/redux/centerSlice';
import { showErrorToast } from '@/utils/error-utils';
/**
 * ProtectedRoute component for handling route authentication
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authorized
 * @param {boolean} [props.requireAuth=true] - Whether the route requires authentication
 *
 * Features:
 * - Checks session on mount and reload (handled by AuthContext)
 * - Shows loading state while verifying authentication
 * - Redirects to /login if auth required but user not authenticated
 * - Shows error message if session API fails on protected pages
 * - Redirects to /settings if user authenticated but trying to access login
 */
const ProtectedRoute = ({ children, requireAuth = true }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, loading: authLoading, sessionApiError, refreshSession } = useAuth();
  const location = useLocation();
  const centerAccess = useSelector(selectCenterAccess);

  // Trigger session check when component mounts (only for routes that use ProtectedRoute)
  // Only check if we haven't checked yet to avoid unnecessary API calls
  useEffect(() => {
    // Only trigger check if we haven't checked yet
    // sessionApiSucceeded will be false if we haven't checked, or if the check failed
    // We still want to check even if it failed (to retry), but not if it succeeded
    // Actually, we should check on every protected route mount to ensure session is valid
    // But checkAuth has a guard to prevent multiple simultaneous calls
    refreshSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once per route mount

  // Ensure center access data is available before rendering protected content
  useEffect(() => {
    if (!requireAuth) return;
    if (!isAuthenticated || authLoading) return;

    if (centerAccess.status === 'idle') {
      const fetchCenterAccessAPI = async () => {
        const result = await dispatch(fetchCenterAccess());
        if (result.type === 'center/getCenterList/rejected') {
          showErrorToast(result.payload);
          console.error('Error fetching center access:', result.payload);
        }
      };
      if (centerAccess.status === 'idle') {
        fetchCenterAccessAPI();
      }
    }
  }, [requireAuth, isAuthenticated, authLoading, centerAccess.status, dispatch]);

  const isCenterAccessLoading =
    requireAuth &&
    isAuthenticated &&
    (centerAccess.status === 'idle' || centerAccess.status === 'loading');

  // Show loader while checking authentication or loading center access
  if (authLoading || isCenterAccessLoading) {
    return (
      <div className='h-screen w-full flex items-center justify-center bg-(--color-bg-weak-50)'>
        <div className='flex flex-col items-center gap-4'>
          <div className='w-8 h-8 border-4 border-(--color-primary-base) border-t-transparent rounded-full animate-spin' />
          <p className='text-(--color-text-sub-500)'>
            {authLoading ? 'Verifying session...' : 'Loading center access...'}
          </p>
        </div>
      </div>
    );
  }

  // If session API failed on a protected page, show error message
  if (requireAuth && sessionApiError) {
    return (
      <div className='h-screen w-full flex items-center justify-center bg-(--color-bg-weak-50)'>
        <div className='flex flex-col items-center gap-4 max-w-md mx-auto px-4'>
          <div className='text-6xl mb-2'>
            <RiAlertFill className='text-error-base' />
          </div>
          <h1 className='text-2xl font-semibold text-(--color-text-base)'>Something went wrong</h1>
          <p className='text-(--color-text-sub-500) text-center'>
            We couldn&apos;t verify your session. Please try again after some time.
          </p>
          <Button.Root variant='primary' size='medium' onClick={() => window.location.reload()}>
            Retry
          </Button.Root>
        </div>
      </div>
    );
  }

  // If route requires authentication and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  // If route is login page and user is already authenticated
  if (!requireAuth && isAuthenticated) {
    return <Navigate to='/dashboard' replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
