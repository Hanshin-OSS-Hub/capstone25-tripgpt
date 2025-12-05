import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface ChatInputProps {
  onKeywordsChange: (keywords: string[]) => void;
  placeholder?: string;
  selectedKeywords: string[];
}

export function ChatInput({ 
  onKeywordsChange, 
  placeholder = "관광지 키워드를 입력하세요",
  selectedKeywords = []
}: ChatInputProps) {
  const [keyword, setKeyword] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // 카테고리별 추천 키워드
  const categoryTags = {
    자연: ["바다", "산", "폭포", "동굴", "섬", "계곡", "캠핑", "기타"],
    랜드마크: ["타워", "궁궐", "성당", "다리", "기타"],
    액티비티: ["놀이공원", "테마파크", "레저", "체험", "기타"],
    스포츠: ["야구", "축구", "농구", "배구", "골프", "볼링", "기타"],
    맛집: ["시장", "먹거리거리", "카페거리", "해산물", "중식", "일식", "양식", "한식", "디저트", "기타"],
    이벤트: ["축제", "연극", "뮤지컬", "전시", "팝업", "기타"],
    핫플: ["포토존", "야경", "버스킹", "대학로", "기타"],
    역사: ["전통문화", "사찰", "유적", "박물관", "기타"]
  };

  const handleAddKeyword = (newKeyword: string) => {
    if (newKeyword.trim() && !selectedKeywords.includes(newKeyword.trim())) {
      onKeywordsChange([...selectedKeywords, newKeyword.trim()]);
    }
    setKeyword("");
  };

  const handleToggleKeyword = (tag: string) => {
    if (selectedKeywords.includes(tag)) {
      onKeywordsChange(selectedKeywords.filter(k => k !== tag));
    } else {
      onKeywordsChange([...selectedKeywords, tag]);
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    onKeywordsChange(selectedKeywords.filter(k => k !== keywordToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddKeyword(keyword);
    }
  };

  const toggleCategory = (category: string) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(expandedCategories.filter(c => c !== category));
    } else {
      setExpandedCategories([...expandedCategories, category]);
    }
  };

  // 카테고리 아이콘 매핑
  const categoryIcons: Record<string, string> = {
    자연: "🌊",
    랜드마크: "🏛️",
    액티비티: "🎢",
    스포츠: "⚽",
    맛집: "🍜",
    이벤트: "🎉",
    핫플: "📸",
    역사: "🏯"
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
      {/* 선택된 키워드 표시 */}
      {selectedKeywords.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-100"
        >
          <span className="text-sm text-gray-600 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            선택된 키워드
          </span>
          <AnimatePresence>
            {selectedKeywords.map((kw) => (
              <motion.div
                key={kw}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-sm"
              >
                <span>{kw}</span>
                <button
                  onClick={() => handleRemoveKeyword(kw)}
                  className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* 입력 필드 */}
      <div className="flex gap-3 mb-4 bg-gray-50 rounded-xl p-2">
        <Input
          type="text"
          placeholder={placeholder}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1 border-0 bg-transparent focus-visible:ring-0"
        />
        <Button 
          onClick={() => handleAddKeyword(keyword)} 
          disabled={!keyword.trim()}
          className="px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg"
        >
          추가
        </Button>
      </div>

      {/* 추천 키워드 - 컴팩트 버전 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">카테고리</span>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent"></div>
        </div>
        
        {/* 카테고리 버튼들을 가로로 배치 */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryTags).map(([category, tags]) => {
            const isExpanded = expandedCategories.includes(category);
            return (
              <motion.button
                key={category}
                onClick={() => toggleCategory(category)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-3 py-1.5 rounded-full text-sm transition-all shadow-sm ${
                  isExpanded
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 hover:from-gray-200 hover:to-gray-100"
                }`}
              >
                <span className="mr-1">{categoryIcons[category]}</span>
                {category}
              </motion.button>
            );
          })}
        </div>

        {/* 펼쳐진 카테고리의 키워드들 */}
        <AnimatePresence>
          {expandedCategories.map((category) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-blue-700">
                    {categoryIcons[category]} {category}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categoryTags[category as keyof typeof categoryTags].map((tag) => {
                    const isSelected = selectedKeywords.includes(tag);
                    return (
                      <motion.button
                        key={tag}
                        onClick={() => handleToggleKeyword(tag)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                          isSelected
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                            : "bg-white text-blue-700 hover:bg-blue-100 border border-blue-200"
                        }`}
                      >
                        {tag}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}