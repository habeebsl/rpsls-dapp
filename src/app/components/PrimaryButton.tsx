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
  iconSize?:
    | 'xs'
    | 'sm'
    | 'lg'
    | 'xl'
    | '2xl'
    | '1x'
    | '2x'
    | '3x'
    | '4x'
    | '5x'
    | '6x'
    | '7x'
    | '8x'
    | '9x'
    | '10x';
  shadowTop?: number;
  loadingText?: string;
}

export function PrimaryButton({
  text = 'Play a Game',
  onClick,
  width,
  height = 40,
  backgroundColor = 'bg-blue-500',
  hoverBackgroundColor = 'hover:bg-blue-600',
  shadowColor = 'bg-blue-800',
  textColor = 'text-white',
  borderRadius = 'rounded-lg',
  className = '',
  icon,
  iconPosition = 'left',
  iconSize = 'sm',
  shadowTop = 3,
  loadingText,
}: PrimaryButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Use explicit width if provided, otherwise let CSS handle it
  const widthStyle = width !== undefined ? `${width}px` : undefined;

  const handleMouseDown = () => {
    if (isLoading || !onClick) return;
    setIsPressed(true);
  };

  const handleMouseUp = async () => {
    if (isLoading || !onClick) return;
    setIsPressed(false);

    try {
      setIsLoading(true);
      await onClick();
    } catch (error) {
      console.error('Button action failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMouseLeave = () => {
    if (isLoading || !onClick) return;
    setIsPressed(false);
  };

  return (
    <div
      className={`relative ${className}`}
      style={{
        width: widthStyle,
        height: `${height + shadowTop}px`,
        overflow: widthStyle ? 'hidden' : 'visible',
      }}
    >
      {!isPressed && (
        <div
          className={`absolute left-0 right-0 ${borderRadius} ${isLoading ? 'bg-gray-600' : shadowColor}`}
          style={{
            top: `${shadowTop}px`,
            width: widthStyle,
            height: `${height}px`,
          }}
        ></div>
      )}
      <button
        className={`relative z-10 px-3 py-2 ${borderRadius} transition-colors ${textColor} font-medium ${isLoading ? 'bg-gray-400 cursor-not-allowed' : `${backgroundColor} ${hoverBackgroundColor}`} flex items-center justify-center gap-2 overflow-hidden w-full`}
        style={{
          width: widthStyle,
          height: `${height}px`,
          top: isPressed && !isLoading && onClick ? `${shadowTop}px` : '0px',
        }}
        onMouseDown={!isLoading && onClick ? handleMouseDown : undefined}
        onMouseUp={!isLoading && onClick ? handleMouseUp : undefined}
        onMouseLeave={!isLoading && onClick ? handleMouseLeave : undefined}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <LoadingSpinner size={height <= 35 ? 'xs' : 'sm'} />
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
