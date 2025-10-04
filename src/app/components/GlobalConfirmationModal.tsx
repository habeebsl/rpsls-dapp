'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { PrimaryButton } from './PrimaryButton';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { getMoveIcon } from '@/lib/moves';

export function GlobalConfirmationModal() {
  const {
    isOpen,
    isLoading,
    move,
    title,
    message,
    confirmText,
    cancelText,
    executeConfirm,
    closeConfirmation,
    onCancel,
  } = useConfirmationStore();

  if (!isOpen) return null;

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
    closeConfirmation();
  };

  const handleConfirm = async () => {
    await executeConfirm();
  };

  const moveIcon = move ? getMoveIcon(move) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black opacity-30"
        onClick={!isLoading ? handleCancel : undefined}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        {!isLoading && (
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 px-2 py-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
          >
            <FontAwesomeIcon icon={faTimes} size={'sm'} />
          </button>
        )}

        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>

          {move && (
            <div className="mb-4">
              <div className="w-20 h-20 mx-auto mb-3 bg-blue-50 rounded-full flex items-center justify-center border-2 border-blue-200">
                  <FontAwesomeIcon
                    icon={moveIcon}
                    className="text-3xl text-blue-600"
                  />
              </div>
              <div className="text-lg font-semibold text-gray-800 mb-2">
                {move}
              </div>
            </div>
          )}

          <p className="text-gray-600 mb-6">{message}</p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className={`px-6 py-2 rounded-lg border-2 transition-colors ${
                isLoading
                  ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {cancelText}
            </button>

            {/* Confirm Button with Loading State */}
            <PrimaryButton
              text={confirmText}
              loadingText={'Processing...'}
              width={160}
              height={40}
              backgroundColor={isLoading ? 'bg-gray-400' : 'bg-blue-500'}
              hoverBackgroundColor={
                isLoading ? 'hover:bg-gray-400' : 'hover:bg-blue-600'
              }
              shadowColor={isLoading ? 'bg-gray-600' : 'bg-blue-700'}
              onClick={!isLoading ? handleConfirm : undefined}
              className={`transition-colors ${
                isLoading ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
