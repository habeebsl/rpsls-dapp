'use client';

import React from 'react';
import { useWalletStore } from '@/stores/walletStore';

interface ConnectionStatusBadgeProps {
  onConnect: () => void;
}

export function ConnectionStatusBadge({
  onConnect,
}: ConnectionStatusBadgeProps) {
  const { isConnected, address } = useWalletStore();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleClick = async () => {
    if (!isConnected) {
      setIsLoading(true);
      try {
        await onConnect();
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-sm font-medium"
      >
        <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></span>
        <span>Loading...</span>
      </button>
    );
  }

  // Connected state
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-sm font-medium">
        <span className="w-2 h-2 rounded-full bg-green-500"></span>
        <span className="hidden min-[360px]:inline">Connected</span>
      </div>
    );
  }

  // Not connected state - clickable button
  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors active:scale-95"
    >
      <span className="w-2 h-2 rounded-full bg-white"></span>
      <span>Connect</span>
    </button>
  );
}
