import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { LogIn, LogOut, User, Plane, Globe } from "lucide-react";
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

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api"
).replace(/\/$/, "");

const REGION_OPTIONS = [
  "서울",
  "경기",
  "인천",
  "부산",
  "대구",
  "광주",
  "대전",
  "울산",
  "세종",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
  "경주",
];

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

interface PlaceSearchResponse {
  count: number;
  results: PlaceApiResult[];
}

interface StoredUser {
  userId?: string;
  username?: string;
  email?: string;
  preferredKeywords?: string[];
}

interface AttractionResult {
  id: number;
  name: string;
  location: string;
  score: number;
  imageUrl: string;
  category: string;
  region: string;
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
  "야구장": [
    "야구장",
    "스카이돔",
    "랜더스필드",
    "라이온즈파크",
    "챔피언스필드",
    "위즈파크",
    "볼파크",
    "NC파크",
  ],
  "축구장": [
    "축구장",
    "월드컵경기장",
    "축구전용구장",
    "스틸야드",
    "축구센터",
    "스타디움",
  ],
  "배구장": [
    "배구",
    "체육관",
    "실내체육관",
    "아레나",
    "페퍼스타디움",
  ],
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
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
  if (!place.overview) {
    return [];
  }

  return place.overview
    .split(/[.]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function mapPlaceToAttraction(
  place: PlaceApiResult,
  region: string,
  baseScore = 60
): AttractionResult {
  return {
    id: place.content_id,
    name: place.title,
    location: [place.addr1, place.addr2].filter(Boolean).join(" "),
    score: baseScore,
    imageUrl: place.image_url || place.thumbnail_url || FALLBACK_IMAGE,
    category: place.category_label || "관광지",
    region,
    tags: inferTags(place),
    keywordTags: place.keyword_tags ?? [],
    nearbyActivities: buildNearbyActivities(place),
  };
}

function keywordMatchesAttraction(keyword: string, attraction: AttractionResult) {
  const normalizedKeyword = normalizeText(keyword);
  const normalizedCategory = normalizeText(attraction.category);

  if (
    normalizedCategory.includes(normalizedKeyword) ||
    normalizedKeyword.includes(normalizedCategory)
  ) {
    return true;
  }

  return attraction.tags.some((tag) => {
    const normalizedTag = normalizeText(tag);
    return (
      normalizedTag.includes(normalizedKeyword) ||
      normalizedKeyword.includes(normalizedTag)
    );
  });
}

function applyKeywordScoreBoost(
  attractions: AttractionResult[],
  keywords: string[]
) {
  if (keywords.length === 0) {
    return [...attractions].sort((a, b) => b.score - a.score);
  }

  return [...attractions]
    .map((attraction) => {
      const matchedKeywordCount = keywords.filter((keyword) =>
        keywordMatchesAttraction(keyword, attraction)
      ).length;

      const boostedScore = Math.min(
        attraction.score +
          matchedKeywordCount * 4 +
          Math.max(matchedKeywordCount - 1, 0) * 3,
        100
      );

      return {
        ...attraction,
        score: boostedScore,
      };
    })
    .sort((a, b) => b.score - a.score);
}

function getSavedPreferredKeywords(currentUser: StoredUser | null) {
  if (!currentUser?.email) {
    return [];
  }

  try {
    const raw = localStorage.getItem(`tripgpt_keywords_${currentUser.email}`);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchedRegion, setSearchedRegion] = useState("");
  const [searchResults, setSearchResults] = useState<AttractionResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<AttractionResult[]>([]);
  const [filterKeywords, setFilterKeywords] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);
  const [selectedAttraction, setSelectedAttraction] =
    useState<AttractionResult | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [hoveredAttractionId, setHoveredAttractionId] = useState<number | null>(
    null
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tripgpt_current_user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {
      setCurrentUser(null);
    }
  }, []);

  const displayedResults = useMemo(() => {
    const results = filteredResults.length > 0 ? filteredResults : searchResults;
    return results.slice(0, 40);
  }, [filteredResults, searchResults]);

  const handleLoginSuccess = (user: StoredUser) => {
    setCurrentUser(user);
  };

  const handleSignupSuccess = () => {
    setIsLoginOpen(true);
  };

