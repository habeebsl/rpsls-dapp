'use client';

import { useAppKit } from '@reown/appkit/react';
import { useAccount, useDisconnect } from 'wagmi';
import { useEffect } from 'react';
import { useWalletStore } from '@/stores/walletStore';
import { BrowserProvider } from 'ethers';

export function MultiWalletConnect() {
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();

  // Sync wagmi state with wallet store
  useEffect(() => {
    const syncWalletState = async () => {
      if (isConnected && address && connector) {
        try {
          const provider = await connector.getProvider();
          const ethersProvider = new BrowserProvider(provider as any);
          const signer = await ethersProvider.getSigner();

          useWalletStore.getState().setWalletState(address, signer);
        } catch (error) {
          console.error('Error syncing wallet:', error);
          useWalletStore.getState().disconnect();
        }
      } else {
        useWalletStore.getState().disconnect();
      }
    };

    syncWalletState();
  }, [isConnected, address, connector]);

  const handleConnect = async () => {
    try {
      await open();
    } catch (error) {
      console.error('Error opening wallet modal:', error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    useWalletStore.getState().disconnect();
  };

  if (isConnected && address) {
    return (
      <button
        onClick={handleDisconnect}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Disconnect
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      Connect Wallet
    </button>
  );
}
