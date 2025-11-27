import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { MapPin, Star, Navigation, Route, Car, Train, Footprints, X, MapPinned } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { motion, AnimatePresence } from "motion/react";

interface AttractionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attraction: {
    name: string;
    location: string;
    score: number;
    imageUrl: string;
    category: string;
    nearbyActivities?: string[];
  } | null;
  showScore?: boolean;
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
}

export function AttractionDetailDialog({
  open,
  onOpenChange,
  attraction,
  showScore = true,
  isLoggedIn = false,
  onLoginRequired,
}: AttractionDetailDialogProps) {
  const [showDirections, setShowDirections] = useState(false);
  const [currentLocation, setCurrentLocation] = useState("");
  const [transportMode, setTransportMode] = useState<"car" | "transit" | "walk">("car");

  // Dialog가 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setShowDirections(false);
      setCurrentLocation("");
      setTransportMode("car");
    }
  }, [open]);

  if (!attraction) return null;

  const getBadgeColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 80) return "bg-blue-500";
    return "bg-gray-500";
  };

  const handleDirectionsClick = () => {
    if (!isLoggedIn) {
      toast.error("로그인이 필요합니다.");
      if (onLoginRequired) {
        onLoginRequired();
      }
      return;
    }
    setShowDirections(true);
  };

  const handleCloseDirections = () => {
    setShowDirections(false);
    setCurrentLocation("");
    setTransportMode("car");
  };

  // Mock route data based on transport mode
  const getRouteInfo = () => {
    const modes = {
      car: {
        duration: "약 45분",
        distance: "23.5 km",
        icon: Car,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        steps: [
          "현재 위치에서 출발",
          "올림픽대로로 진입 (12.3 km)",
          "강변북로로 이동 (8.7 km)",
          "목적지 근처 주차장 도착",
          `${attraction.name} 도보 5분`
        ]
      },
      transit: {
        duration: "약 1시간 10분",
        distance: "26.2 km",
        icon: Train,
        color: "text-green-600",
        bgColor: "bg-green-50",
        steps: [
          "현재 위치에서 도보 5분",
          "지하철 2호선 탑승 (7정거장)",
          "환승역에서 3호선으로 환승",
          "목적지역 하차 후 도보 10분",
          `${attraction.name} 도착`
        ]
      },
      walk: {
        duration: "약 4시간 30분",
        distance: "18.3 km",
        icon: Footprints,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        steps: [
          "현재 위치에서 출발",
          "한강변 산책로 따라 이동 (10.2 km)",
          "공원을 지나 주요 도로로 (5.8 km)",
          "골목길을 통해 이동 (2.3 km)",
          `${attraction.name} 도착`
        ]
      }
    };
    return modes[transportMode];
  };

  const routeInfo = getRouteInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex h-full max-h-[90vh]">
          {/* 메인 컨텐츠 */}
          <div className={`${showDirections ? 'w-1/2 border-r' : 'w-full max-w-3xl mx-auto'} overflow-y-auto p-6 transition-all duration-300`}>
            <DialogHeader className="mb-6">
              <DialogTitle className="flex items-center gap-3">
                {attraction.name}
                {showScore && (
                  <Badge className={`${getBadgeColor(attraction.score)} text-white`}>
                    <Star className="w-3 h-3 mr-1 fill-white" />
                    {attraction.score}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                {attraction.category} 카테고리의 {attraction.name}에 대한 상세 정보입니다.
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
                  <p className="text-sm text-gray-500 mt-1">{attraction.category}</p>
                </div>
              </div>

              {/* 지도 영역 */}
              <div className="border rounded-lg overflow-hidden shadow-sm">
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
                <div className="relative aspect-video bg-gradient-to-br from-blue-50 to-gray-100">
                  {/* 지도 스타일 배경 패턴 */}
                  <div className="absolute inset-0 opacity-10">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="gray" strokeWidth="1"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>
                  
                  {/* 중앙 마커와 정보 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
                      <div className="relative inline-block mb-3">
                        <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
                        <MapPin className="w-16 h-16 text-blue-600 relative" />
                      </div>
                      <h4 className="mb-2 text-gray-800">{attraction.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{attraction.location}</p>
                      <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
                        실제 지도 연동이 필요한 경우<br/>
                        카카오맵 또는 네이버 지도 API를 활용하세요
                      </div>
                    </div>
                  </div>

                  {/* 데코레이션 요소들 */}
                  <div className="absolute top-4 left-4 w-3 h-3 bg-red-500 rounded-full opacity-50"></div>
                  <div className="absolute top-8 right-8 w-2 h-2 bg-green-500 rounded-full opacity-50"></div>
                  <div className="absolute bottom-6 left-12 w-2 h-2 bg-yellow-500 rounded-full opacity-50"></div>
                  <div className="absolute bottom-10 right-16 w-3 h-3 bg-purple-500 rounded-full opacity-50"></div>
                </div>
              </div>

              {/* 주변 놀거리 */}
              {attraction.nearbyActivities && attraction.nearbyActivities.length > 0 && (
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
            </div>
          </div>

          {/* 상세경로 패널 */}
          <AnimatePresence>
            {showDirections && (
              <motion.div
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="w-1/2 overflow-y-auto bg-gradient-to-br from-blue-50 to-white"
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
                      className="hover:bg-blue-100 rounded-full h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
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

                  {/* 경로 정보 */}
                  {currentLocation && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* 요약 정보 */}
                      <div className={`${routeInfo.bgColor} rounded-xl p-4 border border-${transportMode === 'car' ? 'blue' : transportMode === 'transit' ? 'green' : 'orange'}-200`}>
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`${routeInfo.bgColor} p-2 rounded-lg`}>
                            <routeInfo.icon className={`w-6 h-6 ${routeInfo.color}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 text-sm">예상 소요시간</span>
                            </div>
                            <p className={`text-xl ${routeInfo.color}`}>{routeInfo.duration}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Navigation className="w-4 h-4" />
                          <span>총 거리: {routeInfo.distance}</span>
                        </div>
                      </div>

                      {/* 단계별 경로 */}
                      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <h4 className="text-sm mb-4 text-gray-700 flex items-center gap-2">
                          <Route className="w-4 h-4 text-blue-600" />
                          단계별 경로
                        </h4>
                        <div className="space-y-3">
                          {routeInfo.steps.map((step, index) => (
                            <div key={index} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full ${routeInfo.bgColor} ${routeInfo.color} flex items-center justify-center text-sm flex-shrink-0`}>
                                  {index + 1}
                                </div>
                                {index < routeInfo.steps.length - 1 && (
                                  <div className={`w-0.5 flex-1 my-1 ${routeInfo.bgColor} min-h-[20px]`}></div>
                                )}
                              </div>
                              <div className="flex-1 pb-4">
                                <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 도착지 정보 */}
                      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-5 h-5" />
                          <span className="text-sm opacity-90">도착지</span>
                        </div>
                        <p className="mb-1">{attraction.name}</p>
                        <p className="text-sm opacity-90">{attraction.location}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* 안내 메시지 */}
                  {!currentLocation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                      <MapPinned className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        현재 위치를 입력하면<br />
                        상세한 경로를 확인할 수 있습니다
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}