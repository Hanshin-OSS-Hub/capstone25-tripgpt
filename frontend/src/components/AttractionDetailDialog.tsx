import { useState, useEffect, type CSSProperties } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  MapPin,
  Star,
  Navigation,
  Route,
  Car,
  Train,
  Footprints,
  MapPinned,
  ArrowLeft,
  Sparkles,
  Map,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { KakaoMap } from "./KakaoMap";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000/api"
).replace(/\/$/, "");

interface RouteInfo {
  duration: string | null;
  distance: string | null;
  steps: string[];
}

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

interface Attraction {
  name: string;
  location: string;
  score: number;
  imageUrl: string;
  category: string;
  keywordTags?: string[];
  nearbyActivities?: string[];
}

interface AttractionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attraction: Attraction | null;
  showScore?: boolean;
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
}

type TransportMode = "car" | "transit" | "walk";

export function AttractionDetailDialog({
  open,
  onOpenChange,
  attraction,
  showScore = true,
}: AttractionDetailDialogProps) {
  const [showDirections, setShowDirections] = useState(false);
  const [showNearbyInfo, setShowNearbyInfo] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("");
  const [transportMode, setTransportMode] = useState<TransportMode>("car");
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowDirections(false);
      setShowNearbyInfo(false);
      setCurrentLocation("");
      setTransportMode("car");
      setRouteInfo(null);
    }
  }, [open]);

  if (!attraction) return null;

  const getBadgeColor = (score: number) => {
    if (score >= 90) return "bg-emerald-500";
    if (score >= 80) return "bg-blue-500";
    return "bg-slate-500";
  };

  const getRecommendationText = (category: string, name: string) => {
    const map: Record<string, string> = {
      "문화/역사": `${name}은 전통적인 분위기와 볼거리를 함께 즐기기 좋은 대표 여행지예요.`,
      자연: `${name}은 풍경을 즐기며 여유롭게 둘러보기 좋은 여행지예요.`,
      액티비티: `${name}은 직접 체험하고 활동적으로 즐기기 좋은 장소예요.`,
      카페: `${name}은 가볍게 쉬어가기 좋고 분위기를 즐기기 좋은 장소예요.`,
      음식: `${name}은 여행 중 함께 들르기 좋은 먹거리 명소예요.`,
    };

    return (
      map[category] ??
      `${name}은 현재 조건 기준으로 방문하기 좋은 추천 여행지예요.`
    );
  };

  const recommendationText = getRecommendationText(
    attraction.category,
    attraction.name
  );

  const keywordTags = attraction.keywordTags ?? [];
  const categoryTags = keywordTags.filter((t) => TOP_CATEGORIES.has(t));
  const subTags = keywordTags.filter((t) => !TOP_CATEGORIES.has(t));
  const allTags = [...categoryTags, ...subTags];

  const getTagStyle = (tag: string) =>
    CATEGORY_TAG_COLORS[tag] ?? "bg-blue-50 text-blue-600 border-blue-100";

  const handleDirectionsClick = () => {
    setShowNearbyInfo(false);
    setShowDirections(true);
  };

  const handleCloseDirections = () => {
    setShowDirections(false);
    setCurrentLocation("");
    setTransportMode("car");
    setRouteInfo(null);
  };

  const handleNearbyInfoClick = () => {
    setShowNearbyInfo(true);
  };

  const handleCloseNearbyInfo = () => {
    setShowNearbyInfo(false);
  };

  const handleFetchRoute = async () => {
    if (!currentLocation.trim()) {
      toast.error("현재 위치를 입력해 주세요.");
      return;
    }

    try {
      setIsRouteLoading(true);

      const params = new URLSearchParams({
        origin: currentLocation,
        destination: attraction.location,
        mode: transportMode,
      });

      const res = await fetch(`${API_BASE_URL}/tmap/route/?${params.toString()}`);

      if (!res.ok) {
        throw new Error("경로 요청 실패");
      }

      const data = await res.json();

      setRouteInfo({
        duration: data.duration ?? null,
        distance: data.distance ?? null,
        steps: Array.isArray(data.steps) ? data.steps : [],
      });
    } catch (err) {
      console.error(err);
      toast.error("경로를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setIsRouteLoading(false);
    }
  };

  const modeStyles = {
    car: {
      icon: Car,
      label: "자동차",
      gradient: "linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)",
      softBg:
        "linear-gradient(135deg, rgba(239,246,255,0.96) 0%, rgba(238,242,255,0.98) 100%)",
      glow: "0 12px 24px rgba(79, 70, 229, 0.18)",
    },
    transit: {
      icon: Train,
      label: "대중교통",
      gradient: "linear-gradient(135deg, #059669 0%, #0ea5a4 100%)",
      softBg:
        "linear-gradient(135deg, rgba(236,253,245,0.96) 0%, rgba(240,253,250,0.98) 100%)",
      glow: "0 12px 24px rgba(5, 150, 105, 0.18)",
    },
    walk: {
      icon: Footprints,
      label: "도보",
      gradient: "linear-gradient(135deg, #f97316 0%, #f59e0b 100%)",
      softBg:
        "linear-gradient(135deg, rgba(255,247,237,0.96) 0%, rgba(255,251,235,0.98) 100%)",
      glow: "0 12px 24px rgba(249, 115, 22, 0.18)",
    },
  } as const;

  const modeStyle = modeStyles[transportMode];
  const ModeIcon = modeStyle.icon;

  const premiumCard: CSSProperties = {
    border: "1px solid rgba(226,232,240,0.82)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.93) 0%, rgba(247,250,255,0.87) 100%)",
    boxShadow:
      "0 18px 40px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.55)",
    borderRadius: 28,
    backdropFilter: "blur(18px)",
  };

  const softPanel: CSSProperties = {
    border: "1px solid rgba(232,237,244,0.92)",
    background:
      "linear-gradient(180deg, rgba(250,252,255,0.92) 0%, rgba(244,247,251,0.90) 100%)",
    borderRadius: 22,
  };

  const summaryPill: CSSProperties = {
    border: "1px solid rgba(228,233,241,0.92)",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(246,249,252,0.88) 100%)",
    boxShadow: "0 6px 14px rgba(15, 23, 42, 0.04)",
  };

  const renderRoutePanelBody = () => (
    <div className="space-y-6 p-6">
      <div className="sticky top-0 z-20 -mx-1 px-1 pb-4">
        <div
          className="rounded-[28px] px-5 py-4"
          style={{
            border: "1px solid rgba(210,223,243,0.85)",
            background:
              "linear-gradient(135deg, rgba(240,246,255,0.96) 0%, rgba(255,255,255,0.94) 56%, rgba(242,240,255,0.92) 100%)",
            boxShadow: "0 16px 30px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, #eaf2ff 0%, #ede9ff 100%)",
                  color: "#4f46e5",
                  boxShadow: "0 10px 22px rgba(79, 70, 229, 0.10)",
                }}
              >
                <Route className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-[22px] font-semibold tracking-tight text-gray-900">
                  상세 경로
                </h3>
                <p className="text-sm text-gray-500">
                  출발 위치 기준 이동 정보를 확인해보세요.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseDirections}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-white/80"
              style={{
                border: "1px solid rgba(219,227,239,0.95)",
                background: "rgba(255,255,255,0.72)",
                boxShadow: "0 8px 18px rgba(15, 23, 42, 0.05)",
                backdropFilter: "blur(10px)",
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              돌아가기
            </button>
          </div>
        </div>
      </div>

      <div style={{ ...premiumCard, padding: 22, borderRadius: 30 }}>
        <div className="grid gap-5 md:grid-cols-[1.15fr_1fr]">
          <div>
            <label className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
              <MapPinned className="h-4 w-4 text-blue-600" />
              현재 위치
            </label>

            <Input
              type="text"
              placeholder="예: 서울역, 강남역, 주소 입력..."
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
              className="h-12 rounded-2xl border-gray-200 bg-white/90 px-4 shadow-sm focus:border-blue-400 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700">
              교통수단
            </label>

            <div
              className="grid grid-cols-3 gap-3 rounded-[24px] p-3"
              style={{
                background:
                  "linear-gradient(135deg, rgba(246,248,252,0.86) 0%, rgba(241,244,248,0.82) 100%)",
                border: "1px solid rgba(226,232,240,0.78)",
              }}
            >
              {(Object.keys(modeStyles) as TransportMode[]).map((mode) => {
                const Icon = modeStyles[mode].icon;
                const isActive = transportMode === mode;

                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTransportMode(mode)}
                    className="flex flex-col items-center justify-center gap-2 rounded-[22px] py-4 text-sm transition"
                    style={
                      isActive
                        ? {
                            color: "#ffffff",
                            border: "1px solid transparent",
                            background: modeStyles[mode].gradient,
                            boxShadow: modeStyles[mode].glow,
                          }
                        : {
                            color: "#374151",
                            border: "1px solid rgba(219,227,239,0.85)",
                            background:
                              "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(247,249,252,0.92) 100%)",
                          }
                    }
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-xs font-medium">
                      {modeStyles[mode].label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Button
        className="w-full rounded-[22px] text-base font-semibold text-white hover:opacity-95"
        style={{
          height: 58,
          background: modeStyle.gradient,
          boxShadow: modeStyle.glow,
        }}
        onClick={handleFetchRoute}
        disabled={isRouteLoading}
      >
        {isRouteLoading ? "경로 조회 중..." : "상세 경로 조회"}
      </Button>

      {routeInfo ? (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div
            className="rounded-[26px] p-5"
            style={{
              border: "1px solid rgba(220,228,240,0.85)",
              background: modeStyle.softBg,
              boxShadow:
                "0 14px 28px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.50)",
            }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  background: modeStyle.gradient,
                  color: "#ffffff",
                  boxShadow: modeStyle.glow,
                }}
              >
                <ModeIcon className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm text-gray-500">예상 소요시간</p>
                <p className="text-[24px] font-semibold tracking-tight text-gray-900">
                  {routeInfo.duration ?? "정보 없음"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Navigation className="h-4 w-4" />
              <span>총 거리: {routeInfo.distance ?? "정보 없음"}</span>
            </div>
          </div>

          <div style={{ ...premiumCard, padding: 20, borderRadius: 26 }}>
            <h4 className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Route className="h-4 w-4 text-blue-600" />
              단계별 경로
            </h4>

            {routeInfo.steps.length === 0 ? (
              <p className="text-sm text-gray-500">
                단계별 경로 정보를 가져오지 못했습니다.
              </p>
            ) : (
              <div className="space-y-4">
                {routeInfo.steps.map((step, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white"
                        style={{
                          background: modeStyle.gradient,
                          boxShadow: modeStyle.glow,
                        }}
                      >
                        {index + 1}
                      </div>
                      {index < routeInfo.steps.length - 1 && (
                        <div className="my-1 min-h-[24px] w-0.5 flex-1 bg-gray-200" />
                      )}
                    </div>

                    <div
                      className="flex-1 rounded-2xl px-4 py-3"
                      style={softPanel}
                    >
                      <p className="text-sm leading-7 text-gray-700">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <div
          className="rounded-[28px] p-0"
          style={{
            border: "1px solid rgba(210,223,255,0.92)",
            background:
              "linear-gradient(135deg, rgba(243,248,255,0.98) 0%, rgba(237,245,255,0.96) 55%, rgba(243,240,255,0.94) 100%)",
            boxShadow:
              "0 16px 32px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255,255,255,0.45)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 12,
              background:
                "linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(129,140,248,0.16) 100%)",
            }}
          />

          <div
            className="flex flex-col items-center justify-center px-8 text-center"
            style={{ minHeight: 320, paddingTop: 36, paddingBottom: 36 }}
          >
            <div
              className="mb-5 flex h-16 w-16 items-center justify-center rounded-[22px]"
              style={{
                background:
                  "linear-gradient(135deg, rgba(37,99,235,0.12) 0%, rgba(79,70,229,0.12) 100%)",
                color: "#3b82f6",
                boxShadow: "0 10px 24px rgba(79, 70, 229, 0.08)",
              }}
            >
              <MapPinned className="h-8 w-8" />
            </div>

            <p className="text-[20px] font-semibold tracking-tight text-gray-800">
              현재 위치를 입력하고 경로를 확인해보세요.
            </p>

            <p className="mt-4 text-sm leading-8 text-gray-500">
              출발 위치를 입력한 뒤
              <br />
              ‘상세 경로 조회’ 버튼을 눌러 주세요.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const renderNearbyInfoPanel = () => (
    <div className="space-y-5 p-6">
      <div className="sticky top-0 z-20 -mx-1 px-1 pb-4">
        <div
          className="rounded-[28px] px-5 py-4"
          style={{
            border: "1px solid rgba(210,223,243,0.85)",
            background:
              "linear-gradient(135deg, rgba(240,246,255,0.96) 0%, rgba(255,255,255,0.94) 56%, rgba(242,240,255,0.92) 100%)",
            boxShadow: "0 16px 30px rgba(15, 23, 42, 0.06)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, #eaf2ff 0%, #ede9ff 100%)",
                  color: "#2563eb",
                  boxShadow: "0 10px 22px rgba(79, 70, 229, 0.10)",
                }}
              >
                <Map className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-[22px] font-semibold tracking-tight text-gray-900">
                  주변 정보
                </h3>
                <p className="text-sm text-gray-500">
                  위치와 주변 즐길거리를 함께 확인해보세요.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseNearbyInfo}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-white/80"
              style={{
                border: "1px solid rgba(219,227,239,0.95)",
                background: "rgba(255,255,255,0.72)",
                boxShadow: "0 8px 18px rgba(15, 23, 42, 0.05)",
                backdropFilter: "blur(10px)",
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              돌아가기
            </button>
          </div>
        </div>
      </div>

      <section className="flex flex-wrap items-start gap-4">
        <div
          className="overflow-hidden"
          style={{
            ...premiumCard,
            flex: "1 1 560px",
            minWidth: 320,
            borderRadius: 30,
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{
              borderBottom: "1px solid rgba(232,237,244,0.92)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(248,250,252,0.88) 100%)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, #eaf2ff 0%, #ede9ff 100%)",
                  color: "#2563eb",
                }}
              >
                <Navigation className="h-5 w-5" />
              </div>

              <div>
                <h3 className="text-[18px] font-semibold text-gray-900">
                  위치 정보
                </h3>
                <p className="text-sm text-gray-500">
                  지도에서 관광지 위치를 확인할 수 있어요.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleDirectionsClick}
              className="rounded-full px-4 text-gray-700 hover:bg-gray-50"
              style={{
                borderColor: "#dbe3ef",
                background: "rgba(255,255,255,0.92)",
                boxShadow: "0 8px 18px rgba(15, 23, 42, 0.05)",
              }}
            >
              <Route className="mr-2 h-4 w-4" />
              상세경로
            </Button>
          </div>

          <div className="relative">
            <KakaoMap
              address={attraction.location}
              name={attraction.name}
              height={460}
            />
          </div>
        </div>

        <div
          className="p-5"
          style={{
            ...premiumCard,
            flex: "0 0 360px",
            minWidth: 320,
            maxWidth: 380,
            minHeight: 560,
            display: "flex",
            flexDirection: "column",
            borderRadius: 30,
          }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{
                background:
                  "linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%)",
                color: "#f59e0b",
              }}
            >
              <Star className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-[18px] font-semibold text-gray-900">
                주변 놀거리
              </h3>
              <p className="text-sm text-gray-500">
                주변에서 함께 즐길 수 있는 장소예요.
              </p>
            </div>
          </div>

          {attraction.nearbyActivities &&
          attraction.nearbyActivities.length > 0 ? (
            <div className="space-y-3">
              {attraction.nearbyActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-[22px] p-4"
                  style={softPanel}
                >
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(59,130,246,0.14) 0%, rgba(96,165,250,0.12) 100%)",
                      color: "#3b82f6",
                    }}
                  >
                    {index + 1}
                  </div>

                  <p className="break-keep text-[15px] leading-7 text-gray-700">
                    {activity}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-5 text-center">
              <p className="text-sm font-medium text-gray-600">
                주변 놀거리 정보를 준비 중이에요.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full border-0 p-0 shadow-lg"
        style={{
          width: "calc(100vw - 2rem)",
          maxWidth: 1080,
          height: "90vh",
          maxHeight: "90vh",
          borderRadius: 30,
          background:
            "radial-gradient(circle at top right, rgba(79,70,229,0.10) 0%, rgba(79,70,229,0) 22%), radial-gradient(circle at top left, rgba(37,99,235,0.08) 0%, rgba(37,99,235,0) 20%), linear-gradient(180deg, #eef4fb 0%, #eaf0f8 48%, #e8eef7 100%)",
          overflow: "hidden",
          boxShadow: "0 28px 70px rgba(15, 23, 42, 0.18)",
        }}
      >
        <style>{`
          .tripgpt-detail-shell {
            height: 100%;
            padding: 16px;
            box-sizing: border-box;
          }

          .tripgpt-detail-inner {
            height: 100%;
            border-radius: 26px;
            overflow: hidden;
            background:
              radial-gradient(circle at top right, rgba(99,102,241,0.10) 0%, rgba(99,102,241,0) 26%),
              radial-gradient(circle at top left, rgba(37,99,235,0.10) 0%, rgba(37,99,235,0) 22%),
              linear-gradient(180deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0.22) 100%);
            border: 1px solid rgba(255,255,255,0.32);
            backdrop-filter: blur(10px);
          }

          .tripgpt-detail-scroll {
            height: 100%;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #c8d0dc transparent;
            scrollbar-gutter: stable;
          }

          .tripgpt-detail-scroll::-webkit-scrollbar {
            width: 10px;
          }

          .tripgpt-detail-scroll::-webkit-scrollbar-track {
            background: transparent;
          }

          .tripgpt-detail-scroll::-webkit-scrollbar-thumb {
            background: #cfd6e2;
            border-radius: 999px;
            border: 2px solid transparent;
            background-clip: padding-box;
          }

          .tripgpt-top-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.7fr) minmax(320px, 360px);
            gap: 20px;
            align-items: start;
          }

          @media (max-width: 980px) {
            .tripgpt-top-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

        <div className="tripgpt-detail-shell">
          <div className="tripgpt-detail-inner">
            <div
              className="tripgpt-detail-scroll"
              style={{
                padding: 22,
                paddingRight: 16,
                boxSizing: "border-box",
                overscrollBehavior: "contain",
              }}
            >
              <DialogHeader className="sr-only">
                <DialogTitle>{attraction.name}</DialogTitle>
                <DialogDescription>
                  {attraction.name} 상세 정보 페이지
                </DialogDescription>
              </DialogHeader>

              <section className="tripgpt-top-grid">
                <div
                  className="overflow-hidden"
                  style={{
                    borderRadius: 32,
                    padding: 18,
                    background:
                      "linear-gradient(135deg, rgba(247,250,255,0.82) 0%, rgba(243,246,255,0.78) 52%, rgba(241,240,255,0.78) 100%)",
                    border: "1px solid rgba(255,255,255,0.36)",
                    boxShadow:
                      "0 24px 54px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255,255,255,0.68)",
                  }}
                >
                  <div
                    className="relative overflow-hidden rounded-[28px]"
                    style={{
                      height: 560,
                      boxShadow: "0 16px 38px rgba(15, 23, 42, 0.12)",
                      background: "#cbd5e1",
                    }}
                  >
                    <img
                      src={attraction.imageUrl}
                      alt={attraction.name}
                      className="h-full w-full object-cover"
                      style={{
                        objectPosition: "center center",
                        transform: "scale(1.02)",
                        filter:
                          "saturate(1.02) contrast(1.01) brightness(0.97)",
                      }}
                    />

                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(10,18,34,0.02) 0%, rgba(10,18,34,0.02) 34%, rgba(10,18,34,0.18) 68%, rgba(10,18,34,0.34) 100%)",
                      }}
                    />

                    {attraction.score >= 90 && (
                      <div className="absolute bottom-6 left-6 right-6">
                        <div
                          className="rounded-[24px] px-6 py-5"
                          style={{
                            width: "min(520px, 78%)",
                            background: "rgba(255,255,255,0.72)",
                            backdropFilter: "blur(22px)",
                            border: "1px solid rgba(255,255,255,0.72)",
                            boxShadow:
                              "0 20px 40px rgba(15, 23, 42, 0.22)",
                          }}
                        >
                          <div className="mb-3 flex items-center gap-2 text-slate-600">
                            <MapPin className="h-4 w-4" />
                            <span className="text-xs font-semibold tracking-[0.18em]">
                              지금의 추천 포인트
                            </span>
                          </div>

                          <p className="text-[28px] font-semibold tracking-tight text-slate-950">
                            {attraction.name}
                          </p>

                          <p className="mt-3 break-keep text-[15px] leading-7 text-slate-700">
                            지금 이 순간 가장 분위기 있게 머물기 좋은 추천 여행지예요.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    className="w-full"
                    style={{
                      ...premiumCard,
                      borderRadius: 32,
                      padding: 22,
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div className="relative z-10 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-blue-500" />
                          <span className="text-xs font-medium tracking-[0.18em] text-blue-600">
                            추천 여행지
                          </span>
                        </div>

                        <h2 className="break-keep text-[32px] font-semibold tracking-tight text-gray-950">
                          {attraction.name}
                        </h2>

                        <div className="mt-3 flex items-center gap-2 text-gray-600">
                          <MapPin className="h-4 w-4 flex-shrink-0 text-blue-600" />
                          <p className="break-keep text-[15px]">
                            {attraction.location}
                          </p>
                        </div>
                      </div>

                      {showScore && (
                        <Badge
                          className={`${getBadgeColor(
                            attraction.score
                          )} rounded-full px-4 py-2 text-sm text-white`}
                        >
                          <Star className="mr-1.5 h-3.5 w-3.5 fill-white" />
                          {attraction.score}
                        </Badge>
                      )}
                    </div>

                    {allTags.length > 0 && (
                      <div className="relative z-10 flex flex-wrap gap-2">
                        {allTags.map((tag) => (
                          <span
                            key={tag}
                            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium ${getTagStyle(tag)}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ ...softPanel, padding: 18 }}>
                      <p className="mb-2 text-sm font-medium text-gray-500">
                        추천 이유
                      </p>
                      <p className="break-keep text-[15px] leading-8 text-gray-700">
                        {recommendationText}
                      </p>
                    </div>

                    <div className="flex items-stretch gap-3">
                      <div className="flex-1 rounded-[18px] px-4 py-3" style={summaryPill}>
                        <p className="text-xs font-medium text-gray-500">
                          카테고리
                        </p>
                        <p className="mt-2 text-[16px] font-semibold text-gray-900">
                          {attraction.category}
                        </p>
                      </div>

                      <div className="flex-1 rounded-[18px] px-4 py-3" style={summaryPill}>
                        <p className="text-xs font-medium text-gray-500">
                          추천 점수
                        </p>
                        <p className="mt-2 text-[16px] font-semibold text-gray-900">
                          {attraction.score}점
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleNearbyInfoClick}
                      className="w-full rounded-[20px] text-base font-medium text-gray-700 hover:bg-gray-50"
                      style={{
                        height: 52,
                        borderColor: "rgba(219,227,239,0.95)",
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(247,249,252,0.92) 100%)",
                        boxShadow: "0 8px 18px rgba(15, 23, 42, 0.04)",
                      }}
                    >
                      <Map className="mr-2 h-4 w-4" />
                      주변 정보 보기
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <AnimatePresence>
            {showDirections && (
              <motion.div
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 z-50"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(240,245,253,0.98) 0%, rgba(236,242,251,0.98) 100%)",
                  borderRadius: 24,
                  overflow: "hidden",
                }}
              >
                <div
                  className="tripgpt-detail-scroll"
                  style={{
                    height: "100%",
                    overflowY: "auto",
                    padding: 22,
                    paddingRight: 14,
                    boxSizing: "border-box",
                  }}
                >
                  {renderRoutePanelBody()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showNearbyInfo && !showDirections && (
              <motion.div
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 z-50"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(240,245,253,0.98) 0%, rgba(236,242,251,0.98) 100%)",
                  borderRadius: 24,
                  overflow: "hidden",
                }}
              >
                <div
                  className="tripgpt-detail-scroll"
                  style={{
                    height: "100%",
                    overflowY: "auto",
                    padding: 22,
                    paddingRight: 14,
                    boxSizing: "border-box",
                  }}
                >
                  {renderNearbyInfoPanel()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
