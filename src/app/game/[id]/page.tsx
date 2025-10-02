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
  const [previousGameHasEnded, setPreviousGameHasEnded] = useState<boolean>(false);
  const [realtimeGameEndDetected, setRealtimeGameEndDetected] = useState<boolean>(false);

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
    result: 'win' | 'loss' | 'tie';
    playerMove?: string;
    opponentMove?: string;
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
      previousGameHasEnded 
    });
    
    const handleRealtimeGameEnd = async () => {
      if (!realtimeGameEndDetected || !gameState || !currentUserAddress) {
        console.log('⏭️ Skipping real-time game end handling:', { 
          realtimeGameEndDetected, 
          hasGameState: !!gameState, 
          hasCurrentUser: !!currentUserAddress 
        });
        return;
      }
      
      // Check if game actually ended via blockchain OR real-time notification
      const gameEndedViaBlockchain = gameState.stake === '0' && !previousGameHasEnded;
      const gameEndedViaRealtime = realtimeGameEndDetected && !previousGameHasEnded;
      
      if (gameEndedViaBlockchain || gameEndedViaRealtime) {
        console.log('🎯 Detected game end, calculating results...', {
          source: gameEndedViaBlockchain ? 'blockchain' : 'realtime',
          stake: gameState.stake,
          previousGameHasEnded,
          isCurrentUserJ1,
          userMove,
          realtimeGameEndDetected
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
              console.log('🔍 J2 fetching own game result to get J1 move...', { contractAddress, currentUserAddress });
              const gameResultResponse = await gameApi.getGameResult(contractAddress, currentUserAddress);
              console.log('📦 Game result response:', gameResultResponse);
              
              if (gameResultResponse.success && gameResultResponse.gameResult) {
                console.log('📊 Game result data (full object):', JSON.stringify(gameResultResponse.gameResult, null, 2));
                          // Get J1's move from API (with retry for timing issues)
          if (!isCurrentUserJ1) {
            try {
              const { gameApi } = await import('@/services/api');
              console.log('🔍 J2 fetching own game result to get J1 move...', { contractAddress, currentUserAddress });
              
              // Retry mechanism: J1's API update might take a moment to complete
              let gameResultResponse;
              let attempts = 0;
              const maxAttempts = 5;
              const delayMs = 1000; // 1 second between attempts
              
              while (attempts < maxAttempts) {
                attempts++;
                console.log(`🔄 Attempt ${attempts}/${maxAttempts} to fetch J2 game result...`);
                
                gameResultResponse = await gameApi.getGameResult(contractAddress, currentUserAddress);
                console.log('📦 Game result response:', gameResultResponse);
                
                // Check if we have the completed data with opponentChoice
                if (gameResultResponse.success && 
                    gameResultResponse.gameResult && 
                    gameResultResponse.gameResult.status === 'completed' &&
                    gameResultResponse.gameResult.opponentChoice) {
                  console.log('✅ Found completed game result with opponent move!');
                  break;
                }
                
                console.log(`⏳ Game result not ready yet (status: ${gameResultResponse.gameResult?.status}), waiting ${delayMs}ms...`);
                if (attempts < maxAttempts) {
                  await new Promise(resolve => setTimeout(resolve, delayMs));
                }
              }
              
              if (gameResultResponse.success && gameResultResponse.gameResult) {
                console.log('📊 Game result data (full object):', JSON.stringify(gameResultResponse.gameResult, null, 2));
                // J1's move should be stored as J2's opponentChoice
                j1Move = gameResultResponse.gameResult.opponentChoice;
                console.log('🎯 Found J1 move from API:', j1Move);
                console.log('🔍 All properties in gameResult:', Object.keys(gameResultResponse.gameResult));
                console.log('🔍 opponentChoice type:', typeof gameResultResponse.gameResult.opponentChoice);
              } else {
                console.warn('❌ API response unsuccessful or missing gameResult after all attempts:', JSON.stringify(gameResultResponse, null, 2));
              }
            } catch (error) {
              console.error('💥 Error fetching J1 move for result calculation:', error);
            }
          }
              } else {
                console.warn('❌ API response unsuccessful or missing gameResult:', JSON.stringify(gameResultResponse, null, 2));
              }
            } catch (error) {
              console.error('💥 Error fetching J1 move for result calculation:', error);
            }
          }
          
          if (j1Move) {
            console.log('✅ Have J1 move, calculating result...', { j1Move, gameState: gameState });
            const result = calculateGameResult(gameState, currentUserAddress, j1Move, true); // true = skip blockchain check in real-time mode
            console.log('🎲 calculateGameResult returned:', result);
            if (result) {
              console.log('🎉 Setting game result and showing modal:', result);
              setGameResult(result);
              setShowResultModal(true);
            } else {
              console.warn('⚠️ calculateGameResult returned null/undefined');
            }
          } else {
            console.warn('❌ Could not calculate result: J1 move not available');
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
  }, [realtimeGameEndDetected, gameState, currentUserAddress, isCurrentUserJ1, userMove, contractAddress, previousGameHasEnded]);

  // Helper functions to calculate results for each player
  const getJ1Result = (): 'win' | 'loss' | 'tie' | null => {
    // Debug logging
    console.log('getJ1Result - gameResult:', gameResult, 'gameHasEnded:', gameHasEnded, 'isCurrentUserJ1:', isCurrentUserJ1);
    
    if (!gameHasEnded) return null;
    
    // If we have gameResult from a recent action, use it
    if (gameResult) {
      if (gameResult.isTimeout) {
        return gameResult.timeoutWinner === 'j1' ? 'win' : 'loss';
      }
      
      // gameResult.result is from the current user's perspective
      // We need to determine J1's actual result
      let j1Result: 'win' | 'loss' | 'tie';
      if (isCurrentUserJ1) {
        // Current user IS J1, so use their result directly
        j1Result = gameResult.result;
      } else {
        // Current user is J2, so J1's result is the opposite of J2's result
        j1Result = gameResult.result === 'loss' ? 'win' :   // If J2 lost, J1 won
                    gameResult.result === 'win' ? 'loss' :   // If J2 won, J1 lost
                    'tie';
      }
      console.log('getJ1Result calculated:', j1Result);
      return j1Result;
    }
    
    // If game has ended but we don't have gameResult, we need to determine it
    // For now, return a placeholder - we'll implement proper logic later
    return 'win';
  };

  const getJ2Result = (): 'win' | 'loss' | 'tie' | null => {
    // Debug logging
    console.log('getJ2Result - gameResult:', gameResult, 'gameHasEnded:', gameHasEnded, 'isCurrentUserJ2:', isCurrentUserJ2);
    
    if (!gameHasEnded) return null;
    
    // If we have gameResult from a recent action, use it
    if (gameResult) {
      if (gameResult.isTimeout) {
        return gameResult.timeoutWinner === 'j2' ? 'win' : 'loss';
      }
      
      // gameResult.result is from the current user's perspective
      // We need to determine J2's actual result
      let j2Result: 'win' | 'loss' | 'tie';
      if (isCurrentUserJ2) {
        // Current user IS J2, so use their result directly
        j2Result = gameResult.result;
      } else {
        // Current user is J1, so J2's result is the opposite of J1's result
        j2Result = gameResult.result === 'loss' ? 'win' :   // If J1 lost, J2 won
                    gameResult.result === 'win' ? 'loss' :   // If J1 won, J2 lost
                    'tie';
      }
      console.log('getJ2Result calculated:', j2Result);
      return j2Result;
    }
    
    // If game has ended but we don't have gameResult, we need to determine it
    // For now, return a placeholder - we'll implement proper logic later
    return 'loss';
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
    <div className="min-h-screen bg-gray-100 pt-30 relative">
      <div className="container mx-auto px-4 max-w-4xl">
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
              hasSelectedMove={currentUserHasSelectedMove || userHasSelectedMove}
              selectedMove={
                userMove || (isCurrentUserJ2 && gameState.c2 > 0 ? NUMBER_TO_MOVE[gameState.c2] : undefined)
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
          result={gameResult.result}
          playerMove={gameResult.playerMove}
          opponentMove={gameResult.opponentMove}
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