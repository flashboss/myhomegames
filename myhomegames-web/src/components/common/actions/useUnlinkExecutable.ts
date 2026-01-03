import { useState } from "react";
import { API_BASE, getApiToken } from "../../../config";
import { buildApiUrl } from "../../../utils/api";
import { useLoading } from "../../../contexts/LoadingContext";
import type { GameItem } from "../../../types";

type UseUnlinkExecutableParams = {
  gameId: string;
  onGameUpdate: (game: GameItem) => void;
};

type UseUnlinkExecutableReturn = {
  isUnlinking: boolean;
  handleUnlinkExecutable: () => Promise<void>;
};

export function useUnlinkExecutable({
  gameId,
  onGameUpdate,
}: UseUnlinkExecutableParams): UseUnlinkExecutableReturn {
  const { setLoading } = useLoading();
  const [isUnlinking, setIsUnlinking] = useState(false);

  const handleUnlinkExecutable = async () => {
    setIsUnlinking(true);
    setLoading(true);

    try {
      const url = buildApiUrl(API_BASE, `/games/${gameId}`);
      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Auth-Token": getApiToken(),
        },
        body: JSON.stringify({ command: null }),
      });

      if (response.ok) {
        const result = await response.json();
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
          command: null,
        };
        onGameUpdate(updatedGame);
      } else {
        console.error("Failed to unlink executable");
      }
    } catch (error) {
      console.error("Error unlinking executable:", error);
    } finally {
      setIsUnlinking(false);
      setLoading(false);
    }
  };

  return {
    isUnlinking,
    handleUnlinkExecutable,
  };
}

