import { j1Timeout, j2Timeout } from '@/lib/contract';
import { gameApi } from '@/services/api';
import { notificationHelpers } from '@/utils/notifications';
import { GameState } from '@/types';
import { ethers, Signer } from 'ethers';

interface UseTimeoutProps {
    contractAddress: string;
    currentUserAddress: string | null;
    signer: Signer | null;
    gameState: GameState | null;
    isCurrentUserJ1: boolean;
    isCurrentUserJ2: boolean;
    fetchGameState: () => Promise<void>;
}

interface UseTimeoutReturn {
    handleTimeoutClick: () => Promise<{
        absoluteWinner: 'j1-wins' | 'j2-wins';
        j1Move: string;
        j2Move: string;
        stakeAmount: string;
        isTimeout: boolean;
        timeoutWinner: 'j1' | 'j2';
    } | null>;
}

export function useTimeout({
    contractAddress,
    currentUserAddress,
    signer,
    gameState,
    isCurrentUserJ1,
    isCurrentUserJ2,
    fetchGameState,
}: UseTimeoutProps): UseTimeoutReturn {
    const handleTimeoutClick = async () => {
        if (!signer || !gameState || !currentUserAddress) {
            throw new Error('Wallet not connected or game state not loaded');
        }

        try {
            let transaction;

            if (isCurrentUserJ1 && !gameState.hasPlayer2Played) {
                // J1 calls j2Timeout because J2 didn't play
                console.log('J1 calling j2Timeout - J2 failed to play in time');
                transaction = await j2Timeout(contractAddress, signer);
            } else if (isCurrentUserJ2 && gameState.hasPlayer2Played) {
                // J2 calls j1Timeout because J1 didn't reveal/solve
                console.log(
                    'J2 calling j1Timeout - J1 failed to reveal in time'
                );
                transaction = await j1Timeout(contractAddress, signer);
            } else {
                throw new Error('Invalid timeout condition');
            }

            console.log('Timeout transaction submitted:', transaction.hash);

            // Wait for transaction to be mined
            await transaction.wait();
            console.log('Timeout transaction confirmed');

            const completedAt = new Date().toISOString();

            // Update game result for the winner (current user who called timeout)
            await gameApi.updateGameResult(
                contractAddress,
                currentUserAddress,
                {
                    status: 'completed',
                    type: 'win',
                    completedAt,
                    timeoutWinner: isCurrentUserJ1 ? 'j1' : 'j2', // Add timeoutWinner field
                }
            );

            // Update game result for the loser (opponent who timed out)
            const opponentAddress = isCurrentUserJ1
                ? gameState.j2
                : gameState.j1;
            await gameApi.updateGameResult(contractAddress, opponentAddress, {
                status: 'timeout',
                type: 'loss',
                completedAt,
                timeoutWinner: isCurrentUserJ1 ? 'j1' : 'j2', // Add timeoutWinner field
            });

            // Send timeout notification to the loser
            await notificationHelpers.timeout(
                currentUserAddress,
                opponentAddress,
                contractAddress
            );

            // Send win notification to the current user (winner)
            await notificationHelpers.gameCompleted(
                opponentAddress,
                currentUserAddress,
                contractAddress,
                'won'
            );

            // Show timeout result modal
            const timeoutWinner: 'j1' | 'j2' = isCurrentUserJ1 ? 'j1' : 'j2';
            const absoluteWinner: 'j1-wins' | 'j2-wins' = isCurrentUserJ1
                ? 'j1-wins'
                : 'j2-wins';

            const timeoutResult = {
                absoluteWinner,
                j1Move: 'Unknown', // Timeout: moves not revealed
                j2Move: 'Unknown', // Timeout: moves not revealed
                stakeAmount: ethers.formatEther(gameState.stake),
                isTimeout: true,
                timeoutWinner,
            };

            // These would need to be passed back to parent
            // setGameResult(timeoutResult);
            // setShowResultModal(true);

            // Refresh game state
            await fetchGameState();

            return timeoutResult;
        } catch (error) {
            console.error('Error calling timeout:', error);

            // Create user-friendly error message
            let errorMessage = 'Failed to call timeout. Please try again.';

            if (error instanceof Error) {
                if (error.message.includes('insufficient funds')) {
                    errorMessage = 'Insufficient funds to call timeout.';
                } else if (error.message.includes('user rejected')) {
                    errorMessage = 'Transaction was cancelled.';
                } else {
                    errorMessage = error.message;
                }
            }

            throw new Error(errorMessage);
        }
    };

    return {
        handleTimeoutClick,
    };
}
