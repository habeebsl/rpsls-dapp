import { NUMBER_TO_MOVE, MOVE_TO_NUMBER } from '@/types';
import { ethers } from 'ethers';

export interface GameResultData {
  result: 'win' | 'loss' | 'tie';
  playerMove: string;
  opponentMove: string;
  stakeAmount: string;
  isTimeout: boolean;
  timeoutWinner?: 'j1' | 'j2';
}

// Rock Paper Scissors Lizard Spock rules
// 1=Rock, 2=Paper, 3=Scissors, 4=Lizard, 5=Spock
const WINNING_COMBINATIONS = {
  1: [4, 3], // Rock beats Lizard and Scissors
  2: [1, 5], // Paper beats Rock and Spock
  3: [2, 4], // Scissors beats Paper and Lizard
  4: [5, 2], // Lizard beats Spock and Paper
  5: [3, 1], // Spock beats Scissors and Rock
};

/**
 * Determine the winner of Rock Paper Scissors Lizard Spock
 * @param move1 - First player's move (1-5)
 * @param move2 - Second player's move (1-5)
 * @returns 'j1-wins', 'j2-wins', or 'tie'
 */
export function determineWinner(move1: number, move2: number): 'j1-wins' | 'j2-wins' | 'tie' {
  if (move1 === move2) return 'tie';
  
  const move1Beats = WINNING_COMBINATIONS[move1 as keyof typeof WINNING_COMBINATIONS];
  if (move1Beats.includes(move2)) {
    return 'j1-wins';
  } else {
    return 'j2-wins';
  }
}

/**
 * Calculate game result for a specific player when game ends via real-time
 * @param gameState - Current blockchain game state
 * @param playerAddress - Address of the player to calculate result for
 * @param j1Move - J1's revealed move (from API or user data)
 * @param isRealtimeContext - If true, skip blockchain state check (for real-time notifications)
 * @returns GameResultData for the specified player
 */
export function calculateGameResult(
  gameState: any,
  playerAddress: string,
  j1Move: string | null,
  isRealtimeContext: boolean = false
): GameResultData | null {
  // Ensure game has ended (stake is 0) - skip check in real-time context
  if (!isRealtimeContext && gameState.stake !== '0') {
    console.warn('Game has not ended yet, cannot calculate result');
    return null;
  }

  // Get move numbers
  const j1MoveNumber = j1Move ? MOVE_TO_NUMBER[j1Move as keyof typeof MOVE_TO_NUMBER] : null;
  const j2MoveNumber = gameState.c2;

  if (!j1MoveNumber || !j2MoveNumber) {
    console.warn('Missing move data for result calculation');
    return null;
  }

  // Determine overall winner
  const winner = determineWinner(j1MoveNumber, j2MoveNumber);
  
  // Calculate result from this player's perspective
  const isJ1 = playerAddress.toLowerCase() === gameState.j1.toLowerCase();
  const isJ2 = playerAddress.toLowerCase() === gameState.j2.toLowerCase();

  let result: 'win' | 'loss' | 'tie';
  if (winner === 'tie') {
    result = 'tie';
  } else if ((winner === 'j1-wins' && isJ1) || (winner === 'j2-wins' && isJ2)) {
    result = 'win';
  } else {
    result = 'loss';
  }

  // Get move names
  const playerMove = isJ1 ? j1Move : NUMBER_TO_MOVE[j2MoveNumber];
  const opponentMove = isJ1 ? NUMBER_TO_MOVE[j2MoveNumber] : j1Move;

  return {
    result,
    playerMove: playerMove || 'Unknown',
    opponentMove: opponentMove || 'Unknown',
    stakeAmount: ethers.formatEther(gameState.originalStake || gameState.stake || '0'),
    isTimeout: false, // Real-time results are never timeouts
  };
}