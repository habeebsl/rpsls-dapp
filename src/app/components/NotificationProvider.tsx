'use client';

import { useNotificationPolling } from '@/hooks/useNotificationPolling';

export function NotificationProvider() {
  // This component just runs the notification polling hook globally
  useNotificationPolling();
  
  // Return null since this is just a hook provider
  return null;
}