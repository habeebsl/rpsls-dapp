import { NextRequest, NextResponse } from 'next/server';
import { getGameHistory } from '@/lib/redis';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json(
                { error: 'Address is required' },
                { status: 400 }
            );
        }

        // Check if user has any game history (indicating they've used the app)
        const gameHistory = await getGameHistory(address);
        const exists = gameHistory.length > 0;

        return NextResponse.json({ exists });
    } catch (error) {
        console.error('Error checking user existence:', error);
        return NextResponse.json(
            { error: 'Failed to check user' },
            { status: 500 }
        );
    }
}
