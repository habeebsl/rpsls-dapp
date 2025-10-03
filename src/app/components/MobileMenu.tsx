'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { PrimaryButton } from './PrimaryButton';
import { ShareButton } from './ShareButton';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayGame: () => void;
}

export function MobileMenu({ isOpen, onClose, onPlayGame }: MobileMenuProps) {
  const pathname = usePathname();

  // Check if we're on a game page
  const isGamePage = pathname?.startsWith('/game/');

  const handlePlayGame = () => {
    onClose();
    onPlayGame();
  };

  const handleLinkClick = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
        onClick={onClose}
      />

      {/* Menu Drawer */}
      <div className="fixed top-0 right-0 bottom-0 w-72 bg-white shadow-2xl z-50 md:hidden animate-slide-in-right">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <FontAwesomeIcon
              icon={faTimes}
              className="text-gray-600"
              size="lg"
            />
          </button>
        </div>

        {/* Menu Content */}
        <div className="flex flex-col p-4 gap-3">
          {/* Navigation Links */}
          <Link
            href="/"
            onClick={handleLinkClick}
            className={`px-4 py-3 rounded-lg text-base font-medium transition-colors ${
              pathname === '/'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Dashboard
          </Link>

          <Link
            href="/games"
            onClick={handleLinkClick}
            className={`px-4 py-3 rounded-lg text-base font-medium transition-colors ${
              pathname === '/games'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Games
          </Link>

          {/* Divider */}
          <div className="border-t border-gray-200 my-2" />

          {/* Share Button - Only show on game pages */}
          {isGamePage && <ShareButton variant="secondary" className="w-full" />}

          {/* Play a Game Button */}
          <PrimaryButton
            text="Play a Game"
            onClick={handlePlayGame}
            className="w-full"
          />
        </div>
      </div>
    </>
  );
}
