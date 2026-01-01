import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { API_BASE, API_TOKEN } from "../../config";
import "./DropdownMenu.css";

type DropdownMenuProps = {
  onEdit: () => void;
  onDelete?: () => void;
  gameId?: string;
  gameTitle?: string;
  onGameDelete?: (gameId: string) => void;
  collectionId?: string;
  collectionTitle?: string;
  onCollectionDelete?: (collectionId: string) => void;
  className?: string;
};

export default function DropdownMenu({
  onEdit,
  onDelete,
  gameId,
  gameTitle,
  onGameDelete,
  collectionId,
  collectionTitle,
  onCollectionDelete,
  className = "",
}: DropdownMenuProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      
      // Check if click is on the menu button itself
      if (menuRef.current && menuRef.current.contains(target)) {
        return;
      }
      
      // Check if click is on the popup
      if (popupRef.current && popupRef.current.contains(target)) {
        return;
      }
      
      // Also check by class name
      if (target.closest('.dropdown-menu-popup')) {
        return;
      }
      
      // Otherwise, close the dropdown
      setIsOpen(false);
    }

    // Use a delay to avoid immediate closure when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside, true);
    }, 100);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [isOpen]);

  // Block body scroll when modal is open
  useEffect(() => {
    if (showConfirmModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showConfirmModal]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!showConfirmModal) return;
    
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowConfirmModal(false);
        setDeleteError(null);
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showConfirmModal]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    onEdit();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    
    // Se abbiamo le props per gestire la cancellazione internamente (game o collection)
    if (API_TOKEN && ((gameId && gameTitle) || (collectionId && collectionTitle))) {
      setShowConfirmModal(true);
    } else if (onDelete) {
      // Fallback al comportamento precedente
      onDelete();
    }
  };

  const handleConfirmDelete = async () => {
    if (!API_TOKEN) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const { buildApiUrl } = await import("../../utils/api");
      let url: string;

      // Determina se stiamo cancellando un game o una collection
      if (gameId) {
        url = buildApiUrl(API_BASE, `/games/${gameId}`);
      } else if (collectionId) {
        url = buildApiUrl(API_BASE, `/collections/${collectionId}`);
      } else {
        return;
      }

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "X-Auth-Token": API_TOKEN,
        },
      });

      if (response.ok) {
        if (gameId && onGameDelete) {
          onGameDelete(gameId);
        } else if (collectionId && onCollectionDelete) {
          onCollectionDelete(collectionId);
        }
        setShowConfirmModal(false);
      } else {
        setDeleteError(t("common.deleteError"));
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      setDeleteError(t("common.deleteError"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setDeleteError(null);
  };

  return (
    <div className={`dropdown-menu-wrapper ${className}`} ref={menuRef}>
      <button
        onClick={handleToggle}
        className="dropdown-menu-button"
        aria-label="Menu"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>
      {isOpen && (
        <div ref={popupRef} className="dropdown-menu-popup">
          <button
            onClick={handleEdit}
            className="dropdown-menu-item"
          >
            <span>{t("common.edit", "Edit")}</span>
          </button>
          {(onDelete || (API_TOKEN && (gameId || collectionId))) && (
            <button
              onClick={handleDeleteClick}
              className="dropdown-menu-item dropdown-menu-item-danger"
            >
              <span>{t("common.delete", "Delete")}</span>
            </button>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && createPortal(
        <div className="dropdown-menu-confirm-overlay" onClick={handleCancelDelete}>
          <div className="dropdown-menu-confirm-container" onClick={(e) => e.stopPropagation()}>
            <div className="dropdown-menu-confirm-header">
              <h3>{t("common.confirmDelete", { title: gameTitle || collectionTitle || "" })}</h3>
            </div>
            {deleteError && (
              <div className="dropdown-menu-confirm-error">{deleteError}</div>
            )}
            <div className="dropdown-menu-confirm-footer">
              <button
                className="dropdown-menu-confirm-cancel"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                className="dropdown-menu-confirm-delete"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? t("common.deleting", "Deleting...") : t("common.delete", "Delete")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

