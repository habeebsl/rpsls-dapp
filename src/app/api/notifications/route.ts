import { NextRequest, NextResponse } from 'next/server';
import {
    addNotification,
    getNotifications,
    getUnreadNotificationCount,
    clearAllNotifications,
} from '@/lib/redis';

// GET /api/notifications?address={userAddress}
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json(
                { error: 'Address parameter is required' },
                { status: 400 }
            );
        }

        const notifications = await getNotifications(address);
        const unreadCount = await getUnreadNotificationCount(address);

        return NextResponse.json({
            notifications,
            unreadCount,
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}

// POST /api/notifications
export async function POST(request: NextRequest) {
    try {
        const notification = await request.json();

        // Validate required fields
        if (
            !notification.id ||
            !notification.type ||
            !notification.message ||
            !notification.from ||
            !notification.to
        ) {
            return NextResponse.json(
                { error: 'Missing required notification fields' },
                { status: 400 }
            );
        }

        // Add timestamp if not provided
        if (!notification.timestamp) {
            notification.timestamp = new Date().toISOString();
        }

        // Set read to false if not provided
        if (notification.read === undefined) {
            notification.read = false;
        }

        await addNotification(notification);

        return NextResponse.json(
            { success: true, message: 'Notification created successfully' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json(
            { error: 'Failed to create notification' },
            { status: 500 }
        );
    }
}

// DELETE /api/notifications?address={userAddress}
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const address = searchParams.get('address');

        if (!address) {
            return NextResponse.json(
                { error: 'Address parameter is required' },
                { status: 400 }
            );
        }

        await clearAllNotifications(address);

        return NextResponse.json({
            success: true,
            message: 'All notifications cleared successfully',
        });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        return NextResponse.json(
            { error: 'Failed to clear notifications' },
            { status: 500 }
        );
    }  
}
