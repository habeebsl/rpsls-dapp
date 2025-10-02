import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';
import { getGameState } from '@/lib/contract';
import { NUMBER_TO_MOVE } from '@/types';
import { recoverMoveFromNonce } from '@/lib/moves';
import { createClient } from 'redis';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ gameId: string; playerAddress: string }> }
) {
    try {
        const { gameId, playerAddress } = await params;

        if (!gameId || !playerAddress) {
            return NextResponse.json(
                { error: 'Missing gameId or playerAddress' },
                { status: 400 }
            );
        }

        // Get game data from contract using Infura RPC
        const provider = new ethers.JsonRpcProvider(
            `https://sepolia.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`
        );

        // For read-only operations, we can create a dummy signer from the provider
        const wallet = new ethers.Wallet(
            ethers.hexlify(ethers.randomBytes(32)),
            provider
        );

        // Initialize Redis client
        const redis = createClient({
            url: process.env.REDIS_URL,
        });
        await redis.connect();

        // Use the existing getGameState function
        const gameState = await getGameState(gameId, wallet);

        const { j1, j2, c2, c1Hash } = gameState;

        const isJ1 = playerAddress.toLowerCase() === j1.toLowerCase();
        const isJ2 = playerAddress.toLowerCase() === j2.toLowerCase();

        // Security: Only return move if the requester is actually a player in this game
        if (!isJ1 && !isJ2) {
            return NextResponse.json(
                { error: 'Not authorized to view moves for this game' },
                { status: 403 }
            );
        }

        let userMove: string | null = null;

        if (isJ1) {
            // For J1: Get salt from user's game history in Redis
            const historyKey = `rpsls-account:${playerAddress}:history`;
            const gameHistory = await redis.lRange(historyKey, 0, -1);

            let storedSalt: string | null = null;

            // Find the game in user's history
            for (const gameData of gameHistory) {
                const gameResult = JSON.parse(gameData);
                if (gameResult.contractAddress === gameId) {
                    storedSalt = gameResult.salt;
                    break;
                }
            }

            if (!storedSalt) {
                return NextResponse.json(
                    { error: 'Game salt not found in user history' },
                    { status: 404 }
                );
            }

            // Try to recover the move by testing all possibilities
            userMove = recoverMoveFromNonce(storedSalt, c1Hash);

            if (!userMove) {
                return NextResponse.json(
                    { error: 'Could not recover move from commitment' },
                    { status: 500 }
                );
            }
        } else if (isJ2) {
            // For J2: Move is directly available from contract
            if (c2 > 0 && c2 <= 5) {
                userMove = NUMBER_TO_MOVE[c2];
            } else {
                // J2 hasn't played yet
                return NextResponse.json(
                    { error: 'Player 2 has not made a move yet' },
                    { status: 404 }
                );
            }
        }

        // Clean up Redis connection
        await redis.quit();

        return NextResponse.json({
            move: userMove,
            player: isJ1 ? 'j1' : 'j2',
            gameId,
        });
    } catch (error) {
        console.error('Error fetching user move:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
