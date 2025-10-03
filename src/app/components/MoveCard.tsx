'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Move } from '@/types';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { getMoveIcon } from '@/lib/moves';

interface MoveCardProps {
  move: Move;
  isSelected: boolean;
  isLocked: boolean;
  isDisabled: boolean;
  onSelect: (move: Move) => void;
  onUnselect: () => void;
  onConfirm: (move: Move) => Promise<void>;
}

export function MoveCard({
  move,
  isSelected,
  isLocked,
  isDisabled,
  onSelect,
  onUnselect,
  onConfirm,
}: MoveCardProps) {
  const { openConfirmation, closeConfirmation } = useConfirmationStore();

  const handleCardClick = () => {
    if (isDisabled || isLocked) return;
    if (!isSelected) {
      onSelect(move);
    }
  };

  const handleConfirmClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisabled || isLocked) return;

    // Open global confirmation modal
    openConfirmation({
      move,
      title: 'Confirm Your Move',
      message: `Are you sure you want to select ${move}? This action cannot be undone once confirmed.`,
      confirmText: `Confirm ${move}`,
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await onConfirm(move);
          // Close modal only after the move selection is completely done
          closeConfirmation();
        } catch (error) {
          // Don't close modal on error - let user try again or cancel
          console.error('Move confirmation failed:', error);
          throw error; // Re-throw so the confirmation store can handle loading state
        }
      },
    });
  };

  const handleUnselectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDisabled || isLocked) return;
    onUnselect();
  };

  return (
    <>
      <div
        className={`
          relative w-28 h-28 sm:w-32 sm:h-32 rounded-lg shadow-lg cursor-pointer transition-all duration-300
          ${isDisabled || isLocked ? 'cursor-not-allowed' : 'hover:shadow-xl'}
          ${isSelected && !isLocked ? 'ring-4 ring-blue-500 bg-blue-50' : 'bg-white'}
          ${isLocked && isSelected ? 'bg-green-50 ring-4 ring-green-500' : ''}
          ${isDisabled && !isSelected ? 'bg-gray-200 opacity-50' : ''}
        `}
        onClick={handleCardClick}
      >
        {/* Selection Controls - Only show when selected and not locked */}
        {isSelected && !isLocked && !isDisabled && (
          <>
            {/* Green Checkmark - Top Left */}
            <button
              className="absolute -top-2 -left-2 w-8 h-8 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-colors z-10 flex items-center justify-center"
              onClick={handleConfirmClick}
            >
              <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
            </button>

            {/* Red X - Top Right */}
            <button
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors z-10 flex items-center justify-center"
              onClick={handleUnselectClick}
            >
              <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Locked Indicator - Only show when locked and selected */}
        {isLocked && isSelected && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 text-white rounded-full shadow-lg flex items-center justify-center z-10">
            <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
          </div>
        )}

        {/* Card Content */}
        <div className="h-full flex flex-col items-center justify-center p-2 sm:p-4">
          {/* Move Icon */}
          <div
            className={`
            text-3xl sm:text-4xl mb-2 sm:mb-3 transition-colors
            ${isSelected && !isLocked ? 'text-blue-600' : ''}
            ${isLocked && isSelected ? 'text-green-600' : ''}
            ${isDisabled && !isSelected ? 'text-gray-400' : 'text-gray-700'}
          `}
          >
            <FontAwesomeIcon icon={getMoveIcon(move)} />
          </div>

          {/* Move Name */}
          <div
            className={`
            text-xs sm:text-sm font-medium text-center transition-colors
            ${isSelected && !isLocked ? 'text-blue-800' : ''}
            ${isLocked && isSelected ? 'text-green-800' : ''}
            ${isDisabled && !isSelected ? 'text-gray-400' : 'text-gray-700'}
          `}
          >
            {move}
          </div>
        </div>
      </div>
    </>
  );
}
