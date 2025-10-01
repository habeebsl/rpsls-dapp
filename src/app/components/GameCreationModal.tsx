'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faHandRock, faHandPaper, faHandScissors, faCheck, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { PrimaryButton } from './PrimaryButton';
import { validateSepoliaAddress, type AddressValidation } from '../../utils/addressValidation';
import { useWalletStore } from '../../stores/walletStore';

interface GameCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Move = 'rock' | 'paper' | 'scissors' | 'lizard' | 'spock';

export function GameCreationModal({ isOpen, onClose }: GameCreationModalProps) {
  const { address: userAddress } = useWalletStore();
  const [stake, setStake] = useState('');
  const [opponentAddress, setOpponentAddress] = useState('');
  const [selectedMove, setSelectedMove] = useState<Move | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const moves = [
    { id: 'rock', name: 'Rock', icon: faHandRock, emoji: '🪨' },
    { id: 'paper', name: 'Paper', icon: faHandPaper, emoji: '📄' },
    { id: 'scissors', name: 'Scissors', icon: faHandScissors, emoji: '✂️' },
    { id: 'lizard', name: 'Lizard', icon: null, emoji: '🦎' },
    { id: 'spock', name: 'Spock', icon: null, emoji: '🖖' }
  ];

  const [addressValidation, setAddressValidation] = useState<AddressValidation>({ 
    isValid: false, 
    isChecking: false, 
    exists: null 
  });

  // Check if user is trying to play against themselves
  const isSelfPlay = userAddress && opponentAddress && userAddress.toLowerCase() === opponentAddress.toLowerCase();

  // Trigger validation when address changes
  useEffect(() => {
    if (opponentAddress) {
      // Check for self-play first
      if (isSelfPlay) {
        setAddressValidation({ isValid: false, isChecking: false, exists: null });
        return;
      }

      // Set checking state immediately (no flash of error)
      setAddressValidation({ isValid: false, isChecking: true, exists: null });
      
      const timeoutId = setTimeout(async () => {
        const result = await validateSepoliaAddress(opponentAddress);
        setAddressValidation(result);
      }, 500); // Debounce for 500ms

      return () => clearTimeout(timeoutId);
    } else {
      setAddressValidation({ isValid: false, isChecking: false, exists: null });
    }
  }, [opponentAddress, isSelfPlay]);

  // Form validation
  const isFormValid = stake && opponentAddress && selectedMove && addressValidation.isValid && !addressValidation.isChecking && !isSelfPlay;

  const handleStartGame = () => {
    if (!isFormValid) return;
    
    console.log('Starting game with:', { stake, opponentAddress, selectedMove });
    // TODO: Implement game creation logic
    handleClose();
  };

  const handleClose = () => {
    // Reset form when closing
    setStake('');
    setOpponentAddress('');
    setSelectedMove(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Background Overlay */}
      <div 
        className="absolute inset-0 bg-black opacity-30"
        onClick={handleClose}
      ></div>
      
      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
        >
          <FontAwesomeIcon icon={faTimes} size="lg" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Create New Game</h2>
          <p className="text-gray-600">Set your stake, choose opponent, and make your move!</p>
        </div>

        {/* Stake Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stake Amount (ETH)
          </label>
          <input
            type="number"
            step="0.001"
            min="0"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            placeholder="0.1"
            className="w-full p-4 rounded-lg border-2 border-gray-300 bg-white text-gray-900 focus:border-purple-500 focus:outline-none transition-colors"
            disabled={isCreating}
          />
        </div>

        {/* Opponent Address Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Opponent Address
          </label>
          <div className="relative">
            <input
              type="text"
              value={opponentAddress}
              onChange={(e) => setOpponentAddress(e.target.value)}
              placeholder="0x..."
              className="w-full p-4 pr-12 rounded-lg border-2 border-gray-300 bg-white text-gray-900 focus:border-purple-500 focus:outline-none transition-colors"
              disabled={isCreating}
            />            {/* Validation Icon */}
            {opponentAddress && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isSelfPlay ? (
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" />
                ) : addressValidation.isChecking ? (
                  <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                ) : addressValidation.isValid && addressValidation.exists === true ? (
                  <FontAwesomeIcon icon={faCheck} className="text-green-500" />
                ) : addressValidation.isValid && addressValidation.exists === false ? (
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500" />
                ) : (
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500" />
                )}
              </div>
            )}
          </div>
          
          {/* Validation Messages */}
          {opponentAddress && (
            <div className="mt-2 text-sm">
              {isSelfPlay ? (
                <div className="text-red-600 flex items-center gap-1">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-xs" />
                  You cannot create a game with yourself
                </div>
              ) : addressValidation.isChecking ? (
                <div className="text-blue-600 flex items-center gap-1">
                  <div className="animate-spin w-3 h-3 border border-blue-500 border-t-transparent rounded-full"></div>
                  Checking address on Sepolia network...
                </div>
              ) : addressValidation.isValid && addressValidation.exists === true ? (
                <div className="text-green-600 flex items-center gap-1">
                  <FontAwesomeIcon icon={faCheck} className="text-xs" />
                  Valid Sepolia address found
                </div>
              ) : addressValidation.isValid && addressValidation.exists === false ? (
                <div className="text-yellow-600 flex items-center gap-1">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-xs" />
                  Address not found on Sepolia network
                </div>
              ) : !addressValidation.isValid && !addressValidation.isChecking ? (
                <div className="text-red-600 flex items-center gap-1">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-xs" />
                  Invalid Ethereum address format
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Move Selection */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-4">
            Choose Your Move
          </label>
          <div className="grid grid-cols-5 gap-3">
            {moves.map((move) => (
              <button
                key={move.id}
                onClick={() => setSelectedMove(move.id as Move)}
                className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                  selectedMove === move.id
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  {move.icon ? (
                    <FontAwesomeIcon 
                      icon={move.icon} 
                      className={`text-2xl ${
                        selectedMove === move.id ? 'text-blue-600' : 'text-gray-600'
                      }`}
                    />
                  ) : (
                    <span className="text-2xl">{move.emoji}</span>
                  )}
                  <span className={`text-xs font-medium ${
                    selectedMove === move.id ? 'text-blue-700' : 'text-gray-600'
                  }`}>
                    {move.name}
                  </span>
                </div>
                
                {/* Selection Indicator */}
                {selectedMove === move.id && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Start Game Button */}
        <div className="flex justify-center">
          <PrimaryButton
            text="Start Game"
            width={200}
            height={50}
            backgroundColor={isFormValid ? "bg-blue-500" : "bg-gray-400"}
            hoverBackgroundColor={isFormValid ? "hover:bg-blue-600" : "hover:bg-gray-400"}
            shadowColor={isFormValid ? "bg-blue-700" : "bg-gray-600"}
            onClick={isFormValid ? handleStartGame : undefined}
            className={`transition-all duration-200 ${
              isFormValid ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
            }`}
          />
        </div>
      </div>
    </div>
  );
}