'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGamepad } from '@fortawesome/free-solid-svg-icons';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="mb-6">
          <FontAwesomeIcon
            icon={faGamepad}
            className="text-blue-600 animate-pulse"
            style={{
              fontSize: '6rem',
              animation: 'pulse-scale 1.5s ease-in-out infinite',
            }}
          />
        </div>

        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Loading</h2>
        <p className="text-gray-500">Connecting to MetaMask...</p>

        <div className="flex justify-center mt-4 space-x-1">
          <div
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          ></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-scale {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
