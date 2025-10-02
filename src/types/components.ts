// Wallet/User types
export interface WalletState {
  isConnected: boolean | null;
  address: string | null;
  signer: any | null; // ethers.Signer
  isLoading: boolean;
}

// Component Props types
export interface PlayerCardProps {
  address: string;
  hasPlayed: boolean;
  isJ1: boolean;
  lastAction: string;
  currentUserAddress?: string;
}

export interface MoveCardProps {
  move: string;
  isSelected: boolean;
  isLocked: boolean;
  isDisabled: boolean;
  onSelect: (move: string) => void;
  onUnselect: () => void;
  onConfirm: (move: string) => void;
}

export interface MoveContainerProps {
  hasSelectedMove: boolean;
  selectedMove?: string;
  isJ1: boolean;
  gameContractAddress: string;
  currentUserAddress?: string;
  onSelectionConfirmed: (move: string, nonce?: string) => void;
}