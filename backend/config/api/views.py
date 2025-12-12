# travel_app/views.py
import os
import json
import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.renderers import JSONRenderer



def tmap_geocode(keyword: str, app_key: str):
    """
    Tmap POI 통합 검색으로 '역/주소/장소명' → (lat, lon) 좌표 얻기
    검색 결과가 없으면 None 반환
    """
    if not keyword or not app_key:
        return None

    try:
        url = "https://apis.openapi.sk.com/tmap/pois"
        headers = {
            "appKey": app_key,
            "Accept": "application/json",
        }
        params = {
            "version": 1,
            "searchKeyword": keyword,
            "resCoordType": "WGS84GEO",
            "reqCoordType": "WGS84GEO",
            "count": 1,
        }

        resp = requests.get(url, headers=headers, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()

        spi = data.get("searchPoiInfo")
        if not spi:
            print(f"[tmap_geocode] no searchPoiInfo for '{keyword}'")
            return None

        pois = spi.get("pois", {}).get("poi")
        if not pois:
            print(f"[tmap_geocode] no pois for '{keyword}'")
            return None

        # poi가 리스트일 수도, 단일 dict일 수도 있어서 처리
        if isinstance(pois, list):
            poi0 = pois[0]
        else:
            poi0 = pois

        lat = (
            poi0.get("frontLat")
            or poi0.get("frontlat")
            or poi0.get("noorLat")
            or poi0.get("lat")
        )
        lon = (
            poi0.get("frontLon")
            or poi0.get("frontlon")
            or poi0.get("noorLon")
            or poi0.get("lon")
        )

        if lat is None or lon is None:
            print(f"[tmap_geocode] no lat/lon for '{keyword}'")
            return None

        return float(lat), float(lon)

    except Exception as e:
        print(f"[tmap_geocode] error for '{keyword}':", e)
        return None


class TravelAPIView(APIView):
    """
    GET /api/tmap/route/?origin=한신대&destination=경복궁&mode=car|transit|walk

    프론트에서 기대하는 응답 형태:
    {
      "duration": "약 40분",
      "distance": "23.5 km",
      "steps": ["...","..."],
      "raw": { ... 디버그용 전체 데이터 ... }
    }
    """
    renderer_classes = [JSONRenderer] 
    def get(self, request):
        # --- 환경변수에서 키 읽기 ---
        tmap_app_key = os.environ.get("TMAP_APP_KEY", "")
        kakao_js_key = os.environ.get("KAKAO_JS_KEY", "")
        openweather_key = os.environ.get("OPENWEATHER_API_KEY", "")

        # 프론트에서 오는 파라미터에 맞추기 (origin/destination)
        departure = (request.GET.get("origin") or request.GET.get("departure") or "").strip()
        destination = (request.GET.get("destination") or "").strip()
        mode = (request.GET.get("mode") or "car").strip()  # car | transit | walk

        # 전체 raw 정보 (디버그/확장용)
        response = {
            "kakao_js_key": kakao_js_key,
            "departure": departure,
            "destination": destination,
            "mode": mode,
            "weather": None,
            "car_info": None,
            "transit_info": None,
            "car_path": [],
            "transit_steps": [],
            "errors": [],
        }

        # 출발/도착 없으면 바로 빈 route 응답
        if not (departure and destination):
            response["errors"].append("출발지와 도착지가 필요합니다.")
            return Response(
                {
                    "duration": None,
                    "distance": None,
                    "steps": [],
                    "raw": response,
                },
                status=status.HTTP_200_OK,
            )

        # TMAP 키가 아예 없으면 여기서 안내
        if not tmap_app_key:
            response["errors"].append("TMAP_APP_KEY가 서버 환경변수에 설정되지 않았습니다.")
            steps = [
                "TMAP_APP_KEY가 서버 환경변수에 설정되지 않았습니다.",
                "settings.py 또는 .env에서 TMAP_APP_KEY를 설정해 주세요.",
                "API 키가 설정되면 실제 Tmap 경로가 표시됩니다.",
            ]
            return Response(
                {
                    "duration": None,
                    "distance": None,
                    "steps": steps,
                    "raw": response,
                },
                status=status.HTTP_200_OK,
            )

        # --- 좌표 변환 (POI) ---
        dep_coord = tmap_geocode(departure, tmap_app_key)
        dest_coord = tmap_geocode(destination, tmap_app_key)

        if dep_coord:
            dep_lat, dep_lng = dep_coord
        else:
            dep_lat = dep_lng = None
            response["errors"].append(f"'{departure}' 좌표 변환 실패")

        if dest_coord:
            dest_lat, dest_lng = dest_coord
        else:
            dest_lat = dest_lng = None
            response["errors"].append(f"'{destination}' 좌표 변환 실패")

        if dep_lat is None or dest_lat is None:
            # 좌표 변환 실패 시
            return Response(
                {
                    "duration": None,
                    "distance": None,
                    "steps": [],
                    "raw": response,
                },
                status=status.HTTP_200_OK,
            )

        # --- 날씨 API (나중 점수 계산용, 프론트에는 안 써도 됨) ---
        weather = None
        if openweather_key:
            try:
                w_res = requests.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    params={
                        "lat": dest_lat,
                        "lon": dest_lng,
                        "appid": openweather_key,
                        "units": "metric",
                        "lang": "kr",
                    },
                    timeout=5,
                )
                w_res.raise_for_status()
                w_data = w_res.json()
                weather = {
                    "name": w_data.get("name"),
                    "temp": w_data["main"]["temp"],
                    "desc": w_data["weather"][0]["description"],
                }
            except Exception as e:
                print("Weather error:", e)
                response["errors"].append("날씨 정보 조회 실패")

        response["weather"] = weather

        # --- 자동차 경로 호출 ---
        car_info = None
        car_path = []
        try:
            headers = {
                "appKey": tmap_app_key,
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
            body = {
                "startX": str(dep_lng),
                "startY": str(dep_lat),
                "endX": str(dest_lng),
                "endY": str(dest_lat),
                "reqCoordType": "WGS84GEO",
                "resCoordType": "WGS84GEO",
                "searchOption": "0",
            }
            r = requests.post(
                "https://apis.openapi.sk.com/tmap/routes?version=1",
                headers=headers,
                json=body,
                timeout=7,
            )
            print("Tmap car status:", r.status_code, r.text[:200])
            r.raise_for_status()
            data = r.json()

            features = data.get("features", [])
            if features:
                props0 = features[0].get("properties", {})
                total_time = int(props0.get("totalTime", 0))
                total_distance = int(props0.get("totalDistance", 0))

                car_info = {
                    "time_min": total_time // 60,
                    "distance_km": round(total_distance / 1000, 1),
                }

            for f in features:
                geom = f.get("geometry", {})
                if geom.get("type") == "LineString":
                    for lng, lat in geom.get("coordinates", []):
                        car_path.append({"lat": lat, "lng": lng})

        except Exception as e:
            print("Car route error:", e)
            response["errors"].append("자동차 경로 조회 실패")

        response["car_info"] = car_info
        response["car_path"] = car_path

        # --- 대중교통 경로 ---
        transit_info = None
        transit_steps = []

        try:
            headers = {
                "appKey": tmap_app_key,
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
            body = {
                "startX": str(dep_lng),
                "startY": str(dep_lat),
                "endX": str(dest_lng),
                "endY": str(dest_lat),
                "count": 1,
                "format": "json",
                "lang": 0,
            }

            tr = requests.post(
                "https://apis.openapi.sk.com/transit/routes",
                headers=headers,
                json=body,
                timeout=7,
            )
            print("Tmap transit status:", tr.status_code, tr.text[:200])
            tr.raise_for_status()
            data = tr.json()

            plan = data.get("metaData", {}).get("plan", {})
            itineraries = plan.get("itineraries", [])

            if itineraries:
                it0 = itineraries[0]

                total_time = it0.get("totalTime", 0)
                total_distance = it0.get("totalDistance", 0)
                transfer_count = it0.get("transferCount", 0)

                transit_info = {
                    "total_time_min": total_time // 60,
                    "total_distance_km": round(total_distance / 1000, 1),
                    "transfer_count": transfer_count,
                    "path_type": it0.get("pathType"),
                }

                legs = it0.get("legs", [])
                mode_ko_map = {
                    "WALK": "도보",
                    "BUS": "버스",
                    "SUBWAY": "지하철",
                    "EXPRESSBUS": "고속버스",
                    "TRAIN": "기차",
                    "FERRY": "해운",
                }

                for idx, leg in enumerate(legs, start=1):
                    mode_leg = leg.get("mode")
                    mode_ko = mode_ko_map.get(mode_leg, mode_leg)
                    sec = int(leg.get("sectionTime", 0))
                    time_min = sec // 60

                    start_name = (leg.get("start") or {}).get("name") or ""
                    end_name = (leg.get("end") or {}).get("name") or ""

                    summary = f"{start_name} → {end_name} ({mode_ko}) 약 {time_min}분"

                    transit_steps.append(
                        {
                            "order": idx,
                            "mode": mode_leg,
                            "mode_ko": mode_ko,
                            "summary": summary,
                        }
                    )

        except Exception as e:
            print("Transit error:", e)
            response["errors"].append("대중교통 경로 조회 실패")

        response["transit_info"] = transit_info
        response["transit_steps"] = transit_steps

        # --------------------------------------------------
        # 🔥 프론트가 보기 좋게 가공
        # --------------------------------------------------
        duration = None
        distance = None
        steps = []

        if mode == "car" and car_info:
            duration = f"약 {car_info['time_min']}분"
            distance = f"{car_info['distance_km']} km"
            steps = [
                f"{departure}에서 출발",
                f"Tmap 자동차 경로를 따라 이동 (약 {car_info['distance_km']}km)",
                f"{destination} 도착",
            ]

        elif mode == "transit" and transit_info:
            duration = f"약 {transit_info['total_time_min']}분"
            distance = f"{transit_info['total_distance_km']} km"
            steps = [s["summary"] for s in transit_steps]

        elif mode == "walk" and car_info:
            # 대략 도보 4km/h 기준으로 자동차 거리로 시간 추정
            walk_minutes = int(car_info["distance_km"] / 4 * 60)
            duration = f"약 {walk_minutes}분"
            distance = f"{car_info['distance_km']} km"
            steps = [
                f"{departure}에서 도보 출발",
                f"약 {car_info['distance_km']}km 도보 이동",
                f"{destination} 도착",
            ]

        # car/transit/둘 다 실패한 경우 등
        if duration is None:
            response["errors"].append("적절한 경로를 찾지 못했습니다.")
            return Response(
                {
                    "duration": None,
                    "distance": None,
                    "steps": [],
                    "raw": response,
                },
                status=status.HTTP_200_OK,
            )

        # ⭐ 프론트(React)의 setRouteInfo에서 기대하는 형태
        return Response(
            {
                "duration": duration,
                "distance": distance,
                "steps": steps,
                "raw": response,  # 필요 없으면 프론트에서 무시해도 됨
            },
            status=status.HTTP_200_OK,
        )
