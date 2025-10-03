import { useState } from 'react';
import { solve, determineGameOutcome } from '@/lib/contract';
import { gameApi } from '@/services/api';
import { notificationHelpers } from '@/utils/notifications';
import { MOVE_TO_NUMBER, NUMBER_TO_MOVE, Move, GameState } from '@/types';
import { ethers, Signer } from 'ethers';

interface UseRevealMoveProps {
    contractAddress: string;
    currentUserAddress: string | null;
    signer: Signer | null;
    gameState: GameState | null;
    userMove: Move | null;
    isCurrentUserJ1: boolean;
    j2HasPlayed: boolean;
    fetchGameState: () => Promise<void>;
    notifyMove?: (
        action: 'move_made' | 'game_joined' | 'move_revealed'
    ) => Promise<void>;
}

interface UseRevealMoveReturn {
    handleRevealMove: () => Promise<{
        absoluteWinner: 'j1-wins' | 'j2-wins' | 'tie';
        j1Move: string;
        j2Move: string;
        stakeAmount: string;
        isTimeout: boolean;
    } | null>;
}

export function useRevealMove({
    contractAddress,
    currentUserAddress,
    signer,
    gameState,
    userMove,
    isCurrentUserJ1,
    j2HasPlayed,
    fetchGameState,
    notifyMove,
}: UseRevealMoveProps): UseRevealMoveReturn {
    const [gameResult, setGameResult] = useState<any>(null);
    const [showResultModal, setShowResultModal] = useState(false);

    const handleRevealMove = async () => {
        if (!signer || !gameState || !currentUserAddress) {
            throw new Error('Wallet not connected or game state not loaded');
        }

        if (!isCurrentUserJ1) {
            throw new Error('Only Player 1 can reveal moves');
        }

        if (!j2HasPlayed) {
            throw new Error('Cannot reveal move until Player 2 has played');
        }

        try {
            console.log('Getting J1 game data for reveal...');

            // Get J1's salt from the game result and use userMove for the move
            const gameResultResponse = await gameApi.getGameResult(
                contractAddress,
                currentUserAddress
            );

            if (!gameResultResponse.success || !gameResultResponse.gameResult) {
                throw new Error('Could not find game data for reveal');
            }

            const gameResultData = gameResultResponse.gameResult;

            if (!gameResultData.salt) {
                throw new Error('Salt not found in game data');
            }

            if (!userMove) {
                throw new Error('Original move not found');
            }

            console.log('Found game data:', {
                move: userMove,
                hasSalt: !!gameResultData.salt,
            });

            // Convert move name to number for the contract
            const moveNumber =
                MOVE_TO_NUMBER[userMove as keyof typeof MOVE_TO_NUMBER];

            if (moveNumber === undefined) {
                throw new Error(`Invalid move: ${userMove}`);
            }

            console.log(
                'Revealing move:',
                userMove,
                'with move number:',
                moveNumber
            );

            // Call the solve function with the original move and salt
            const transaction = await solve(
                contractAddress,
                moveNumber,
                gameResultData.salt,
                signer
            );
            console.log('Reveal transaction submitted:', transaction.hash);

            // Wait for transaction to be mined
            await transaction.wait();
            console.log('Move revealed successfully');

            // Notify other players of the move reveal
            if (notifyMove) {
                await notifyMove('move_revealed');
                console.log('📢 Notified other players of move reveal');
            }

            // Refresh game state to reflect the reveal
            await fetchGameState();

            // Determine game outcome after reveal
            const outcome = await determineGameOutcome(
                contractAddress,
                moveNumber,
                gameState.c2,
                signer
            );
            console.log('Game outcome:', outcome);

            const completedAt = new Date().toISOString();
            const opponentAddress = gameState.j2; // J2 is the opponent for J1
            const j2Move = NUMBER_TO_MOVE[gameState.c2];

            // Update game result for J1 (current user)
            let j1Result: 'win' | 'loss' | 'tie';
            if (outcome === 'j1-wins') j1Result = 'win';
            else if (outcome === 'j2-wins') j1Result = 'loss';
            else j1Result = 'tie';

            await gameApi.updateGameResult(
                contractAddress,
                currentUserAddress,
                {
                    status: 'completed',
                    type: j1Result,
                    completedAt,
                    playerChoice: userMove,
                    opponentChoice: j2Move,
                }
            );

            // Update game result for J2 (opponent)
            let j2Result: 'win' | 'loss' | 'tie';
            if (outcome === 'j2-wins') j2Result = 'win';
            else if (outcome === 'j1-wins') j2Result = 'loss';
            else j2Result = 'tie';

            await gameApi.updateGameResult(contractAddress, opponentAddress, {
                status: 'completed',
                type: j2Result,
                completedAt,
                playerChoice: j2Move,
                opponentChoice: userMove,
            });

            // Send completion notifications to both players
            if (outcome !== 'tie') {
                const winner =
                    outcome === 'j1-wins'
                        ? currentUserAddress
                        : opponentAddress;
                const loser =
                    outcome === 'j1-wins'
                        ? opponentAddress
                        : currentUserAddress;

                await notificationHelpers.gameCompleted(
                    loser,
                    winner,
                    contractAddress,
                    'won'
                );
                await notificationHelpers.gameCompleted(
                    winner,
                    loser,
                    contractAddress,
                    'lost'
                );
            } else {
                // Both players tied
                await notificationHelpers.gameCompleted(
                    opponentAddress,
                    currentUserAddress,
                    contractAddress,
                    'tied'
                );
                await notificationHelpers.gameCompleted(
                    currentUserAddress,
                    opponentAddress,
                    contractAddress,
                    'tied'
                );
            }

            // Return absolute result data for parent to handle modal
            return {
                absoluteWinner: outcome, // 'j1-wins' | 'j2-wins' | 'tie'
                j1Move: userMove,
                j2Move: NUMBER_TO_MOVE[gameState.c2],
                stakeAmount: ethers.formatEther(gameState.stake),
                isTimeout: false,
            };
        } catch (error) {
            console.error('Error revealing move:', error);

            let errorMessage = 'Failed to reveal move. Please try again.';

            if (error instanceof Error) {
                if (error.message.includes('insufficient funds')) {
                    errorMessage = 'Insufficient funds to reveal move.';
                } else if (error.message.includes('user rejected')) {
                    errorMessage = 'Transaction was cancelled.';
                } else if (error.message.includes('Could not find game data')) {
                    errorMessage =
                        'Game data not found. Please try refreshing the page.';
                } else {
                    errorMessage = error.message;
                }
            }

            throw new Error(errorMessage);
        }
    };

    return {
        handleRevealMove,
    };
}
