import { MetaMaskSDK } from '@metamask/sdk';
import { ethers, Eip1193Provider } from 'ethers';

export async function connectWallet(): Promise<Eip1193Provider> {
    // Wait for provider to be available
    const ethereum = await waitForProvider();
    if (!ethereum) {
        throw new Error(
            'MetaMask not detected. Please install MetaMask extension.'
        );
    }

    await ethereum.request({ method: 'eth_requestAccounts' });
    return ethereum;
}

// Wait for MetaMask provider to be available
async function waitForProvider(
    maxAttempts = 10,
    delay = 200
): Promise<Eip1193Provider | null> {
    return new Promise(resolve => {
        let attempts = 0;

        const checkProvider = () => {
            attempts++;

            // Check if MetaMask is available
            if (typeof window !== 'undefined' && (window as any).ethereum) {
                resolve((window as any).ethereum);
                return;
            }

            // If we've reached max attempts, resolve with null
            if (attempts >= maxAttempts) {
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
    const ethereum = await waitForProvider();
    if (!ethereum) {
        console.log('MetaMask not detected');
        return null;
    }

    try {
        // Check existing accounts without triggering popup
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
    } catch (error: unknown) {
        // Chain not added, try to add it
        if ((error as any).code === 4902) {
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
