'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LoggedInContainer from './LoggedInContainer';
import { NotificationBell } from './NotificationBell';
import { useWalletStore } from '@/stores/walletStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGamepad } from '@fortawesome/free-solid-svg-icons';
import { PrimaryButton } from './PrimaryButton';

export function NavBar() {
  const { isConnected, address, connect, checkConnection } = useWalletStore();
  const pathname = usePathname();

  // Check wallet connection on component mount only
  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div>
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 bg-white shadow-sm">
        <div className="flex flex-row items-center justify-center gap-2">
          <FontAwesomeIcon
            icon={faGamepad}
            className="text-blue-600"
            size={"2xl"}
          />
          <div className="font-medium text-lg text-blue-600">
            RPSLS
          </div>
        </div>
        <div className="flex gap-4">
          <Link 
            href="/" 
            className={`px-3 py-2 rounded-md transition-colors ${
              pathname === '/' 
                ? 'bg-blue-100 text-blue-700 font-medium' 
                : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
            }`}
          >
            Dashboard
          </Link>
          <Link 
            href="/games" 
            className={`px-3 py-2 rounded-md transition-colors ${
              pathname === '/games' 
                ? 'bg-blue-100 text-blue-700 font-medium' 
                : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
            }`}
          >
            Games
          </Link>
          <PrimaryButton 
            text="Play a Game"
            onClick={() => console.log("Play button clicked!")}
          />
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <LoggedInContainer
            isConnected={isConnected}
            userAddress={address || undefined}
            onConnect={connect}
          />
        </div>
      </nav>
    </div>
  );
}
