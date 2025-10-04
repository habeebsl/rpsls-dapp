import { useState, useEffect } from 'react';
import { getGameState } from '@/lib/contract';
import { gameApi } from '@/services/api';
import { GameState, Move } from '@/types';
import { Signer } from 'ethers';
import { useWalletStore } from '@/stores/walletStore';
import { useGameSync } from './useGameSync';

interface UseGameStateProps {
    contractAddress: string;
    currentUserAddress: string | null;
    signer: Signer | null;
    onGameEnd?: (
        action: 'move_made' | 'game_joined' | 'move_revealed' | 'timeout'
    ) => void;
}

interface UseGameStateReturn {
    gameState: GameState | null;
    userMove: Move | null;
    userHasSelectedMove: boolean;
    isLoading: boolean;
    error: string | null;
    timeoutEnabled: boolean;
    gameHasEnded: boolean;
    isCurrentUserJ1: boolean;
    isCurrentUserJ2: boolean;
    j1HasPlayed: boolean;
    j2HasPlayed: boolean;
    currentUserHasSelectedMove: boolean;
    setUserHasSelectedMove: (value: boolean) => void;
    fetchGameState: (isInitialLoad?: boolean) => Promise<void>;
    notifyMove: (
        action: 'move_made' | 'game_joined' | 'move_revealed' | 'timeout'
    ) => Promise<void>;
}

const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
// Add a 10-second safety buffer to account for blockchain timing differences
// This prevents users from clicking the timeout button before the blockchain
// considers the timeout period elapsed, which would cause the transaction to revert
const TIMEOUT_SAFETY_BUFFER = 10 * 1000; // 10 seconds in milliseconds

export function useGameState({
    contractAddress,
    currentUserAddress,
    signer,
    onGameEnd,
}: UseGameStateProps): UseGameStateReturn {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userHasSelectedMove, setUserHasSelectedMove] = useState(false);
    const [userMove, setUserMove] = useState<Move | null>(null);
    const [timeoutEnabled, setTimeoutEnabled] = useState(false);

    // Fetch game state from smart contract
    const fetchGameState = async (isInitialLoad = false) => {
        // For spectators (no wallet connected), we can still fetch read-only game state
        // We'll use a provider instead of signer

        // Only show loading screen on initial load, not during polling
        if (isInitialLoad) {
            setIsLoading(true);
        }

        try {
            // Fetch game state - works for both players and spectators
            const state = await getGameState(contractAddress, signer);
            setGameState(state);

            // Only try to fetch user's move if they are connected and potentially a player
            if (currentUserAddress) {
                try {
                    const moveResponse = await gameApi.getUserMove(
                        contractAddress,
                        currentUserAddress
                    );
                    if (moveResponse && moveResponse.move) {
                        setUserMove(moveResponse.move as Move);
                        setUserHasSelectedMove(true);
                    }
                } catch (moveError: any) {
                    // 404 is expected if player hasn't made a move yet - ignore it
                    if (moveError.response?.status !== 404) {
                        console.error('Error fetching user move:', {
                            status: moveError.response?.status,
                            message: moveError.message,
                        });
                    }
                }
            }

            if (isInitialLoad) {
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Error fetching game data:', err);
            setError('Failed to load game data');
            if (isInitialLoad) {
                setIsLoading(false);
            }
        }
    };

    // Set up real-time game sync
    const { notifyMove } = useGameSync({
        gameId: contractAddress,
        onGameUpdate: async () => {
            // Wait 2 seconds to allow blockchain state to propagate across nodes
            await new Promise(resolve => setTimeout(resolve, 2000));
            fetchGameState(false);
        },
        onGameEnd: onGameEnd,
        enabled: !!contractAddress && !!currentUserAddress && !!signer,
    });

    // Initial load - works for both players and spectators
    useEffect(() => {
        if (contractAddress) {
            fetchGameState(true); // Initial load with loading screen
        }
    }, [contractAddress]);

    // Calculate timeout button state
    useEffect(() => {
        if (
            !gameState ||
            !currentUserAddress ||
            !gameState.lastAction ||
            gameState.lastAction === '0'
        ) {
            setTimeoutEnabled(false);
            return;
        }

        const updateTimeoutState = () => {
            const lastActionTime = parseInt(gameState.lastAction) * 1000; // Convert to milliseconds
            const now = Date.now();
            const elapsed = now - lastActionTime;
            const timeUntilTimeout =
                TIMEOUT_DURATION + TIMEOUT_SAFETY_BUFFER - elapsed;

            // Add safety buffer to prevent premature timeout calls
            // The blockchain might be slightly behind the frontend time
            const hasTimedOut =
                elapsed >= TIMEOUT_DURATION + TIMEOUT_SAFETY_BUFFER;

            // Determine if current user is J1 or J2
            const isCurrentUserJ1 =
                currentUserAddress?.toLowerCase() ===
                gameState.j1.toLowerCase();
            const isCurrentUserJ2 =
                currentUserAddress?.toLowerCase() ===
                gameState.j2.toLowerCase();

            let shouldEnableTimeout = false;

            if (isCurrentUserJ1 && !gameState.hasPlayer2Played && hasTimedOut) {
                shouldEnableTimeout = true;
            } else if (
                isCurrentUserJ2 &&
                gameState.hasPlayer2Played &&
                hasTimedOut
            ) {
                shouldEnableTimeout = true;
            }

            setTimeoutEnabled(shouldEnableTimeout);
        };

        updateTimeoutState();
        const interval = setInterval(updateTimeoutState, 1000);

        return () => clearInterval(interval);
    }, [gameState, currentUserAddress]);

    // Derived state
    const isCurrentUserJ1 =
        currentUserAddress?.toLowerCase() === gameState?.j1.toLowerCase();
    const isCurrentUserJ2 =
        currentUserAddress?.toLowerCase() === gameState?.j2.toLowerCase();
    const j1HasPlayed = true; // J1 always has "played" (created the game with commitment)
    const j2HasPlayed = gameState?.hasPlayer2Played || false;
    const currentUserHasSelectedMove = isCurrentUserJ1
        ? j1HasPlayed
        : j2HasPlayed;
    const gameHasEnded = gameState?.stake === '0';

    return {
        gameState,
        userMove,
        userHasSelectedMove,
        isLoading,
        error,
        timeoutEnabled,
        gameHasEnded,
        isCurrentUserJ1,
        isCurrentUserJ2,
        j1HasPlayed,
        j2HasPlayed,
        currentUserHasSelectedMove,
        setUserHasSelectedMove,
        fetchGameState,
        notifyMove,
    };
}
