import { useState } from "react";

export function useConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState({
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    onConfirm: null,
    isLoading: false
  });

  const confirm = ({ title, message, confirmText = "Confirm", cancelText = "Cancel" }) => {
    return new Promise((resolve) => {
      setConfig({
        title,
        message,
        confirmText,
        cancelText,
        onConfirm: resolve,
        isLoading: false
      });
      setIsOpen(true);
    });
  };

  const handleConfirm = async () => {
    setConfig(prev => ({ ...prev, isLoading: true }));
    if (config.onConfirm) {
      config.onConfirm(true);
    }
    setIsOpen(false);
    setConfig(prev => ({ ...prev, isLoading: false }));
  };

  const handleCancel = () => {
    if (config.isLoading) return;
    if (config.onConfirm) {
      config.onConfirm(false);
    }
    setIsOpen(false);
  };

  const ConfirmDialog = () => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-gray-100 shadow-2xl">
          <h3 className="text-lg font-black text-[#1E2761] mb-2">{config.title}</h3>
          <p className="text-sm text-gray-600 mb-6">{config.message}</p>
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
            <button
              onClick={handleCancel}
              disabled={config.isLoading}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              {config.cancelText}
            </button>
            <button
              onClick={handleConfirm}
              disabled={config.isLoading}
              className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-50"
            >
              {config.isLoading ? "Processing..." : config.confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return { confirm, ConfirmDialog };
}
