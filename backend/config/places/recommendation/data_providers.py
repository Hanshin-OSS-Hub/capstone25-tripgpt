import os
from typing import Dict, List

import requests

from ..models import TourismPlace


OPENWEATHER_GEOCODING_URL = "http://api.openweathermap.org/geo/1.0/direct"
OPENWEATHER_CURRENT_URL = "https://api.openweathermap.org/data/2.5/weather"
OPENWEATHER_AIR_POLLUTION_URL = "http://api.openweathermap.org/data/2.5/air_pollution"
REGION_QUERY_MAP = {
    "서울": "Seoul,KR",
    "경기": "Suwon,KR",
    "인천": "Incheon,KR",
    "강원": "Gangneung,KR",
    "충북": "Cheongju,KR",
    "충남": "Cheonan,KR",
    "대전": "Daejeon,KR",
    "세종": "Sejong,KR",
    "전북": "Jeonju,KR",
    "전남": "Mokpo,KR",
    "광주": "Gwangju,KR",
    "경북": "Gyeongju,KR",
    "경남": "Changwon,KR",
    "대구": "Daegu,KR",
    "울산": "Ulsan,KR",
    "부산": "Busan,KR",
    "제주": "Jeju City,KR",
    "경주": "Gyeongju,KR",
}
REGION_ALIASES = {
    "서울특별시": "서울",
    "서울시": "서울",
    "부산광역시": "부산",
    "대구광역시": "대구",
    "인천광역시": "인천",
    "광주광역시": "광주",
    "대전광역시": "대전",
    "울산광역시": "울산",
    "세종특별자치시": "세종",
    "경기도": "경기",
    "강원도": "강원",
    "강원특별자치도": "강원",
    "충청북도": "충북",
    "충청남도": "충남",
    "전라북도": "전북",
    "전북특별자치도": "전북",
    "전라남도": "전남",
    "경상북도": "경북",
    "경상남도": "경남",
    "제주도": "제주",
    "제주특별자치도": "제주",
}
REGION_AREA_CODE_MAP = {
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
    "경북": "35",
    "경남": "36",
    "전북": "37",
    "전남": "38",
    "제주": "39",
}
DESTINATION_KEYWORD_RULES = {
    "자연": ["바다", "해수욕장", "해변", "산", "계곡", "폭포", "공원", "숲", "섬", "수목원"],
    "랜드마크": ["타워", "궁궐", "성당", "다리", "전망대", "광장"],
    "역사": ["유적", "문화재", "박물관", "사찰", "전통문화", "한옥"],
    "액티비티": ["놀이공원", "테마파크", "캠핑장", "야구장", "축구장", "스키장", "레포츠"],
    "이벤트": ["축제", "공연", "전시", "팝업"],
    "핫플": ["포토존", "야경", "카페거리", "거리"],
    "맛집": ["한식", "중식", "일식", "양식", "디저트", "카페", "해산물", "시장", "먹거리거리"],
    "쇼핑": ["쇼핑", "시장", "아울렛", "면세점", "백화점"],
    "숙소": ["숙소", "호텔", "리조트", "펜션", "게스트하우스", "한옥스테이"],
}

TMAP_POI_URL = "https://apis.openapi.sk.com/tmap/pois"
TMAP_CAR_ROUTE_URL = "https://apis.openapi.sk.com/tmap/routes?version=1"
TMAP_TRANSIT_ROUTE_URL = "https://apis.openapi.sk.com/transit/routes"
WEATHER_DEFAULT = {
    "sky_condition": "",
    "rain_probability": 100,
    "pm10_level": "",
    "pm25_level": "",
    "alerts": [],
}
TRAVEL_TIME_DEFAULT_MINUTES = 120
SPORTS_FACILITY_ALIASES = {
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
}


def map_weather_description_to_score_label(description: str) -> str:
    value = (description or "").strip().lower()

    if any(token in value for token in ["clear", "sun"]):
        return "맑음"
    if any(token in value for token in ["cloud", "overcast"]):
        return "흐림"
    if any(token in value for token in ["rain", "drizzle", "shower"]):
        return "비"
    if "thunder" in value:
        return "천둥"
    if "snow" in value:
        return "눈"
    return description or ""


def map_air_quality_level(value: float | int | None) -> str:
    if value is None:
        return ""

    value = float(value)
    if value <= 30:
        return "좋음"
    if value <= 80:
        return "보통"
    return "나쁨"


