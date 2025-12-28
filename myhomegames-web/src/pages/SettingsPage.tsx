import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SettingsPage.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:4000";
const API_TOKEN = import.meta.env.VITE_API_TOKEN || "";

export default function SettingsPage() {
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Load settings from server
    async function loadSettings() {
      try {
        const url = new URL("/settings", API_BASE);
        const res = await fetch(url.toString(), {
          headers: {
            Accept: "application/json",
            "X-Auth-Token": API_TOKEN,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.language) {
            setLanguage(data.language);
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
        // Fallback to localStorage
        const saved = localStorage.getItem("language");
        if (saved) {
          setLanguage(saved);
        }
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      // Save settings to server
      const url = new URL("/settings", API_BASE);
      const res = await fetch(url.toString(), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": API_TOKEN,
        },
        body: JSON.stringify({
          language: language,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save settings");
      }

      // Also save to localStorage as fallback
      localStorage.setItem("language", language);
      navigate("/");
    } catch (err) {
      console.error("Failed to save settings:", err);
      // Fallback to localStorage
      localStorage.setItem("language", language);
      navigate("/");
    } finally {
      setSaving(false);
    }
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

            <div className="settings-actions">
              <button
                onClick={handleSave}
                className="settings-button"
                disabled={loading || saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
