// src/components/AttractionDetailDialog.tsx
import { useState, useEffect } from "react";
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
  X,
  MapPinned,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { KakaoMap } from "./KakaoMap";


interface RouteInfo {
  duration: string | null;
  distance: string | null;
  steps: string[];
}

interface Attraction {
  name: string;
  location: string;
  score: number;
  imageUrl: string;
  category: string;
  nearbyActivities?: string[];
  latitude?: number | null;
  longitude?: number | null;
}

interface AttractionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attraction: Attraction | null;
  showScore?: boolean;
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
}

export function
 AttractionDetailDialog({
  open,
  onOpenChange,
  attraction,
  showScore = true,
  isLoggedIn = false,
  onLoginRequired,
}: AttractionDetailDialogProps) {
  const [showDirections, setShowDirections] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("");
  const [transportMode, setTransportMode] =
    useState<"car" | "transit" | "walk">("car");
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  // 다이얼로그 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setShowDirections(false);
      setCurrentLocation("");
      setTransportMode("car");
      setRouteInfo(null);
    }
  }, [open]);

  if (!attraction) return null;

  const getBadgeColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 80) return "bg-blue-500";
    return "bg-gray-500";
  };

  const handleDirectionsClick = () => {
    setShowDirections(true);
  };

  const handleCloseDirections = () => {
    setShowDirections(false);
    setCurrentLocation("");
    setTransportMode("car");
    setRouteInfo(null);
  };

  // 🔥 백엔드 /api/tmap/route/ 호출
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

      const res = await fetch(
        `http://localhost:8000/api/tmap/route/?${params.toString()}`
      );
      if (!res.ok) {
        throw new Error("경로 요청 실패");
      }

      const data = await res.json();
      console.log("route data >>>", data);

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

  // 교통수단별 스타일
  const modeStyles = {
    car: {
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: Car,
    },
    transit: {
      color: "text-green-600",
      bg: "bg-green-50",
      border: "border-green-200",
      icon: Train,
    },
    walk: {
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
      icon: Footprints,
    },
  } as const;

  const modeStyle = modeStyles[transportMode];
  const ModeIcon = modeStyle.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>

     <DialogContent
  className={`max-h-[90vh] overflow-hidden p-0 transition-all duration-300 ${
    showDirections
     ? "w-[1050px] max-w-[calc(100vw-2rem)]"
    : "w-[900px] max-w-[calc(100vw-2rem)]"
  }`}
>
      
        <div className="relative min-h-[80vh] max-h-[90vh] w-full">
          {/* 왼쪽 메인 컨텐츠 */}
<div
  className={`overflow-y-auto p-6 transition-all duration-300 ${
    showDirections
      ? "w-full lg:w-[520px] lg:border-r"
      : "w-full max-w-3xl mx-auto"
  }`}
