import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  disabled?: boolean;
  centered?: boolean;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  disabled = false,
  centered = false,
}: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !disabled) {
      onSearch();
    }
  };

  if (centered) {
    return (
      <div
        className="flex flex-col items-center justify-center px-4"
        style={{ minHeight: "60vh" }}
      >
        <div className="text-center" style={{ marginBottom: "64px" }}>
          <div className="mb-6 text-6xl">🌏</div>

          <h2
            className="text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl"
            style={{ marginBottom: "20px" }}
          >
            어디로 떠나고 싶으신가요?
          </h2>

          <p
            className="text-lg leading-relaxed text-gray-500"
            style={{ marginBottom: disabled ? "20px" : "0" }}
          >
            지역을 검색하고 맞춤 관광지를 추천받아보세요
          </p>

          {disabled && (
            <div className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
              로그인하면 더 많은 여행지를 추천받을 수 있어요
            </div>
          )}
        </div>

        <div className="w-full max-w-5xl" style={{ marginTop: "8px" }}>
          <div
            className="flex items-center rounded-full bg-white shadow-[0_12px_30px_rgba(15,23,42,0.10)] ring-1 ring-black/5"
            style={{
              padding: "14px 18px",
              gap: "16px",
            }}
          >
            <div
              className="flex flex-1 items-center"
              style={{ minHeight: "46px" }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{ width: "58px", marginRight: "12px" }}
              >
                <Search className="h-7 w-7 text-gray-400" />
              </div>

              <input
                type="text"
                placeholder="예: 서울, 부산, 경주, 제주도..."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className="w-full border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed"
                style={{
                  fontSize: "24px",
                  lineHeight: "1.2",
                  padding: 0,
                  margin: 0,
                }}
              />
            </div>

            <button
              type="button"
              onClick={onSearch}
              disabled={disabled}
              className="shrink-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                minWidth: "148px",
                height: "64px",
                padding: "0 28px",
                fontSize: "24px",
                fontWeight: 700,
                boxShadow: "0 10px 22px rgba(37,99,235,0.26)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.filter = "brightness(1.1)";
                e.currentTarget.style.boxShadow =
                  "0 14px 28px rgba(37,99,235,0.34)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.filter = "brightness(1)";
                e.currentTarget.style.boxShadow =
                  "0 10px 22px rgba(37,99,235,0.26)";
              }}
            >
              검색
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="max-w-5xl">
        <div
          className="flex items-center rounded-full bg-white shadow-[0_8px_22px_rgba(15,23,42,0.08)] ring-1 ring-black/5"
          style={{
            padding: "12px 16px",
            gap: "14px",
          }}
        >
          <div
            className="flex flex-1 items-center"
            style={{ minHeight: "40px" }}
          >
            <div
              className="flex items-center justify-center shrink-0"
              style={{ width: "46px", marginRight: "10px" }}
            >
              <Search className="h-5 w-5 text-gray-400" />
            </div>

            <input
              type="text"
              placeholder="예: 서울, 부산, 경주, 제주도..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              className="w-full border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed"
              style={{
                fontSize: "16px",
                lineHeight: "1.2",
                padding: 0,
                margin: 0,
              }}
            />
          </div>

          <button
            type="button"
            onClick={onSearch}
            disabled={disabled}
            className="shrink-0 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              minWidth: "124px",
              height: "50px",
              padding: "0 22px",
              fontSize: "18px",
              fontWeight: 700,
              boxShadow: "0 8px 16px rgba(37,99,235,0.22)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.filter = "brightness(1.1)";
              e.currentTarget.style.boxShadow =
                "0 12px 22px rgba(37,99,235,0.28)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.filter = "brightness(1)";
              e.currentTarget.style.boxShadow =
                "0 8px 16px rgba(37,99,235,0.22)";
            }}
          >
            검색
          </button>
        </div>
      </div>
    </div>
  );
}