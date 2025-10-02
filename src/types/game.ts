// Game-related types
export type Move = 'Rock' | 'Paper' | 'Scissors' | 'Lizard' | 'Spock';

export interface GameState {
  j1: string;
  j2: string;
  stake: string;
  c2: number;
  c1Hash: string;
  lastAction: string;
  hasPlayer2Played: boolean;
}

export interface GameResult {
  id?: string;
  stake: string;
  contractAddress: string;
  status: 'pending' | 'completed' | 'timeout';
  salt: string;
  type?: 'win' | 'loss' | 'tie';
  opponent?: string;
  playerChoice?: string;
  opponentChoice?: string;
  createdAt?: string;
  completedAt?: string;
}

// Contract interaction types
export interface CreateGameResult {
  contractAddress: string;
  salt: string;
}

// Move to number mapping (as used in smart contract)
export const MOVE_TO_NUMBER: Record<Move, number> = {
  Rock: 1,
  Paper: 2,
  Scissors: 3,
  Lizard: 4,
  Spock: 5,
};

// Number to move mapping
export const NUMBER_TO_MOVE: Record<number, Move> = {
  1: 'Rock',
  2: 'Paper',
  3: 'Scissors',
  4: 'Lizard',
  5: 'Spock',
};