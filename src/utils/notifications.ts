/**
 * Utility functions for creating persistent notifications
 */
import { notificationApi } from '@/services/api';
import { CreateNotificationRequest } from '@/types';

export interface CreateNotificationParams {
    type:
        | 'game-request'
        | 'move-needed'
        | 'game-completed'
        | 'info'
        | 'success'
        | 'warning'
        | 'error';
    message: string;
    from: string;
    to: string;
    gameId?: string;
    actionRequired?: 'accept' | 'view' | 'play-move';
}

/**
 * Create a persistent notification that will be stored in Redis
 * Uses the centralized service layer for consistency
 */
export async function createPersistentNotification(
    params: CreateNotificationParams
): Promise<boolean> {
    try {
        const notificationData: CreateNotificationRequest = {
            type: params.type,
            message: params.message,
            from: params.from,
            to: params.to,
            gameId: params.gameId,
            actionRequired: params.actionRequired,
        };

        const response =
            await notificationApi.addNotification(notificationData);

        if (response.success) {
            console.log('Notification created successfully:', response);
            return true;
        } else {
            console.error('Failed to create notification:', response.message);
            return false;
        }
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
     * Send a game started notification to the creator
     */
    gameStarted: (
        creatorAddress: string,
        opponentAddress: string,
        gameId: string
    ) => {
        return createPersistentNotification({
            type: 'success',
            message: `You started a game with ${opponentAddress.slice(0, 6)}...${opponentAddress.slice(-4)}`,
            from: creatorAddress,
            to: creatorAddress,
            gameId,
            actionRequired: 'view',
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
    gameCompleted: (
        fromAddress: string,
        toAddress: string,
        gameId: string,
        result: 'won' | 'lost' | 'tied'
    ) => {
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

    /**
     * Send a timeout notification when a player times out
     */
    timeout: (fromAddress: string, toAddress: string, gameId: string) => {
        return createPersistentNotification({
            type: 'game-completed',
            message: `You lost by timeout against ${fromAddress.slice(0, 6)}...${fromAddress.slice(-4)}`,
            from: fromAddress,
            to: toAddress,
            gameId,
            actionRequired: 'view',
        });
    },
};
