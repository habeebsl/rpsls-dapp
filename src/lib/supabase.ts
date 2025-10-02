import { createClient } from '@supabase/supabase-js';

// Environment variables for Next.js (client-side needs NEXT_PUBLIC_ prefix)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Debug: Check if environment variables are loaded
console.log('🔧 Supabase Config:', {
  url: supabaseUrl?.slice(0, 30) + '...',
  keyLoaded: !!supabaseAnonKey && supabaseAnonKey !== 'your-anon-key',
  nextPublicUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  viteUrl: !!process.env.VITE_SUPABASE_URL
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10, // Reasonable rate limit
    },
  },
});

// Game sync types
export interface GameSyncMessage {
  gameId: string;
  playerId: string;
  action: 'move_made' | 'game_joined' | 'move_revealed';
  timestamp: number;
}

// Send notification when you make a move
export const notifyGameUpdate = async (gameId: string, action: GameSyncMessage['action']) => {
  const channel = supabase.channel(`game-${gameId}`);
  
  await channel.send({
    type: 'broadcast',
    event: 'game_update',
    payload: {
      gameId,
      playerId: 'current_player', // We'll get this from wallet
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
      console.log('🔔 Received game update:', payload);
      onUpdate(payload as GameSyncMessage);
    })
    .subscribe((status) => {
      console.log(`📡 Game sync status for ${gameId}:`, status);
    });

  return channel;
};