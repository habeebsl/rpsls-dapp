import { MetaMaskSDK } from '@metamask/sdk';
import { ethers } from 'ethers';

const MMSDK = new MetaMaskSDK({
    dappMetadata: {
        name: "RPSLS DApp",
        url: typeof window !== 'undefined' ? window.location.href : '',
    },
    infuraAPIKey: process.env.NEXT_PUBLIC_INFURA_API_KEY,
});

export async function connectWallet() {
    const ethereum = MMSDK.getProvider();
    await ethereum?.request({ method: 'eth_requestAccounts' });
    return ethereum;
}

export async function switchToSepolia() {
    const ethereum = MMSDK.getProvider();
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
                    params: [{
                        chainId: '0xaa36a7',
                        chainName: 'Sepolia Test Network',
                        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                        rpcUrls: [`https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`],
                        blockExplorerUrls: ['https://sepolia.etherscan.io/']
                    }]
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