import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { API_BASE, API_TOKEN } from "../../config";
import TagEditor from "../common/TagEditor";
import type { GameItem } from "../../types";
import { buildApiUrl } from "../../utils/api";
import "./EditGameModal.css";

type EditGameModalProps = {
  isOpen: boolean;
  onClose: () => void;
  game: GameItem;
  onGameUpdate: (updatedGame: GameItem) => void;
};

export default function EditGameModal({
  isOpen,
  onClose,
  game,
  onGameUpdate,
}: EditGameModalProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(game.title);
  const [summary, setSummary] = useState(game.summary || "");
  const [year, setYear] = useState(game.year?.toString() || "");
  const [month, setMonth] = useState(game.month?.toString() || "");
  const [day, setDay] = useState(game.day?.toString() || "");
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    Array.isArray(game.genre) ? game.genre : game.genre ? [game.genre] : []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(game.title);
      setSummary(game.summary || "");
      setYear(game.year?.toString() || "");
      setMonth(game.month?.toString() || "");
      setDay(game.day?.toString() || "");
      setSelectedGenres(
        Array.isArray(game.genre) ? game.genre : game.genre ? [game.genre] : []
      );
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

    try {
      const updates: any = {};

      if (title !== game.title) updates.title = title;
      if (summary !== (game.summary || "")) updates.summary = summary;
      if (year !== (game.year?.toString() || "")) {
        updates.year = year ? parseInt(year, 10) : null;
      }
      if (month !== (game.month?.toString() || "")) {
        updates.month = month ? parseInt(month, 10) : null;
      }
      if (day !== (game.day?.toString() || "")) {
        updates.day = day ? parseInt(day, 10) : null;
      }

      // Check if genres changed
      const currentGenre = Array.isArray(game.genre)
        ? game.genre
        : game.genre
        ? [game.genre]
        : [];
      if (
        JSON.stringify(selectedGenres.sort()) !==
        JSON.stringify(currentGenre.sort())
      ) {
        updates.genre = selectedGenres.length === 1 ? selectedGenres[0] : selectedGenres;
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
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update game");
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
      };

      onGameUpdate(updatedGame);
      onClose();
    } catch (err: any) {
      setError(String(err.message || err));
    } finally {
      setSaving(false);
    }
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
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            {t("gameDetail.editGame", "Edit Game")}
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
            <label htmlFor="edit-game-title">{t("gameDetail.title", "Title")}</label>
            <input
              id="edit-game-title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="edit-game-modal-field">
            <label htmlFor="edit-game-summary">{t("gameDetail.summary", "Summary")}</label>
            <textarea
              id="edit-game-summary"
              name="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={saving}
              rows={5}
            />
          </div>

          <div className="edit-game-modal-row">
            <div className="edit-game-modal-field">
              <label htmlFor="edit-game-year">{t("gameDetail.year", "Year")}</label>
              <input
                id="edit-game-year"
                name="year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={saving}
                placeholder="YYYY"
              />
            </div>

            <div className="edit-game-modal-field">
              <label htmlFor="edit-game-month">{t("gameDetail.month", "Month")}</label>
              <input
                id="edit-game-month"
                name="month"
                type="number"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                disabled={saving}
                placeholder="MM"
                min="1"
                max="12"
              />
            </div>

            <div className="edit-game-modal-field">
              <label htmlFor="edit-game-day">{t("gameDetail.day", "Day")}</label>
              <input
                id="edit-game-day"
                name="day"
                type="number"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                disabled={saving}
                placeholder="DD"
                min="1"
                max="31"
              />
            </div>
          </div>

          <div className="edit-game-modal-field">
            <label>{t("gameDetail.genre", "Genre")}</label>
            <TagEditor
              selectedTags={selectedGenres}
              onTagsChange={setSelectedGenres}
              disabled={saving}
            />
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
            disabled={saving}
          >
            {saving ? t("common.saving", "Saving...") : t("common.save", "Save")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

