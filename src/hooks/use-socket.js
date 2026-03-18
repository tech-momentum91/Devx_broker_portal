import { useContext, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';

/**
 * Custom hook to access socket service from auth context
 * Provides convenient methods to subscribe/unsubscribe to events
 */
export const useSocket = () => {
  const { socket, isAuthenticated } = useAuth();
  const subscriptionsRef = useRef([]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      // Unsubscribe from all subscriptions when component unmounts
      subscriptionsRef.current.forEach((unsubscribe) => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      subscriptionsRef.current = [];
    };
  }, []);

  /**
   * Subscribe to doctype events
   * @param {string} doctype - Document type (e.g., 'HD Ticket')
   * @param {string} eventType - Event type: 'doc_update', 'doc_insert', 'doc_delete', or 'all'
   * @param {Function} callback - Callback function to handle events
   * @param {string} docname - Optional: specific document name to filter events
   * @returns {Function} Unsubscribe function
   */
  const subscribe = useCallback(
    (doctype, eventType, callback, docname = null) => {
      if (!socket) {
        console.warn('Socket not available. Subscription will not be created.');
        return () => {};
      }

      if (!isAuthenticated) {
        console.warn('User not authenticated. Subscription will not be created.');
        return () => {};
      }

      const unsubscribe = socket.subscribe(doctype, eventType, callback, docname);

      // Store unsubscribe function for cleanup
      subscriptionsRef.current.push(unsubscribe);

      return unsubscribe;
    },
    [socket, isAuthenticated],
  );

  /**
   * Unsubscribe from doctype events
   */
  const unsubscribe = useCallback(
    (doctype, eventType, docname = null) => {
      if (!socket) return;
      socket.unsubscribe(doctype, eventType, docname);
    },
    [socket],
  );

  /**
   * Get socket connection status
   */
  const getConnectionStatus = useCallback(() => {
    if (!socket) {
      return { isConnected: false, socketId: null };
    }
    return socket.getConnectionStatus();
  }, [socket]);

  return {
    socket,
    subscribe,
    unsubscribe,
    getConnectionStatus,
    isAuthenticated,
  };
};
