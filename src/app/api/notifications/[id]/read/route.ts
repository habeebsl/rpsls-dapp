import { NextRequest, NextResponse } from 'next/server';
import { markNotificationAsRead } from '@/lib/redis';

// PATCH /api/notifications/[id]/read
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { userAddress } = await request.json();

        if (!userAddress) {
            return NextResponse.json(
                { error: 'User address is required' },
                { status: 400 }
            );
        }

        const success = await markNotificationAsRead(userAddress, id);

        if (success) {
            return NextResponse.json({
                success: true,
                message: 'Notification marked as read',
            });
        } else {
            return NextResponse.json(
                { error: 'Notification not found or already read' },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json(
            { error: 'Failed to mark notification as read' },
            { status: 500 }
        );
    }
}
