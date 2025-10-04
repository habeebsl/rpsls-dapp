'use client';

import { PrimaryButton } from './PrimaryButton';

interface GameActionButtonsProps {
  isCurrentUserJ1: boolean;
  j2HasPlayed: boolean;
  gameHasEnded: boolean;
  timeoutEnabled: boolean;
  onRevealMove: () => void;
  onTimeout: () => void;
}

export function GameActionButtons({
  isCurrentUserJ1,
  j2HasPlayed,
  gameHasEnded,
  timeoutEnabled,
  onRevealMove,
  onTimeout,
}: GameActionButtonsProps) {
  const showRevealButton = isCurrentUserJ1 && !gameHasEnded;
  const showTimeoutButton = !gameHasEnded;
  const shouldShowBar = showRevealButton || showTimeoutButton;
  const isRevealEnabled = j2HasPlayed && !gameHasEnded;
  const isTimeoutEnabled = timeoutEnabled && !gameHasEnded;

  if (!shouldShowBar) return null;

  return (
    <>
      <div className="hidden lg:flex lg:absolute lg:top-30 lg:right-10 lg:z-10 lg:flex-col lg:gap-8">
        {showRevealButton && (
          <PrimaryButton
            text="Reveal Move"
            backgroundColor={isRevealEnabled ? 'bg-blue-500' : 'bg-gray-400'}
            hoverBackgroundColor={
              isRevealEnabled ? 'hover:bg-blue-600' : 'hover:bg-gray-400'
            }
            shadowColor={isRevealEnabled ? 'bg-blue-700' : 'bg-gray-500'}
            className={`text-sm font-medium ${isRevealEnabled ? '' : 'cursor-not-allowed'}`}
            onClick={isRevealEnabled ? onRevealMove : undefined}
          />
        )}

        {showTimeoutButton && (
          <PrimaryButton
            text="Call Opponent Timeout"
            height={45}
            backgroundColor={isTimeoutEnabled ? 'bg-red-500' : 'bg-gray-400'}
            hoverBackgroundColor={
              isTimeoutEnabled ? 'hover:bg-red-600' : 'hover:bg-gray-400'
            }
            shadowColor={isTimeoutEnabled ? 'bg-red-700' : 'bg-gray-500'}
            className={`text-sm font-medium ${isTimeoutEnabled ? '' : 'cursor-not-allowed'}`}
            onClick={isTimeoutEnabled ? onTimeout : undefined}
          />
        )}
      </div>

      <div
        className="
        lg:hidden
        fixed bottom-0 left-0 right-0 z-50
        px-4 pt-4 pb-4
        bg-gray-100
        border-t-2 border-gray-300
      "
      >
        <div
          className={`
          flex gap-3 max-w-md mx-auto
          ${showRevealButton && showTimeoutButton ? 'flex-col min-[400px]:flex-row' : 'flex-col'}
        `}
        >
          {showRevealButton && (
            <PrimaryButton
              text="Reveal Move"
              height={45}
              width={undefined}
              backgroundColor={isRevealEnabled ? 'bg-blue-500' : 'bg-gray-400'}
              hoverBackgroundColor={
                isRevealEnabled ? 'hover:bg-blue-600' : 'hover:bg-gray-400'
              }
              shadowColor={isRevealEnabled ? 'bg-blue-700' : 'bg-gray-500'}
              className={`text-sm font-medium flex-1 w-full ${isRevealEnabled ? '' : 'cursor-not-allowed'}`}
              onClick={isRevealEnabled ? onRevealMove : undefined}
            />
          )}

          {showTimeoutButton && (
            <PrimaryButton
              text="Call Opponent Timeout"
              height={45}
              width={undefined}
              backgroundColor={isTimeoutEnabled ? 'bg-red-500' : 'bg-gray-400'}
              hoverBackgroundColor={
                isTimeoutEnabled ? 'hover:bg-red-600' : 'hover:bg-gray-400'
              }
              shadowColor={isTimeoutEnabled ? 'bg-red-700' : 'bg-gray-500'}
              className={`text-sm font-medium flex-1 w-full ${isTimeoutEnabled ? '' : 'cursor-not-allowed'}`}
              onClick={isTimeoutEnabled ? onTimeout : undefined}
            />
          )}
        </div>
      </div>
    </>
  );
}
