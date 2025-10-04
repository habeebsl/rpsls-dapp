import { MetaMaskSDK } from '@metamask/sdk';
import { ethers } from 'ethers';

let MMSDK: MetaMaskSDK | null = null;

// Initialize MetaMask SDK for mobile support
function initializeSDK() {
    if (typeof window === 'undefined') return null;

    // Don't initialize if already done or if MetaMask extension is present
    if (MMSDK) return MMSDK;

    // Check if MetaMask extension is already available (desktop)
    if ((window as any).ethereum?.isMetaMask) {
        console.log('MetaMask extension detected, skipping SDK initialization');
        return null;
    }

    // Initialize SDK for mobile browsers with persistence
    console.log('Initializing MetaMask SDK for mobile support...');
    MMSDK = new MetaMaskSDK({
        dappMetadata: {
            name: 'RPSLS dApp',
            url: typeof window !== 'undefined' ? window.location.origin : '',
        },
        // Enable storage for persistent connections
        storage: {
            enabled: true,
        },
        // Logging for debugging (remove in production)
        logging: {
            developerMode: false,
        },
        // Don't automatically open deep link on every check
        checkInstallationImmediately: false,
        // Prefer in-app browser when possible
        preferDesktop: false,
    });

    return MMSDK;
}

export async function connectWallet() {
    // Initialize SDK first (for mobile)
    initializeSDK();

    // Wait for provider to be available
    const ethereum = await waitForProvider();
    if (!ethereum) {
        throw new Error(
            'MetaMask not detected. Please install MetaMask extension or mobile app.'
        );
    }

    await ethereum.request({ method: 'eth_requestAccounts' });
    return ethereum;
}

// Wait for MetaMask provider to be available
async function waitForProvider(maxAttempts = 10, delay = 200): Promise<any> {
    return new Promise(resolve => {
        let attempts = 0;

        const checkProvider = () => {
            attempts++;

            // Check if MetaMask extension is available (desktop)
            if (typeof window !== 'undefined' && (window as any).ethereum) {
                console.log('MetaMask provider found');
                resolve((window as any).ethereum);
                return;
            }

            // Check if SDK initialized and has provider (mobile)
            if (MMSDK) {
                const sdkProvider = MMSDK.getProvider();
                if (sdkProvider) {
                    console.log('MetaMask SDK provider found (mobile)');
                    resolve(sdkProvider);
                    return;
                }
            }

            // If we've reached max attempts, resolve with null
            if (attempts >= maxAttempts) {
                console.log('MetaMask provider not found after max attempts');
                resolve(null);
                return;
            }

            // Wait and try again
            setTimeout(checkProvider, delay);
        };

        checkProvider();
    });
}

export async function checkExistingConnection() {
    // Initialize SDK ONLY if not already initialized
    // This prevents unnecessary re-initialization on every check
    if (!MMSDK && typeof window !== 'undefined' && !(window as any).ethereum) {
        initializeSDK();
    }

    const ethereum = await waitForProvider();
    if (!ethereum) {
        console.log('MetaMask not detected');
        return null;
    }

    try {
        const accounts = (await ethereum.request({
            method: 'eth_accounts',
        })) as string[];
        if (accounts && Array.isArray(accounts) && accounts.length > 0) {
            console.log('Found existing MetaMask connection');
            return ethereum;
        }
        console.log('No existing MetaMask connection found');
        return null;
    } catch (error) {
        console.error('Failed to check existing connection:', error);
        return null;
    }
}

export async function switchToSepolia() {
    const ethereum = await waitForProvider();
    if (!ethereum) return false;

    try {
        await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }], // Sepolia chain ID
        });
        return true;
    } catch (error: any) {
        // Chain not added, try to add it
        if (error.code === 4902) {
            try {
                await ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        {
                            chainId: '0xaa36a7',
                            chainName: 'Sepolia Test Network',
                            nativeCurrency: {
                                name: 'ETH',
                                symbol: 'ETH',
                                decimals: 18,
                            },
                            rpcUrls: [
                                `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`,
                            ],
                            blockExplorerUrls: [
                                'https://sepolia.etherscan.io/',
                            ],
                        },
                    ],
                });
                return true;
            } catch (addError) {
                return false;
            }
        }
        return false;
    }
}

export async function getSigner() {
    const ethereum = await connectWallet();
    if (ethereum) {
        await switchToSepolia(); // Ensure we're on Sepolia
        const provider = new ethers.BrowserProvider(ethereum);
        return await provider.getSigner();
    }
}

export async function getSignerIfConnected() {
    const ethereum = await checkExistingConnection();
    if (ethereum) {
        await switchToSepolia(); // Ensure we're on Sepolia
        const provider = new ethers.BrowserProvider(ethereum);
        return await provider.getSigner();
    }
    return null;
}
