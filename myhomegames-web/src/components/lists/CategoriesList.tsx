import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Cover from "../games/Cover";
import type { CategoryItem } from "../../types";
import "./CategoriesList.css";

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
      <Cover
        title={t(`genre.${category.title}`, category.title)}
        coverUrl={buildCoverUrl(apiBase, category.cover)}
        width={coverSize}
        height={coverHeight}
        onClick={handleClick}
        showTitle={true}
        titlePosition="overlay"
        detail={true}
        play={false}
        showBorder={true}
        aspectRatio="16/9"
        brightness={40}
        blur={1}
      />
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

