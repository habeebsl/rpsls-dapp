import { create } from 'zustand';
import { notificationApi } from '@/services/api';
import { PersistentNotification } from '@/types';

// Simplified notification interface - all notifications are persistent
export interface Notification {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'game-request' | 'move-needed' | 'game-completed';
    timestamp: Date;
    read: boolean;
    actionRequired?: 'accept' | 'view' | 'play-move';
    gameId?: string;
    from: string;
    to: string;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isOpen: boolean;
    isLoading: boolean;
    lastFetch: Date | null;
    
    addNotification: (
        message: string,
        type: Notification['type'],
        from: string,
        to: string,
        actionRequired?: 'accept' | 'view' | 'play-move',
        gameId?: string
    ) => Promise<void>;
    loadNotifications: (userAddress: string) => Promise<void>;
    markAsRead: (id: string, userAddress: string) => Promise<void>;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    clearAll: (userAddress: string) => Promise<void>;

    // UI methods
    toggleOpen: () => void;
    setOpen: (open: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isOpen: false,
    isLoading: false,
    lastFetch: null,

    // Add persistent notification - much simpler!
    addNotification: async (
        message: string,
        type: Notification['type'],
        from: string,
        to: string,
        actionRequired?: 'accept' | 'view' | 'play-move',
        gameId?: string
    ) => {
        try {
            // Create notification via API service
            await notificationApi.addNotification({
                message,
                type,
                from,
                to,
                actionRequired,
                gameId,
            });

            // Reload notifications to get the updated list
            await get().loadNotifications(to);
            
            // Auto-open panel for new notifications
            set({ isOpen: true });
        } catch (error) {
            console.error('Error adding notification:', error);
            throw error;
        }
    },

    // Load all notifications from Redis via API service
    loadNotifications: async (userAddress: string) => {
        set({ isLoading: true });

        try {
            const data = await notificationApi.loadNotifications(userAddress);

            // Convert API response to local format
            const notifications: Notification[] = data.notifications.map((n: PersistentNotification) => ({
                id: n.id,
                message: n.message,
                type: n.type,
                timestamp: new Date(n.timestamp),
                read: n.read,
                actionRequired: n.actionRequired,
                gameId: n.gameId,
                from: n.from,
                to: n.to,
            }));

            set({
                notifications,
                unreadCount: data.unreadCount,
                lastFetch: new Date(),
                isLoading: false,
            });
        } catch (error) {
            console.error('Error loading notifications:', error);
            set({ isLoading: false });
            throw error;
        }
    },

    // Mark notification as read via API service
    markAsRead: async (id: string, userAddress: string) => {
        // Update local state immediately for better UX
        set(state => {
            const notifications = state.notifications.map(n =>
                n.id === id ? { ...n, read: true } : n
            );
            const unreadCount = notifications.filter(n => !n.read).length;

            return { notifications, unreadCount };
        });

        try {
            // Sync with Redis via API service
            await notificationApi.markAsRead(id, userAddress);
        } catch (error) {
            console.error('Error marking notification as read:', error);
            // Optionally revert local state on error
            set(state => {
                const notifications = state.notifications.map(n =>
                    n.id === id ? { ...n, read: false } : n
                );
                const unreadCount = notifications.filter(n => !n.read).length;
                return { notifications, unreadCount };
            });
            throw error;
        }
    },

    markAllAsRead: () => {
        set(state => ({
            notifications: state.notifications.map(notification => ({
                ...notification,
                read: true,
            })),
            unreadCount: 0,
        }));
    },

    removeNotification: (id: string) => {
        set(state => {
            const notifications = state.notifications.filter(
                notification => notification.id !== id
            );
            const unreadCount = notifications.filter(n => !n.read).length;

            return { notifications, unreadCount };
        });
    },

    clearAll: async (userAddress: string) => {
        try {
            // Clear on backend first
            await notificationApi.clearAllNotifications(userAddress);
            
            // Then update local state
            set({
                notifications: [],
                unreadCount: 0,
                isOpen: false,
            });
        } catch (error) {
            console.error('Error clearing all notifications:', error);
            throw error;
        }
    },

    toggleOpen: () => {
        set(state => ({ isOpen: !state.isOpen }));
    },

    setOpen: (open: boolean) => {
        set({ isOpen: open });
    },
}));
