import { j1Timeout, j2Timeout } from '@/lib/contract';
import { gameApi } from '@/services/api';
import { notificationHelpers } from '@/utils/notifications';
import { GameState } from '@/types';
import { ethers, Signer } from 'ethers';
import { NUMBER_TO_MOVE } from '@/types';

interface UseTimeoutProps {
    contractAddress: string;
    currentUserAddress: string | null;
    signer: Signer | null;
    gameState: GameState | null;
    isCurrentUserJ1: boolean;
    isCurrentUserJ2: boolean;
    fetchGameState: () => Promise<void>;
    notifyMove?: (
        action: 'move_made' | 'game_joined' | 'move_revealed' | 'timeout'
    ) => Promise<void>;
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
    notifyMove,
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

            // Get player moves if available
            let currentUserMove: string | undefined;
            let opponentMove: string | undefined;

            // Try to get current user's move from Redis
            try {
                const moveResponse = await gameApi.getUserMove(
                    contractAddress,
                    currentUserAddress
                );
                if (moveResponse && moveResponse.move) {
                    currentUserMove = moveResponse.move;
                }
            } catch (error) {
                // Move not found is okay, might not have been made yet
                console.log(
                    'Current user move not found (expected for J1 timeout)'
                );
            }

            // Get opponent's move if J2 has played (visible on blockchain)
            if (gameState.hasPlayer2Played && gameState.c2) {
                opponentMove = NUMBER_TO_MOVE[Number(gameState.c2)];
            }

            // Update game result for the winner (current user who called timeout)
            await gameApi.updateGameResult(
                contractAddress,
                currentUserAddress,
                {
                    status: 'completed',
                    type: 'win',
                    completedAt,
                    ...(currentUserMove && { playerChoice: currentUserMove }),
                    ...(opponentMove && { opponentChoice: opponentMove }),
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
                ...(opponentMove && { playerChoice: opponentMove }),
                ...(currentUserMove && { opponentChoice: currentUserMove }),
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

            // Notify real-time listeners that game ended via timeout
            if (notifyMove) {
                await notifyMove('timeout');
                console.log(
                    '📢 Notified other players of timeout via real-time'
                );
            }

            // Show timeout result modal
            const timeoutWinner: 'j1' | 'j2' = isCurrentUserJ1 ? 'j1' : 'j2';
            const absoluteWinner: 'j1-wins' | 'j2-wins' = isCurrentUserJ1
                ? 'j1-wins'
                : 'j2-wins';

            // Fetch original stake from Redis (since gameState.stake might be 0 after timeout)
            let originalStake = ethers.formatEther(gameState.stake); // fallback
            console.log('🔍 DEBUG: Fetching stake from Redis...', {
                contractAddress,
                j1Address: gameState.j1,
                fallbackStakeFromBlockchain: originalStake,
                gameStateStake: gameState.stake,
            });

            try {
                const gameResultResponse = await gameApi.getGameResult(
                    contractAddress,
                    gameState.j1 // Get J1's game result which has the original stake
                );
                console.log('🔍 DEBUG: Redis response:', {
                    success: gameResultResponse.success,
                    hasGameResult: !!gameResultResponse.gameResult,
                    fullResponse: JSON.stringify(gameResultResponse, null, 2),
                });

                if (
                    gameResultResponse.success &&
                    gameResultResponse.gameResult
                ) {
                    const redisStake = gameResultResponse.gameResult.stake;
                    console.log('🔍 DEBUG: Stake from Redis:', {
                        redisStake,
                        redisStakeType: typeof redisStake,
                        redisStakeLength: redisStake?.length,
                        willUseThisStake:
                            redisStake || 'NO - will use fallback',
                    });

                    originalStake = gameResultResponse.gameResult.stake;
                    console.log(
                        '✅ Found original stake from Redis:',
                        originalStake
                    );
                } else {
                    console.warn(
                        '❌ Redis response not successful or missing gameResult'
                    );
                }
            } catch (stakeError) {
                console.warn('💥 Error fetching stake from Redis:', stakeError);
                console.warn('Using blockchain fallback value:', originalStake);
            }

            console.log(
                '🎯 FINAL stake value that will be used:',
                originalStake
            );

            const timeoutResult = {
                absoluteWinner,
                j1Move: 'Unknown', // Timeout: moves not revealed
                j2Move: 'Unknown', // Timeout: moves not revealed
                stakeAmount: originalStake,
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
