'use client';

import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faStopwatch } from '@fortawesome/free-solid-svg-icons';
import { PrimaryButton } from './PrimaryButton';
import { getMoveEmoji, getMoveIcon } from '@/lib/moves';
import { getUserPerspectiveResult } from '@/utils/gameResults';

interface GameResultModalProps {
  isOpen: boolean;
  absoluteWinner: 'j1-wins' | 'j2-wins' | 'tie';
  j1Move: string;
  j2Move: string;
  stakeAmount: string; // in ETH (e.g., "0.001")
  isTimeout?: boolean;
  timeoutWinner?: 'j1' | 'j2';
  isCurrentUserJ1?: boolean;
  isSpectator?: boolean;
  onClose: () => void;
}

export function GameResultModal({
  isOpen,
  absoluteWinner,
  j1Move,
  j2Move,
  stakeAmount,
  isTimeout = false,
  timeoutWinner,
  isCurrentUserJ1,
  isSpectator = false,
  onClose,
}: GameResultModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  // Calculate result from current user's perspective
  const result = getUserPerspectiveResult(
    absoluteWinner,
    isCurrentUserJ1 || false,
    isTimeout,
    timeoutWinner
  );

  // Get player's move and opponent's move
  // For spectators, always show j1Move as "Player 1" and j2Move as "Player 2"
  // For players, show based on their perspective
  const playerMove = isSpectator ? j1Move : isCurrentUserJ1 ? j1Move : j2Move;
  const opponentMove = isSpectator ? j2Move : isCurrentUserJ1 ? j2Move : j1Move;

  // Calculate stake winnings
  const calculateWinnings = (): {
    amount: string;
    color: string;
    sign: string;
    label: string;
  } => {
    const stake = parseFloat(stakeAmount);

    // Format amount to remove unnecessary trailing zeros
    const formatAmount = (amount: number): string => {
      return amount === 0 ? '0' : amount.toString();
    };

    // For spectators, show neutral stake information
    if (isSpectator) {
      if (absoluteWinner === 'tie') {
        return {
          amount: formatAmount(stake * 2), // Total stake (both players)
          color: 'text-gray-600',
          sign: '',
          label: 'Total Stake',
        };
      }
      // Show winner's earnings
      return {
        amount: formatAmount(stake * 2), // Winner gets both stakes
        color: 'text-blue-600',
        sign: '',
        label: `${absoluteWinner === 'j1-wins' ? 'Player 1' : 'Player 2'} Won`,
      };
    }

    // For players, show personalized winnings/losses
    if (isTimeout) {
      if (result === 'win') {
        // Winner by timeout
        if (isCurrentUserJ1 && timeoutWinner === 'j1') {
          // J1 wins by J2 timeout - J1 gets nothing (J2 never staked)
          return {
            amount: '0',
            color: 'text-gray-600',
            sign: '+',
            label: 'Your Winnings',
          };
        } else if (!isCurrentUserJ1 && timeoutWinner === 'j2') {
          // J2 wins by J1 timeout - J2 gets J1's stake
          return {
            amount: formatAmount(stake),
            color: 'text-green-600',
            sign: '+',
            label: 'Your Winnings',
          };
        }
      }
      // Loser by timeout - check if they actually staked
      if (result === 'loss') {
        // If J2 lost by timeout (J1 called timeout), J2 never staked, so they lose nothing
        if (!isCurrentUserJ1 && timeoutWinner === 'j1') {
          return {
            amount: '0',
            color: 'text-gray-600',
            sign: '-',
            label: 'Your Loss',
          };
        }
        // If J1 lost by timeout (J2 called timeout), J1 loses their stake
        return {
          amount: formatAmount(stake),
          color: 'text-red-600',
          sign: '-',
          label: 'Your Loss',
        };
      }
    } else {
      // Regular game results
      if (result === 'win') {
        // Winner gets opponent's stake (net gain)
        return {
          amount: formatAmount(stake),
          color: 'text-green-600',
          sign: '+',
          label: 'Your Winnings',
        };
      } else if (result === 'loss') {
        // Loser loses their stake
        return {
          amount: formatAmount(stake),
          color: 'text-red-600',
          sign: '-',
          label: 'Your Loss',
        };
      }
    }

    // Tie - no money changes hands
    return {
      amount: '0',
      color: 'text-gray-600',
      sign: '+',
      label: 'Your Winnings',
    };
  };

  const winnings = calculateWinnings();

  // Get title text
  const getTitleText = (): string => {
    // Spectator view - show absolute winner
    if (isSpectator) {
      if (absoluteWinner === 'tie') return 'They Tied';
      if (absoluteWinner === 'j1-wins') {
        return isTimeout ? 'Player 1 Won by Timeout!' : 'Player 1 Won!';
      }
      return isTimeout ? 'Player 2 Won by Timeout!' : 'Player 2 Won!';
    }

    // Player view - show from their perspective
    if (isTimeout) {
      if (result === 'win') return 'You Won by Timeout!';
      if (result === 'loss') return 'You Lost by Timeout';
    }

    if (result === 'win') return 'You Won!';
    if (result === 'loss') return 'You Lost';
    return 'You Tied';
  };

  // Get subtitle text
  const getSubtitle = (): string => {
    // Spectator view - neutral subtitles
    if (isSpectator) {
      if (isTimeout) {
        if (absoluteWinner === 'j1-wins')
          return 'Player 2 failed to act in time';
        if (absoluteWinner === 'j2-wins')
          return 'Player 1 failed to act in time';
      }
      if (absoluteWinner === 'tie') return 'Great minds think alike!';
      return 'Game completed';
    }

    // Player view - personalized subtitles
    if (isTimeout) {
      if (result === 'win') return 'Your opponent failed to act in time';
      return 'You failed to act in time';
    }

    if (result === 'tie') return 'Great minds think alike!';
    if (result === 'win') return 'Excellent choice!';
    return 'Better luck next time!';
  };

  const handleBackToDashboard = () => {
    router.push('/');
  };

  // Get title color
  const getTitleColor = () => {
    if (result === 'win') return 'text-green-600';
    if (result === 'loss') return 'text-red-600';
    return 'text-blue-600';
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-black opacity-30" onClick={onClose} />

      {/* Modal Content - Much smaller and cleaner */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
        >
          <FontAwesomeIcon icon={faTimes} size="lg" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className={`text-2xl font-bold mb-2 ${getTitleColor()}`}>
            {getTitleText()}
          </h2>
          <p className="text-gray-600 text-sm">{getSubtitle()}</p>
        </div>

        {/* Move Battle Display - Always show, use ?? for unknown moves */}
        <div className="mb-6">
          <div className="flex items-center justify-center gap-4">
            {/* First Player's Move */}
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 mb-2 ${
                  isSpectator
                    ? // Spectator: Color based on absolute winner
                      absoluteWinner === 'j1-wins'
                      ? 'bg-green-50 border-green-200'
                      : absoluteWinner === 'j2-wins'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    : // Player: Color based on their result
                      result === 'win'
                      ? 'bg-blue-50 border-blue-200'
                      : result === 'loss'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                }`}
              >
                {playerMove && playerMove !== 'Unknown' ? (
                  <FontAwesomeIcon
                    icon={getMoveIcon(playerMove)}
                    className={`text-lg ${
                      isSpectator
                        ? // Spectator: Color based on absolute winner
                          absoluteWinner === 'j1-wins'
                          ? 'text-green-600'
                          : absoluteWinner === 'j2-wins'
                            ? 'text-red-600'
                            : 'text-gray-600'
                        : // Player: Color based on their result
                          result === 'win'
                          ? 'text-blue-600'
                          : result === 'loss'
                            ? 'text-red-600'
                            : 'text-gray-600'
                    }`}
                  />
                ) : (
                  <span className="text-2xl text-gray-400">??</span>
                )}
              </div>
              <span className="text-xs font-medium text-gray-700">
                {isSpectator ? 'Player 1' : 'You'}
              </span>
              <span className="text-xs text-gray-500">
                {playerMove && playerMove !== 'Unknown'
                  ? playerMove
                  : 'Unknown'}
              </span>
            </div>

            {/* VS */}
            <div className="text-lg font-bold text-gray-400">VS</div>

            {/* Second Player's Move */}
            <div className="flex flex-col items-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 mb-2 ${
                  isSpectator
                    ? // Spectator: Color based on absolute winner
                      absoluteWinner === 'j2-wins'
                      ? 'bg-green-50 border-green-200'
                      : absoluteWinner === 'j1-wins'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    : // Player: Color based on their result (inverted)
                      result === 'loss'
                      ? 'bg-blue-50 border-blue-200'
                      : result === 'win'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                }`}
              >
                {opponentMove && opponentMove !== 'Unknown' ? (
                  <FontAwesomeIcon
                    icon={getMoveIcon(opponentMove)}
                    className={`text-lg ${
                      isSpectator
                        ? // Spectator: Color based on absolute winner
                          absoluteWinner === 'j2-wins'
                          ? 'text-green-600'
                          : absoluteWinner === 'j1-wins'
                            ? 'text-red-600'
                            : 'text-gray-600'
                        : // Player: Color based on their result (inverted)
                          result === 'loss'
                          ? 'text-blue-600'
                          : result === 'win'
                            ? 'text-red-600'
                            : 'text-gray-600'
                    }`}
                  />
                ) : (
                  <span className="text-2xl text-gray-400">??</span>
                )}
              </div>
              <span className="text-xs font-medium text-gray-700">
                {isSpectator ? 'Player 2' : 'Opponent'}
              </span>
              <span className="text-xs text-gray-500">
                {opponentMove && opponentMove !== 'Unknown'
                  ? opponentMove
                  : 'Unknown'}
              </span>
            </div>
          </div>

          {/* Timeout indicator below moves */}
          {isTimeout && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <FontAwesomeIcon icon={faStopwatch} className="text-orange-600" />
              <p className="text-xs text-gray-600">Game ended due to timeout</p>
            </div>
          )}
        </div>

        {/* Winnings */}
        <div className="text-center mb-6">
          <div className="text-sm text-gray-500 mb-1">{winnings.label}</div>
          <div className={`text-2xl font-bold ${winnings.color}`}>
            {winnings.sign}
            {winnings.amount} ETH
          </div>
          {isTimeout &&
            result === 'win' &&
            isCurrentUserJ1 &&
            timeoutWinner === 'j1' && (
              <div className="text-xs text-gray-500 mt-1">
                Opponent never staked
              </div>
            )}
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <PrimaryButton
            text="Back to Dashboard"
            width={180}
            height={40}
            backgroundColor="bg-blue-500"
            hoverBackgroundColor="hover:bg-blue-600"
            shadowColor="bg-blue-700"
            onClick={handleBackToDashboard}
          />
        </div>
      </div>
    </div>
  );
}
