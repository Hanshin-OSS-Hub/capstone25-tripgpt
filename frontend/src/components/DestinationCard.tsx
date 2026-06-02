import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { MapPin, Star } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const CATEGORY_TAG_COLORS: Record<string, string> = {
  자연:     "bg-green-100 text-green-700 border-green-200",
  랜드마크: "bg-purple-100 text-purple-700 border-purple-200",
  액티비티: "bg-orange-100 text-orange-700 border-orange-200",
  스포츠:   "bg-red-100 text-red-700 border-red-200",
  맛집:     "bg-yellow-100 text-yellow-700 border-yellow-200",
  이벤트:   "bg-pink-100 text-pink-700 border-pink-200",
  핫플:     "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
  역사:     "bg-amber-100 text-amber-700 border-amber-200",
  쇼핑:     "bg-cyan-100 text-cyan-700 border-cyan-200",
};

const TOP_CATEGORIES = new Set(Object.keys(CATEGORY_TAG_COLORS));

const MAX_VISIBLE_TAGS = 4;

interface DestinationCardProps {
  name: string;
  location: string;
  score: number;
  imageUrl: string;
  category: string;
  keywordTags?: string[];
  onClick?: () => void;
  showScore?: boolean;
  isPreferred?: boolean;
  isDimmed?: boolean;
  isHovered?: boolean;
  isMatched?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function DestinationCard({
  name,
  location,
  score,
  imageUrl,
  category,
  keywordTags = [],
  onClick,
  showScore = true,
  isPreferred = false,
  isDimmed = false,
  isHovered = false,
  isMatched = false,
  onMouseEnter,
  onMouseLeave,
}: DestinationCardProps) {
  // 카테고리 태그는 상단에, 세부 키워드는 하단에 분리
  const categoryTags = keywordTags.filter((t) => TOP_CATEGORIES.has(t));
  const subTags = keywordTags.filter((t) => !TOP_CATEGORIES.has(t));
  const allDisplayTags = [...categoryTags, ...subTags];
  const visibleTags = allDisplayTags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenCount = allDisplayTags.length - visibleTags.length;

  const getTagStyle = (tag: string) =>
    CATEGORY_TAG_COLORS[tag] ?? "bg-blue-50 text-blue-600 border-blue-100";
  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-gradient-to-r from-green-500 to-emerald-500";
    if (score >= 75) return "bg-gradient-to-r from-blue-500 to-cyan-500";
    if (score >= 60) return "bg-gradient-to-r from-yellow-500 to-orange-500";
    return "bg-gradient-to-r from-gray-500 to-slate-500";
  };

  return (
    <Card
      className={`overflow-hidden cursor-pointer group bg-white rounded-2xl transition-all duration-300 shadow-md ${
        isMatched
          ? "ring-2 ring-blue-500 shadow-lg shadow-blue-100"
          : isPreferred
          ? "border-2 border-blue-500 ring-2 ring-blue-200"
          : "border border-gray-100"
      } ${
        isHovered
          ? "scale-[1.04] -translate-y-2 shadow-2xl z-20"
          : "scale-100 translate-y-0"
      } ${
        isDimmed
          ? "opacity-50 blur-[1px]"
          : "opacity-100 blur-0"
      }`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="relative h-56 overflow-hidden">
        <ImageWithFallback
          src={imageUrl}
          alt={name}
          className={`w-full h-full object-cover transition-transform duration-500 ${
            isHovered ? "scale-110" : "scale-100"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {isPreferred && (
          <div className="absolute top-4 left-4">
            <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-lg px-3 py-1.5">
              <Star className="w-3.5 h-3.5 mr-1 fill-current" />
              추천
            </Badge>
          </div>
        )}

        {showScore && (
          <div className="absolute top-4 right-4">
            <Badge
              className={`${getScoreColor(score)} text-white border-0 shadow-lg px-3 py-1.5`}
            >
              <Star className="w-3.5 h-3.5 mr-1 fill-current" />
              {score}
            </Badge>
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="mb-3">
          <h3
            className={`mb-2 transition-colors duration-300 ${
              isHovered ? "text-blue-600" : ""
            }`}
          >
            {name}
          </h3>

          <div
            className={`flex items-center transition-colors duration-300 ${
              isHovered ? "text-gray-700" : "text-gray-500"
            }`}
          >
            <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span className="text-sm">{location}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge
            variant="outline"
            className={`transition-all duration-300 ${
              isHovered
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-gray-50 text-gray-700"
            }`}
          >
            {category}
          </Badge>

          {visibleTags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getTagStyle(tag)}`}
            >
              {tag}
            </span>
          ))}

          {hiddenCount > 0 && (
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-500">
              +{hiddenCount}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}