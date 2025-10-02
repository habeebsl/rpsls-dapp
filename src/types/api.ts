// API Request/Response Types
export interface StoreGameResultRequest {
  j1Address: string;
  j2Address: string;
  gameData: {
    stake: string;
    contractAddress: string;
    status: 'pending' | 'completed' | 'timeout';
    createdAt?: string;
  };
  j1Salt: string;
}

export interface StoreGameResultResponse {
  success: boolean;
  message: string;
}

export interface UserMoveResponse {
  move: string;
  player: 'j1' | 'j2';
  gameId: string;
}

// Notification API Types
export interface CreateNotificationRequest {
  type: 'game-request' | 'move-needed' | 'game-completed' | 'info' | 'success' | 'warning' | 'error';
  message: string;
  from: string;
  to: string;
  gameId?: string;
  actionRequired?: 'accept' | 'view' | 'play-move';
}

export interface GetNotificationsResponse {
  notifications: PersistentNotification[];
  unreadCount: number;
}

export interface PersistentNotification {
  id: string;
  type: 'game-request' | 'move-needed' | 'game-completed' | 'info' | 'success' | 'warning' | 'error';
  message: string;
  from: string;
  to: string;
  gameId?: string;
  timestamp: string;
  read: boolean;
  actionRequired?: 'accept' | 'view' | 'play-move';
}

export interface NotificationResponse {
  success: boolean;
  notificationId?: string;
  message?: string;
}

export interface MarkAsReadRequest {
  userAddress: string;
}