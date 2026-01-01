import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE, API_TOKEN } from "../../config";
import { buildApiUrl } from "../../utils/api";
import "./TagEditor.css";

type Category = {
  id: string;
  title: string;
};

type TagEditorProps = {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
};

export default function TagEditor({
  selectedTags,
  onTagsChange,
  disabled = false,
  placeholder,
}: TagEditorProps) {
  const { t } = useTranslation();
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [tagSearch, setTagSearch] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const url = buildApiUrl(API_BASE, "/categories");
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Auth-Token": API_TOKEN,
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const items = (json.categories || []) as Category[];
      setAvailableCategories(items);
    } catch (err: any) {
      console.error("Error fetching categories:", err);
    }
  }

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((t) => t !== tagId));
  };

  const handleAddTag = (tagId: string) => {
    if (!selectedTags.includes(tagId)) {
      onTagsChange([...selectedTags, tagId]);
      setTagSearch("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagSearch.trim()) {
      e.preventDefault();
      const category = availableCategories.find(
        (c) =>
          c.id.toLowerCase() === tagSearch.trim().toLowerCase() ||
          c.title.toLowerCase() === tagSearch.trim().toLowerCase()
      );
      if (category && !selectedTags.includes(category.id)) {
        handleAddTag(category.id);
      }
    }
  };

  const filteredSuggestions = availableCategories.filter(
    (c) =>
      !selectedTags.includes(c.id) &&
      (c.id.toLowerCase().includes(tagSearch.toLowerCase()) ||
        c.title.toLowerCase().includes(tagSearch.toLowerCase()))
  );

  return (
    <div className="tag-editor-container">
      <div className="tag-editor-tags">
        {selectedTags.map((tagId) => {
          const category = availableCategories.find(
            (c) => c.id === tagId || c.title === tagId
          );
          const displayName = category
            ? t(`genre.${category.title}`, category.title)
            : tagId;
          return (
            <span key={tagId} className="tag-editor-tag">
              {displayName}
              <button
                type="button"
                className="tag-editor-tag-remove"
                onClick={() => handleRemoveTag(tagId)}
                disabled={disabled}
              >
                ×
              </button>
            </span>
          );
        })}
        <input
          type="text"
          value={tagSearch}
          onChange={(e) => setTagSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder || t("gameDetail.addGenre", "Add genre...")}
          className="tag-editor-input"
        />
      </div>
      {tagSearch && filteredSuggestions.length > 0 && (
        <div className="tag-editor-suggestions">
          {filteredSuggestions.slice(0, 5).map((category) => (
            <button
              key={category.id}
              type="button"
              className="tag-editor-suggestion"
              onClick={() => handleAddTag(category.id)}
              disabled={disabled}
            >
              {t(`genre.${category.title}`, category.title)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

