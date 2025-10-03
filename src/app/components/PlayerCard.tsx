'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheck,
  faClock,
  faStopwatch,
  faCrown,
  faFlag,
  faHandshake,
} from '@fortawesome/free-solid-svg-icons';

interface PlayerCardProps {
  address: string;
  hasPlayed: boolean;
  isJ1: boolean;
  lastAction: string; // Timestamp from contract
  currentUserAddress?: string; // To determine if this card represents "You" or "Opponent"
  gameResult?: 'win' | 'loss' | 'tie' | null; // Game result for this player
  gameHasEnded?: boolean; // Whether the game has ended
  isSpectator?: boolean; // Whether the viewer is a spectator (not a player)
}

export function PlayerCard({
  address,
  hasPlayed,
  isJ1,
  lastAction,
  currentUserAddress,
  gameResult,
  gameHasEnded = false,
  isSpectator = false,
}: PlayerCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isTimeout, setIsTimeout] = useState(false);

  const isCurrentUser =
    currentUserAddress?.toLowerCase() === address.toLowerCase();
  const TIMEOUT_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
  // Note: The timeout button will have a 3-second safety buffer after the countdown
  // reaches zero to ensure blockchain timing alignment

  // Calculate time remaining and timeout status
  useEffect(() => {
    if (!lastAction || lastAction === '0') return;

    const updateTimer = () => {
      const lastActionTime = parseInt(lastAction) * 1000; // Convert to milliseconds
      const now = Date.now();
      const elapsed = now - lastActionTime;
      const remaining = TIMEOUT_DURATION - elapsed;

      if (remaining <= 0) {
        setIsTimeout(true);
        setTimeRemaining(0);
      } else {
        setIsTimeout(false);
        setTimeRemaining(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [lastAction]);

  // Format time remaining for display
  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Determine if we should show the timer (only show on the player who needs to act)
  // Show timer for any player who hasn't completed their current required action
  const shouldShowTimer =
    !gameHasEnded && !hasPlayed && lastAction && lastAction !== '0';

  // Get result indicator configuration
  const getResultIndicator = () => {
    if (!gameHasEnded || !gameResult) return null;

    switch (gameResult) {
      case 'win':
        return {
          icon: faCrown,
          bgColor: 'bg-yellow-500',
          label: 'Won',
        };
      case 'loss':
        return {
          icon: faFlag,
          bgColor: 'bg-red-500',
          label: 'Lost',
        };
      case 'tie':
        return {
          icon: faHandshake,
          bgColor: 'bg-blue-500',
          label: 'Tied',
        };
      default:
        return null;
    }
  };

  const resultIndicator = getResultIndicator();

  return (
    <div className="relative">
      {/* Timer or Result indicator in top-right corner */}
      {shouldShowTimer && (
        <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 z-10">
          {isTimeout ? (
            <div className="bg-red-500 text-white w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full shadow-lg border-2 border-white">
              <FontAwesomeIcon
                icon={faStopwatch}
                className="text-sm md:text-base"
              />
            </div>
          ) : (
            <div className="bg-blue-500 text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full text-xs md:text-sm font-mono shadow-lg border-2 border-white">
              {formatTime(timeRemaining)}
            </div>
          )}
        </div>
      )}

      {/* Game result indicator */}
      {resultIndicator && (
        <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 z-10">
          <div
            className={`${resultIndicator.bgColor} text-white w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full shadow-lg border-2 border-white`}
          >
            <FontAwesomeIcon
              icon={resultIndicator.icon}
              className="text-sm md:text-base"
            />
          </div>
        </div>
      )}

      {/* Main card container */}
      <div
        className={`relative w-36 h-36 md:w-48 md:h-48 rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${
          hasPlayed
            ? 'bg-green-500 border-2 border-green-600'
            : 'bg-gray-400 border-2 border-gray-500'
        }`}
      >
        {/* Ethereum icon background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <svg
            width="120"
            height="120"
            viewBox="0 0 256 417"
            className="text-white"
            fill="currentColor"
          >
            <path d="M127.961 0l-2.795 9.5v275.668l2.795 2.79 127.962-75.638z" />
            <path d="M127.962 0L0 212.32l127.962 75.639V154.158z" />
            <path d="M127.961 312.187l-1.575 1.92v98.199l1.575 4.6L256 236.587z" />
            <path d="M127.962 416.905v-104.718L0 236.587z" />
            <path d="M127.961 287.958l127.96-75.637-127.96-58.162z" />
            <path d="M0 212.32l127.961 75.638V154.159z" />
          </svg>
        </div>

        {/* Card content */}
        <div className="relative z-10 h-full flex flex-col justify-between p-3 md:p-4">
          {/* Player identifier */}
          <div className="text-center">
            <h3 className="text-white text-base md:text-lg font-bold mb-1">
              {isSpectator
                ? isJ1
                  ? 'Player 1'
                  : 'Player 2'
                : isCurrentUser
                  ? 'You'
                  : 'Opponent'}
            </h3>
            <p className="text-white/80 text-xs font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>

          {/* Status indicator */}
          <div className="text-center">
            <div className="text-white mb-1 md:mb-2">
              {hasPlayed ? (
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-lg md:text-xl"
                />
              ) : (
                <FontAwesomeIcon
                  icon={faClock}
                  className="text-lg md:text-xl"
                />
              )}
            </div>
            <p className="text-white text-xs md:text-sm font-medium">
              {hasPlayed
                ? 'Move Selected'
                : isJ1
                  ? 'Reveal move'
                  : 'Select a move'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
