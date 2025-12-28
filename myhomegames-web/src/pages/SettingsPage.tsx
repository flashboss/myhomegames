import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SettingsPage() {
  const [metadataPath, setMetadataPath] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Load saved metadata path from localStorage, or use default
    const defaultPath = "$HOME/Library/Application\\ Support/MyHomeGames";
    const saved = localStorage.getItem("metadataPath") || defaultPath;
    setMetadataPath(saved);
  }, []);

  function handleSave() {
    // Save to localStorage
    localStorage.setItem("metadataPath", metadataPath);
    navigate("/");
  }

  return (
    <div className="bg-[#1a1a1a] text-white" style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="bg-[#1a1a1a] rounded-lg shadow-2xl overflow-hidden border border-[#2a2a2a]">
          <div className="p-6 border-b border-[#2a2a2a] bg-[#0d0d0d]">
            <h2 className="text-2xl font-semibold text-white">Settings</h2>
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
                onClick={handleSave}
                className="px-4 py-2 bg-[#E5A00D] hover:bg-[#F5B041] text-black font-semibold rounded transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

