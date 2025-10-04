'use client';

'use client';

import { useAccount } from 'wagmi';
import { useEffect, useRef } from 'react';
import { useWalletStore } from '@/stores/walletStore';
import { BrowserProvider } from 'ethers';

/**
 * This component syncs wagmi wallet state with the global walletStore.
 * It must be rendered in the app layout to ensure wallet state is always synced.
 */
export function WalletSync() {
  const { address, isConnected, connector } = useAccount();
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent running multiple times on mount
    if (hasRun.current) return;
    hasRun.current = true;

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

  return null;
}
