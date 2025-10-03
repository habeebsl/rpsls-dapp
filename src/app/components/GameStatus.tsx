'use client';

import { PlayerCard } from './PlayerCard';
import { GameState } from '@/types';

interface GameStatusProps {
  gameState: GameState;
  j1HasPlayed: boolean;
  j2HasPlayed: boolean;
  gameHasEnded: boolean;
  currentUserAddress?: string;
  j1Result?: 'win' | 'loss' | 'tie' | null;
  j2Result?: 'win' | 'loss' | 'tie' | null;
}

export function GameStatus({
  gameState,
  j1HasPlayed,
  j2HasPlayed,
  gameHasEnded,
  currentUserAddress,
  j1Result,
  j2Result,
}: GameStatusProps) {
  return (
    <div className="flex justify-center items-center gap-3 md:gap-8 mb-6 md:mb-8">
      {/* Player 1 Card */}
      <PlayerCard
        address={gameState.j1}
        hasPlayed={gameHasEnded || !j2HasPlayed} // true until J2 plays, then false until game ends (J1 reveals)
        isJ1={true}
        lastAction={gameState.lastAction}
        currentUserAddress={currentUserAddress}
        gameResult={j1Result}
        gameHasEnded={gameHasEnded}
      />

      {/* VS Text */}
      <div className="text-2xl md:text-4xl font-bold text-gray-400">VS</div>

      {/* Player 2 Card */}
      <PlayerCard
        address={gameState.j2}
        hasPlayed={j2HasPlayed}
        isJ1={false}
        lastAction={gameState.lastAction}
        currentUserAddress={currentUserAddress}
        gameResult={j2Result}
        gameHasEnded={gameHasEnded}
      />
    </div>
  );
}
