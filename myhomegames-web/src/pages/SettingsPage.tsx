import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
    <div className="bg-[#1a1a1a] text-white" style={{ width: '100%', height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
      <div className="max-w-4xl mx-auto" style={{ padding: '48px 48px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 600, 
            color: '#ffffff',
            marginBottom: '8px',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
          }}>
            Settings
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: 'rgba(255, 255, 255, 0.6)',
            fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
          }}>
            Configure application preferences
          </p>
        </div>

        <div className="bg-[#1a1a1a]" style={{ borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h2 style={{ 
              fontSize: '18px', 
              fontWeight: 600, 
              color: 'rgba(255, 255, 255, 0.9)',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            }}>
              General
            </h2>
          </div>

          <div style={{ padding: '32px' }}>
            <div style={{ marginBottom: '32px' }}>
              <label style={{ 
                display: 'block',
                fontSize: '14px', 
                fontWeight: 500, 
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '8px',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
              }}>
                Version 1.0.0
              </label>
            </div>

            <div style={{ marginBottom: '40px' }}>
              <label style={{ 
                display: 'block',
                fontSize: '14px', 
                fontWeight: 500, 
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '8px',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
              }}>
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  width: '200px',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  cursor: 'pointer'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#E5A00D';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <option value="en">English</option>
                <option value="it">Italiano</option>
              </select>
              <p style={{ 
                marginTop: '8px',
                fontSize: '12px', 
                color: 'rgba(255, 255, 255, 0.5)',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
              }}>
                Select the application language
              </p>
            </div>

            <div style={{ marginBottom: '40px' }}>
              <label style={{ 
                display: 'block',
                fontSize: '14px', 
                fontWeight: 500, 
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '8px',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
              }}>
                Metadata Path
              </label>
              <input
                type="text"
                value={metadataPath}
                onChange={(e) => setMetadataPath(e.target.value)}
                placeholder="/path/to/metadata"
                style={{
                  width: '100%',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  padding: '12px 16px',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#E5A00D';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              />
              <p style={{ 
                marginTop: '8px',
                fontSize: '12px', 
                color: 'rgba(255, 255, 255, 0.5)',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
              }}>
                Path where game metadata (covers, descriptions, etc.) are stored
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button
                onClick={handleSave}
                style={{
                  padding: '10px 24px',
                  backgroundColor: '#E5A00D',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#000000',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F5B041';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#E5A00D';
                }}
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