  const handleUserUpdate = (updatedUser: StoredUser) => {
    setCurrentUser(updatedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("tripgpt_current_user");
    setCurrentUser(null);
    toast.success("로그아웃되었습니다.");
  };

  const handleMyPageClick = () => {
    if (!currentUser) {
      setIsLoginOpen(true);
      return;
    }
    setIsMyPageOpen(true);
  };

  const handleLogoClick = () => {
    setSearchKeyword("");
    setSearchedRegion("");
    setSearchResults([]);
    setFilteredResults([]);
    setFilterKeywords([]);
      setHasSearched(false);
  };


  const isAttractionPreferred = (attraction: AttractionResult) => {
    const preferredKeywords = getSavedPreferredKeywords(currentUser);
    if (preferredKeywords.length === 0) {
      return false;
    }

    return preferredKeywords.some((keyword) =>
      keywordMatchesAttraction(keyword, attraction)
    );
  };

  const fetchRecommendation = async (region: string, keywords: string[]) => {
    const params = new URLSearchParams({
      region,
      keywords: keywords.join(","),
    });

    const response = await fetch(
      `${API_BASE_URL}/places/recommendations/?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error("추천 점수 조회 실패");
    }

    return (await response.json()) as RecommendationResponse;
  };

  const runSearch = async (regionInput: string) => {
    const region = regionInput.trim();
    if (!region) {
      toast.error("지역명을 입력해 주세요.");
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const preferredKeywords = getSavedPreferredKeywords(currentUser);
      const activeKeywords = unique([...preferredKeywords, ...filterKeywords]);

      const placeParams = new URLSearchParams({
        region,
        limit: "200",
      });

      const recommendationPromise = fetchRecommendation(region, activeKeywords);
      const placePromise = fetch(
        `${API_BASE_URL}/places/search/?${placeParams.toString()}`
      );

      const [recommendationData, placesResponse] = await Promise.all([
        recommendationPromise,
        placePromise,
      ]);

      if (!placesResponse.ok) {
        throw new Error("장소 조회 실패");
      }

      const placesData = (await placesResponse.json()) as PlaceSearchResponse;
      const mappedResults = placesData.results.map((place) =>
        mapPlaceToAttraction(place, region, recommendationData.final_score)
      );
      const boostedResults = applyKeywordScoreBoost(mappedResults, activeKeywords);

      setSearchResults(mappedResults);
      setFilteredResults(boostedResults);
      setFilterKeywords(activeKeywords);
      setSearchedRegion(region);

      if (boostedResults.length === 0) {
        toast.info("검색 결과가 없습니다.");
      } else {
        toast.success(`${boostedResults.length}개의 장소를 찾았습니다.`);
      }
    } catch (error) {
      console.error(error);
      toast.error("지역 검색 중 오류가 발생했습니다.");
      setSearchResults([]);
      setFilteredResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    await runSearch(searchKeyword);
  };

  const handleKeywordsChange = async (keywords: string[]) => {
    setFilterKeywords(keywords);

    if (!searchedRegion) {
      setFilteredResults([]);
      return;
    }

    const boostedResults = applyKeywordScoreBoost(searchResults, keywords);
    setFilteredResults(boostedResults);

    try {
      await fetchRecommendation(searchedRegion, keywords);
    } catch (error) {
      console.error(error);
    }
  };

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
              "linear-gradient(120deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.25) 25%, rgba(139, 92, 246, 0.35) 50%, rgba(236, 72, 153, 0.25) 75%, rgba(59, 130, 246, 0.15) 100%)",
              "linear-gradient(120deg, rgba(236, 72, 153, 0.25) 0%, rgba(59, 130, 246, 0.15) 25%, rgba(99, 102, 241, 0.25) 50%, rgba(139, 92, 246, 0.35) 75%, rgba(236, 72, 153, 0.25) 100%)",
              "linear-gradient(120deg, rgba(139, 92, 246, 0.35) 0%, rgba(236, 72, 153, 0.25) 25%, rgba(59, 130, 246, 0.15) 50%, rgba(99, 102, 241, 0.25) 75%, rgba(139, 92, 246, 0.35) 100%)",
            ],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
        />

        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={handleLogoClick}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-white shadow-md transition-all hover:scale-105 hover:shadow-lg"
            >
              <div className="relative">
                <Globe className="h-6 w-6" />
                <Plane className="absolute -right-1 -top-1 h-4 w-4 rotate-45" />
              </div>
              <h1 className="text-white">TripGpt</h1>
            </motion.button>

            <div className="hidden items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-sm text-gray-600 sm:flex">
              <span className="text-blue-600">국내</span>
              <span>여행 추천</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
{currentUser ? (
              <>
                <button
                  onClick={handleMyPageClick}
                  className="flex cursor-pointer items-center gap-2 rounded-full bg-gray-50 px-4 py-2 transition-colors hover:bg-gray-100"
                >
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-600 hover:text-blue-700">
                    {currentUser.username}님
                  </span>
                </button>
                <Button variant="ghost" className="gap-2" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </Button>
              </>
            ) : (
              <Button
                className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                onClick={() => setIsLoginOpen(true)}
              >
                <LogIn className="h-4 w-4" />
                로그인
              </Button>
            )}
          </div>
        </div>
      </motion.header>

      <LoginDialog
        open={isLoginOpen}
        onOpenChange={setIsLoginOpen}
        onSignupClick={() => setIsSignupOpen(true)}
        onLoginSuccess={handleLoginSuccess}
      />

      <SignupDialog
        open={isSignupOpen}
        onOpenChange={setIsSignupOpen}
        onSignupSuccess={handleSignupSuccess}
      />

      <MyPageDialog
        open={isMyPageOpen}
        onOpenChange={setIsMyPageOpen}
        currentUser={currentUser}
        onUserUpdate={handleUserUpdate}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!hasSearched ? (
          <SearchBar
            value={searchKeyword}
            onChange={setSearchKeyword}
            onSearch={handleSearch}
            disabled={false}
            centered
          />
        ) : (
          <>
            <SearchBar
              value={searchKeyword}
              onChange={setSearchKeyword}
              onSearch={handleSearch}
            />

            {isSearching ? (
              <>
                <div className="mb-6 text-center">
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <span className="text-2xl">🔍</span>
                    <div className="flex gap-1">
                      <span className="animate-pulse text-blue-400">.</span>
                      <span className="animate-pulse text-blue-400 [animation-delay:200ms]">
                        .
                      </span>
                      <span className="animate-pulse text-blue-400 [animation-delay:400ms]">
                        .
                      </span>
                    </div>
                  </div>
                  <p className="font-semibold text-blue-600">
                    {searchKeyword || "지역"}의 추천 장소를 찾는 중입니다...
                  </p>
                </div>

                <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-3 h-7 w-52 animate-pulse rounded-md bg-slate-300" />
                  <div className="h-4 w-36 animate-pulse rounded-md bg-slate-200" />
                </div>

                <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <div className="mb-4 h-5 w-40 animate-pulse rounded-md bg-slate-300" />
                  <div className="flex flex-wrap gap-3">
                    <div className="h-10 w-24 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-10 w-24 animate-pulse rounded-full bg-slate-200" />
                    <div className="h-10 w-24 animate-pulse rounded-full bg-slate-200" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                    >
                      <div className="h-56 w-full animate-pulse bg-slate-300" />
                      <div className="p-5">
                        <div className="mb-3 h-6 w-32 animate-pulse rounded-md bg-slate-300" />
                        <div className="mb-4 h-4 w-40 animate-pulse rounded-md bg-slate-200" />
                        <div className="h-7 w-20 animate-pulse rounded-full bg-slate-200" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : hasSearched && searchResults.length > 0 ? (
              <>
                <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                  <h2 className="mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {searchedRegion} 추천 장소
                  </h2>
                  <p className="text-sm text-gray-600">
                    총 {displayedResults.length}개의 장소
                    {filterKeywords.length > 0 && ` · ${filterKeywords.length}개 필터 적용`}
                  </p>
                </div>

                <div className="mb-8">
                  <ChatInput
                    onKeywordsChange={handleKeywordsChange}
                    selectedKeywords={filterKeywords}
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {displayedResults.map((attraction) => {
                    const isMatched =
                      filterKeywords.length > 0 &&
                      filterKeywords.some((keyword) =>
                        keywordMatchesAttraction(keyword, attraction)
                      );

                    const isPreferred = isAttractionPreferred(attraction);
                    const isHovered = hoveredAttractionId === attraction.id;
                    const isDimmed =
                      hoveredAttractionId !== null &&
                      hoveredAttractionId !== attraction.id;

                    return (
                      <div
                        key={attraction.id}
                        className={
                          isMatched
                            ? "rounded-2xl ring-2 ring-blue-500 shadow-lg shadow-blue-100"
                            : ""
                        }
                      >
                        <DestinationCard
                          name={attraction.name}
                          location={attraction.location}
                          score={attraction.score}
                          imageUrl={attraction.imageUrl}
                          category={attraction.category}
                          keywordTags={attraction.keywordTags}
                          showScore={!!currentUser}
                          isPreferred={isPreferred}
                          isHovered={isHovered}
                          isDimmed={isDimmed}
                          onMouseEnter={() => setHoveredAttractionId(attraction.id)}
                          onMouseLeave={() => setHoveredAttractionId(null)}
                          onClick={() => {
                            setSelectedAttraction(attraction);
                            setIsDetailOpen(true);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            ) : hasSearched && !isSearching && searchResults.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-white py-20 text-center shadow-sm">
                <div className="mb-4 text-4xl">📭</div>
                <h3 className="mb-2">검색 결과가 없습니다</h3>
                <p className="text-sm text-gray-500">
                  다른 지역명으로 검색해보세요.
                </p>
              </div>
            ) : (
              <div className="py-20 text-center">
                <div className="mb-6 text-5xl">✈️</div>
                <h2 className="mb-4">여행지를 검색해보세요</h2>
                <p className="mb-8 text-gray-600">
                  원하는 지역을 입력하면 추천 장소를 보여드립니다.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {REGION_OPTIONS.map((region) => (
                    <Button
                      key={region}
                      variant="outline"
                      className="transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                      onClick={() => {
                        setSearchKeyword(region);
                        void runSearch(region);
                      }}
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
