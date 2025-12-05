import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  disabled?: boolean;
  centered?: boolean;
}

export function SearchBar({ value, onChange, onSearch, disabled = false, centered = false }: SearchBarProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !disabled) {
      onSearch();
    }
  };

  if (centered) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="text-center mb-10">
          <div className="mb-6 text-6xl">🌏</div>
          <h2 className="mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            어디로 여행을 떠나시나요?
          </h2>
          <p className="text-gray-600 mb-2">
            원하는 지역을 검색해보세요
          </p>
          {disabled && (
            <p className="text-sm text-blue-600 mt-3 bg-blue-50 px-4 py-2 rounded-full inline-block">
              💡 로그인하면 더 많은 여행지를 추천받을 수 있습니다
            </p>
          )}
        </div>
        <div className="w-full max-w-2xl">
          <div className="flex gap-3 bg-white rounded-2xl shadow-lg p-2 border border-gray-100">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="예: 서울, 부산, 경주, 제주도..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={disabled}
                className="pl-12 py-6 border-0 focus-visible:ring-0 text-base"
              />
            </div>
            <Button 
              onClick={onSearch} 
              disabled={disabled} 
              className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
            >
              검색
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex gap-3 bg-white rounded-2xl shadow-sm p-2 border border-gray-100 max-w-3xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="예: 서울, 부산, 경주, 제주도..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-12 border-0 focus-visible:ring-0"
          />
        </div>
        <Button 
          onClick={onSearch}
          className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl"
        >
          검색
        </Button>
      </div>
    </div>
  );
}