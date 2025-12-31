import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import type { CollectionInfo } from "../../types";
import { buildApiUrl } from "../../utils/api";
import "./EditCollectionModal.css";

type EditCollectionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  collection: CollectionInfo;
  apiBase: string;
  apiToken: string;
  onCollectionUpdate: (updatedCollection: CollectionInfo) => void;
};

export default function EditCollectionModal({
  isOpen,
  onClose,
  collection,
  apiBase,
  apiToken,
  onCollectionUpdate,
}: EditCollectionModalProps) {
  const { t } = useTranslation();
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
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscKey);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const updates: any = {};

      if (title !== collection.title) updates.title = title;
      if (summary !== (collection.summary || "")) updates.summary = summary;

      if (Object.keys(updates).length === 0) {
        onClose();
        return;
      }

      const url = buildApiUrl(apiBase, `/collections/${collection.id}`);
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": apiToken,
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
          <h2>{t("collectionDetail.editCollection", "Edit Collection")}</h2>
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
            <label>{t("collectionDetail.title", "Title")}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="edit-collection-modal-field">
            <label>{t("collectionDetail.summary", "Summary")}</label>
            <textarea
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

