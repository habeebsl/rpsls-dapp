import { create } from 'zustand';
import {
    getSigner,
    checkExistingConnection,
    getSignerIfConnected,
} from '@/lib/metamask';
import { ethers } from 'ethers';

interface WalletState {
    isConnected: boolean | null; // null = loading, true = connected, false = not connected
    address: string | null;
    signer: ethers.Signer | null;
    isLoading: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    checkConnection: () => Promise<boolean>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
    isConnected: null,
    address: null,
    signer: null,
    isLoading: false,

    connect: async () => {
        set({ isLoading: true });
        try {
            const signer = await getSigner();
            if (!signer) {
                throw new Error('Failed to get signer');
            }
            const address = await signer.getAddress();
            set({
                isConnected: true,
                address,
                signer,
                isLoading: false,
            });
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            set({
                isConnected: false,
                address: null,
                signer: null,
                isLoading: false,
            });
        }
    },

    disconnect: () => {
        set({
            isConnected: false,
            address: null,
            signer: null,
            isLoading: false,
        });
    },

    checkConnection: async () => {
        try {
            const ethereum = await checkExistingConnection();
            if (ethereum) {
                // If we have an existing connection, update the state
                const signer = await getSignerIfConnected();
                if (signer) {
                    const address = await signer.getAddress();
                    set({
                        isConnected: true,
                        address,
                        signer,
                        isLoading: false,
                    });
                    return true;
                }
            }

            // No existing connection found
            set({
                isConnected: false,
                address: null,
                signer: null,
                isLoading: false,
            });
            return false;
        } catch (error) {
            console.error('Error checking connection:', error);
            set({
                isConnected: false,
                address: null,
                signer: null,
                isLoading: false,
            });
            return false;
        }
    },
}));
