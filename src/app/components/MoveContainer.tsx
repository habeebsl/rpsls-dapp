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
}

export function MoveContainer({
  hasSelectedMove,
  selectedMove,
  isJ1,
  gameContractAddress,
  currentUserAddress,
  onSelectionConfirmed,
}: MoveContainerProps) {
  const [currentSelection, setCurrentSelection] = useState<Move | null>(null);

  const handleMoveSelect = (move: Move) => {
    if (hasSelectedMove) return;
    setCurrentSelection(move);
  };

  const handleMoveUnselect = () => {
    if (hasSelectedMove) return;
    setCurrentSelection(null);
  };

  const handleMoveConfirm = async (move: Move) => {
    if (hasSelectedMove) return;

    // Only J2 should be making moves through this component
    // J1's move was already made during game creation
    await onSelectionConfirmed(move);

    setCurrentSelection(null);
  };

  // Use the selected move passed from parent
  const displaySelectedMove = selectedMove;

  return (
    <>
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {hasSelectedMove ? 'Your Move' : 'Select Your Move'}
          </h2>
          {!hasSelectedMove && (
            <p className="text-gray-600">
              Choose your move for Rock Paper Scissors Lizard Spock
            </p>
          )}
        </div>

        <div className="grid grid-cols-5 gap-4 justify-items-center">
          {ALL_MOVES.map(move => {
            const isThisSelected = hasSelectedMove
              ? move === displaySelectedMove
              : move === currentSelection;

            const isDisabled = hasSelectedMove && move !== displaySelectedMove;

            return (
              <MoveCard
                key={move}
                move={move}
                isSelected={isThisSelected}
                isLocked={hasSelectedMove}
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
