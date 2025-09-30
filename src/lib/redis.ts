import { createClient } from "redis";

const client = createClient({
    url: process.env.REDIS_URL,
});

const userPrefixKey = 'rpsls-account:';

interface GameResult {
    timestamp: string;
    stake: string;
    contractAddress: string;
    status: 'pending' | 'completed' | 'timeout';
    type?: 'win' | 'loss' | 'tie'; // Only set when game is completed
    opponent?: string;
    playerChoice?: string;
    opponentChoice?: string;
}

async function ensureConnection() {
    if (!client.isOpen) {
        await client.connect();
    }
}

export async function setUserAddress(userId: string, address: string) {
    try {
        await ensureConnection();
        const key = `${userPrefixKey}${userId}`;
        await client.set(key, address);
    } catch (error) {
        console.error("Error setting user address:", error);
        throw error;
    }
}

export async function getUserAddress(userId: string) {
    try {
        await ensureConnection();
        const key = `${userPrefixKey}${userId}`;
        return await client.get(key);
    } catch (error) {
        console.error("Error getting user address:", error);
        return null;
    }
}

export async function addGameResult(userId: string, result: GameResult) {
    try {
        await ensureConnection();
        const key = `${userPrefixKey}${userId}:history`;
        await client.lpush(key, JSON.stringify(result));
    } catch (error) {
        console.error("Error adding game result:", error);
        throw error;
    }
}

export async function getGameHistory(userId: string): Promise<GameResult[]> {
    try {
        await ensureConnection();
        const key = `${userPrefixKey}${userId}:history`;
        const history = await client.lrange(key, 0, -1) as string[];
        return history.map((item: string) => JSON.parse(item) as GameResult);
    } catch (error) {
        console.error("Error getting game history:", error);
        return [];
    }
}

export async function updateGameResult(userId: string, contractAddress: string, updates: Partial<GameResult>) {
    try {
        await ensureConnection();
        const key = `${userPrefixKey}${userId}:history`;
        const history = await client.lrange(key, 0, -1) as string[];
        
        for (let i = 0; i < history.length; i++) {
            const gameResult = JSON.parse(history[i]) as GameResult;
            if (gameResult.contractAddress === contractAddress) {
                const updatedResult = { ...gameResult, ...updates };
                await client.lset(key, i, JSON.stringify(updatedResult));
                return true;
            }
        }
        return false; // Game not found
    } catch (error) {
        console.error("Error updating game result:", error);
        throw error;
    }
}