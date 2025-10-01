'use client';

import { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faTimes, faCheck, faHandshake, faEye } from '@fortawesome/free-solid-svg-icons';
import { useNotificationStore } from '@/stores/notificationStore';
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

  const handleAcceptGame = (gameId: string, fromPlayer: string) => {
    console.log(`Accepting game request from ${fromPlayer}, gameId: ${gameId}`);
    // TODO: Implement actual game acceptance logic
  };

  const handleViewGame = (gameId: string) => {
    console.log(`Viewing game ${gameId}`);
    // TODO: Navigate to game component
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
        <FontAwesomeIcon icon={faBell} size={"lg"} />

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
                onClick={markAllAsRead}
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
                  size={"lg"}
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
                      {notification.actionType && (
                        <div className="mt-3 flex gap-2">
                          {notification.actionType === 'accept' && (
                            <PrimaryButton
                              text="Accept"
                              icon={faHandshake}
                              width={80}
                              height={32}
                              className="text-xs"
                              backgroundColor="bg-green-500"
                              hoverBackgroundColor="hover:bg-green-600"
                              shadowColor="bg-green-700"
                              onClick={() => handleAcceptGame(notification.gameId!, notification.fromPlayer!)}
                            />
                          )}
                          {notification.actionType === 'view' && (
                            <PrimaryButton
                              text="View"
                              icon={faEye}
                              width={70}
                              height={32}
                              className="text-xs"
                              backgroundColor="bg-blue-500"
                              hoverBackgroundColor="hover:bg-blue-600"
                              shadowColor="bg-blue-700"
                              onClick={() => handleViewGame(notification.gameId!)}
                            />
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-1 text-blue-600 hover:text-blue-800 rounded"
                          title="Mark as read"
                        >
                          <FontAwesomeIcon icon={faCheck} className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        onClick={() => removeNotification(notification.id)}
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
                onClick={() => {
                  useNotificationStore.getState().clearAll();
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
