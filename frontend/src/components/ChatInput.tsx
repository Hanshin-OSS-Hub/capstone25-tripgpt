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

const CATEGORY_TAGS: Record<string, string[]> = {
  자연: ["바다", "해변", "해수욕장", "계곡", "폭포", "산", "공원"],
  랜드마크: ["타워", "전망대", "대교", "광장", "건축", "사찰"],
  액티비티: ["놀이공원", "테마파크", "체험", "레포츠"],
  스포츠: ["야구", "축구", "농구", "배구", "골프", "볼링", , "체육관"],
  맛집: ["시장", "먹거리거리", "카페거리", "해산물", "중식", "일식", "양식", "한식"],
  이벤트: ["축제", "공연", "뮤직페어", "전시", "팝업"],
  핫플: ["포토존", "야경", "뷰포인트", "드라이브", "카페거리"],
  역사: ["전통문화", "사찰", "유적", "박물관", "궁궐"],
};

const CATEGORY_ICONS: Record<string, string> = {
  자연: "🌿",
  랜드마크: "🗼",
  액티비티: "🎢",
  스포츠: "🏟️",
  맛집: "🍜",
  이벤트: "🎪",
  핫플: "📸",
  역사: "🏛️",
};

export function ChatInput({
  onKeywordsChange,
  placeholder = "관광지 키워드를 입력하세요",
  selectedKeywords = [],
}: ChatInputProps) {
  const [keyword, setKeyword] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const handleAddKeyword = (newKeyword: string) => {
    const trimmed = newKeyword.trim();
    if (trimmed && !selectedKeywords.includes(trimmed)) {
      onKeywordsChange([...selectedKeywords, trimmed]);
    }
    setKeyword("");
  };

  const handleToggleKeyword = (tag: string) => {
    if (selectedKeywords.includes(tag)) {
      onKeywordsChange(selectedKeywords.filter((item) => item !== tag));
      return;
    }

    onKeywordsChange([...selectedKeywords, tag]);
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    onKeywordsChange(selectedKeywords.filter((item) => item !== keywordToRemove));
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      handleAddKeyword(keyword);
    }
  };

  const toggleCategory = (category: string) => {
    const isExpanded = expandedCategories.includes(category);
    if (isExpanded) {
      setExpandedCategories(expandedCategories.filter((item) => item !== category));
    } else {
      setExpandedCategories([...expandedCategories, category]);
    }

    // 부모 카테고리 클릭 시 실제 키워드 선택도 함께 반영
    handleToggleKeyword(category);
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md">
      {selectedKeywords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex flex-wrap gap-2 border-b border-gray-100 pb-4"
        >
          <span className="flex w-full items-center gap-1.5 text-sm text-gray-600">
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            선택된 키워드
          </span>

          <AnimatePresence>
            {selectedKeywords.map((item) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-sm text-white shadow-sm"
              >
                <span>{item}</span>
                <button
                  onClick={() => handleRemoveKeyword(item)}
                  className="rounded-full p-0.5 transition-colors hover:bg-white/20"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <div className="mb-4 flex gap-3 rounded-xl bg-gray-50 p-2">
        <Input
          type="text"
          placeholder={placeholder}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 border-0 bg-transparent focus-visible:ring-0"
        />
        <Button
          onClick={() => handleAddKeyword(keyword)}
          disabled={!keyword.trim()}
          className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-5 hover:from-blue-700 hover:to-indigo-700"
        >
          추가
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">카테고리</span>
          <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.keys(CATEGORY_TAGS).map((category) => {
            const isExpanded = expandedCategories.includes(category);
            const isSelected = selectedKeywords.includes(category);

            return (
              <motion.button
                key={category}
                onClick={() => toggleCategory(category)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`rounded-full px-3 py-1.5 text-sm shadow-sm transition-all ${
                  isExpanded || isSelected
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 hover:from-gray-200 hover:to-gray-100"
                }`}
              >
                <span className="mr-1">{CATEGORY_ICONS[category]}</span>
                {category}
              </motion.button>
            );
          })}
        </div>

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
              <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs text-blue-700">
                    {CATEGORY_ICONS[category]} {category}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_TAGS[category].map((tag) => {
                    const isSelected = selectedKeywords.includes(tag);

                    return (
                      <motion.button
                        key={tag}
                        onClick={() => handleToggleKeyword(tag)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`rounded-full px-3 py-1 text-xs transition-all duration-200 ${
                          isSelected
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                            : "border border-blue-200 bg-white text-blue-700 hover:bg-blue-100"
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
