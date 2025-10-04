import { NUMBER_TO_MOVE, MOVE_TO_NUMBER } from '@/types';
import { ethers } from 'ethers';

export interface GameResultData {
    absoluteWinner: 'j1-wins' | 'j2-wins' | 'tie';
    j1Move: string;
    j2Move: string;
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
export function determineWinner(
    move1: number,
    move2: number
): 'j1-wins' | 'j2-wins' | 'tie' {
    // CRITICAL: Convert to regular numbers to avoid BigInt comparison issues
    const m1 = Number(move1);
    const m2 = Number(move2);

    if (m1 === m2) {
        return 'tie';
    }

    const move1Beats =
        WINNING_COMBINATIONS[m1 as keyof typeof WINNING_COMBINATIONS];

    if (move1Beats.includes(m2)) {
        return 'j1-wins';
    } else {
        return 'j2-wins';
    }
}

/**
 * Calculate game result with absolute winner (not from any player's perspective)
 * @param gameState - Current blockchain game state
 * @param j1Move - J1's revealed move (from API or user data)
 * @param isRealtimeContext - If true, skip blockchain state check (for real-time notifications)
 * @returns GameResultData with absolute winner and both players' moves
 */
export function calculateGameResult(
    gameState: any,
    j1Move: string | null,
    isRealtimeContext: boolean = false
): GameResultData | null {
    // Ensure game has ended (stake is 0) - skip check in real-time context
    if (!isRealtimeContext && gameState.stake !== '0') {
        return null;
    }

    // Get move numbers
    const j1MoveNumber = j1Move
        ? MOVE_TO_NUMBER[j1Move as keyof typeof MOVE_TO_NUMBER]
        : null;
    const j2MoveNumber = gameState.c2;

    if (!j1MoveNumber || !j2MoveNumber) {
        return null;
    }

    // Determine absolute winner (no perspective)
    const absoluteWinner = determineWinner(j1MoveNumber, j2MoveNumber);

    let formattedStake: string;
    if (gameState.originalStake) {
        // If originalStake exists, it's from Redis and already formatted as ETH string
        formattedStake = gameState.originalStake;
    } else {
        // Otherwise format from blockchain wei value
        formattedStake = ethers.formatEther(gameState.stake || '0');
    }

    return {
        absoluteWinner,
        j1Move: j1Move || 'Unknown',
        j2Move: NUMBER_TO_MOVE[j2MoveNumber] || 'Unknown',
        stakeAmount: formattedStake,
        isTimeout: false, // Real-time results are never timeouts
    };
}

/**
 * Get game result from a specific player's perspective
 * @param absoluteWinner - The absolute winner ('j1-wins', 'j2-wins', or 'tie')
 * @param isJ1 - Whether the current user is J1
 * @param isTimeout - Whether the game ended via timeout
 * @param timeoutWinner - Who won via timeout (if applicable)
 * @returns 'win', 'loss', or 'tie' from the player's perspective
 */
export function getUserPerspectiveResult(
    absoluteWinner: 'j1-wins' | 'j2-wins' | 'tie',
    isJ1: boolean,
    isTimeout: boolean = false,
    timeoutWinner?: 'j1' | 'j2'
): 'win' | 'loss' | 'tie' {
    let result: 'win' | 'loss' | 'tie';

    // Handle timeout cases
    if (isTimeout && timeoutWinner) {
        if (
            (timeoutWinner === 'j1' && isJ1) ||
            (timeoutWinner === 'j2' && !isJ1)
        ) {
            result = 'win';
        } else {
            result = 'loss';
        }
    }
    // Handle tie
    else if (absoluteWinner === 'tie') {
        result = 'tie';
    }
    // Handle normal win/loss
    else if (
        (absoluteWinner === 'j1-wins' && isJ1) ||
        (absoluteWinner === 'j2-wins' && !isJ1)
    ) {
        result = 'win';
    } else {
        result = 'loss';
    }

    return result;
}
