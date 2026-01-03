import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { API_BASE, API_TOKEN } from "../../config";
import { useLoading } from "../../contexts/LoadingContext";
import type { GameItem } from "../../types";
import { buildApiUrl } from "../../utils/api";
import "./EditGameModal.css";

type LinkExecutableModalProps = {
  isOpen: boolean;
  onClose: () => void;
  game: GameItem;
  onGameUpdate: (updatedGame: GameItem) => void;
};

export default function LinkExecutableModal({
  isOpen,
  onClose,
  game,
  onGameUpdate,
}: LinkExecutableModalProps) {
  const { t } = useTranslation();
  const { setLoading } = useLoading();
  const [command, setCommand] = useState(game.command || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBrowseFile = async () => {
    // Clear any previous errors
    setError(null);
    
    try {
      // Try to use File System Access API (available in Chrome/Edge) to get full path
      if ('showOpenFilePicker' in window) {
        try {
          const [fileHandle] = await (window as any).showOpenFilePicker({
            types: [{
              description: 'Executable files',
              accept: {
                'application/x-executable': ['.exe', '.app', '.sh', '.bat', '.cmd'],
                'application/octet-stream': ['*']
              }
            }],
            excludeAcceptAllOption: false,
            multiple: false
          });
          
          const file = await fileHandle.getFile();
          
          // Try to get the full path from file handle
          // Note: File System Access API doesn't directly expose full path, but we can try
          // In some implementations, the file handle might have path information
          let fullPath = file.name;
          
          // Try different ways to get the path
          if ((fileHandle as any).path) {
            fullPath = (fileHandle as any).path;
          } else if ((file as any).webkitRelativePath) {
            fullPath = (file as any).webkitRelativePath;
          } else if ((file as any).path) {
            fullPath = (file as any).path;
          }
          
          // Even with File System Access API, we usually only get the filename
          // The full path is not exposed for security reasons
          // User will need to manually complete the path
          setCommand(fullPath);
          setError(null);
        } catch (fsError: any) {
          // If File System Access API fails (e.g., user cancelled), fallback to standard input
          if (fsError.name !== 'AbortError') {
            console.error('File System Access API error:', fsError);
            // Fallback to standard file input
            fileInputRef.current?.click();
          }
        }
      } else {
        // Fallback to standard file input
        fileInputRef.current?.click();
      }
    } catch (err: any) {
      console.error('Error in handleBrowseFile:', err);
      // Fallback to standard file input
      fileInputRef.current?.click();
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCommand(game.command || "");
      setError(null);
    }
  }, [isOpen, game]);

  useEffect(() => {
    if (!isOpen) return;

    function handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscKey, true);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscKey, true);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setLoading(true);

    try {
      const updates: any = {};

      // Check if command changed
      const currentCommand = game.command || "";
      if (command.trim() !== currentCommand.trim()) {
        updates.command = command.trim() || null;
      }

      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }

      const url = buildApiUrl(API_BASE, `/games/${game.ratingKey}`);
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": API_TOKEN,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        let errorMessage = "Failed to update game";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          // Translate common error messages
          if (errorMessage === "Game not found in library") {
            errorMessage = t("gameDetail.gameNotInLibrary", "This game is not in the main library. Please add it to the library first.");
          }
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const updatedGame: GameItem = {
        ratingKey: result.game.id,
        title: result.game.title,
        summary: result.game.summary,
        cover: result.game.cover,
        background: result.game.background,
        day: result.game.day,
        month: result.game.month,
        year: result.game.year,
        stars: result.game.stars,
        genre: result.game.genre,
        command: result.game.command || null,
      };

      onGameUpdate(updatedGame);
      onClose();
    } catch (err: any) {
      setError(String(err.message || err));
    } finally {
      setSaving(false);
      setLoading(false);
    }
  };

  const hasChanges = () => {
    const currentCommand = game.command || "";
    return command.trim() !== currentCommand.trim();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="edit-game-modal-overlay" onClick={onClose}>
      <div
        className="edit-game-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="edit-game-modal-header">
          <h2>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: "8px", verticalAlign: "middle" }}
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            {t("gameDetail.linkExecutable", "Link Executable")}
          </h2>
          <button
            className="edit-game-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="edit-game-modal-content">
          {error && (
            <div className="edit-game-modal-error">{error}</div>
          )}

          <div className="edit-game-modal-field">
            <label htmlFor="link-executable-command">
              {t("gameDetail.executablePath", "Executable Path")}
            </label>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <input
                id="link-executable-command"
                name="command"
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                disabled={saving}
                placeholder={t("gameDetail.executablePathPlaceholder", "Enter full path (e.g., /usr/local/bin/game or C:\\Program Files\\Game\\game.exe)")}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={handleBrowseFile}
                disabled={saving}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  color: "white",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "4px",
                  cursor: saving ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  whiteSpace: "nowrap",
                  opacity: saving ? 0.5 : 1,
                  transition: "background-color 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.15)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!saving) {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                  }
                }}
              >
                {t("gameDetail.browseFile", "Browse...")}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // Try to get the full path
                    // Note: Browsers don't allow full path access for security reasons
                    // We try webkitRelativePath first, then fallback to name
                    const filePath = (file as any).webkitRelativePath || (file as any).path || file.name;
                    setCommand(filePath);
                    
                    setError(null);
                  }
                  // Reset the input so the same file can be selected again
                  e.target.value = "";
                }}
                accept="*"
              />
            </div>
            <div style={{ marginTop: "8px", fontSize: "0.875rem", color: "rgba(255, 255, 255, 0.6)" }}>
              {t("gameDetail.executablePathHint", "Enter the full absolute path to the game executable (e.g., /usr/local/bin/game or C:\\Program Files\\Game\\game.exe). You can include arguments after the path.")}
            </div>
          </div>
        </div>

        <div className="edit-game-modal-footer">
          <button
            className="edit-game-modal-cancel"
            onClick={onClose}
            disabled={saving}
          >
            {t("common.cancel", "Cancel")}
          </button>
          <button
            className="edit-game-modal-save"
            onClick={handleSave}
            disabled={saving || !hasChanges()}
          >
            {saving ? t("common.saving", "Saving...") : t("common.save", "Save")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

