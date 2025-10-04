import '@reown/appkit-polyfills'; // MUST be first - mobile browser support
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
    console.log(
        '⚠️ If mobile WalletConnect fails, verify this Project ID at https://cloud.walletconnect.com'
    );
    console.log('   - Check that your domain is in "Allowed Domains"');
    console.log('   - Ensure the project is active and not rate-limited');
}

// Set up queryClient
export const queryClient = new QueryClient();

// Create Wagmi Adapter with explicit configuration for mobile WalletConnect
export const wagmiAdapter = new WagmiAdapter({
    storage: createStorage({
        storage: cookieStorage,
    }),
    ssr: true,
    projectId,
    networks: [sepolia],
    // Add polyfills for mobile browsers if needed
    connectors: [], // Let WagmiAdapter auto-configure connectors
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
        analytics: false, // Disable analytics - causing errors
        email: false,
        socials: [],
        onramp: false,
    },
    // ONLY show MetaMask - no other wallets
    includeWalletIds: [
        'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask only
    ],
    enableWalletGuide: false,
});
