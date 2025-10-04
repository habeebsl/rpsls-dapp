'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LoggedInContainer from './LoggedInContainer';
import { NotificationBell } from './NotificationBell';
import { ConnectionStatusBadge } from './ConnectionStatusBadge';
import { MobileMenu } from './MobileMenu';
import { ShareButton } from './ShareButton';
import { useWalletStore } from '@/stores/walletStore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGamepad, faBars } from '@fortawesome/free-solid-svg-icons';
import { PrimaryButton } from './PrimaryButton';
import { GameCreationModal } from './GameCreationModal';

export function NavBar() {
  const { isConnected, address, connect, checkConnection } = useWalletStore();
  const pathname = usePathname();
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isGamePage = pathname?.startsWith('/game/');

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
            size={'2xl'}
          />
          <div className="font-medium text-lg text-blue-600">RPSLS</div>
        </div>

        <div className="hidden md:flex gap-4">
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
          {isGamePage ? (
            <ShareButton />
          ) : (
            <PrimaryButton
              text="Play a Game"
              onClick={() => setIsGameModalOpen(true)}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <ConnectionStatusBadge onConnect={connect} />
          </div>

          <NotificationBell />

          <div className="hidden md:block">
            <LoggedInContainer
              isConnected={isConnected}
              userAddress={address || undefined}
              onConnect={connect}
            />
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <FontAwesomeIcon
              icon={faBars}
              className="text-gray-700"
              size="lg"
            />
          </button>
        </div>
      </nav>

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onPlayGame={() => setIsGameModalOpen(true)}
      />

      <GameCreationModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
      />
    </div>
  );
}
