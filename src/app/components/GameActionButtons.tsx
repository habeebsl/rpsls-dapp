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
  return (
    <div className="absolute top-30 right-10 z-10 flex flex-col gap-8">
      {/* Reveal Move Button - Only show for J1 */}
      {isCurrentUserJ1 && (
        <PrimaryButton
          text="Reveal Move"
          backgroundColor={j2HasPlayed && !gameHasEnded ? "bg-blue-500" : "bg-gray-400"}
          hoverBackgroundColor={j2HasPlayed && !gameHasEnded ? "hover:bg-blue-600" : "hover:bg-gray-400"}
          shadowColor={j2HasPlayed && !gameHasEnded ? "bg-blue-700" : "bg-gray-500"}
          className={`text-sm font-medium ${j2HasPlayed && !gameHasEnded ? "" : "cursor-not-allowed"}`}
          onClick={j2HasPlayed && !gameHasEnded ? onRevealMove : undefined}
        />
      )}
      
      <PrimaryButton
        text="Call Opponent Timeout"
        height={45}
        backgroundColor={timeoutEnabled && !gameHasEnded ? "bg-red-500" : "bg-gray-400"}
        hoverBackgroundColor={timeoutEnabled && !gameHasEnded ? "hover:bg-red-600" : "hover:bg-gray-400"}
        shadowColor={timeoutEnabled && !gameHasEnded ? "bg-red-700" : "bg-gray-500"}
        className={`text-sm font-medium ${timeoutEnabled && !gameHasEnded ? "" : "cursor-not-allowed"}`}
        onClick={timeoutEnabled && !gameHasEnded ? onTimeout : undefined}
      />
    </div>
  );
}