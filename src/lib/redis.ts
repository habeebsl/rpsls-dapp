import { createClient } from 'redis';

const client = createClient({
    url: process.env.REDIS_URL,
});

const userPrefixKey = 'rpsls-account:';
const notificationPrefixKey = 'rpsls-notifications:';
const notificationCountKey = 'rpsls-notification-count:';

interface GameResult {
    id: string;
    stake: string;
    contractAddress: string;
    status: 'pending' | 'completed' | 'timeout';
    salt: string; // Required for reveal phase
    type?: 'win' | 'loss' | 'tie'; // Only set when game is completed
    opponent?: string;
    playerChoice?: string;
    opponentChoice?: string;
    createdAt?: string;
    completedAt?: string;
}

interface PersistentNotification {
    id: string;
    type: 'game-request' | 'move-needed' | 'game-completed';
    message: string;
    from: string; // sender address
    to: string; // recipient address
    gameId?: string;
    timestamp: string;
    read: boolean;
    actionRequired?: 'accept' | 'view' | 'play-move';
}

async function ensureConnection() {
    if (!client.isOpen) {
        await client.connect();
    }
}

export async function addGameResult(userId: string, result: GameResult) {
    try {
        await ensureConnection();
        const key = `${userPrefixKey}${userId}:history`;
        await client.lPush(key, JSON.stringify(result));
    } catch (error) {
        console.error('Error adding game result:', error);
        throw error;
    }
}

export async function getGameHistory(userId: string): Promise<GameResult[]> {
    try {
        await ensureConnection();
        const key = `${userPrefixKey}${userId}:history`;
        const history = await client.lRange(key, 0, -1);
        return history.map((item: string) => JSON.parse(item) as GameResult);
    } catch (error) {
        console.error('Error getting game history:', error);
        return [];
    }
}

export async function updateGameResult(
    userId: string,
    contractAddress: string,
    updates: Partial<GameResult>
) {
    try {
        await ensureConnection();
        const key = `${userPrefixKey}${userId}:history`;
        const history = await client.lRange(key, 0, -1);

        for (let i = 0; i < history.length; i++) {
            const gameResult = JSON.parse(history[i]) as GameResult;
            if (gameResult.contractAddress === contractAddress) {
                const updatedResult = { ...gameResult, ...updates };
                await client.lSet(key, i, JSON.stringify(updatedResult));
                return true;
            }
        }
        return false; // Game not found
    } catch (error) {
        console.error('Error updating game result:', error);
        throw error;
    }
}

// Notification Functions
export async function addNotification(notification: PersistentNotification) {
    try {
        await ensureConnection();
        const notificationKey = `${notificationPrefixKey}${notification.to}`;
        const countKey = `${notificationCountKey}${notification.to}`;
        
        // Add notification to user's list with 7 day TTL
        await client.lPush(notificationKey, JSON.stringify(notification));
        await client.expire(notificationKey, 7 * 24 * 60 * 60); // 7 days
        
        // Increment unread count if notification is unread
        if (!notification.read) {
            await client.incr(countKey);
            await client.expire(countKey, 7 * 24 * 60 * 60); // 7 days
        }
    } catch (error) {
        console.error('Error adding notification:', error);
        throw error;
    }
}

export async function getNotifications(userAddress: string): Promise<PersistentNotification[]> {
    try {
        await ensureConnection();
        const notificationKey = `${notificationPrefixKey}${userAddress}`;
        
        const notifications = await client.lRange(notificationKey, 0, -1);
        return notifications.map((item: string) => JSON.parse(item) as PersistentNotification);
    } catch (error) {
        console.error('Error getting notifications:', error);
        return [];
    }
}

export async function markNotificationAsRead(userAddress: string, notificationId: string) {
    try {
        await ensureConnection();
        const notificationKey = `${notificationPrefixKey}${userAddress}`;
        const countKey = `${notificationCountKey}${userAddress}`;
        
        const notifications = await client.lRange(notificationKey, 0, -1);
        
        for (let i = 0; i < notifications.length; i++) {
            const notification = JSON.parse(notifications[i]) as PersistentNotification;
            if (notification.id === notificationId && !notification.read) {
                // Mark as read
                notification.read = true;
                await client.lSet(notificationKey, i, JSON.stringify(notification));
                
                // Decrement unread count
                const currentCount = await client.get(countKey);
                if (currentCount && parseInt(currentCount) > 0) {
                    await client.decr(countKey);
                }
                return true;
            }
        }
        return false; // Notification not found
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
}

export async function getUnreadNotificationCount(userAddress: string): Promise<number> {
    try {
        await ensureConnection();
        const countKey = `${notificationCountKey}${userAddress}`;
        
        const count = await client.get(countKey);
        return count ? parseInt(count) : 0;
    } catch (error) {
        console.error('Error getting unread notification count:', error);
        return 0;
    }
}
