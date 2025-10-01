import { create } from 'zustand';

export interface Notification {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'game-request' | 'move-needed';
    timestamp: Date;
    read: boolean;
    actionType?: 'accept' | 'view';
    gameId?: string;
    fromPlayer?: string;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isOpen: boolean;
    addNotification: (message: string, type?: Notification['type'], actionType?: 'accept' | 'view', gameId?: string, fromPlayer?: string) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
    toggleOpen: () => void;
    setOpen: (open: boolean) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
    notifications: [],
    unreadCount: 0,
    isOpen: false,

    addNotification: (message: string, type: Notification['type'] = 'info', actionType?: 'accept' | 'view', gameId?: string, fromPlayer?: string) => {
        const newNotification: Notification = {
            id: Date.now().toString(),
            message,
            type,
            timestamp: new Date(),
            read: false,
            actionType,
            gameId,
            fromPlayer,
        };

        set(state => {
            const notifications = [newNotification, ...state.notifications];
            const unreadCount = notifications.filter(n => !n.read).length;

            return {
                notifications,
                unreadCount,
                isOpen: true, // Auto-open when new notification arrives
            };
        });
    },

    markAsRead: (id: string) => {
        set(state => {
            const notifications = state.notifications.map(notification =>
                notification.id === id
                    ? { ...notification, read: true }
                    : notification
            );
            const unreadCount = notifications.filter(n => !n.read).length;

            return {
                notifications,
                unreadCount,
            };
        });
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

            return {
                notifications,
                unreadCount,
            };
        });
    },

    clearAll: () => {
        set({
            notifications: [],
            unreadCount: 0,
            isOpen: false,
        });
    },

    toggleOpen: () => {
        set(state => ({ isOpen: !state.isOpen }));
    },

    setOpen: (open: boolean) => {
        set({ isOpen: open });
    },
}));
