import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { createPortal } from "react-dom";
import { API_BASE, getApiToken } from "../../config";
import { buildApiUrl } from "../../utils/api";
import Tooltip from "./Tooltip";
import "./DropdownMenu.css";

type DropdownMenuProps = {
  onEdit?: () => void;
  onDelete?: () => void;
  onReload?: () => void;
  gameId?: string;
  gameTitle?: string;
  onGameDelete?: (gameId: string) => void;
  collectionId?: string;
  collectionTitle?: string;
  onCollectionDelete?: (collectionId: string) => void;
  className?: string;
  horizontal?: boolean;
  onModalOpen?: () => void;
  onModalClose?: () => void;
  toolTipDelay?: number;
};

export default function DropdownMenu({
  onEdit,
  onDelete,
  onReload,
  gameId,
  gameTitle,
  onGameDelete,
  collectionId,
  collectionTitle,
  onCollectionDelete,
  className = "",
  horizontal = false,
  onModalOpen,
  onModalClose,
  toolTipDelay = 0,
}: DropdownMenuProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
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
    if (onModalOpen) {
      onModalOpen();
    }
    if (onEdit) {
      onEdit();
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    
    // Se abbiamo le props per gestire la cancellazione internamente (game o collection)
    const apiToken = getApiToken();
    if (apiToken && ((gameId && gameTitle) || (collectionId && collectionTitle))) {
      if (onModalOpen) {
        onModalOpen();
      }
      setShowConfirmModal(true);
    } else if (onDelete) {
      // Fallback al comportamento precedente
      onDelete();
    }
  };

  const handleReload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    
    if (onReload) {
      // Se c'è una callback personalizzata, usala
      onReload();
      return;
    }
    
    // Altrimenti gestisci il reload internamente
    const apiToken = getApiToken();
    if (!API_BASE || !apiToken) {
      console.error("API_BASE or API_TOKEN not available");
      return;
    }
    
    setIsReloading(true);
    
    try {
      const url = buildApiUrl(API_BASE, "/reload-games");
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "X-Auth-Token": apiToken,
        },
      });

      if (response.ok) {
        // Reload the page to show updated data
        window.location.reload();
      } else {
        console.error("Failed to reload metadata");
        setIsReloading(false);
      }
    } catch (error) {
      console.error("Error reloading metadata:", error);
      setIsReloading(false);
    }
  };

  const handleConfirmDelete = async () => {
    const apiToken = getApiToken();
    if (!apiToken) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
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
          "X-Auth-Token": apiToken,
        },
      });

      if (response.ok) {
        if (gameId && onGameDelete) {
          onGameDelete(gameId);
        } else if (collectionId && onCollectionDelete) {
          onCollectionDelete(collectionId);
        }
        setShowConfirmModal(false);
        if (onModalClose) {
          onModalClose();
        }
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
    if (onModalClose) {
      onModalClose();
    }
  };

  const buttonContent = (
    <button
      onClick={handleToggle}
      className="dropdown-menu-button"
      aria-label="Menu"
    >
      {horizontal ? (
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
          <circle cx="5" cy="12" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="19" cy="12" r="1" />
        </svg>
      ) : (
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
      )}
    </button>
  );

  return (
    <div className={`dropdown-menu-wrapper ${className}`} ref={menuRef}>
      {toolTipDelay > 0 ? (
        <Tooltip text={t("common.more", "More")} delay={toolTipDelay}>
          {buttonContent}
        </Tooltip>
      ) : (
        buttonContent
      )}
      {isOpen && (
        <div ref={popupRef} className="dropdown-menu-popup">
          {onEdit && (
            <button
              onClick={handleEdit}
              className="dropdown-menu-item"
            >
              <span>{t("common.edit", "Edit")}</span>
            </button>
          )}
          {onReload && (
            <button
              onClick={handleReload}
              className="dropdown-menu-item"
              disabled={isReloading}
            >
              <span>{isReloading ? t("common.reloadingMetadata", "Reloading metadata...") : t("common.reloadMetadata", "Reload all metadata")}</span>
            </button>
          )}
          {(onDelete || (getApiToken() && (gameId || collectionId))) && (
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
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                {t("common.deleteTitle", "Delete")}
              </h2>
              <button
                className="dropdown-menu-confirm-close"
                onClick={handleCancelDelete}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="dropdown-menu-confirm-content">
              <p>{t("common.confirmDelete", { title: gameTitle || collectionTitle || "" })}</p>
              {deleteError && (
                <div className="dropdown-menu-confirm-error">{deleteError}</div>
              )}
            </div>
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

