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
export const validateSepoliaAddress = async (address: string): Promise<AddressValidation> => {
  // First check basic format
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return { isValid: false, isChecking: false, exists: null };
  }

  try {
    // Call our secure API route for validation
    const response = await fetch('/api/validate-address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error validating Sepolia address:', error);
    return { isValid: true, isChecking: false, exists: false };
  }
};

/**
 * Simple Ethereum address format validation
 * @param address - The address to validate
 * @returns boolean indicating if the format is valid
 */
export const isValidEthereumAddressFormat = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

