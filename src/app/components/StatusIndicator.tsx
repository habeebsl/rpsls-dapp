interface StatusIndicatorProps {
  isConnected: boolean;
}

export default function StatusIndicator({ isConnected }: StatusIndicatorProps) {
  return (
    <div
      className={`w-3 h-3 rounded-full ${
        isConnected ? 'bg-green-500' : 'bg-red-500'
      }`}
    />
  );
}
