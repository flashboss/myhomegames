import { useState, useEffect } from "react";

type SettingsProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function Settings({ isOpen, onClose }: SettingsProps) {
  const [metadataPath, setMetadataPath] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Load saved metadata path from localStorage, or use default
      const defaultPath = "$HOME/Library/Application\\ Support/MyHomeGames";
      const saved = localStorage.getItem("metadataPath") || defaultPath;
      setMetadataPath(saved);
    }
  }, [isOpen]);

  function handleSave() {
    // Save to localStorage
    localStorage.setItem("metadataPath", metadataPath);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1a] w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden border border-[#2a2a2a]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[#2a2a2a] flex items-center justify-between bg-[#0d0d0d]">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <button
            className="text-gray-400 hover:text-white transition-colors text-sm px-3 py-1 rounded hover:bg-[#2a2a2a]"
            onClick={onClose}
          >
            ✕ Close
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Metadata Path
            </label>
            <input
              type="text"
              value={metadataPath}
              onChange={(e) => setMetadataPath(e.target.value)}
              placeholder="/path/to/metadata"
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-[#E5A00D] transition-colors"
            />
            <p className="mt-2 text-xs text-gray-400">
              Path where game metadata (covers, descriptions, etc.) are stored
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors rounded hover:bg-[#2a2a2a]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-[#E5A00D] hover:bg-[#F5B041] text-black font-semibold rounded transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

