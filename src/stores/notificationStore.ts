import { create } from 'zustand';

export interface Notification {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'game-request' | 'move-needed' | 'game-completed';
    timestamp: Date;
    read: boolean;
    actionType?: 'accept' | 'view' | 'play-move';
    gameId?: string;
    fromPlayer?: string;
    // Additional fields for persistent notifications
    from?: string;
    to?: string;
    persistent?: boolean; // Flag to distinguish between local and persistent notifications
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isOpen: boolean;
    isLoading: boolean;
    lastFetch: Date | null;
    
    // Local notification methods (for temporary notifications)
    addNotification: (message: string, type?: Notification['type'], actionType?: 'accept' | 'view', gameId?: string, fromPlayer?: string) => void;
    
    // Persistent notification methods (sync with Redis)
    loadNotifications: (userAddress: string) => Promise<void>;
    markAsRead: (id: string, userAddress?: string) => Promise<void>;
    markAllAsRead: () => void;
    removeNotification: (id: string) => void;
    clearAll: () => void;
    
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

    // Add local (temporary) notification
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
            persistent: false, // Local notification
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

    // Load persistent notifications from Redis
    loadNotifications: async (userAddress: string) => {
        set({ isLoading: true });
        
        try {
            const response = await fetch(`/api/notifications?address=${userAddress}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch notifications');
            }
            
            const data = await response.json();
            
            // Convert persistent notifications to local format
            const persistentNotifications: Notification[] = data.notifications.map((n: any) => ({
                id: n.id,
                message: n.message,
                type: n.type,
                timestamp: new Date(n.timestamp),
                read: n.read,
                actionType: n.actionRequired,
                gameId: n.gameId,
                fromPlayer: n.from,
                from: n.from,
                to: n.to,
                persistent: true, // Mark as persistent
            }));

            set(state => {
                // Keep local notifications, replace persistent ones
                const localNotifications = state.notifications.filter(n => !n.persistent);
                const allNotifications = [...localNotifications, ...persistentNotifications];
                
                return {
                    notifications: allNotifications,
                    unreadCount: data.unreadCount + localNotifications.filter(n => !n.read).length,
                    lastFetch: new Date(),
                    isLoading: false,
                };
            });
        } catch (error) {
            console.error('Error loading notifications:', error);
            set({ isLoading: false });
        }
    },

    // Mark notification as read
    markAsRead: async (id: string, userAddress?: string) => {
        const state = get();
        const notification = state.notifications.find(n => n.id === id);
        
        if (!notification) return;

        // Update local state immediately
        set(state => {
            const notifications = state.notifications.map(n =>
                n.id === id ? { ...n, read: true } : n
            );
            const unreadCount = notifications.filter(n => !n.read).length;

            return { notifications, unreadCount };
        });

        // If it's a persistent notification, update Redis
        if (notification.persistent && userAddress) {
            try {
                const response = await fetch(`/api/notifications/${id}/read`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userAddress }),
                });

                if (!response.ok) {
                    console.error('Failed to mark notification as read in Redis');
                    // Optionally revert local state on error
                }
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
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