def get_region_query(region: str) -> str:
    normalized_region = normalize_region_name(region)
    return REGION_QUERY_MAP.get(normalized_region, f"{normalized_region},KR")


def normalize_region_name(region: str) -> str:
    value = (region or "").strip()
    return REGION_ALIASES.get(value, value)


def get_region_coordinates(region: str, api_key: str):
    query = get_region_query(region)
    response = requests.get(
        OPENWEATHER_GEOCODING_URL,
        params={
            "q": query,
            "limit": 1,
            "appid": api_key,
        },
        timeout=5,
    )
    response.raise_for_status()
    data = response.json()
    if not data:
        return None
    first = data[0]
    return first.get("lat"), first.get("lon")


def get_weather_data(region: str) -> Dict:
    """
    OpenWeather 현재 날씨를 사용합니다.
    키가 없거나 API 호출이 실패하면 recommendation 로직이 깨지지 않도록
    안전한 기본값을 반환합니다.
    """
    api_key = os.environ.get("OPENWEATHER_API_KEY", "").strip()
    if not api_key or not region.strip():
        return WEATHER_DEFAULT.copy()

    try:
        coordinates = get_region_coordinates(region, api_key)
        if not coordinates:
            return WEATHER_DEFAULT.copy()

        lat, lon = coordinates
        response = requests.get(
            OPENWEATHER_CURRENT_URL,
            params={
                "lat": lat,
                "lon": lon,
                "appid": api_key,
                "units": "metric",
                "lang": "kr",
            },
            timeout=5,
        )
        response.raise_for_status()
        payload = response.json()
        air_response = requests.get(
            OPENWEATHER_AIR_POLLUTION_URL,
            params={
                "lat": lat,
                "lon": lon,
                "appid": api_key,
            },
            timeout=5,
        )
        air_response.raise_for_status()
        air_payload = air_response.json()

        weather_description = payload.get("weather", [{}])[0].get("description", "")
        rain_probability = 100 if any(
            token in weather_description.lower() for token in ["비", "rain", "snow", "drizzle", "shower", "thunder"]
        ) else 20

        alerts = []
        normalized_weather = map_weather_description_to_score_label(weather_description)
        if normalized_weather in {"비", "눈", "천둥"}:
            alerts.append(f"현재 날씨 주의: {weather_description}")

        components = (air_payload.get("list") or [{}])[0].get("components", {})
        pm10 = components.get("pm10")
        pm25 = components.get("pm2_5")

        return {
            "sky_condition": normalized_weather,
            "rain_probability": rain_probability,
            "pm10_level": map_air_quality_level(pm10),
            "pm25_level": map_air_quality_level(pm25),
            "alerts": alerts,
        }
    except Exception:
        return WEATHER_DEFAULT.copy()


def tmap_geocode(keyword: str, app_key: str):
    if not keyword or not app_key:
        return None

    try:
        response = requests.get(
            TMAP_POI_URL,
            headers={
                "appKey": app_key,
                "Accept": "application/json",
            },
            params={
                "version": 1,
                "searchKeyword": keyword,
                "resCoordType": "WGS84GEO",
                "reqCoordType": "WGS84GEO",
                "count": 1,
            },
            timeout=5,
        )
        response.raise_for_status()
        data = response.json()
        poi = (
            data.get("searchPoiInfo", {})
            .get("pois", {})
            .get("poi")
        )
        if isinstance(poi, list):
            poi = poi[0] if poi else None
        if not poi:
            return None

        lat = (
            poi.get("frontLat")
            or poi.get("frontlat")
            or poi.get("noorLat")
            or poi.get("lat")
        )
        lon = (
            poi.get("frontLon")
            or poi.get("frontlon")
            or poi.get("noorLon")
            or poi.get("lon")
        )
        if lat is None or lon is None:
            return None
        return float(lat), float(lon)
    except Exception:
        return None


