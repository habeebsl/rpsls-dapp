import { ethers } from 'ethers';

/**
 * Get a consistent JSON-RPC provider for reading blockchain data
 * This ensures all users read from the same source, avoiding sync issues
 */
export function getConsistentProvider(): ethers.JsonRpcProvider {
    const infuraKey = process.env.NEXT_PUBLIC_INFURA_API_KEY;

    if (!infuraKey) {
        console.warn(
            '⚠️ NEXT_PUBLIC_INFURA_API_KEY not set, falling back to public RPC'
        );
        // Fallback to public Sepolia RPC (less reliable but better than inconsistent sources)
        return new ethers.JsonRpcProvider('https://rpc.sepolia.org');
    }

    // Use Infura as the consistent source of truth
    return new ethers.JsonRpcProvider(
        `https://sepolia.infura.io/v3/${infuraKey}`
    );
}

/**
 * Get a provider that uses consistent RPC for reads but user's signer for writes
 * This is a FallbackProvider that prioritizes our consistent RPC
 */
export async function getHybridProvider(
    userSigner: ethers.Signer
): Promise<{ provider: ethers.Provider; signer: ethers.Signer }> {
    // Get the consistent provider for all read operations
    const consistentProvider = getConsistentProvider();

    // For write operations, we still need the user's signer connected to MetaMask
    // But we'll read from the consistent provider
    return {
        provider: consistentProvider,
        signer: userSigner,
    };
}
