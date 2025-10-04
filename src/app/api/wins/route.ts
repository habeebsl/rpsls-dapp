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

        const gameHistory = await getGameHistory(address);
        const winCount = gameHistory.filter(game => game.type === 'win').length;

        return NextResponse.json({
            wins: winCount,
            totalGames: gameHistory.length,
            gameHistory,
        });
    } catch (error) {
        console.error('Error fetching user wins:', error);
        return NextResponse.json(
            { error: 'Failed to fetch wins' },
            { status: 500 }
        );
    }
}
