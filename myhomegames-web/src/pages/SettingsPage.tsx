import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SettingsPage.css";

export default function SettingsPage() {
  const [metadataPath, setMetadataPath] = useState("");
  const [language, setLanguage] = useState("en");
  const navigate = useNavigate();

  useEffect(() => {
    // Load saved metadata path from localStorage, or use default
    const defaultPath = "$HOME/Library/Application\\ Support/MyHomeGames";
    const saved = localStorage.getItem("metadataPath") || defaultPath;
    setMetadataPath(saved);

    // Load saved language from localStorage, or use default (English)
    const savedLanguage = localStorage.getItem("language") || "en";
    setLanguage(savedLanguage);
  }, []);

  function handleSave() {
    // Save to localStorage
    localStorage.setItem("metadataPath", metadataPath);
    localStorage.setItem("language", language);
    navigate("/");
  }

  return (
    <div className="bg-[#1a1a1a] text-white settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Configure application preferences</p>
        </div>

        <div className="bg-[#1a1a1a] settings-card">
          <div className="settings-card-header">
            <h2 className="settings-card-title">General</h2>
          </div>

          <div className="settings-card-content">
            <div className="settings-field-small">
              <label className="settings-label">Version {__APP_VERSION__}</label>
            </div>

            <div className="settings-field">
              <label className="settings-label">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="settings-select"
              >
                <option value="en">English</option>
                <option value="it">Italiano</option>
              </select>
              <p className="settings-help-text">
                Select the application language
              </p>
            </div>

            <div className="settings-field">
              <label className="settings-label">Metadata Path</label>
              <input
                type="text"
                value={metadataPath}
                onChange={(e) => setMetadataPath(e.target.value)}
                placeholder="/path/to/metadata"
                className="settings-input"
              />
              <p className="settings-help-text">
                Path where game metadata (covers, descriptions, etc.) are stored
              </p>
            </div>

            <div className="settings-actions">
              <button onClick={handleSave} className="settings-button">
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
