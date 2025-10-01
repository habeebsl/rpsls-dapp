'use client';

import { useState, ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import LoadingSpinner from './LoadingSpinner';

interface PrimaryButtonProps {
  text?: string;
  onClick?: () => void | Promise<void>;
  width?: number;
  height?: number;
  backgroundColor?: string;
  hoverBackgroundColor?: string;
  shadowColor?: string;
  textColor?: string;
  borderRadius?: string;
  className?: string;
  icon?: IconDefinition;
  iconPosition?: 'left' | 'right';
  iconSize?: 'xs' | 'sm' | 'lg' | 'xl' | '2xl' | '1x' | '2x' | '3x' | '4x' | '5x' | '6x' | '7x' | '8x' | '9x' | '10x';
  shadowTop?: number;
  loadingText?: string;
}

export function PrimaryButton({
  text = "Play a Game",
  onClick,
  width = 138,
  height = 40,
  backgroundColor = "bg-blue-500",
  hoverBackgroundColor = "hover:bg-blue-600",
  shadowColor = "bg-blue-800",
  textColor = "text-white",
  borderRadius = "rounded-lg",
  className = "",
  icon,
  iconPosition = "left",
  iconSize = "sm",
  shadowTop = 3,
  loadingText
}: PrimaryButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleMouseDown = () => {
    if (isLoading) return;
    setIsPressed(true);
  };

  const handleMouseUp = async () => {
    if (isLoading) return;
    setIsPressed(false);
    
    // Call the callback after releasing the click
    if (onClick) {
      try {
        setIsLoading(true);
        await onClick();
      } catch (error) {
        console.error('Button callback error:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleMouseLeave = () => {
    if (isLoading) return;
    // Reset pressed state if mouse leaves while pressed
    setIsPressed(false);
  };

  return (
    <div className={`relative inline-block ${className}`} style={{ width: `${width}px` }}>
      {/* Shadow/background container - hidden when pressed */}
      {!isPressed && (
        <div 
          className={`absolute left-0 ${shadowColor} ${borderRadius}`}
          style={{ 
            top: `${shadowTop}px`,
            width: `${width}px`,
            height: `${height}px`
          }}
        ></div>
      )}
      <button 
        className={`relative z-10 px-3 py-2 ${borderRadius} transition-colors ${textColor} font-medium ${isLoading ? 'bg-gray-400 cursor-not-allowed' : `${backgroundColor} ${hoverBackgroundColor}`} flex items-center justify-center gap-2`}
        style={{ 
          width: `${width}px`,
          height: `${height}px`
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <LoadingSpinner size="sm" />
            <span>{loadingText || 'Loading...'}</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <FontAwesomeIcon icon={icon} size={iconSize} />
            )}
            {text}
            {icon && iconPosition === 'right' && (
              <FontAwesomeIcon icon={icon} size={iconSize} />
            )}
          </>
        )}
      </button>
    </div>
  );
}
