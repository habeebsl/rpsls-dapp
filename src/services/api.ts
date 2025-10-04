import axios from 'axios';
import {
  StoreGameResultRequest,
  StoreGameResultResponse,
  UserMoveResponse,
  CreateNotificationRequest,
  GetNotificationsResponse,
  NotificationResponse,
} from '@/types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions
export const gameApi = {
  /**
   * Store game result for both players in Redis
   */
  storeGameResult: async (data: StoreGameResultRequest): Promise<StoreGameResultResponse> => {
    const response = await api.post<StoreGameResultResponse>('/games/store-result', data);
    return response.data;
  },

  /**
   * Get user's move for a specific game
   */
  getUserMove: async (gameId: string, playerAddress: string): Promise<UserMoveResponse> => {
    const response = await api.get<UserMoveResponse>(`/games/${gameId}/user-move/${playerAddress}`);
    return response.data;
  },

  /**
   * Get game result for a specific contract and player
   */
  getGameResult: async (gameId: string, playerAddress: string) => {
    const response = await api.get(`/games/${gameId}?playerAddress=${playerAddress}`);
    return response.data;
  },

  /**
   * Update game result for a specific contract and player
   */
  updateGameResult: async (gameId: string, playerAddress: string, updates: Record<string, any>) => {
    const response = await api.patch(`/games/${gameId}/update`, {
      playerAddress,
      updates
    });
    return response.data;
  },
};

export const notificationApi = {
  /**
   * Load all notifications for a user from Redis
   */
  loadNotifications: async (userAddress: string): Promise<GetNotificationsResponse> => {
    const response = await api.get<GetNotificationsResponse>(`/notifications?address=${userAddress}`);
    return response.data;
  },

  /**
   * Create a new persistent notification
   */
  addNotification: async (data: CreateNotificationRequest): Promise<NotificationResponse> => {
    // Generate ID on client side to ensure uniqueness
    const notificationWithId = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };

    const response = await api.post<NotificationResponse>('/notifications', notificationWithId);
    return response.data;
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (notificationId: string, userAddress: string): Promise<NotificationResponse> => {
    const response = await api.patch<NotificationResponse>(
      `/notifications/${notificationId}/read`,
      { userAddress }
    );
    return response.data;
  },

  /**
   * Clear all notifications for a user
   */
  clearAllNotifications: async (userAddress: string): Promise<NotificationResponse> => {
    const response = await api.delete<NotificationResponse>(`/notifications?address=${userAddress}`);
    return response.data;
  },
};

export { api };
