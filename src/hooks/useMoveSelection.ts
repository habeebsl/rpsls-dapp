import { play } from '@/lib/contract';
import { Move, GameState } from '@/types';
import { ethers, Signer } from 'ethers';

interface UseMoveSelectionProps {
  contractAddress: string;
  currentUserAddress: string | null;
  signer: Signer | null;
  gameState: GameState | null;
  isCurrentUserJ2: boolean;
  fetchGameState: () => Promise<void>;
  setUserHasSelectedMove: (value: boolean) => void;
  notifyMove?: (action: 'move_made' | 'game_joined' | 'move_revealed') => Promise<void>;
}

interface UseMoveSelectionReturn {
  handleMoveSelection: (move: Move) => Promise<void>;
}

export function useMoveSelection({
  contractAddress,
  currentUserAddress,
  signer,
  gameState,
  isCurrentUserJ2,
  fetchGameState,
  setUserHasSelectedMove,
  notifyMove,
}: UseMoveSelectionProps): UseMoveSelectionReturn {

  const handleMoveSelection = async (move: Move) => {
    try {
      if (!signer || !gameState) {
        throw new Error('Wallet not connected or game state not loaded');
      }

      // Only J2 should be able to play moves through this function
      // J1 has already "played" by creating the contract with a commitment
      if (!isCurrentUserJ2) {
        throw new Error('Only Player 2 can play moves at this stage');
      }

      console.log(`J2 playing move: ${move} with stake: ${gameState.stake}`);
      
      // Submit move to smart contract with stake payment
      // gameState.stake is already in Wei from the blockchain, so pass it as BigInt
      const stakeInWei = ethers.toBigInt(gameState.stake);
      const transaction = await play(contractAddress, move, stakeInWei, signer);
      console.log('Transaction submitted:', transaction.hash);
      
      // Wait for transaction to be mined
      await transaction.wait();
      console.log('Transaction confirmed');
      
      // Notify other players of the move
      if (notifyMove) {
        await notifyMove('move_made');
        console.log('📢 Notified other players of move');
      }
      
      // Refresh game state to reflect the new move
      await fetchGameState();
      
      // Update local state
      setUserHasSelectedMove(true);
      
    } catch (error) {
      console.error('Error submitting move:', error);
      
      // Create user-friendly error message
      let errorMessage = 'Failed to submit move. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds to pay the stake amount.';
        } else if (error.message.includes('user rejected')) {
          errorMessage = 'Transaction was cancelled.';
        } else if (error.message.includes('Wallet not connected')) {
          errorMessage = 'Please connect your wallet first.';
        } else if (error.message.includes('Player 2 can play')) {
          errorMessage = 'Only Player 2 can make moves at this stage.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Re-throw with user-friendly message so global modal can handle it
      throw new Error(errorMessage);
    }
  };

  return {
    handleMoveSelection,
  };
}