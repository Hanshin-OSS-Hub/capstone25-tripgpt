import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LogIn, LogOut, User, Plane, Globe, Languages } from "lucide-react";
import { toast } from "sonner";

import { DestinationCard } from "./components/DestinationCard";
import { LoginDialog } from "./components/LoginDialog";
import { SignupDialog } from "./components/SignupDialog";
import { MyPageDialog } from "./components/MyPageDialog";
import { SearchBar } from "./components/SearchBar";
import { ChatInput } from "./components/ChatInput";
import { AttractionDetailDialog } from "./components/AttractionDetailDialog";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";

// ==========================================
// 기존 places.ts 분리 대상이었던 상수 및 유틸 함수 통합
// ==========================================
const API_BASE = "http://127.0.0.1:8000";
const PAGE_SIZE = 50;

const REGION_OPTIONS = [
  "서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종",
  "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주", "경주",
];

const REGION_AREA_CODES: Record<string, string> = {
  "서울": "1",
  "인천": "2",
  "대전": "3",
  "대구": "4",
  "광주": "5",
  "부산": "6",
  "울산": "7",
  "세종": "8",
  "경기": "31",
  "강원": "32",
  "충북": "33",
  "충남": "34",
  "전북": "35",
  "전남": "36",
  "경북": "37",
  "경남": "38",
  "제주": "39",
  "경주": "37",
};

interface RecommendationResponse {
  region: string;
  weather_score: number;
  distance_score: number;
  keyword_score: number;
  final_score: number;
  has_alert: boolean;
  alerts: string[];
  details?: {
    selected_keywords?: string[];
    destination_keywords?: string[];
    message?: string;
  };
}

interface PlaceApiResult {
  content_id: number;
  title: string;
  addr1: string;
  addr2?: string;
  area_code?: string;
  category_label?: string;
  image_url?: string;
  thumbnail_url?: string;
  overview?: string;
  keyword_tags?: string[];
}

