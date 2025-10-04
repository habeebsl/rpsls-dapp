'use client';

import { useNotificationPolling } from '@/hooks/useNotificationPolling';

export function NotificationProvider() {
  useNotificationPolling();
  return null;
}
