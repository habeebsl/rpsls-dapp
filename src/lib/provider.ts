import { ethers } from 'ethers';

/**
 * Get a consistent JSON-RPC provider for reading blockchain data
 * This ensures all users read from the same source, avoiding sync issues
 */
export function getConsistentProvider(): ethers.JsonRpcProvider {
    const infuraKey = process.env.NEXT_PUBLIC_INFURA_API_KEY;

    if (!infuraKey) {
        console.warn(
            'NEXT_PUBLIC_INFURA_API_KEY not set, falling back to public RPC'
        );
        // Fallback to public Sepolia RPC
        return new ethers.JsonRpcProvider('https://rpc.sepolia.org');
    }

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
    const consistentProvider = getConsistentProvider();

    return {
        provider: consistentProvider,
        signer: userSigner,
    };
}