>
          
            <DialogHeader className="mb-6">
              <DialogTitle className="flex items-center gap-3">
                {attraction.name}
                {showScore && (
                  <Badge
                    className={`${getBadgeColor(
                      attraction.score
                    )} text-white`}
                  >
                    <Star className="w-3 h-3 mr-1 fill-white" />
                    {attraction.score}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                {attraction.category} 카테고리의 {attraction.name}에 대한 상세
                정보입니다.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* 메인 이미지 */}
              <div className="relative aspect-video rounded-lg overflow-hidden">
                <img
                  src={attraction.imageUrl}
                  alt={attraction.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 위치 정보 */}
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-gray-600">{attraction.location}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {attraction.category}
                  </p>
                </div>
              </div>

                         {/* 지도 영역 */}
              <div className="border rounded-lg overflow-hidden shadow-sm">
                {/* 헤더 (위치 정보 / 상세경로 버튼) */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-white" />
                    <span className="text-white">위치 정보</span>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleDirectionsClick}
                    className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2"
                  >
                    <Route className="w-4 h-4" />
                    상세경로
                  </Button>
                </div>

                {/* ✅ 실제 카카오 지도 */}
                <div className="relative">
                  <KakaoMap
                    address={attraction.location}
                    name={attraction.name}
                    latitude={attraction.latitude}
                    longitude={attraction.longitude}
                    height={260}
                  />
                  {/* 지도 위 오버레이 카드 */}
                  <div className="absolute left-4 bottom-4 bg-white/90 backdrop-blur rounded-xl shadow-md px-4 py-3">
                    <p className="text-sm font-semibold text-gray-900">
                      {attraction.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {attraction.location}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      카카오맵 기준 위치입니다.
                    </p>
                  </div>
                </div>
              </div>
              {/* 주변 놀거리 */}
              {attraction.nearbyActivities &&
                attraction.nearbyActivities.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2">
                      <Star className="w-5 h-5 text-blue-600" />
                      주변 놀거리
                    </h3>
                    <div className="space-y-2">
                      {attraction.nearbyActivities.map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 text-sm">
                            {index + 1}
                          </div>
                          <p className="text-gray-700">{activity}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
           </div> {/* space-y-6 끝 */}

          </div> {/* ✅ 왼쪽 패널 div 닫기 */}
          {/* 오른쪽 상세 경로 패널 */}
          {/* 오른쪽 상세 경로 패널 */}
<AnimatePresence>
  {showDirections && (
    <>
      {/* 데스크톱용 패널 */}
      <motion.div
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 40, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="hidden lg:block absolute top-0 left-[540px] w-[420px] h-full bg-white border-l shadow-xl overflow-y-auto"
      >
        <div className="p-6 space-y-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-2">
              <Route className="w-5 h-5 text-blue-600" />
              <h3 className="text-blue-900">상세 경로</h3>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseDirections}
              className="gap-2 text-blue-700 hover:bg-blue-50"
            >
              ← 돌아가기
            </Button>
          </div>

          {/* 현재 위치 입력 */}
          <div className="space-y-3">
            <label className="text-sm text-gray-700 flex items-center gap-2">
              <MapPinned className="w-4 h-4 text-blue-600" />
              현재 위치
            </label>
            <Input
              type="text"
              placeholder="예: 서울역, 강남역, 주소 입력..."
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
              className="bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-400"
            />
          </div>

          {/* 교통수단 선택 */}
          <div className="space-y-3">
            <label className="text-sm text-gray-700">교통수단</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={transportMode === "car" ? "default" : "outline"}
                onClick={() => setTransportMode("car")}
                className={`flex flex-col items-center gap-2 h-auto py-3 ${
                  transportMode === "car"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                <Car className="w-5 h-5" />
                <span className="text-xs">자동차</span>
              </Button>

              <Button
                variant={transportMode === "transit" ? "default" : "outline"}
                onClick={() => setTransportMode("transit")}
                className={`flex flex-col items-center gap-2 h-auto py-3 ${
                  transportMode === "transit"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "border-gray-300 hover:border-green-400 hover:bg-green-50"
                }`}
              >
                <Train className="w-5 h-5" />
                <span className="text-xs">대중교통</span>
              </Button>

              <Button
                variant={transportMode === "walk" ? "default" : "outline"}
                onClick={() => setTransportMode("walk")}
                className={`flex flex-col items-center gap-2 h-auto py-3 ${
                  transportMode === "walk"
                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                    : "border-gray-300 hover:border-orange-400 hover:bg-orange-50"
                }`}
              >
                <Footprints className="w-5 h-5" />
                <span className="text-xs">도보</span>
              </Button>
            </div>
          </div>

          <Button
            className="w-full h-11 text-base font-semibold bg-blue-600 hover:bg-blue-700"
            onClick={handleFetchRoute}
            disabled={isRouteLoading}
          >
            {isRouteLoading ? "경로 조회 중..." : "상세 경로 조회"}
          </Button>

          {routeInfo ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className={`rounded-xl p-4 border ${modeStyle.bg} ${modeStyle.border}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`${modeStyle.bg} p-2 rounded-lg flex items-center justify-center`}>
                    <ModeIcon className={`w-6 h-6 ${modeStyle.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">예상 소요시간</p>
                    <p className={`text-xl font-semibold ${modeStyle.color}`}>
                      {routeInfo.duration ?? "정보 없음"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Navigation className="w-4 h-4" />
                  <span>총 거리: {routeInfo.distance ?? "정보 없음"}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <h4 className="text-sm mb-4 text-gray-700 flex items-center gap-2">
                  <Route className="w-4 h-4 text-blue-600" />
                  단계별 경로
                </h4>
                {routeInfo.steps.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    단계별 경로 정보를 가져오지 못했습니다.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {routeInfo.steps.map((step, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full ${modeStyle.bg} ${modeStyle.color} flex items-center justify-center text-sm flex-shrink-0`}
                          >
                            {index + 1}
                          </div>
                          {index < routeInfo.steps.length - 1 && (
                            <div className={`w-0.5 flex-1 my-1 ${modeStyle.bg} min-h-[20px]`} />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm opacity-90">도착지</span>
                </div>
                <p className="mb-1">{attraction.name}</p>
                <p className="text-sm opacity-90">{attraction.location}</p>
              </div>
            </motion.div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mt-4">
              <MapPinned className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                현재 위치를 입력하고
                <br />
                상단의 &apos;상세 경로 조회&apos; 버튼을 눌러 주세요.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* 모바일/좁은 화면용 패널 */}
      <motion.div
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="lg:hidden absolute inset-0 z-20 bg-white overflow-y-auto"
      >
        <div className="p-6 space-y-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-2">
              <Route className="w-5 h-5 text-blue-600" />
              <h3 className="text-blue-900">상세 경로</h3>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseDirections}
              className="gap-2 text-blue-700 hover:bg-blue-50"
            >
              ← 돌아가기
            </Button>
          </div>

          {/* 현재 위치 입력 */}
          <div className="space-y-3">
            <label className="text-sm text-gray-700 flex items-center gap-2">
              <MapPinned className="w-4 h-4 text-blue-600" />
              현재 위치
            </label>
            <Input
              type="text"
              placeholder="예: 서울역, 강남역, 주소 입력..."
              value={currentLocation}
              onChange={(e) => setCurrentLocation(e.target.value)}
              className="bg-white border-blue-200 focus:border-blue-400 focus:ring-blue-400"
            />
          </div>

          {/* 교통수단 선택 */}
          <div className="space-y-3">
            <label className="text-sm text-gray-700">교통수단</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={transportMode === "car" ? "default" : "outline"}
                onClick={() => setTransportMode("car")}
                className={`flex flex-col items-center gap-2 h-auto py-3 ${
                  transportMode === "car"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                <Car className="w-5 h-5" />
                <span className="text-xs">자동차</span>
              </Button>

              <Button
                variant={transportMode === "transit" ? "default" : "outline"}
                onClick={() => setTransportMode("transit")}
                className={`flex flex-col items-center gap-2 h-auto py-3 ${
                  transportMode === "transit"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "border-gray-300 hover:border-green-400 hover:bg-green-50"
                }`}
              >
                <Train className="w-5 h-5" />
                <span className="text-xs">대중교통</span>
              </Button>

              <Button
                variant={transportMode === "walk" ? "default" : "outline"}
                onClick={() => setTransportMode("walk")}
                className={`flex flex-col items-center gap-2 h-auto py-3 ${
                  transportMode === "walk"
                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                    : "border-gray-300 hover:border-orange-400 hover:bg-orange-50"
                }`}
              >
                <Footprints className="w-5 h-5" />
                <span className="text-xs">도보</span>
              </Button>
            </div>
          </div>

          <Button
            className="w-full h-11 text-base font-semibold bg-blue-600 hover:bg-blue-700"
            onClick={handleFetchRoute}
            disabled={isRouteLoading}
          >
            {isRouteLoading ? "경로 조회 중..." : "상세 경로 조회"}
          </Button>

          {routeInfo ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className={`rounded-xl p-4 border ${modeStyle.bg} ${modeStyle.border}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`${modeStyle.bg} p-2 rounded-lg flex items-center justify-center`}>
                    <ModeIcon className={`w-6 h-6 ${modeStyle.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">예상 소요시간</p>
                    <p className={`text-xl font-semibold ${modeStyle.color}`}>
                      {routeInfo.duration ?? "정보 없음"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Navigation className="w-4 h-4" />
                  <span>총 거리: {routeInfo.distance ?? "정보 없음"}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <h4 className="text-sm mb-4 text-gray-700 flex items-center gap-2">
                  <Route className="w-4 h-4 text-blue-600" />
                  단계별 경로
                </h4>
                {routeInfo.steps.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    단계별 경로 정보를 가져오지 못했습니다.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {routeInfo.steps.map((step, index) => (
                      <div key={index} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full ${modeStyle.bg} ${modeStyle.color} flex items-center justify-center text-sm flex-shrink-0`}
                          >
                            {index + 1}
                          </div>
                          {index < routeInfo.steps.length - 1 && (
                            <div className={`w-0.5 flex-1 my-1 ${modeStyle.bg} min-h-[20px]`} />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm opacity-90">도착지</span>
                </div>
                <p className="mb-1">{attraction.name}</p>
                <p className="text-sm opacity-90">{attraction.location}</p>
              </div>
            </motion.div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mt-4">
              <MapPinned className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                현재 위치를 입력하고
                <br />
                상단의 &apos;상세 경로 조회&apos; 버튼을 눌러 주세요.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )}
</AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
