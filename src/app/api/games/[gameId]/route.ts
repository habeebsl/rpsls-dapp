import { NextRequest, NextResponse } from 'next/server';
import { getGameHistory } from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const playerAddress = searchParams.get('playerAddress');
    
    if (!playerAddress) {
      return NextResponse.json(
        { error: 'Player address is required' },
        { status: 400 }
      );
    }

    const resolvedParams = await params;
    const contractAddress = resolvedParams.gameId;
    console.log(`Getting game result for contract: ${contractAddress}, player: ${playerAddress}`);

    // Get player's game history
    const gameHistory = await getGameHistory(playerAddress);
    
    // Find the specific game by contract address
    const gameResult = gameHistory.find(
      (game) => game.contractAddress === contractAddress
    );

    if (!gameResult) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    console.log('Found game result:', gameResult);

    return NextResponse.json({
      success: true,
      gameResult
    });

  } catch (error) {
    console.error('Error getting game result:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}