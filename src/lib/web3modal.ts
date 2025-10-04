import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { sepolia } from '@reown/appkit/networks';
import { cookieStorage, createStorage } from 'wagmi';
import { QueryClient } from '@tanstack/react-query';

// Get projectId from environment
export const projectId =
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
    'PLACEHOLDER_PROJECT_ID_REPLACE_ME';

if (projectId === 'PLACEHOLDER_PROJECT_ID_REPLACE_ME') {
    console.warn(
        '⚠️ Using placeholder WalletConnect Project ID. Get a real one from https://cloud.walletconnect.com'
    );
} else {
    console.log(
        '✅ WalletConnect Project ID loaded:',
        projectId.substring(0, 8) + '...'
    );
    console.log(
        '🌐 Current origin:',
        typeof window !== 'undefined' ? window.location.origin : 'SSR'
    );
}

// Set up queryClient
export const queryClient = new QueryClient();

// Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
    storage: createStorage({
        storage: cookieStorage,
    }),
    ssr: true,
    projectId,
    networks: [sepolia],
});

// Get Wagmi config
export const config = wagmiAdapter.wagmiConfig;

// Metadata
const metadata = {
    name: 'RPSLS DApp',
    description: 'Rock Paper Scissors Lizard Spock on Ethereum',
    url:
        typeof window !== 'undefined'
            ? window.location.origin
            : 'https://rpsls-dapp.com',
    icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

// Create the AppKit instance
export const modal = createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [sepolia],
    defaultNetwork: sepolia,
    metadata,
    features: {
        analytics: true, // Enable analytics for better debugging
        email: false,
        socials: [],
    },
    enableWalletConnect: true, // Explicitly enable WalletConnect
    enableInjected: true, // Enable injected wallets (desktop)
    enableCoinbase: false, // Disable coinbase for now
    // Featured wallet: MetaMask appears first
    // On desktop: uses injected connector (browser extension)
    // On mobile: uses WalletConnect to deep link to MetaMask app
    featuredWalletIds: [
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    ],
});
