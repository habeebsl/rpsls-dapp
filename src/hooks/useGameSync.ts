import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
    subscribeToGameUpdates,
    notifyGameUpdate,
    GameSyncMessage,
} from '@/lib/supabase';
import { useWalletStore } from '@/stores/walletStore';

interface UseGameSyncOptions {
    gameId: string;
    onGameUpdate: () => void; // Callback to refresh game state
    onGameEnd?: (action: GameSyncMessage['action']) => void; // Callback when game ends via real-time
    enabled?: boolean;
}

export const useGameSync = ({
    gameId,
    onGameUpdate,
    onGameEnd,
    enabled = true,
}: UseGameSyncOptions) => {
    const channelRef = useRef<RealtimeChannel | null>(null);
    const { address } = useWalletStore();

    useEffect(() => {
        if (!enabled || !gameId || !address) {
            return;
        }

        // Subscribe to game updates
        const channel = subscribeToGameUpdates(
            gameId,
            (message: GameSyncMessage) => {
                // Only react to other players' actions (not our own)
                if (message.playerId !== address) {
                    onGameUpdate();

                    // If this is a move reveal or timeout, the game has ended
                    if (
                        (message.action === 'move_revealed' ||
                            message.action === 'timeout') &&
                        onGameEnd
                    ) {
                        onGameEnd(message.action);
                    }
                }
            }
        );

        channelRef.current = channel;

        // Cleanup subscription
        return () => {
            if (channelRef.current) {
                channelRef.current.unsubscribe();
                channelRef.current = null;
            }
        };
    }, [gameId, address, enabled, onGameUpdate]);

    // Notify other players when current player makes a move
    const notifyMove = async (action: GameSyncMessage['action']) => {
        if (!gameId || !address) return;
        await notifyGameUpdate(gameId, action);
    };
    return {
        notifyMove,
        isConnected: !!channelRef.current,
    };
};
