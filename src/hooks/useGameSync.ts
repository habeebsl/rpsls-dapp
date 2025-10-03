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

        console.log(`🚀 Setting up real-time sync for game: ${gameId}`);

        // Subscribe to game updates
        const channel = subscribeToGameUpdates(
            gameId,
            (message: GameSyncMessage) => {
                // Only react to other players' actions (not our own)
                if (message.playerId !== address) {
                    console.log(
                        `🔄 Other player action detected: ${message.action}`
                    );
                    onGameUpdate(); // Trigger immediate game state refresh

                    // If this is a move reveal or timeout, the game has ended - notify callback
                    if (
                        (message.action === 'move_revealed' ||
                            message.action === 'timeout') &&
                        onGameEnd
                    ) {
                        console.log(
                            `🎯 Game ended via real-time: ${message.action}`
                        );
                        onGameEnd(message.action);
                    }
                } else {
                    console.log(`ℹ️ Own action ignored: ${message.action}`);
                }
            }
        );

        channelRef.current = channel;

        // Cleanup subscription
        return () => {
            console.log(`🧹 Cleaning up game sync for: ${gameId}`);
            if (channelRef.current) {
                channelRef.current.unsubscribe();
                channelRef.current = null;
            }
        };
    }, [gameId, address, enabled, onGameUpdate]);

    // Function to notify other players when we make a move
    // When you make a move, notify other players
    const notifyMove = async (action: GameSyncMessage['action']) => {
        if (!gameId || !address) return;

        console.log(
            `📢 Notifying other players: ${action} at ${new Date().toISOString()}`
        );
        await notifyGameUpdate(gameId, action);
        console.log(`✅ Notification sent for: ${action}`);
    };
    return {
        notifyMove,
        isConnected: !!channelRef.current,
    };
};
