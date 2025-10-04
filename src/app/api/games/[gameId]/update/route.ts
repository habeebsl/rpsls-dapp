import { NextRequest, NextResponse } from 'next/server';
import { updateGameResult } from '@/lib/redis';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ gameId: string }> }
) {
    try {
        const body = await request.json();
        const { playerAddress, updates } = body;

        if (!playerAddress) {
            return NextResponse.json(
                { error: 'Player address is required' },
                { status: 400 }
            );
        }

        if (!updates || typeof updates !== 'object') {
            return NextResponse.json(
                { error: 'Updates object is required' },
                { status: 400 }
            );
        }

        const resolvedParams = await params;
        const contractAddress = resolvedParams.gameId;
        const updated = await updateGameResult(
            playerAddress,
            contractAddress,
            updates
        );

        if (!updated) {
            return NextResponse.json(
                { error: 'Game not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Game result updated successfully',
        });
    } catch (error) {
        console.error('Error updating game result:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
