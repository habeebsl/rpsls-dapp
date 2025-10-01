interface ConnectButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function ConnectButton({
  onClick,
  disabled,
}: ConnectButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Connect
    </button>
  );
}
