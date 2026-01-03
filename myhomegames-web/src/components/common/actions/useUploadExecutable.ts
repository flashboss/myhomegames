import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE, getApiToken } from "../../../config";
import { buildApiUrl } from "../../../utils/api";
import { useLoading } from "../../../contexts/LoadingContext";
import type { GameItem } from "../../../types";

type UseUploadExecutableProps = {
  game: GameItem;
  onGameUpdate: (updatedGame: GameItem) => void;
};

type UseUploadExecutableReturn = {
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (file: File) => Promise<void>;
  handleBrowseClick: () => void;
};

export function useUploadExecutable({
  game,
  onGameUpdate,
}: UseUploadExecutableProps): UseUploadExecutableReturn {
  const { t } = useTranslation();
  const { setLoading } = useLoading();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file extension
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.sh') && !fileName.endsWith('.bat')) {
      alert(t("gameDetail.invalidFileType", "Only .sh and .bat files are allowed"));
      return;
    }

    setIsUploading(true);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const url = buildApiUrl(API_BASE, `/games/${game.ratingKey}/upload-executable`);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-Auth-Token': getApiToken() || '',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to upload file' }));
        throw new Error(errorData.error || 'Failed to upload file');
      }

      const result = await response.json();

      // Update game with the extension from server response
      // The server has already saved it in the JSON, we just update the local state
      if (result.game && onGameUpdate) {
        const updatedGame: GameItem = {
          ratingKey: result.game.id,
          title: result.game.title,
          summary: result.game.summary || "",
          cover: result.game.cover,
          background: result.game.background,
          day: result.game.day || null,
          month: result.game.month || null,
          year: result.game.year || null,
          stars: result.game.stars || null,
          genre: result.game.genre || null,
          criticratings: result.game.criticratings || null,
          userratings: result.game.userratings || null,
          command: result.game.command || null, // Extension saved by server
        };
        onGameUpdate(updatedGame);
      }
    } catch (err: any) {
      console.error('Error uploading file:', err);
      alert(err.message || t("common.error", "Error"));
    } finally {
      setIsUploading(false);
      setLoading(false);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return {
    isUploading,
    fileInputRef,
    handleFileSelect,
    handleBrowseClick,
  };
}

