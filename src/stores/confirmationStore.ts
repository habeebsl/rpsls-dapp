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
  isOpen: false,
  isLoading: false,
  move: null,
  title: 'Confirm Move',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  onConfirm: null,
  onCancel: null,

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

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  executeConfirm: async () => {
    const { onConfirm } = get();
    if (!onConfirm) return;

    set({ isLoading: true });

    try {
      await onConfirm();
    } catch (error) {
      set({ isLoading: false });
      console.error('Confirmation action failed:', error);
    }
  },
}));
