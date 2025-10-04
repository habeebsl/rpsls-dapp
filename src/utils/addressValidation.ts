import axios from 'axios';

export interface AddressValidation {
    isValid: boolean;
    isChecking: boolean;
    exists: boolean | null;
}

/**
 * Validate if an Ethereum address exists on the Sepolia network
 * Uses server-side API route to keep API keys secure
 * @param address - The Ethereum address to validate
 * @returns Promise that resolves to validation result
 */
export const validateSepoliaAddress = async (
    address: string
): Promise<AddressValidation> => {
    try {
        const response = await axios.post('/api/validate-address', { address });
        return response.data;
    } catch (error) {
        console.error('Error validating Sepolia address:', error);
        return { isValid: true, isChecking: false, exists: false };
    }
};