def get_car_travel_minutes(app_key: str, origin_coord, destination_coord):
    response = requests.post(
        TMAP_CAR_ROUTE_URL,
        headers={
            "appKey": app_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        json={
            "startX": str(origin_coord[1]),
            "startY": str(origin_coord[0]),
            "endX": str(destination_coord[1]),
            "endY": str(destination_coord[0]),
            "reqCoordType": "WGS84GEO",
            "resCoordType": "WGS84GEO",
            "searchOption": "0",
        },
        timeout=7,
    )
    response.raise_for_status()
    payload = response.json()
    features = payload.get("features", [])
    if not features:
        return None

    total_time_seconds = int(features[0].get("properties", {}).get("totalTime", 0))
    if total_time_seconds <= 0:
        return None
    return max(1, round(total_time_seconds / 60))


def get_transit_travel_minutes(app_key: str, origin_coord, destination_coord):
    response = requests.post(
        TMAP_TRANSIT_ROUTE_URL,
        headers={
            "appKey": app_key,
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        json={
            "startX": str(origin_coord[1]),
            "startY": str(origin_coord[0]),
            "endX": str(destination_coord[1]),
            "endY": str(destination_coord[0]),
            "count": 1,
            "format": "json",
            "lang": 0,
        },
        timeout=7,
    )
    response.raise_for_status()
    payload = response.json()
    itineraries = (
        payload.get("metaData", {})
        .get("plan", {})
        .get("itineraries", [])
    )
    if not itineraries:
        return None

    total_time_seconds = int(itineraries[0].get("totalTime", 0))
    if total_time_seconds <= 0:
        return None
    return max(1, round(total_time_seconds / 60))


def get_travel_time_data(origin: str, destination: str, transport_type: str) -> Dict:
    """
    Tmap API로 출발지/도착지 이동시간을 조회합니다.
    조회 실패 시 추천 로직이 깨지지 않도록 기본 120분을 반환합니다.
    """
    app_key = os.environ.get("TMAP_APP_KEY", "").strip()
    if not app_key or not origin.strip() or not destination.strip():
        return {"minutes": TRAVEL_TIME_DEFAULT_MINUTES}

    origin_coord = tmap_geocode(origin, app_key)
    destination_coord = tmap_geocode(destination, app_key)
    if not origin_coord or not destination_coord:
        return {"minutes": TRAVEL_TIME_DEFAULT_MINUTES}

    try:
        mode = (transport_type or "transit").strip().lower()
        if mode == "car":
            minutes = get_car_travel_minutes(app_key, origin_coord, destination_coord)
        else:
            minutes = get_transit_travel_minutes(app_key, origin_coord, destination_coord)

        return {"minutes": minutes or TRAVEL_TIME_DEFAULT_MINUTES}
    except Exception:
        return {"minutes": TRAVEL_TIME_DEFAULT_MINUTES}


def get_destination_keywords(region: str) -> List[str]:
    """
    저장된 TourismPlace 데이터를 기준으로 지역 대표 키워드를 추출합니다.
    """
    area_code = REGION_AREA_CODE_MAP.get(normalize_region_name(region))
    if not area_code:
        return []

    queryset = TourismPlace.objects.filter(area_code=area_code, is_active=True)[:300]
    if not queryset:
        return []

    keyword_counts = {}
    category_counts = {}

    for place in queryset:
        if place.category_label:
            category_counts[place.category_label] = category_counts.get(place.category_label, 0) + 1

        text = " ".join(
            filter(
                None,
                [
                    place.title,
                    place.category_label,
                    place.overview,
                ],
            )
        )

        for group, tokens in DESTINATION_KEYWORD_RULES.items():
            matched = [token for token in tokens if token in text]
            if matched:
                keyword_counts[group] = keyword_counts.get(group, 0) + 1
                for token in matched:
                    keyword_counts[token] = keyword_counts.get(token, 0) + 1

        for facility_tag, aliases in SPORTS_FACILITY_ALIASES.items():
            if any(alias in text for alias in aliases):
                keyword_counts["스포츠"] = keyword_counts.get("스포츠", 0) + 1
                keyword_counts[facility_tag] = keyword_counts.get(facility_tag, 0) + 1

    ranked_keywords = sorted(
        keyword_counts.items(),
        key=lambda item: (-item[1], item[0]),
    )
    keywords = [keyword for keyword, _ in ranked_keywords[:10]]

    ranked_categories = sorted(
        category_counts.items(),
        key=lambda item: (-item[1], item[0]),
    )
    for category, _ in ranked_categories:
        if category not in keywords:
            keywords.append(category)

    return keywords[:12]


def get_destination_keywords_from_db(region: str) -> List[str]:
    """
    이전 호출부 호환용 래퍼입니다.
    """
    return get_destination_keywords(region)
