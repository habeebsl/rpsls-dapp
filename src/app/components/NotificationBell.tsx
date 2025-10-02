'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faTimes,
  faCheck,
  faHandshake,
  faEye,
} from '@fortawesome/free-solid-svg-icons';
import { useNotificationStore } from '@/stores/notificationStore';
import { useWalletStore } from '@/stores/walletStore';
import { PrimaryButton } from './PrimaryButton';

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    isOpen,
    toggleOpen,
    setOpen,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotificationStore();
  
  const { address } = useWalletStore();
  const router = useRouter();

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setOpen]);

  const handleAcceptGame = async (notificationId: string, gameId: string, fromPlayer: string) => {
    try {
      // Check if notification is already read before marking
      const notification = notifications.find(n => n.id === notificationId);
      if (address && notification && !notification.read) {
        await markAsRead(notificationId, address);
      }
      // Navigate to the game page (gameId is the contract address)
      router.push(`/game/${gameId}`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Still navigate even if marking as read fails
      router.push(`/game/${gameId}`);
    }
  };

  const handleViewGame = async (notificationId: string, gameId: string) => {
    try {
      // Check if notification is already read before marking
      const notification = notifications.find(n => n.id === notificationId);
      if (address && notification && !notification.read) {
        await markAsRead(notificationId, address);
      }
      // Navigate to the game page (gameId is the contract address)
      router.push(`/game/${gameId}`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Still navigate even if marking as read fails
      router.push(`/game/${gameId}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'game-request':
        return '🎮';
      case 'move-needed':
        return '⏰';
      default:
        return 'ℹ️';
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!address) return;
    
    try {
      // Only mark unread notifications as read
      const unreadNotifications = notifications.filter(n => !n.read);
      
      // Mark each unread notification as read
      for (const notification of unreadNotifications) {
        await markAsRead(notification.id, address);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleRemoveNotification = async (notificationId: string) => {
    try {
      // Find the notification to check if it's unread
      const notification = notifications.find(n => n.id === notificationId);
      
      // If it's unread, mark it as read first to keep count accurate
      if (address && notification && !notification.read) {
        await markAsRead(notificationId, address);
      }
      
      // Then remove it from local state
      removeNotification(notificationId);
    } catch (error) {
      console.error('Error removing notification:', error);
      // Still remove locally even if backend fails
      removeNotification(notificationId);
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={toggleOpen}
        className={`relative p-2 rounded-full transition-colors ${
          isOpen
            ? 'bg-blue-600 text-white'
            : 'text-yellow-500 hover:bg-gray-100 hover:text-yellow-600'
        }`}
        aria-label="Notifications"
      >
        <FontAwesomeIcon icon={faBell} size={'lg'} />

        {/* Red Indicator Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <FontAwesomeIcon
                  icon={faBell}
                  className="mx-auto mb-2 text-gray-300"
                  size={'lg'}
                />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <p
                          className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}
                        >
                          {notification.message}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(notification.timestamp)}
                      </p>

                      {/* Action Buttons */}
                      {notification.actionRequired && (
                        <div className="mt-3 flex gap-2">
                          {notification.actionRequired === 'accept' && (
                            <PrimaryButton
                              text="Accept"
                              icon={faHandshake}
                              width={100}
                              height={32}
                              shadowTop={2}
                              className="text-xs"
                              backgroundColor="bg-green-500"
                              hoverBackgroundColor="hover:bg-green-600"
                              shadowColor="bg-green-700"
                              onClick={() =>
                                handleAcceptGame(
                                  notification.id,
                                  notification.gameId!,
                                  notification.from!
                                )
                              }
                            />
                          )}
                          {notification.actionRequired === 'view' && (
                            <PrimaryButton
                              text="View"
                              icon={faEye}
                              width={90}
                              height={32}
                              shadowTop={2}
                              className="text-xs"
                              backgroundColor="bg-blue-500"
                              hoverBackgroundColor="hover:bg-blue-600"
                              shadowColor="bg-blue-700"
                              onClick={() =>
                                handleViewGame(
                                  notification.id,
                                  notification.gameId!
                                )
                              }
                            />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                      {!notification.read && (
                        <button
                          onClick={() => address && markAsRead(notification.id, address)}
                          className="p-1 text-blue-600 hover:text-blue-800 rounded"
                          title="Mark as read"
                        >
                          <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveNotification(notification.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Remove notification"
                      >
                        <FontAwesomeIcon icon={faTimes} className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <button
                onClick={async () => {
                  if (address) {
                    try {
                      await useNotificationStore.getState().clearAll(address);
                    } catch (error) {
                      console.error('Failed to clear notifications:', error);
                    }
                  }
                }}
                className="text-xs text-gray-600 hover:text-gray-800"
              >
                Clear all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
