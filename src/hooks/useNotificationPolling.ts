import { useEffect, useRef } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import { useWalletStore } from '@/stores/walletStore';

/**
 * Custom hook to handle notification polling
 * Polls for new notifications every 30 seconds when:
 * - User is connected to wallet
 * - App is in focus
 * - User is active (not idle)
 */
export function useNotificationPolling() {
  const { loadNotifications, lastFetch } = useNotificationStore();
  const { isConnected, address } = useWalletStore();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const startPolling = () => {
    if (!address || !isConnected || isPollingRef.current) return;

    isPollingRef.current = true;

    // Initial load
    loadNotifications(address);

    // Set up polling interval (30 seconds)
    intervalRef.current = setInterval(() => {
      if (address && isConnected && !document.hidden) {
        loadNotifications(address);
      }
    }, 30000); // 30 seconds

    console.log('Notification polling started');
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isPollingRef.current = false;
    console.log('Notification polling stopped');
  };

  // Handle visibility change (pause when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else if (address && isConnected) {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [address, isConnected]);

  // Handle focus events (refresh when user returns to app)
  useEffect(() => {
    const handleFocus = () => {
      if (address && isConnected) {
        loadNotifications(address);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [address, isConnected, loadNotifications]);

  // Start/stop polling based on wallet connection
  useEffect(() => {
    if (address && isConnected) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [address, isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, []);

  return {
    isPolling: isPollingRef.current,
    lastFetch,
    manualRefresh: () => {
      if (address && isConnected) {
        loadNotifications(address);
      }
    }
  };
}