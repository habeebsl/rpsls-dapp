import { ethers } from 'ethers';
import { Move, MOVE_TO_NUMBER } from '@/types';
/**
 * Generate a commitment hash for J1's move
 * @param move The move to commit
 * @param nonce Random nonce for the commitment
 * @returns The commitment hash
 */
export function generateCommitment(move: Move, nonce: string): string {
    const moveNumber = MOVE_TO_NUMBER[move];
    const encoded = ethers.solidityPacked(
        ['uint8', 'uint256'],
        [moveNumber, nonce]
    );
    return ethers.keccak256(encoded);
}

/**
 * Try to recover a move from a nonce and commitment
 * @param nonce The nonce to test
 * @param commitment The commitment hash to match against
 * @returns The recovered move or null if no match
 */
export function recoverMoveFromNonce(
    nonce: string,
    commitment: string
): Move | null {
    const allMoves: Move[] = ['Rock', 'Paper', 'Scissors', 'Lizard', 'Spock'];

    for (const move of allMoves) {
        const testCommitment = generateCommitment(move, nonce);
        if (testCommitment.toLowerCase() === commitment.toLowerCase()) {
            return move;
        }
    }

    return null;
}

/**
 * Store J1's move and nonce in localStorage
 * @param gameContractAddress The game contract address
 * @param move The selected move
 * @param nonce The generated nonce
 */
export function storeJ1Move(
    gameContractAddress: string,
    move: Move,
    nonce: string
): void {
    localStorage.setItem(`j1Move_${gameContractAddress}`, move);
    localStorage.setItem(`j1Nonce_${gameContractAddress}`, nonce);
}

/**
 * Retrieve J1's stored move from localStorage
 * @param gameContractAddress The game contract address
 * @returns The stored move or null if not found
 */
export function getStoredJ1Move(gameContractAddress: string): Move | null {
    const storedMove = localStorage.getItem(
        `j1Move_${gameContractAddress}`
    ) as Move;
    if (storedMove && Object.keys(MOVE_TO_NUMBER).includes(storedMove)) {
        return storedMove;
    }
    return null;
}

/**
 * Retrieve J1's stored nonce from localStorage
 * @param gameContractAddress The game contract address
 * @returns The stored nonce or null if not found
 */
export function getStoredJ1Nonce(gameContractAddress: string): string | null {
    return localStorage.getItem(`j1Nonce_${gameContractAddress}`);
}

/**
 * Clear stored J1 data for a game
 * @param gameContractAddress The game contract address
 */
export function clearStoredJ1Data(gameContractAddress: string): void {
    localStorage.removeItem(`j1Move_${gameContractAddress}`);
    localStorage.removeItem(`j1Nonce_${gameContractAddress}`);
}

/**
 * Generate a random nonce for commitments
 * @returns A random nonce string
 */
export function generateNonce(): string {
    return ethers.hexlify(ethers.randomBytes(32));
}

/**
 * Get FontAwesome icon for a move
 * @param move The move to get icon for
 * @returns FontAwesome icon or null if no icon available
 */
export function getMoveIcon(move: string) {
    // Import icons dynamically to avoid circular dependencies
    const { faHandRock, faHandPaper, faHandScissors, faHandLizard, faHandSpock } = require('@fortawesome/free-solid-svg-icons');
    
    switch (move) {
        case 'Rock': return faHandRock;
        case 'Paper': return faHandPaper;
        case 'Scissors': return faHandScissors;
        case 'Lizard': return faHandLizard;
        case 'Spock': return faHandSpock;
        default: return null;
    }
}

/**
 * Get emoji for a move
 * @param move The move to get emoji for
 * @returns Emoji string
 */
export function getMoveEmoji(move: string): string {
    switch (move) {
        case 'Rock': return '🪨';
        case 'Paper': return '📄';
        case 'Scissors': return '✂️';
        case 'Lizard': return '🦎';
        case 'Spock': return '🖖';
        default: return '❓';
    }
}
