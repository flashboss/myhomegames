import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { API_BASE, API_TOKEN } from "../../config";
import { useLoading } from "../../contexts/LoadingContext";
import type { CollectionInfo } from "../../types";
import { buildApiUrl } from "../../utils/api";
import "./EditCollectionModal.css";

type EditCollectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  collection: CollectionInfo;
  onCollectionUpdate: (updatedCollection: CollectionInfo) => void;
};

export default function EditCollectionModal({
  isOpen,
  onClose,
  collection,
  onCollectionUpdate,
}: EditCollectionModalProps) {
  const { t } = useTranslation();
  const { setLoading } = useLoading();
  const [title, setTitle] = useState(collection.title);
  const [summary, setSummary] = useState(collection.summary || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(collection.title);
      setSummary(collection.summary || "");
      setError(null);
    }
  }, [isOpen, collection]);

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

  const hasChanges = () => {
    return (
      title.trim() !== collection.title.trim() ||
      summary.trim() !== (collection.summary || "").trim()
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setLoading(true);

    try {
      const updates: any = {};

      if (title.trim() !== collection.title.trim()) updates.title = title.trim();
      if (summary.trim() !== (collection.summary || "").trim()) updates.summary = summary.trim();

      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }

      const url = buildApiUrl(API_BASE, `/collections/${collection.id}`);
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
        throw new Error(errorData.error || "Failed to update collection");
      }

      const result = await response.json();
      const updatedCollection: CollectionInfo = {
        id: result.collection.id,
        title: result.collection.title,
        summary: result.collection.summary,
        cover: result.collection.cover,
        background: result.collection.background,
      };

      onCollectionUpdate(updatedCollection);
      onClose();
    } catch (err: any) {
      setError(String(err.message || err));
    } finally {
      setSaving(false);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="edit-collection-modal-overlay" onClick={onClose}>
      <div
        className="edit-collection-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="edit-collection-modal-header">
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
            {t("collectionDetail.editCollection", "Edit Collection")}
          </h2>
          <button
            className="edit-collection-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="edit-collection-modal-content">
          {error && (
            <div className="edit-collection-modal-error">{error}</div>
          )}

          <div className="edit-collection-modal-field">
            <label htmlFor="edit-collection-title">{t("collectionDetail.title", "Title")}</label>
            <input
              id="edit-collection-title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="edit-collection-modal-field">
            <label htmlFor="edit-collection-summary">{t("collectionDetail.summary", "Summary")}</label>
            <textarea
              id="edit-collection-summary"
              name="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              disabled={saving}
              rows={5}
            />
          </div>
        </div>

        <div className="edit-collection-modal-footer">
          <button
            className="edit-collection-modal-cancel"
            onClick={onClose}
            disabled={saving}
          >
            {t("common.cancel", "Cancel")}
          </button>
          <button
            className="edit-collection-modal-save"
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

