import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { getUserByEmailID, getSession, logOutService } from '../services/auth-service';
import { clearAuthData } from '../utils/auth-utils';
import { hasBrokerRole } from '../utils/broker-role';
import { getUserSidebarPerm, logoutSuccess } from '../redux/authSlice';
import { getProfile } from '../redux/profileSlice';
import { socketService } from '../services/socket-service';

const AuthContext = createContext();

const normalizeUserProfile = (input) => {
  const document_ = input?.data ?? input ?? {};
  const fullName =
    document_.full_name ||
    document_.fullname ||
    [document_.first_name, document_.last_name].filter(Boolean).join(' ') ||
    document_.name ||
    '';
  const email = document_.email || document_.name || '';
  const userImage = document_.user_image || document_.avatar;
  return {
    full_name: fullName,
    email,
    ...(userImage ? { user_image: userImage } : {}),
  };
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionApiSucceeded, setSessionApiSucceeded] = useState(false);
  const [sessionApiError, setSessionApiError] = useState(false);
  const initialCheckRef = useRef(false);
  /** Latest auth flags for silent revalidation (avoid full-screen loader on every route mount). */
  const sessionOkRef = useRef({ isAuthenticated: false, sessionApiSucceeded: false });

  const persistUser = useCallback((userData, fallbackEmail) => {
    if (!userData) return null;

    const profile = normalizeUserProfile(userData);
    if (!profile.email && fallbackEmail) {
      profile.email = fallbackEmail;
    }

    setUser(profile);
    setIsAuthenticated(true);

    if (profile.email || fallbackEmail) {
      localStorage.setItem('email', profile.email || fallbackEmail);
    } else {
      localStorage.removeItem('email');
    }
    localStorage.setItem('user', JSON.stringify(profile));
    return profile;
  }, []);

  const syncUserFromStorage = useCallback(() => {
    const storedUser = localStorage.getItem('user');
    const storedEmail = localStorage.getItem('email');

    if (!storedUser) {
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      const resolvedEmail = parsedUser.email || storedEmail;

      if (!resolvedEmail) {
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }

      parsedUser.email = resolvedEmail;
      setUser(parsedUser);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      console.error('Failed to parse stored user data:', error);
      clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    void logOutService();
    setUser(null);
    setIsAuthenticated(false);
    setSessionApiSucceeded(false);
    setSessionApiError(false);
    clearAuthData();
    // Disconnect socket on logout
    socketService.disconnect();
    // Clear sidebar permissions from localStorage on logout
    localStorage.removeItem('user_perm_sidebar');
    // Dispatch logoutSuccess to reset entire Redux state
    dispatch(logoutSuccess());
    // remove all related to column-config-*
    const columnConfigKeys = Object.keys(localStorage).filter((key) =>
      key.startsWith('column-config-'),
    );
    columnConfigKeys.forEach((key) => {
      localStorage.removeItem(key);
    });
  }, [dispatch]);

  useEffect(() => {
    sessionOkRef.current = { isAuthenticated, sessionApiSucceeded };
  }, [isAuthenticated, sessionApiSucceeded]);

  const checkAuth = useCallback(
    async (force = false, options = {}) => {
      if (initialCheckRef.current && !force) {
        return;
      }

      if (!initialCheckRef.current) {
        initialCheckRef.current = true;
      }

      const silent =
        Boolean(options.silent) &&
        force &&
        sessionOkRef.current.isAuthenticated &&
        sessionOkRef.current.sessionApiSucceeded;

      if (!silent) {
        setLoading(true);
        setSessionApiSucceeded(false);
        setSessionApiError(false);
      }
      try {
        // Check if there's a valid session on the server
        const session = await getSession();

        // Mark session API as succeeded (regardless of whether user is authenticated)
        setSessionApiSucceeded(true);
        setSessionApiError(false);

        // If valid session exists, fetch and persist user data
        if (session && session.message && session.message !== '' && session.message !== 'Guest') {
          const userData = await getUserByEmailID(session.message);
          if (userData && !userData.error) {
            // Broker Portal: only allow users with Broker role
            if (!hasBrokerRole(userData)) {
              await logOutService();
              logout();
              return;
            }
            persistUser(userData);
            // Socket will be connected automatically via useEffect when isAuthenticated becomes true
            // Fetch sidebar permissions after user data is fetched
            try {
              await dispatch(getUserSidebarPerm());
            } catch (error) {
              console.error('Failed to fetch sidebar permissions:', error);
            }
            // Fetch user profile after user data is fetched
            try {
              await dispatch(getProfile(session.message));
            } catch (error) {
              console.error('Failed to fetch user profile:', error);
            }
            return;
          }
        }

        // No valid server session (403/401 swallowed by getSession, or Guest): do not use
        // cached localStorage — same as devx_frontend; user must sign in again.
        console.log('No valid server session, logging out user');
        logout();
      } catch (error) {
        console.error('Session check failed with unexpected error:', error);

        // Mark session API as failed (network error, server down, etc.)
        setSessionApiError(true);
        setSessionApiSucceeded(false);

        // For unexpected errors (network issues, server down, etc.)
        // Try to sync from localStorage as fallback
        // This allows the app to work offline temporarily
        // Note: sessionApiSucceeded remains false, so centers won't be fetched
        const synced = syncUserFromStorage();
        if (!synced) {
          logout();
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [logout, persistUser, syncUserFromStorage, dispatch],
  );

  /**
   * @param {{ silent?: boolean }} [options] - When `silent` is true and the user already passed a
   *   successful session check, revalidate in the background without the global loading screen
   *   (fixes route changes like dashboard → submit-lead feeling like they need a second click).
   */
  const refreshSession = useCallback((options = {}) => {
    checkAuth(true, options);
  }, [checkAuth]);

  // Note: checkAuth() is no longer called automatically on mount
  // It should be called explicitly from components that need it:
  // - ProtectedRoute (for protected pages and login page)
  // - RootRedirect (to determine redirect destination)

  // Connect socket only when user is fully authenticated
  useEffect(() => {
    if (isAuthenticated && sessionApiSucceeded && user) {
      // Only connect if not already connected
      // Socket authentication middleware will handle verification automatically
      if (!socketService.isConnected && !socketService.socket) {
        console.log('🔌 Connecting socket...');
        // socketService.connect();
      }
    } else if (!isAuthenticated) {
      // Disconnect socket when user is not authenticated
      socketService.disconnect();
    }
  }, [isAuthenticated, sessionApiSucceeded, user]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === 'user' || event.key === 'email') {
        syncUserFromStorage();
      }
    };

    const handleErpSync = (event) => {
      const detail = event.detail || {};
      if (detail.authenticated && detail.profile) {
        persistUser(detail.profile);
      } else if (detail.authenticated === false) {
        logout();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('erpSessionSync', handleErpSync);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('erpSessionSync', handleErpSync);
    };
  }, [logout, persistUser, syncUserFromStorage]);

  const login = useCallback(
    (userData, email) => {
      persistUser(userData, email);
    },
    [persistUser],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        refreshSession,
        currentUser: user,
        sessionApiSucceeded,
        sessionApiError,
        socket: socketService,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
