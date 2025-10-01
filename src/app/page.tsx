'use client';

import { useState, useEffect } from 'react';
import { faWallet, faTrophy } from '@fortawesome/free-solid-svg-icons';
import { useNotificationStore } from '@/stores/notificationStore';
import { useWalletStore } from '@/stores/walletStore';
import { PrimaryButton } from '@/app/components/PrimaryButton';
import { LoadingScreen } from '@/app/components/LoadingScreen';

export default function Home() {
  const { addNotification } = useNotificationStore();
  const { isConnected, address, connect, isLoading } = useWalletStore();
  
  // Real wins data from Redis
  const [userWins, setUserWins] = useState(0);
  const [displayWins, setDisplayWins] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoadingWins, setIsLoadingWins] = useState(false);

  // Fetch user wins from API
  const fetchUserWins = async () => {
    if (!address || !isConnected) {
      setUserWins(0);
      return;
    }

    try {
      setIsLoadingWins(true);
      const response = await fetch(`/api/wins?address=${address}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch wins');
      }
      
      const data = await response.json();
      setUserWins(data.wins);
    } catch (error) {
      console.error('Error fetching user wins:', error);
      setUserWins(0);
    } finally {
      setIsLoadingWins(false);
    }
  };

  // Load user wins when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchUserWins();
    } else {
      setUserWins(0);
      setDisplayWins(0);
    }
  }, [isConnected, address]);

  // Counting animation effect
  useEffect(() => {
    if (isConnected && userWins > 0) {
      setIsAnimating(true);
      setDisplayWins(0);
      
      const duration = 1500; // 1.5 seconds
      const steps = Math.min(userWins, 30); // Max 30 steps for smooth animation
      const stepValue = userWins / steps;
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const newValue = Math.round(stepValue * currentStep);
        setDisplayWins(Math.min(newValue, userWins));
        
        if (currentStep >= steps) {
          clearInterval(timer);
          setDisplayWins(userWins);
          setIsAnimating(false);
        }
      }, stepDuration);
      
      return () => clearInterval(timer);
    } else {
      setDisplayWins(userWins);
    }
  }, [isConnected, userWins]);

  const testWinsIncrease = async () => {
    if (!address) return;
    
    // Add a test win to the user's game history via API
    try {
      const testGame = {
        timestamp: new Date().toISOString(),
        stake: '0.1',
        contractAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
        status: 'completed' as const,
        salt: Math.random().toString(36).substring(7),
        type: 'win' as const,
        opponent: '0x1234567890123456789012345678901234567890',
        playerChoice: 'rock',
        opponentChoice: 'scissors'
      };

      const response = await fetch('/api/test-game', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          gameResult: testGame
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add test game');
      }
      
      // Refresh the wins count
      await fetchUserWins();
    } catch (error) {
      console.error('Error adding test game:', error);
    }
  };

  const testNotifications = () => {
    addNotification('Welcome to RPSLS DApp! 🎉', 'success');
    setTimeout(() => {
      addNotification('Alice wants to play RPSLS with you!', 'game-request', 'accept', 'game123', 'Alice');
    }, 1000);
    setTimeout(() => {
      addNotification('Your move is needed in game vs Bob', 'move-needed', 'view', 'game456');
    }, 2000);
    setTimeout(() => {
      addNotification('Charlie has invited you to a new game', 'game-request', 'accept', 'game789', 'Charlie');
    }, 3000);
  };

  // Show loading screen when wallet is still connecting or loading wins
  if (isLoading || isConnected === null || (isConnected && isLoadingWins)) {
    return <LoadingScreen />;
  }

  return (
    <div className="bg-gray-100 min-h-screen pt-20 flex items-center justify-center">
      <main className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto">
          {/* Main Heading */}
          <h1 className="text-5xl font-bold text-gray-800 mb-16">
            {isConnected ? "Welcome back!" : "Hey New guy"}
          </h1>
          
          {/* Sub Text */}
          {isConnected ? (
            <div className="mb-16">
              <p className="text-2xl text-gray-600 mb-4">You have</p>
              <div className="text-8xl mb-4" style={{ minWidth: '300px', display: 'inline-block' }}>
                <span 
                  className={`text-yellow-500 ${isAnimating ? 'animate-pulse' : ''}`}
                  style={{ 
                    fontFamily: 'monospace',
                    fontWeight: '900',
                    fontSize: '6rem',
                    WebkitTextStroke: '6px black',
                    textShadow: '0 0 0 6px black, 0 0 0 12px black, 0 0 0 18px black'
                  }}
                >
                  {displayWins}
                </span>
              </div>
              <p className="text-2xl text-gray-600">wins</p>
            </div>
          ) : (
            <p className="text-xl text-gray-600 mb-16">
              Connect your account to play a game
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col items-center gap-6">
            {!isConnected ? (
              <PrimaryButton
                text="Connect"
                icon={faWallet}
                shadowTop={4}
                width={200}
                height={50}
                backgroundColor="bg-black"
                hoverBackgroundColor="hover:bg-gray-600"
                shadowColor="bg-gray-700"
                onClick={connect}
              />
            ) : (
              <PrimaryButton
                text="Challenge Someone"
                icon={faTrophy}
                iconSize={"lg"}
                shadowTop={4}
                width={280}
                height={60}
                backgroundColor="bg-green-500"
                hoverBackgroundColor="hover:bg-green-600"
                shadowColor="bg-green-700"
                className="text-xl font-bold"
                onClick={() => console.log("Challenge someone clicked!")}
              />
            )}
          </div>

          {/* Dev Testing Buttons */}
          {/* <div className="mt-12 pt-8 border-t border-gray-300 space-y-3">
            <div>
              <button
                onClick={testNotifications}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors mr-4"
              >
                Test Notifications (Dev)
              </button>
              {isConnected && (
                <button
                  onClick={testWinsIncrease}
                  className="text-sm text-yellow-600 hover:text-yellow-800 transition-colors"
                >
                  <FontAwesomeIcon icon={faDice} className="mr-1" />
                  Test Wins Animation (Dev)
                </button>
              )}
            </div>
          </div> */}
        </div>
      </main>
    </div>
  );
}
