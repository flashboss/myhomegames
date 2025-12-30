import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CoverPlaceholder from "../common/CoverPlaceholder";
import "./CategoriesList.css";

type CategoryItem = {
  ratingKey: string;
  title: string;
  cover?: string;
};

type CategoriesListProps = {
  categories: CategoryItem[];
  apiBase: string;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize?: number;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
};

type CategoryListItemProps = {
  category: CategoryItem;
  apiBase: string;
  buildCoverUrl: (apiBase: string, cover?: string) => string;
  coverSize: number;
  itemRefs?: React.RefObject<Map<string, HTMLElement>>;
};

function CategoryListItem({
  category,
  apiBase,
  buildCoverUrl,
  coverSize,
  itemRefs,
}: CategoryListItemProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const showPlaceholder = !category.cover || imageError;
  const coverHeight = coverSize * (9 / 16); // 16:9 aspect ratio (1280x720px)

  const handleClick = () => {
    navigate(`/category/${category.ratingKey}`);
  };

  return (
    <div
      key={category.ratingKey}
      ref={(el) => {
        if (el && itemRefs?.current) {
          itemRefs.current.set(category.ratingKey, el);
        }
      }}
      className="group cursor-pointer categories-list-item"
      style={{ width: `${coverSize}px`, minWidth: `${coverSize}px` }}
      onClick={handleClick}
    >
      <div className="relative aspect-[16/9] bg-[#2a2a2a] rounded overflow-hidden mb-2 transition-all group-hover:shadow-lg group-hover:shadow-[#E5A00D]/20 categories-list-cover">
        {showPlaceholder ? (
          <>
            <CoverPlaceholder
              title=""
              width={coverSize}
              height={coverHeight}
            />
            <div className="categories-list-title-overlay">
              <div className="categories-list-title-inside">
                {t(`genre.${category.title}`, category.title)}
              </div>
            </div>
          </>
        ) : (
          <>
            <img
              src={buildCoverUrl(apiBase, category.cover)}
              alt={t(`genre.${category.title}`, category.title)}
              className="object-cover w-full h-full"
              onError={() => {
                setImageError(true);
              }}
            />
            <div className="categories-list-title-overlay">
              <div className="categories-list-title-inside">
                {t(`genre.${category.title}`, category.title)}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CategoriesList({
  categories,
  apiBase,
  buildCoverUrl,
  coverSize = 150,
  itemRefs,
}: CategoriesListProps) {
  const { t } = useTranslation();
  
  if (categories.length === 0) {
    return <div className="text-gray-400 text-center">{t("table.noGames")}</div>;
  }

  return (
    <div
      className="categories-list-container"
      style={{ gridTemplateColumns: `repeat(auto-fill, ${coverSize}px)` }}
    >
      {categories.map((category) => (
        <CategoryListItem
          key={category.ratingKey}
          category={category}
          apiBase={apiBase}
          buildCoverUrl={buildCoverUrl}
          coverSize={coverSize}
          itemRefs={itemRefs}
        />
      ))}
    </div>
  );
}

