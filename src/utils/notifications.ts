/**
 * Utility functions for creating persistent notifications
 */

export interface CreateNotificationParams {
  type: 'game-request' | 'move-needed' | 'game-completed';
  message: string;
  from: string;
  to: string;
  gameId?: string;
  actionRequired?: 'accept' | 'view' | 'play-move';
}

/**
 * Create a persistent notification that will be stored in Redis
 */
export async function createPersistentNotification(params: CreateNotificationParams): Promise<boolean> {
  try {
    const notification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: params.type,
      message: params.message,
      from: params.from,
      to: params.to,
      gameId: params.gameId,
      timestamp: new Date().toISOString(),
      read: false,
      actionRequired: params.actionRequired,
    };

    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification),
    });

    if (!response.ok) {
      console.error('Failed to create notification:', await response.text());
      return false;
    }

    console.log('Notification created successfully:', notification);
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

/**
 * Example usage functions for different notification types
 */

export const notificationHelpers = {
  /**
   * Send a game request notification
   */
  gameRequest: (fromAddress: string, toAddress: string, gameId: string) => {
    return createPersistentNotification({
      type: 'game-request',
      message: `${fromAddress.slice(0, 6)}...${fromAddress.slice(-4)} wants to play RPSLS with you!`,
      from: fromAddress,
      to: toAddress,
      gameId,
      actionRequired: 'accept',
    });
  },

  /**
   * Send a move needed notification
   */
  moveNeeded: (fromAddress: string, toAddress: string, gameId: string) => {
    return createPersistentNotification({
      type: 'move-needed',
      message: `Your move is needed in game vs ${fromAddress.slice(0, 6)}...${fromAddress.slice(-4)}`,
      from: fromAddress,
      to: toAddress,
      gameId,
      actionRequired: 'play-move',
    });
  },

  /**
   * Send a game completed notification
   */
  gameCompleted: (fromAddress: string, toAddress: string, gameId: string, result: 'won' | 'lost' | 'tied') => {
    const messages = {
      won: `You won the game against ${fromAddress.slice(0, 6)}...${fromAddress.slice(-4)}!`,
      lost: `You lost the game against ${fromAddress.slice(0, 6)}...${fromAddress.slice(-4)}`,
      tied: `You tied the game against ${fromAddress.slice(0, 6)}...${fromAddress.slice(-4)}`,
    };

    return createPersistentNotification({
      type: 'game-completed',
      message: messages[result],
      from: fromAddress,
      to: toAddress,
      gameId,
      actionRequired: 'view',
    });
  },
};