import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    'https://your-project.supabase.co';
const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});

export interface GameSyncMessage {
    gameId: string;
    playerId: string;
    action: 'move_made' | 'game_joined' | 'move_revealed' | 'timeout';
    timestamp: number;
}

// Send notification when you make a move
export const notifyGameUpdate = async (
    gameId: string,
    action: GameSyncMessage['action']
) => {
    const channel = supabase.channel(`game-${gameId}`);

    await channel.send({
        type: 'broadcast',
        event: 'game_update',
        payload: {
            gameId,
            playerId: 'current_player',
            action,
            timestamp: Date.now(),
        } as GameSyncMessage,
    });
};

// Subscribe to game updates
export const subscribeToGameUpdates = (
    gameId: string,
    onUpdate: (message: GameSyncMessage) => void
) => {
    const channel = supabase.channel(`game-${gameId}`);

    channel
        .on('broadcast', { event: 'game_update' }, ({ payload }) => {
            onUpdate(payload as GameSyncMessage);
        })
        .subscribe();

    return channel;
};
