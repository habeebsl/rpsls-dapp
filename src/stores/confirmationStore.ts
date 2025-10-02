import { create } from 'zustand';

export interface ConfirmationState {
  isOpen: boolean;
  isLoading: boolean;
  move: string | null;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: (() => Promise<void>) | null;
  onCancel: (() => void) | null;
}

interface ConfirmationStore extends ConfirmationState {
  openConfirmation: (params: {
    move: string;
    title?: string;
    message?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => Promise<void>;
    onCancel?: () => void;
  }) => void;
  closeConfirmation: () => void;
  setLoading: (loading: boolean) => void;
  executeConfirm: () => Promise<void>;
}

export const useConfirmationStore = create<ConfirmationStore>((set, get) => ({
  // Initial state
  isOpen: false,
  isLoading: false,
  move: null,
  title: 'Confirm Move',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  onConfirm: null,
  onCancel: null,

  // Open confirmation modal with parameters
  openConfirmation: (params) => {
    set({
      isOpen: true,
      isLoading: false,
      move: params.move,
      title: params.title || 'Confirm Move',
      message: params.message || `Are you sure you want to play ${params.move}?`,
      confirmText: params.confirmText || 'Confirm',
      cancelText: params.cancelText || 'Cancel',
      onConfirm: params.onConfirm,
      onCancel: params.onCancel || null,
    });
  },

  // Close confirmation modal and reset state
  closeConfirmation: () => {
    set({
      isOpen: false,
      isLoading: false,
      move: null,
      title: 'Confirm Move',
      message: '',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      onConfirm: null,
      onCancel: null,
    });
  },

  // Set loading state
  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  // Execute the confirmation callback with loading state management
  executeConfirm: async () => {
    const { onConfirm } = get();
    if (!onConfirm) return;

    set({ isLoading: true });
    
    try {
      await onConfirm();
      // Don't automatically close modal - let the calling code handle it
      // This allows the calling code to keep the modal open with loading state
      // until the full process (like blockchain transactions) is complete
    } catch (error) {
      // Keep modal open on error, just stop loading
      set({ isLoading: false });
      console.error('Confirmation action failed:', error);
      // Error handling should be done in the onConfirm callback
    }
  },
}));