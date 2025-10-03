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
import { NUMBER_TO_MOVE } from '@/types';
import { ethers } from 'ethers';

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
    console.log('🎯 Game ended via real-time notification received');
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
    console.log('🔄 useEffect triggered:', {
      realtimeGameEndDetected,
      gameState: !!gameState,
      currentUserAddress: !!currentUserAddress,
      gameStake: gameState?.stake,
      previousGameHasEnded,
    });

    const handleRealtimeGameEnd = async () => {
      if (!realtimeGameEndDetected || !gameState || !currentUserAddress) {
        console.log('⏭️ Skipping real-time game end handling:', {
          realtimeGameEndDetected,
          hasGameState: !!gameState,
          hasCurrentUser: !!currentUserAddress,
        });
        return;
      }

      // Check if game actually ended via blockchain OR real-time notification
      const gameEndedViaBlockchain =
        gameState.stake === '0' && !previousGameHasEnded;
      const gameEndedViaRealtime =
        realtimeGameEndDetected && !previousGameHasEnded;

      if (gameEndedViaBlockchain || gameEndedViaRealtime) {
        console.log('🎯 Detected game end, calculating results...', {
          source: gameEndedViaBlockchain ? 'blockchain' : 'realtime',
          stake: gameState.stake,
          previousGameHasEnded,
          isCurrentUserJ1,
          userMove,
          realtimeGameEndDetected,
        });

        try {
          // Import the utility function
          const { calculateGameResult } = await import('@/utils/gameResults');

          // We need J1's move to calculate the result
          // For J1, we already have userMove. For J2, we need to get it from the API
          let j1Move: string | null = null;

          if (isCurrentUserJ1) {
            j1Move = userMove;
            console.log('📋 J1 using own move:', j1Move);
          } else {
            // J2 needs to get J1's move from their own game result (J1 stores it as opponentChoice for J2)
            try {
              const { gameApi } = await import('@/services/api');
              console.log('🔍 J2 fetching own game result to get J1 move...', {
                contractAddress,
                currentUserAddress,
              });

              // Retry mechanism: J1's API update might take a moment to complete
              let gameResultResponse;
              let attempts = 0;
              const maxAttempts = 5;
              const delayMs = 1000; // 1 second between attempts

              while (attempts < maxAttempts) {
                attempts++;
                console.log(
                  `🔄 Attempt ${attempts}/${maxAttempts} to fetch J2 game result...`
                );

                gameResultResponse = await gameApi.getGameResult(
                  contractAddress,
                  currentUserAddress
                );
                console.log('📦 Game result response:', gameResultResponse);

                // Check if we have the completed data with opponentChoice
                if (
                  gameResultResponse.success &&
                  gameResultResponse.gameResult &&
                  gameResultResponse.gameResult.status === 'completed' &&
                  gameResultResponse.gameResult.opponentChoice
                ) {
                  console.log(
                    '✅ Found completed game result with opponent move!'
                  );
                  break;
                }

                console.log(
                  `⏳ Game result not ready yet (status: ${gameResultResponse.gameResult?.status}), waiting ${delayMs}ms...`
                );
                if (attempts < maxAttempts) {
                  await new Promise(resolve => setTimeout(resolve, delayMs));
                }
              }

              if (gameResultResponse.success && gameResultResponse.gameResult) {
                console.log(
                  '📊 Game result data (full object):',
                  JSON.stringify(gameResultResponse.gameResult, null, 2)
                );
                // J1's move should be stored as J2's opponentChoice
                j1Move = gameResultResponse.gameResult.opponentChoice;
                console.log('🎯 Found J1 move from API:', j1Move);
              } else {
                console.warn(
                  '❌ API response unsuccessful or missing gameResult after all attempts:',
                  JSON.stringify(gameResultResponse, null, 2)
                );
              }
            } catch (error) {
              console.error(
                '💥 Error fetching J1 move for result calculation:',
                error
              );
            }
          }

          if (j1Move) {
            console.log('✅ Have J1 move, calculating result...', {
              j1Move,
              j1MoveNumber: require('@/types').MOVE_TO_NUMBER[j1Move],
              j2Move: require('@/types').NUMBER_TO_MOVE[gameState.c2],
              j2MoveNumber: gameState.c2,
              isCurrentUserJ1,
              isCurrentUserJ2,
              currentUserAddress,
              gameState: gameState,
            });
            // Calculate absolute result (no player perspective)
            const result = calculateGameResult(gameState, j1Move, true); // true = skip blockchain check in real-time mode
            console.log('🎲 calculateGameResult returned:', result);
            console.log(
              '🎯 About to call setGameResult with absoluteWinner:',
              result?.absoluteWinner
            );
            console.log(
              '🎯 Current user is J1?',
              isCurrentUserJ1,
              'Current user is J2?',
              isCurrentUserJ2
            );
            if (result) {
              console.log('🎉 Setting game result and showing modal:', {
                ...result,
                callerIsJ1: isCurrentUserJ1,
                callerIsJ2: isCurrentUserJ2,
              });
              setGameResult(result);
              setShowResultModal(true);
            } else {
              console.warn('⚠️ calculateGameResult returned null/undefined');
            }
          } else {
            console.warn(
              '❌ Could not calculate result: J1 move not available'
            );
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
      if (!gameHasEnded || !gameState || !currentUserAddress || gameResult) {
        return;
      }

      console.log('🔍 Game has already ended, fetching result from API...');

      try {
        // Fetch the stored game result from API
        const { gameApi } = await import('@/services/api');
        const response = await gameApi.getGameResult(
          contractAddress,
          currentUserAddress
        );

        if (
          response.success &&
          response.gameResult &&
          response.gameResult.status === 'completed'
        ) {
          console.log('✅ Found completed game result:', response.gameResult);

          // Import calculateGameResult
          const { calculateGameResult } = await import('@/utils/gameResults');

          // Get J1's move from the API
          let j1Move: string | null = null;

          if (isCurrentUserJ1) {
            // Current user is J1, get from their own result
            j1Move = response.gameResult.playerChoice || null;
          } else {
            // Current user is J2, J1's move is the opponent choice
            j1Move = response.gameResult.opponentChoice || null;
          }

          if (j1Move) {
            // Calculate the result
            const result = calculateGameResult(gameState, j1Move, true);

            if (result) {
              console.log('🎉 Setting game result from API:', result);
              setGameResult(result);
              setShowResultModal(true);
            }
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

    // Import the helper function
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

    // Import the helper function
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
    <div className="min-h-screen bg-gray-100 relative">
      <div className="container mx-auto px-4 max-w-4xl pt-30 pb-28 md:pb-4">
        {/* Game Action Buttons */}
        <GameActionButtons
          isCurrentUserJ1={isCurrentUserJ1}
          j2HasPlayed={j2HasPlayed}
          gameHasEnded={gameHasEnded}
          timeoutEnabled={timeoutEnabled}
          onRevealMove={handleRevealMoveWithModal}
          onTimeout={handleTimeoutWithModal}
        />

        {/* Player Status Cards */}
        <GameStatus
          gameState={gameState}
          j1HasPlayed={j1HasPlayed}
          j2HasPlayed={j2HasPlayed}
          gameHasEnded={gameHasEnded}
          currentUserAddress={currentUserAddress || undefined}
          j1Result={getJ1Result()}
          j2Result={getJ2Result()}
        />

        {/* Move Selection - Only show if current user is a player */}
        {currentUserAddress && (isCurrentUserJ1 || isCurrentUserJ2) && (
          <div className="mb-8">
            <MoveContainer
              hasSelectedMove={
                currentUserHasSelectedMove || userHasSelectedMove
              }
              selectedMove={
                userMove ||
                (isCurrentUserJ2 && gameState.c2 > 0
                  ? NUMBER_TO_MOVE[gameState.c2]
                  : undefined)
              }
              isJ1={isCurrentUserJ1}
              gameContractAddress={contractAddress}
              currentUserAddress={currentUserAddress}
              onSelectionConfirmed={handleMoveSelection}
            />
          </div>
        )}

        {/* Not a player message */}
        {currentUserAddress && !isCurrentUserJ1 && !isCurrentUserJ2 && (
          <div className="text-center text-gray-600 mb-8">
            <p>You are viewing this game as a spectator.</p>
          </div>
        )}
      </div>

      {/* Game Result Modal */}
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
          onClose={() => setShowResultModal(false)}
        />
      )}
    </div>
  );
}
