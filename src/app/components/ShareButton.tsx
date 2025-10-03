'use client';

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShare } from '@fortawesome/free-solid-svg-icons';
import { PrimaryButton } from './PrimaryButton';

interface ShareButtonProps {
  gameUrl?: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export function ShareButton({
  gameUrl,
  variant = 'primary',
  className = '',
}: ShareButtonProps) {
  const [showToast, setShowToast] = useState(false);

  const handleShare = async () => {
    const urlToShare = gameUrl || window.location.href;
    const shareData = {
      title: 'Rock Paper Scissors Lizard Spock',
      text: 'Check out this RPSLS game!',
      url: urlToShare,
    };

    // Check if Web Share API is available (mobile devices)
    if (
      navigator.share &&
      /mobile|android|iphone|ipad|ipod/i.test(navigator.userAgent)
    ) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled or error occurred, fallback to copy
        if ((error as Error).name !== 'AbortError') {
          copyToClipboard(urlToShare);
        }
      }
    } else {
      // Desktop or Web Share API not available: copy to clipboard
      copyToClipboard(urlToShare);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (variant === 'secondary') {
    // Simple button style for mobile menu
    return (
      <>
        <button
          onClick={handleShare}
          className={`px-4 py-3 rounded-lg text-base font-medium transition-colors text-gray-700 hover:bg-gray-100 flex items-center gap-3 ${className}`}
        >
          <FontAwesomeIcon icon={faShare} className="text-blue-600" />
          <span>Share Game</span>
        </button>

        {/* Toast Notification */}
        {showToast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
            ✓ Link copied to clipboard!
          </div>
        )}
      </>
    );
  }

  // Primary button style for navbar
  return (
    <>
      <PrimaryButton
        text="Share Game"
        icon={faShare}
        iconPosition="left"
        onClick={handleShare}
        className={className}
      />

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg animate-fade-in">
          ✓ Link copied to clipboard!
        </div>
      )}
    </>
  );
}
