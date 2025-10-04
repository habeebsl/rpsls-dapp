import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { address } = await request.json();

        if (!address || typeof address !== 'string') {
            return NextResponse.json(
                { error: 'Address is required' },
                { status: 400 }
            );
        }

        if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
            return NextResponse.json({
                isValid: false,
                isChecking: false,
                exists: null,
            });
        }

        const apiKey = process.env.ETHERSCAN_API_KEY;
        if (!apiKey) {
            console.error(
                'ETHERSCAN_API_KEY not found in environment variables'
            );
            return NextResponse.json(
                { error: 'API configuration error' },
                { status: 500 }
            );
        }

        const response = await fetch(
            `https://api-sepolia.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`
        );
        const data = await response.json();
        const exists = data.status === '1' && data.result !== undefined;

        return NextResponse.json({
            isValid: true,
            isChecking: false,
            exists,
        });
    } catch (error) {
        console.error('Error validating Sepolia address:', error);
        return NextResponse.json(
            { error: 'Validation failed' },
            { status: 500 }
        );
    }
}
