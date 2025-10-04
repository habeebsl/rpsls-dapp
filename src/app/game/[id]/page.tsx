'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { LoadingScreen } from '@/app/components/LoadingScreen';
import { MoveContainer } from '@/app/components/MoveContainer';
import { GameActionButtons } from '@/app/components/GameActionButtons';
import { GameStatus } from '@/app/components/GameStatus';
import { GameResultModal } from '@/app/components/GameResultModal';
import { useWalletStore } from '@/stores/walletStore';
import { useGameState } from '@/hooks/useGameState';
import { useRevealMove } from '@/hooks/useRevealMove';
import { useTimeout } from '@/hooks/useTimeout';
import { useMoveSelection } from '@/hooks/useMoveSelection';
import { NUMBER_TO_MOVE, Move } from '@/types';

export default function GamePage() {
  const params = useParams();
  const contractAddress = params.id as string;
  const { address: walletAddress, signer } = useWalletStore();

  const currentUserAddress = walletAddress;

  // Track previous game state to detect real-time game end
  const [previousGameHasEnded, setPreviousGameHasEnded] =
    useState<boolean>(false);
  const [realtimeGameEndDetected, setRealtimeGameEndDetected] =
    useState<boolean>(false);

  // Handle real-time game end (opponent reveals move)
  const handleGameEndViaRealtime = async () => {
    setRealtimeGameEndDetected(true);
  };

  // Game state management
  const {
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
  } = useGameState({
    contractAddress,
    currentUserAddress,
    signer,
    onGameEnd: handleGameEndViaRealtime,
  });

  // Determine if current user is a spectator (after getting isCurrentUserJ1/J2 from hook)
  const isSpectator =
    !currentUserAddress || (!isCurrentUserJ1 && !isCurrentUserJ2);

  // Result modal state
  const [showResultModal, setShowResultModal] = useState(false);
  const [gameResult, setGameResult] = useState<{
    absoluteWinner: 'j1-wins' | 'j2-wins' | 'tie';
    j1Move: string;
    j2Move: string;
    stakeAmount: string;
    isTimeout: boolean;
    timeoutWinner?: 'j1' | 'j2';
  } | null>(null);

  // State to store fetched J1 move (fallback when useGameState can't fetch it)
  const [fetchedJ1Move, setFetchedJ1Move] = useState<string | null>(null);

  // Reveal move functionality
  const { handleRevealMove } = useRevealMove({
    contractAddress,
    currentUserAddress,
    signer,
    gameState,
    userMove,
    isCurrentUserJ1,
    j2HasPlayed,
    fetchGameState,
    notifyMove,
  });

  // Timeout functionality
  const { handleTimeoutClick } = useTimeout({
    contractAddress,
    currentUserAddress,
    signer,
    gameState,
    isCurrentUserJ1,
    isCurrentUserJ2,
    fetchGameState,
    notifyMove,
  });

  // Wrapper functions to handle modal state
  const handleRevealMoveWithModal = async () => {
    try {
      const result = await handleRevealMove();
      if (result) {
        setGameResult(result);
        setShowResultModal(true);
      }
    } catch (error) {
      console.error('Reveal move error:', error);
    }
  };

  const handleTimeoutWithModal = async () => {
    try {
      const result = await handleTimeoutClick();
      if (result) {
        setGameResult(result);
        setShowResultModal(true);
      }
    } catch (error) {
      console.error('Timeout error:', error);
    }
  };

  // Move selection functionality
  const { handleMoveSelection } = useMoveSelection({
    contractAddress,
    currentUserAddress,
    signer,
    gameState,
    isCurrentUserJ2,
    fetchGameState,
    setUserHasSelectedMove,
    notifyMove,
  });

  // Effect to detect game end via real-time and show results modal
  useEffect(() => {
    const handleRealtimeGameEnd = async () => {
      if (!realtimeGameEndDetected || !gameState || !currentUserAddress) {
        return;
      }

      // Check if game actually ended via blockchain OR real-time notification
      const gameEndedViaBlockchain =
        gameState.stake === '0' && !previousGameHasEnded;
      const gameEndedViaRealtime =
        realtimeGameEndDetected && !previousGameHasEnded;

      if (gameEndedViaBlockchain || gameEndedViaRealtime) {
        try {
          const { calculateGameResult } = await import('@/utils/gameResults');

          // We need J1's move to calculate the result
          // For J1, we already have userMove. For J2, we need to get it from the API
          let j1Move: string | null = null;
          let originalStake: string | null = null;

          if (isCurrentUserJ1) {
            j1Move = userMove;
          } else {
            // J2 needs to get J1's move from their own game result (J1 stores it as opponentChoice for J2)
            try {
              const { gameApi } = await import('@/services/api');

              // Retry mechanism: J1's API update might take a moment to complete
              let gameResultResponse;
              let attempts = 0;
              const maxAttempts = 5;
              const delayMs = 1000;

              while (attempts < maxAttempts) {
                attempts++;

                gameResultResponse = await gameApi.getGameResult(
                  contractAddress,
                  currentUserAddress
                );

                // Check if we have the completed data with opponentChoice
                if (
                  gameResultResponse.success &&
                  gameResultResponse.gameResult &&
                  gameResultResponse.gameResult.status === 'completed' &&
                  gameResultResponse.gameResult.opponentChoice
                ) {
                  break;
                }

                if (attempts < maxAttempts) {
                  await new Promise(resolve => setTimeout(resolve, delayMs));
                }
              }

              if (gameResultResponse.success && gameResultResponse.gameResult) {
                j1Move = gameResultResponse.gameResult.opponentChoice;
              } else {
                console.error('Failed to fetch game result after all attempts');
              }
            } catch (error) {
              console.error(
                'Error fetching J1 move for result calculation:',
                error
              );
            }
          }

          // Fetch original stake from Redis (stored when game was created)
          try {
            const { gameApi } = await import('@/services/api');
            const j1GameResult = await gameApi.getGameResult(
              contractAddress,
              gameState.j1
            );
            if (j1GameResult.success && j1GameResult.gameResult) {
              originalStake = j1GameResult.gameResult.stake;
            }
          } catch (stakeError) {
            console.warn('Could not fetch stake from Redis:', stakeError);
          }

          if (j1Move) {
            // Check if J2 never played (timeout scenario)
            if (gameState.c2 === 0 || !gameState.c2) {
              const timeoutResult = {
                absoluteWinner: 'j1-wins' as const,
                j1Move: j1Move,
                j2Move: 'Unknown',
                stakeAmount: originalStake || '0',
                isTimeout: true,
                timeoutWinner: 'j1' as const,
              };

              setGameResult(timeoutResult);
              setShowResultModal(true);
              return;
            }

            // Add originalStake to gameState for calculation
            const gameStateWithStake = {
              ...gameState,
              originalStake: originalStake || gameState.stake,
            };
            // Calculate absolute result (no player perspective)
            const result = calculateGameResult(
              gameStateWithStake,
              j1Move,
              true
            );
            if (result) {
              setGameResult(result);
              setShowResultModal(true);
            }
          } else {
            // J1 move not available - this is likely a timeout scenario
            // Check if this is a timeout (game ended but J1 never revealed)
            if (gameHasEnded && gameState.stake === '0') {
              // Fetch original stake
              let timeoutStake = '0';
              try {
                const { gameApi } = await import('@/services/api');
                const j1GameResult = await gameApi.getGameResult(
                  contractAddress,
                  gameState.j1
                );
                if (j1GameResult.success && j1GameResult.gameResult) {
                  timeoutStake = j1GameResult.gameResult.stake;
                }
              } catch (error) {
                console.warn('Could not fetch stake for timeout:', error);
              }

              // Create timeout result
              const timeoutResult = {
                absoluteWinner: 'j2-wins' as const,
                j1Move: 'Unknown',
                j2Move:
                  gameState.c2 > 0
                    ? require('@/types').NUMBER_TO_MOVE[gameState.c2]
                    : 'Unknown',
                stakeAmount: timeoutStake,
                isTimeout: true,
                timeoutWinner: 'j2' as const,
              };

              setGameResult(timeoutResult);
              setShowResultModal(true);
            }
          }
        } catch (error) {
          console.error('Error calculating real-time game result:', error);
        }
      }

      // Update tracking state
      setPreviousGameHasEnded(gameState.stake === '0');
      setRealtimeGameEndDetected(false);
    };

    handleRealtimeGameEnd();
  }, [
    realtimeGameEndDetected,
    gameState,
    currentUserAddress,
    isCurrentUserJ1,
    userMove,
    contractAddress,
    previousGameHasEnded,
  ]);

  // Effect to check if game has already ended on page load/refresh
  useEffect(() => {
    const checkGameAlreadyEnded = async () => {
      // Only run if game has ended and we haven't already set the result
      if (!gameHasEnded || !gameState || gameResult) {
        return;
      }

      try {
        const { calculateGameResult } = await import('@/utils/gameResults');

        // Try to get J1's move from API (stored when J1 created the game)
        let j1Move: string | null = null;
        let originalStake: string | null = null;
        let isTimeoutGame = false;
        let timeoutWinnerFromRedis: 'j1' | 'j2' | undefined;

        try {
          const { gameApi } = await import('@/services/api');
          // Try to get J1's move by querying with J1's address
          const j1MoveResponse = await gameApi.getUserMove(
            contractAddress,
            gameState.j1
          );
          if (j1MoveResponse && j1MoveResponse.move) {
            j1Move = j1MoveResponse.move;
            setFetchedJ1Move(j1Move);
          }

          // Fetch J1's game result to get the original stake
          const j1GameResult = await gameApi.getGameResult(
            contractAddress,
            gameState.j1
          );
          if (j1GameResult.success && j1GameResult.gameResult) {
            originalStake = j1GameResult.gameResult.stake;
            console.log('✅ Found original stake from Redis:', originalStake);
          }

          // Check timeout status from current user's perspective (if they're a player)
          if (currentUserAddress && (isCurrentUserJ1 || isCurrentUserJ2)) {
            const userGameResult = await gameApi.getGameResult(
              contractAddress,
              currentUserAddress
            );
            if (userGameResult.success && userGameResult.gameResult) {
              if (userGameResult.gameResult.status === 'timeout') {
                isTimeoutGame = true;
                // Current user lost by timeout, so opponent won
                timeoutWinnerFromRedis = isCurrentUserJ1 ? 'j2' : 'j1';
                console.log(
                  '🕐 Current user lost by timeout, opponent won:',
                  timeoutWinnerFromRedis
                );
              }
            }
          }

          // Also check if J1 lost by timeout (for spectators or if we didn't find it above)
          if (
            !isTimeoutGame &&
            j1GameResult.success &&
            j1GameResult.gameResult
          ) {
            if (j1GameResult.gameResult.status === 'timeout') {
              isTimeoutGame = true;
              timeoutWinnerFromRedis = 'j2';
            } else if (
              j1GameResult.gameResult.type === 'win' &&
              j1GameResult.gameResult.status === 'completed'
            ) {
              // Check if J2 timed out by checking J2's result
              try {
                const j2GameResult = await gameApi.getGameResult(
                  contractAddress,
                  gameState.j2
                );
                if (
                  j2GameResult.success &&
                  j2GameResult.gameResult?.status === 'timeout'
                ) {
                  isTimeoutGame = true;
                  timeoutWinnerFromRedis = 'j1';
                }
              } catch (j2Error) {
                console.error('Could not check J2 timeout status:', j2Error);
              }
            }
          }
        } catch (apiError) {
          console.error('Could not fetch game data from API:', apiError);
        }

        // If we have both moves, calculate the result
        if (j1Move && gameState.c2 > 0) {
          // Add originalStake to gameState for calculation
          const gameStateWithStake = {
            ...gameState,
            originalStake: originalStake || gameState.stake,
          };

          // Check if this was a timeout game
          if (isTimeoutGame && timeoutWinnerFromRedis) {
            // This was a timeout game - create timeout result
            // Hide the move of the player who timed out (didn't reveal)
            const timeoutResult = {
              absoluteWinner: (timeoutWinnerFromRedis === 'j1'
                ? 'j1-wins'
                : 'j2-wins') as 'j1-wins' | 'j2-wins',
              j1Move: timeoutWinnerFromRedis === 'j2' ? 'Unknown' : j1Move, // J1 timed out if J2 won
              j2Move:
                timeoutWinnerFromRedis === 'j1'
                  ? 'Unknown' // J2 timed out if J1 won
                  : require('@/types').NUMBER_TO_MOVE[gameState.c2] ||
                    'Unknown',
              stakeAmount: originalStake || '0',
              isTimeout: true,
              timeoutWinner: timeoutWinnerFromRedis,
            };
            setGameResult(timeoutResult);
            setShowResultModal(true);
          } else {
            // Normal game - calculate result
            const result = calculateGameResult(
              gameStateWithStake,
              j1Move,
              true
            );

            if (result) {
              setGameResult(result);
              setShowResultModal(true);
            }
          }
        } else {
          // Missing moves - check if this is a timeout scenario
          // Determine timeout scenario
          if (gameState.stake === '0') {
            let timeoutWinner: 'j1' | 'j2';
            let absoluteWinner: 'j1-wins' | 'j2-wins';
            let j1MoveDisplay = 'Unknown';
            let j2MoveDisplay = 'Unknown';

            if (!gameState.c2 || gameState.c2 === 0) {
              timeoutWinner = 'j1';
              absoluteWinner = 'j1-wins';
              j1MoveDisplay = j1Move || 'Unknown';
              j2MoveDisplay = 'Unknown';
            } else {
              timeoutWinner = 'j2';
              absoluteWinner = 'j2-wins';
              j1MoveDisplay = 'Unknown';
              j2MoveDisplay =
                require('@/types').NUMBER_TO_MOVE[gameState.c2] || 'Unknown';
            }

            const timeoutResult = {
              absoluteWinner,
              j1Move: j1MoveDisplay,
              j2Move: j2MoveDisplay,
              stakeAmount: originalStake || '0',
              isTimeout: true,
              timeoutWinner,
            };

            setGameResult(timeoutResult);
            setShowResultModal(true);
          }
        }
      } catch (error) {
        console.error('Error fetching game result on load:', error);
      }
    };

    checkGameAlreadyEnded();
  }, [
    gameHasEnded,
    gameState,
    currentUserAddress,
    contractAddress,
    isCurrentUserJ1,
    gameResult,
  ]);

  // Helper functions to calculate results for each player
  const getJ1Result = (): 'win' | 'loss' | 'tie' | null => {
    if (!gameHasEnded || !gameResult) return null;

    const { getUserPerspectiveResult } = require('@/utils/gameResults');

    // J1's result from J1's perspective
    return getUserPerspectiveResult(
      gameResult.absoluteWinner,
      true, // isJ1 = true
      gameResult.isTimeout,
      gameResult.timeoutWinner
    );
  };

  const getJ2Result = (): 'win' | 'loss' | 'tie' | null => {
    if (!gameHasEnded || !gameResult) return null;

    const { getUserPerspectiveResult } = require('@/utils/gameResults');

    // J2's result from J2's perspective
    return getUserPerspectiveResult(
      gameResult.absoluteWinner,
      false, // isJ1 = false (this is J2)
      gameResult.isTimeout,
      gameResult.timeoutWinner
    );
  };

  // Loading state
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    );
  }

  // Game not found state
  if (!gameState) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Game Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The game you're looking for doesn't exist.
          </p>
          <button
            onClick={() => {
              window.location.href = '/';
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-4xl pt-30 pb-28 md:pb-4">
        {!isSpectator && (
          <GameActionButtons
            isCurrentUserJ1={isCurrentUserJ1}
            j2HasPlayed={j2HasPlayed}
            gameHasEnded={gameHasEnded}
            timeoutEnabled={timeoutEnabled}
            onRevealMove={handleRevealMoveWithModal}
            onTimeout={handleTimeoutWithModal}
          />
        )}

        <GameStatus
          gameState={gameState}
          j1HasPlayed={j1HasPlayed}
          j2HasPlayed={j2HasPlayed}
          gameHasEnded={gameHasEnded}
          currentUserAddress={currentUserAddress || undefined}
          j1Result={getJ1Result()}
          j2Result={getJ2Result()}
          isSpectator={isSpectator}
        />

        {/* Spectator mode: show read-only view with game info */}
        {isSpectator && (
          <div className="mb-6 md:mb-8">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 md:p-6">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 text-2xl">👀</div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-blue-900 mb-2">
                    {currentUserAddress ? 'Spectator Mode' : 'Viewing Game'}
                  </h3>
                  <p className="text-sm md:text-base text-blue-800 mb-3">
                    {currentUserAddress
                      ? 'You are viewing this game as a spectator. You cannot interact with the game.'
                      : 'Connect your wallet to interact with games, or continue viewing as a spectator.'}
                  </p>

                  {/* Show result info if game has ended */}
                  {gameHasEnded && gameResult && (
                    <div className="mb-3 p-3 bg-blue-100 rounded-lg border border-blue-300">
                      <p className="text-sm font-medium text-blue-900">
                        🏁 Game Ended •{' '}
                        {gameResult.absoluteWinner === 'tie' ? (
                          <span className="text-blue-700">It's a Tie!</span>
                        ) : gameResult.absoluteWinner === 'j1-wins' ? (
                          <span className="text-green-700">Player 1 Wins!</span>
                        ) : (
                          <span className="text-green-700">Player 2 Wins!</span>
                        )}
                      </p>
                      <button
                        onClick={() => setShowResultModal(true)}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                      >
                        View detailed results →
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs md:text-sm text-blue-700">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Real-time updates
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      View game progress
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      See final results
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Players can select moves - spectators cannot */}
        {!isSpectator && (
          <div className="mb-8">
            {(() => {
              // Determine selected move with fallback logic
              let selectedMoveValue: Move | undefined;

              if (userMove) {
                selectedMoveValue = userMove;
              } else if (isCurrentUserJ1 && fetchedJ1Move) {
                selectedMoveValue = fetchedJ1Move as Move;
              } else if (isCurrentUserJ2 && gameState.c2 > 0) {
                selectedMoveValue = NUMBER_TO_MOVE[gameState.c2] as Move;
              }

              const moveContainerProps = {
                hasSelectedMove:
                  currentUserHasSelectedMove || userHasSelectedMove,
                selectedMove: selectedMoveValue,
                isJ1: isCurrentUserJ1,
                gameContractAddress: contractAddress,
                currentUserAddress: currentUserAddress,
                gameHasEnded: gameHasEnded,
              };
              return (
                <MoveContainer
                  hasSelectedMove={moveContainerProps.hasSelectedMove}
                  selectedMove={moveContainerProps.selectedMove}
                  isJ1={moveContainerProps.isJ1}
                  gameContractAddress={moveContainerProps.gameContractAddress}
                  currentUserAddress={moveContainerProps.currentUserAddress}
                  onSelectionConfirmed={handleMoveSelection}
                  gameHasEnded={moveContainerProps.gameHasEnded}
                />
              );
            })()}
          </div>
        )}
      </div>

      {gameResult && (
        <GameResultModal
          isOpen={showResultModal}
          absoluteWinner={gameResult.absoluteWinner}
          j1Move={gameResult.j1Move}
          j2Move={gameResult.j2Move}
          stakeAmount={gameResult.stakeAmount}
          isTimeout={gameResult.isTimeout}
          timeoutWinner={gameResult.timeoutWinner}
          isCurrentUserJ1={isCurrentUserJ1}
          isSpectator={isSpectator}
          onClose={() => setShowResultModal(false)}
        />
      )}
    </div>
  );
}
