import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { MapPin, Star } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface DestinationCardProps {
  name: string;
  location: string;
  score: number;
  imageUrl: string;
  category: string;
  onClick?: () => void;
  showScore?: boolean;
  isPreferred?: boolean; // 선호 키워드와 매칭되는지 여부
}

export function DestinationCard({
  name,
  location,
  score,
  imageUrl,
  category,
  onClick,
  showScore = true,
  isPreferred = false,
}: DestinationCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-gradient-to-r from-green-500 to-emerald-500";
    if (score >= 75) return "bg-gradient-to-r from-blue-500 to-cyan-500";
    if (score >= 60) return "bg-gradient-to-r from-yellow-500 to-orange-500";
    return "bg-gradient-to-r from-gray-500 to-slate-500";
  };

  return (
    <Card 
      className={`overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group shadow-md bg-white rounded-2xl ${
        isPreferred 
          ? "border-2 border-blue-500 ring-2 ring-blue-200" 
          : "border-0"
      }`} 
      onClick={onClick}
    >
      <div className="relative h-56 overflow-hidden">
        <ImageWithFallback
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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
            <Badge className={`${getScoreColor(score)} text-white border-0 shadow-lg px-3 py-1.5`}>
              <Star className="w-3.5 h-3.5 mr-1 fill-current" />
              {score}
            </Badge>
          </div>
        )}
      </div>
      <div className="p-5">
        <div className="mb-3">
          <h3 className="mb-2 group-hover:text-blue-600 transition-colors">{name}</h3>
          <div className="flex items-center text-gray-500">
            <MapPin className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span className="text-sm">{location}</span>
          </div>
        </div>
        <Badge variant="outline" className="border-gray-200 text-gray-700 bg-gray-50">
          {category}
        </Badge>
      </div>
    </Card>
  );
}