interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export default function LoadingSpinner({
  size = 'md',
  className = '',
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={`flex ${text ? 'flex-col' : 'flex-row'} items-center justify-center ${text ? 'gap-2' : 'gap-0'} ${className}`}
    >
      <div
        className={`${sizeClasses[size]} border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin flex-shrink-0`}
      />
      {text && <p className="text-sm text-gray-600 animate-pulse">{text}</p>}
    </div>
  );
}
