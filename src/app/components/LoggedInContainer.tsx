'use client';

import StatusIndicator from './StatusIndicator';
import ConnectButton from './ConnectButton';
import LoadingSpinner from './LoadingSpinner';

interface LoggedInContainerProps {
  isConnected: boolean | null; // null = loading, true = connected, false = not connected
  userAddress?: string;
  onConnect: () => void;
}

export default function LoggedInContainer({
  isConnected,
  userAddress,
  onConnect,
}: LoggedInContainerProps) {
  if (isConnected === null) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-100 bg-opacity-50 border">
        <LoadingSpinner size="sm" />
        <span className="text-gray-600 italic">Loading...</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-100 bg-opacity-50 border border-green-200">
        <StatusIndicator isConnected={true} />
        <span className="text-green-800 font-medium">Connected</span>
        {userAddress && (
          <span className="text-green-600 text-sm">
            {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-100 bg-opacity-50 border border-red-200">
      <StatusIndicator isConnected={false} />
      <span className="text-red-800 font-medium">Not Connected</span>
      <ConnectButton onClick={onConnect} />
    </div>
  );
}