interface AttractionResult {
  id: number;
  name: string;
  location: string;
  score: number;
  imageUrl: string;
  category: string;
  tags: string[];
  keywordTags: string[];
  nearbyActivities: string[];
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80";

const DETAIL_TAG_RULES: Record<string, string[]> = {
  자연: ["바다", "해변", "해수욕장", "계곡", "공원", "산", "섬", "폭포", "호수"],
  랜드마크: ["타워", "전망대", "대교", "광장", "빌딩", "스카이", "타워"],
  액티비티: ["놀이공원", "테마파크", "체험", "레포츠", "야구장", "축구장", "골프"],
  맛집: ["맛집", "시장", "먹거리", "카페", "한식", "중식", "일식", "양식", "디저트"],
  쇼핑: ["쇼핑", "아울렛", "백화점", "시장", "거리"],
  역사: ["궁", "궁궐", "문화재", "사찰", "박물관", "유적", "전통", "역사"],
};

const SPORTS_TAG_ALIASES: Record<string, string[]> = {
  "야구장": ["야구장", "스카이돔", "랜더스필드", "라이온즈파크", "챔피언스필드", "위즈파크", "볼파크", "NC파크"],
  "축구장": ["축구장", "월드컵경기장", "축구전용구장", "스틸야드", "축구센터", "스타디움"],
  "배구장": ["배구", "체육관", "실내체육관", "아레나", "페퍼스타디움"],
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function inferTags(place: PlaceApiResult) {
  const sourceText = [
    place.title,
    place.category_label,
    place.overview,
    place.addr1,
    place.addr2,
  ]
    .filter(Boolean)
    .join(" ");

  const tags: string[] = [];

  Object.entries(DETAIL_TAG_RULES).forEach(([group, keywords]) => {
    const matched = keywords.filter((keyword) => sourceText.includes(keyword));
    if (matched.length > 0) {
      tags.push(group, ...matched);
    }
  });

  if (place.category_label) {
    tags.push(place.category_label);
  }

  Object.entries(SPORTS_TAG_ALIASES).forEach(([tag, aliases]) => {
    if (aliases.some((alias) => sourceText.includes(alias))) {
      tags.push("스포츠", tag);
    }
  });

  return unique(tags);
}

function buildNearbyActivities(place: PlaceApiResult) {
  if (!place.overview) return [];
  return place.overview
    .split(/[.]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function mapPlaceToAttraction(place: PlaceApiResult): AttractionResult {
  return {
    id: place.content_id,
    name: place.title,
    location: [place.addr1, place.addr2].filter(Boolean).join(" "),
    score: 60,
    imageUrl: place.image_url || place.thumbnail_url || FALLBACK_IMAGE,
    category: place.category_label || "관광지",
    tags: inferTags(place),
    keywordTags: place.keyword_tags ?? [],
    nearbyActivities: buildNearbyActivities(place),
  };
}

// ==========================================
// 메인 App 컴포넌트 시작
// ==========================================
export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchedRegion, setSearchedRegion] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [filterKeywords, setFilterKeywords] = useState<string[]>([]);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [selectedAttraction, setSelectedAttraction] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("한국어");
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const savedUser = localStorage.getItem("tripgpt_current_user");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  const handleLoginSuccess = (user: any) => setCurrentUser(user);
  const handleSignupSuccess = () => setIsLoginOpen(true);
  const handleUserUpdate = (updatedUser: any) => setCurrentUser(updatedUser);

  const handleLogout = () => {
    localStorage.removeItem("tripgpt_current_user");
    setCurrentUser(null);
    toast.success("로그아웃되었습니다.");
  };

  const handleLogoClick = () => {
    setSearchKeyword("");
    setSearchedRegion("");
    setSearchResults([]);
    setHasSearched(false);
    setFilterKeywords([]);
    setFilteredResults([]);
    setCurrentPage(1);
    setTotalPages(1);
    setRecommendation(null);
  };

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    toast.success(`언어가 ${language}로 변경되었습니다.`);
  };

  const fetchRecommendation = async (region: string) => {
    try {
      const res = await fetch(
        `${API_BASE}/places/recommendations/?region=${encodeURIComponent(region)}`
      );
      if (!res.ok) return;
      const data: RecommendationResponse = await res.json();
      setRecommendation(data);
      if (data.has_alert) toast.warning(`${data.region} 지역에 기상 특보가 있습니다.`);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPlaces = async (region: string, page: number) => {
    const areaCode = REGION_AREA_CODES[region];
    if (!areaCode) {
      toast.error(`"${region}" 지역은 아직 지원하지 않습니다.`);
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/places/?area_code=${encodeURIComponent(areaCode)}&page=${page}`
      );
      if (!res.ok) throw new Error("fetch failed");

      const data: { count: number; page: number; total_pages: number; results: PlaceApiResult[] } =
        await res.json();

      const results = data.results.map(mapPlaceToAttraction);

      setTotalCount(data.count);
      setTotalPages(data.total_pages);
      setCurrentPage(page);

      // 선호 키워드 정렬
      let preferredKeywords: string[] = [];
      if (currentUser?.email) {
        const saved = localStorage.getItem(`tripgpt_keywords_${currentUser.email}`);
        if (saved) preferredKeywords = JSON.parse(saved);
      }

      if (preferredKeywords.length > 0) {
        const matched = results.filter((a) =>
          preferredKeywords.some((kw) => a.tags.some((t: string) => t.includes(kw) || kw.includes(t)))
        );
        const unmatched = results.filter((a) =>
          !preferredKeywords.some((kw) => a.tags.some((t: string) => t.includes(kw) || kw.includes(t)))
        );
        setSearchResults([
          ...matched.sort((a, b) => b.score - a.score),
          ...unmatched.sort((a, b) => b.score - a.score),
        ]);
        setFilterKeywords(preferredKeywords);
      } else {
        setSearchResults(results.sort((a, b) => b.score - a.score));
        setFilterKeywords([]);
        setFilteredResults([]);
      }

      setSearchedRegion(region);
      toast.success(`${region} 지역 장소 ${data.count}개 중 ${PAGE_SIZE}개를 불러왔습니다.`);
    } catch (e) {
      console.error(e);
      toast.error("장소 데이터를 불러오지 못했습니다.");
      setSearchResults([]);
    }
  };

  const handlePlacesSearch = async () => {
    if (!searchKeyword.trim()) {
      toast.error("검색어를 입력해주세요.");
      return;
    }
    const keyword = searchKeyword.trim();
    setHasSearched(true);
    setIsSearching(true);
    setCurrentPage(1);
    setFilterKeywords([]);
    setFilteredResults([]);

    await Promise.all([fetchRecommendation(keyword), fetchPlaces(keyword, 1)]);
    setIsSearching(false);
  };

  const handlePageChange = async (page: number) => {
    setIsSearching(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    await fetchPlaces(searchedRegion, page);
    setIsSearching(false);
  };

  const handleKeywordsChange = (keywords: string[]) => {
    setFilterKeywords(keywords);
    if (keywords.length === 0) {
      setFilteredResults([]);
      return;
    }
    const matched = searchResults.filter((a) =>
      keywords.some((kw) => a.tags.some((t: string) => t.includes(kw) || kw.includes(t)))
    );
    const unmatched = searchResults.filter(
      (a) => !keywords.some((kw) => a.tags.some((t: string) => t.includes(kw) || kw.includes(t)))
    );
    setFilteredResults([...matched, ...unmatched]);
    if (matched.length === 0) toast.info("선택한 키워드와 일치하는 관광지가 없습니다.");
    else toast.success(`키워드와 일치하는 관광지 ${matched.length}개를 찾았습니다.`);
  };

  const isAttractionPreferred = (attraction: any) => {
    if (!currentUser?.email) return false;
    const saved = localStorage.getItem(`tripgpt_keywords_${currentUser.email}`);
    if (!saved) return false;
    const keywords = JSON.parse(saved);
    return keywords.some((kw: string) =>
      attraction.tags.some((t: string) => t.includes(kw) || kw.includes(t))
    );
  };

  const getPaginationRange = () => {
    const delta = 2;
    const range: (number | "...")[] = [];
    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    range.push(1);
    if (left > 2) range.push("...");
    for (let i = left; i <= right; i++) range.push(i);
    if (right < totalPages - 1) range.push("...");
    if (totalPages > 1) range.push(totalPages);

    return range;
  };

  const displayResults = filteredResults.length > 0 ? filteredResults : searchResults;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Toaster />

      <motion.header
        className="relative sticky top-0 z-10 overflow-hidden border-b border-gray-100 bg-white/80 shadow-sm backdrop-blur-md"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="absolute inset-0 opacity-50"
          animate={{
            background: [
              "linear-gradient(120deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.25) 25%, rgba(139,92,246,0.35) 50%, rgba(236,72,153,0.25) 75%, rgba(59,130,246,0.15) 100%)",
              "linear-gradient(120deg, rgba(236,72,153,0.25) 0%, rgba(59,130,246,0.15) 25%, rgba(99,102,241,0.25) 50%, rgba(139,92,246,0.35) 75%, rgba(236,72,153,0.25) 100%)",
            ],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={handleLogoClick}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105"
              >
                <div className="relative">
                  <Globe className="w-6 h-6" />
                  <Plane className="absolute -right-1 -top-1 w-4 h-4 rotate-45" />
                </div>
                <h1 className="text-white">TripGpt</h1>
              </motion.button>
              <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                <span className="text-blue-600">🇰🇷</span>
                <span>국내 여행 추천</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 hover:bg-gray-50">
                    <Languages className="w-4 h-4" />
                    <span className="hidden sm:inline">{selectedLanguage}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {[
                    { label: "한국어", flag: "🇰🇷" },
                    { label: "English", flag: "🇺🇸" },
                    { label: "日本語", flag: "🇯🇵" },
                    { label: "中文", flag: "🇨🇳" },
                  ].map(({ label, flag }) => (
                    <DropdownMenuItem key={label} onClick={() => handleLanguageChange(label)}>
                      <span className="mr-2">{flag}</span>{label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {currentUser ? (
                <>
                  <button
                    onClick={() => setIsMyPageOpen(true)}
                    className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-600">{currentUser.username}님</span>
                  </button>
                  <Button variant="ghost" className="gap-2" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </Button>
                </>
              ) : (
                <Button
                  className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  onClick={() => setIsLoginOpen(true)}
                >
                  <LogIn className="w-4 h-4" />
                  로그인
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} onSignupClick={() => setIsSignupOpen(true)} onLoginSuccess={handleLoginSuccess} />
      <SignupDialog open={isSignupOpen} onOpenChange={setIsSignupOpen} onSignupSuccess={handleSignupSuccess} />
      <MyPageDialog open={isMyPageOpen} onOpenChange={setIsMyPageOpen} currentUser={currentUser} onUserUpdate={handleUserUpdate} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasSearched ? (
          <SearchBar value={searchKeyword} onChange={setSearchKeyword} onSearch={handlePlacesSearch} disabled={false} centered={true} />
        ) : (
          <>
            <SearchBar value={searchKeyword} onChange={setSearchKeyword} onSearch={handlePlacesSearch} />

            {/* 추천 점수 결과 */}
            {recommendation && (
              <div className="max-w-2xl mx-auto mt-6 p-5 bg-white rounded-2xl shadow border border-gray-100">
                <h3 className="text-xl font-bold mb-3">{recommendation.region} 추천 결과</h3>
                {recommendation.has_alert ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                    <p className="font-semibold mb-2">기상 특보가 있습니다.</p>
                    <p>{recommendation.alerts.join(", ")}</p>
                    <p className="mt-2 text-sm">{recommendation.details?.message}</p>
                  </div>
                ) : (
                  <div className="space-y-2 text-gray-700">
                    <p>최종 점수: <span className="font-semibold">{recommendation.final_score}</span></p>
                    <p>날씨 점수: {recommendation.weather_score}</p>
                    <p>거리 점수: {recommendation.distance_score}</p>
                    <p>키워드 점수: {recommendation.keyword_score}</p>
                  </div>
                )}
              </div>
            )}

            {isSearching ? (
              <div className="mt-8">
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="text-2xl">✈️</span>
                  <div className="flex gap-1">
                    {[0, 200, 400].map((delay) => (
                      <span key={delay} className="text-blue-400 animate-pulse" style={{ animationDelay: `${delay}ms` }}>•</span>
                    ))}
                  </div>
                  <p className="text-blue-600 font-semibold">{searchedRegion || searchKeyword}의 관광지를 찾는 중...</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                      <div className="h-56 w-full bg-slate-300 animate-pulse" />
                      <div className="p-5 space-y-3">
                        <div className="h-6 w-32 rounded-md bg-slate-300 animate-pulse" />
                        <div className="h-4 w-40 rounded-md bg-slate-200 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <div className="mb-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 className="mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {searchedRegion}의 추천 관광지
                  </h2>
                  <p className="text-gray-600 text-sm">
                    총 {totalCount}개 중 {PAGE_SIZE}개 표시
                    {filterKeywords.length > 0 && ` • ${filterKeywords.length}개 필터 적용됨`}
                  </p>
                </div>

                <div className="mb-8">
                  <ChatInput onKeywordsChange={handleKeywordsChange} selectedKeywords={filterKeywords} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayResults.map((attraction) => {
                    const isMatched = filterKeywords.length > 0 &&
                      filterKeywords.some((kw) => attraction.tags.some((t: string) => t.includes(kw) || kw.includes(t)));
                    return (
                      <div key={attraction.id} className={isMatched ? "ring-2 ring-blue-500 rounded-2xl shadow-lg shadow-blue-100" : ""}>
                        <DestinationCard
                          name={attraction.name}
                          location={attraction.location}
                          score={attraction.score}
                          imageUrl={attraction.imageUrl}
                          category={attraction.category}
                          keywordTags={attraction.keywordTags}
                          showScore={!!currentUser}
                          isPreferred={isAttractionPreferred(attraction)}
                          onClick={() => { setSelectedAttraction(attraction); setIsDetailOpen(true); }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* 페이지네이션 UI */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-1 mt-10">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-30 hover:bg-gray-100 transition-colors"
                    >
                      ‹
                    </button>

                    {getPaginationRange().map((item, idx) =>
                      item === "..." ? (
                        <span key={`dot-${idx}`} className="px-2 text-gray-400">...</span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => handlePageChange(item as number)}
                          className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === item
                              ? "bg-blue-600 text-white shadow"
                              : "hover:bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-30 hover:bg-gray-100 transition-colors"
                    >
                      ›
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="mb-4 text-4xl">🔍</div>
                <h3 className="mb-2">검색 결과가 없습니다</h3>
                <p className="text-sm text-gray-500">다른 지역명으로 검색해보세요</p>
              </div>
            )}

            {/* 검색 전 지역 버튼 */}
            {!hasSearched && (
              <div className="text-center py-20">
                <div className="mb-6 text-5xl">✈️</div>
                <h2 className="mb-4">여행지를 검색해보세요</h2>
                <div className="flex flex-wrap justify-center gap-3">
                  {REGION_OPTIONS.filter((r) => r !== "제주도").map((region) => (
                    <Button
                      key={region}
                      variant="outline"
                      className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                      onClick={() => { setSearchKeyword(region); setTimeout(handlePlacesSearch, 0); }}
                    >
                      {region}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <AttractionDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        attraction={selectedAttraction}
        showScore={!!currentUser}
        isLoggedIn={!!currentUser}
        onLoginRequired={() => setIsLoginOpen(true)}
      />
    </div>
  );
}