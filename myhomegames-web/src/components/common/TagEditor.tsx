import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { API_BASE, getApiToken } from "../../config";
import { buildApiUrl } from "../../utils/api";
import { useLoading } from "../../contexts/LoadingContext";
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
  const { setLoading } = useLoading();
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const url = buildApiUrl(API_BASE, "/categories");
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Auth-Token": getApiToken(),
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

  async function createCategory(title: string): Promise<Category | null> {
    try {
      setLoading(true);
      setIsCreating(true);
      const url = buildApiUrl(API_BASE, "/categories");
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Auth-Token": getApiToken(),
        },
        body: JSON.stringify({ title }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      
      const json = await res.json();
      const newCategory = json.category as Category;
      
      // Add to available categories
      setAvailableCategories((prev) => {
        const updated = [...prev, newCategory];
        updated.sort((a, b) => a.title.localeCompare(b.title));
        return updated;
      });
      
      return newCategory;
    } catch (err: any) {
      console.error("Error creating category:", err);
      return null;
    } finally {
      setLoading(false);
      setIsCreating(false);
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

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagSearch.trim() && !isCreating) {
      e.preventDefault();
      const searchTerm = tagSearch.trim().toLowerCase();
      
      // First, try to find existing category
      const category = availableCategories.find(
        (c) => {
          const translatedName = t(`genre.${c.title}`, c.title).toLowerCase();
          return (
            c.id.toLowerCase() === searchTerm ||
            c.title.toLowerCase() === searchTerm ||
            translatedName === searchTerm ||
            translatedName.includes(searchTerm)
          );
        }
      );
      
      if (category && !selectedTags.includes(category.id)) {
        handleAddTag(category.id);
        return;
      }
      
      // If not found, create new category
      const newCategory = await createCategory(tagSearch.trim());
      if (newCategory && !selectedTags.includes(newCategory.id)) {
        handleAddTag(newCategory.id);
      }
    }
  };

  const filteredSuggestions = availableCategories.filter(
    (c) => {
      if (selectedTags.includes(c.id)) return false;
      const searchTerm = tagSearch.toLowerCase();
      const translatedName = t(`genre.${c.title}`, c.title).toLowerCase();
      return (
        c.id.toLowerCase().includes(searchTerm) ||
        c.title.toLowerCase().includes(searchTerm) ||
        translatedName.includes(searchTerm)
      );
    }
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
          id="tag-editor-input"
          name="tag"
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

