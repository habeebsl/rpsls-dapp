import { create } from 'zustand';
import {
    getSigner,
    checkExistingConnection,
    getSignerIfConnected,
} from '@/lib/metamask';
import { ethers } from 'ethers';

type StateChangeCallback = () => void;

interface WalletState {
    isConnected: boolean | null;
    address: string | null;
    signer: ethers.Signer | null;
    isLoading: boolean;
    connect: () => Promise<void>;
    disconnect: () => void;
    checkConnection: () => Promise<boolean>;
    subscribeToStateChanges: (callback: StateChangeCallback) => () => void;
    _stateChangeCallbacks: Set<StateChangeCallback>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
    isConnected: null,
    address: null,
    signer: null,
    isLoading: false,
    _stateChangeCallbacks: new Set<StateChangeCallback>(),

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

    subscribeToStateChanges: (callback: StateChangeCallback) => {
        const { _stateChangeCallbacks } = get();
        _stateChangeCallbacks.add(callback);

        // Setup MetaMask event listeners if this is the first subscription
        if (_stateChangeCallbacks.size === 1) {
            const setupProviderListeners = async () => {
                if (typeof window !== 'undefined' && (window as any).ethereum) {
                    const provider = (window as any).ethereum;

                    const notifyCallbacks = () => {
                        _stateChangeCallbacks.forEach(cb => cb());
                    };

                    const handleAccountsChanged = (accounts: string[]) => {
                        console.log('🔄 MetaMask accounts changed:', accounts);
                        notifyCallbacks();
                    };

                    const handleChainChanged = (chainId: string) => {
                        console.log('🔄 MetaMask chain changed:', chainId);
                        notifyCallbacks();
                    };

                    const handleConnect = () => {
                        console.log('🔄 MetaMask connected');
                        notifyCallbacks();
                    };

                    const handleDisconnect = () => {
                        console.log('🔄 MetaMask disconnected');
                        notifyCallbacks();
                    };

                    provider.on('accountsChanged', handleAccountsChanged);
                    provider.on('chainChanged', handleChainChanged);
                    provider.on('connect', handleConnect);
                    provider.on('disconnect', handleDisconnect);
                }
            };

            setupProviderListeners();
        }

        return () => {
            const { _stateChangeCallbacks } = get();
            _stateChangeCallbacks.delete(callback);
        };
    },
}));
