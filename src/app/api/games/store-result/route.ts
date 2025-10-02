import { NextRequest, NextResponse } from 'next/server';
import { addGameResult, GameResult } from '@/lib/redis';
import { StoreGameResultRequest } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body: StoreGameResultRequest = await request.json();
        console.log('Received request body:', JSON.stringify(body, null, 2));

        const { j1Address, j2Address, gameData, j1Salt } = body;

        // Validate required fields
        if (!j1Address || !j2Address || !gameData || !j1Salt) {
            console.error('Missing required fields:', { j1Address, j2Address, gameData, j1Salt });
            return NextResponse.json(
                {
                    error: 'Missing required fields: j1Address, j2Address, gameData, j1Salt',
                },
                { status: 400 }
            );
        }

        if (!gameData.contractAddress || !gameData.stake) {
            return NextResponse.json(
                {
                    error: 'Missing required game result fields: contractAddress, stake',
                },
                { status: 400 }
            );
        }

        // Create game result for J1 (with salt)
        const j1GameResult: GameResult = {
            stake: gameData.stake,
            contractAddress: gameData.contractAddress,
            status: gameData.status,
            salt: j1Salt,
            opponent: j2Address,
            createdAt: gameData.createdAt,
        };

        // Create game result for J2 (without salt)
        const j2GameResult: GameResult = {
            stake: gameData.stake,
            contractAddress: gameData.contractAddress,
            status: gameData.status,
            salt: '', // J2 doesn't need salt but field is required
            opponent: j1Address,
            createdAt: gameData.createdAt,
        };

        // Store game result for both players
        console.log('Storing J1 game result:', JSON.stringify(j1GameResult, null, 2));
        await addGameResult(j1Address, j1GameResult);
        
        console.log('Storing J2 game result:', JSON.stringify(j2GameResult, null, 2));
        await addGameResult(j2Address, j2GameResult);

        return NextResponse.json(
            {
                success: true,
                message: 'Game result stored successfully for both players',
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error storing game result:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
