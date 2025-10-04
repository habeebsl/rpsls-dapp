import { NextRequest, NextResponse } from 'next/server';
import { addGameResult, GameResult } from '@/lib/redis';
import { StoreGameResultRequest } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body: StoreGameResultRequest = await request.json();
        const { j1Address, j2Address, gameData, j1Salt } = body;

        if (!j1Address || !j2Address || !gameData || !j1Salt) {
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

        const j1GameResult: GameResult = {
            stake: gameData.stake,
            contractAddress: gameData.contractAddress,
            status: gameData.status,
            salt: j1Salt,
            opponent: j2Address,
            createdAt: gameData.createdAt,
        };

        const j2GameResult: GameResult = {
            stake: gameData.stake,
            contractAddress: gameData.contractAddress,
            status: gameData.status,
            salt: '',
            opponent: j1Address,
            createdAt: gameData.createdAt,
        };

        await addGameResult(j1Address, j1GameResult);
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
