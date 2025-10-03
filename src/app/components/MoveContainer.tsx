'use client';

import { useState } from 'react';
import { MoveCard } from './MoveCard';
import { Move } from '@/types';

const ALL_MOVES: Move[] = ['Rock', 'Paper', 'Scissors', 'Lizard', 'Spock'];

interface MoveContainerProps {
  hasSelectedMove: boolean;
  selectedMove?: Move;
  isJ1: boolean;
  gameContractAddress: string;
  currentUserAddress?: string;
  onSelectionConfirmed: (move: Move) => Promise<void>;
  gameHasEnded?: boolean;
}

export function MoveContainer({
  hasSelectedMove,
  selectedMove,
  isJ1,
  gameContractAddress,
  currentUserAddress,
  onSelectionConfirmed,
  gameHasEnded = false,
}: MoveContainerProps) {
  const [currentSelection, setCurrentSelection] = useState<Move | null>(null);

  const handleMoveSelect = (move: Move) => {
    if (hasSelectedMove || gameHasEnded) return;
    setCurrentSelection(move);
  };

  const handleMoveUnselect = () => {
    if (hasSelectedMove || gameHasEnded) return;
    setCurrentSelection(null);
  };

  const handleMoveConfirm = async (move: Move) => {
    if (hasSelectedMove || gameHasEnded) return;

    // Only J2 should be making moves through this component
    // J1's move was already made during game creation
    await onSelectionConfirmed(move);

    setCurrentSelection(null);
  };

  // Use the selected move passed from parent
  const displaySelectedMove = selectedMove;

  return (
    <>
      <div
        className={`w-full max-w-4xl mx-auto ${gameHasEnded ? 'pointer-events-none' : ''}`}
      >
        <div className="mb-4 md:mb-6 text-center">
          <h2
            className={`text-xl md:text-2xl font-bold mb-2 ${gameHasEnded ? 'text-gray-600' : 'text-gray-800'}`}
          >
            {gameHasEnded
              ? hasSelectedMove
                ? 'Your Move'
                : 'Game Has Ended'
              : hasSelectedMove
                ? 'Your Move'
                : 'Select Your Move'}
          </h2>
          {!hasSelectedMove && !gameHasEnded && (
            <p className="text-sm md:text-base text-gray-600">
              Choose your move for Rock Paper Scissors Lizard Spock
            </p>
          )}
          {gameHasEnded && !hasSelectedMove && (
            <p className="text-sm md:text-base text-gray-600">
              Move selection is no longer available
            </p>
          )}
          {gameHasEnded && hasSelectedMove && (
            <p className="text-sm md:text-base text-gray-600">
              Game has ended - your move is locked in
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 justify-items-center">
          {ALL_MOVES.map(move => {
            // Check if this move is selected (either from confirmed selection or current selection)
            const isThisSelected =
              hasSelectedMove || displaySelectedMove
                ? move === displaySelectedMove
                : move === currentSelection;

            // Disable logic: disable non-selected moves if a move is selected or game has ended
            // When game has ended, disable non-selected moves but keep selected move visible
            const isDisabled =
              !!(hasSelectedMove || gameHasEnded || displaySelectedMove) &&
              move !== displaySelectedMove;

            return (
              <MoveCard
                key={move}
                move={move}
                isSelected={isThisSelected}
                isLocked={
                  hasSelectedMove || gameHasEnded || !!displaySelectedMove
                }
                isDisabled={isDisabled}
                onSelect={handleMoveSelect}
                onUnselect={handleMoveUnselect}
                onConfirm={handleMoveConfirm}
              />
            );
          })}
        </div>

        {hasSelectedMove && displaySelectedMove && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
              ✅ You selected: <strong>{displaySelectedMove}</strong>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
