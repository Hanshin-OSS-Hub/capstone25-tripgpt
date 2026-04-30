# places/recommendation.py

from typing import Dict, List

from .data_providers import (
    get_weather_data,
    get_travel_time_data,
    get_destination_keywords,
)
from .score_rules import (
    score_weather_total,
    has_weather_alert,
    score_travel_time,
    score_keywords,
)


def calculate_recommendation_score(
    region: str,
    selected_keywords: List[str] = None,
    origin: str = "서울역",
    transport_type: str = "transit",
) -> Dict:
    """
    지역별 추천 점수 계산

    반환 예시:
    {
        "region": "서울",
        "weather_score": 7,
        "distance_score": 10,
        "keyword_score": 4,
        "final_score": 21,
        "has_alert": False,
        "alerts": [],
        "details": {...}
    }
    """
    selected_keywords = selected_keywords or []

    # 1. 날씨 데이터 가져오기
    weather_data = get_weather_data(region)

    # 2. 특보 체크
    alerts = weather_data.get("alerts", [])
    has_alert = has_weather_alert(alerts)

    if has_alert:
        return {
            "region": region,
            "weather_score": 0,
            "distance_score": 0,
            "keyword_score": 0,
            "final_score": 0,
            "has_alert": True,
            "alerts": alerts,
            "details": {
                "message": "해당 지역에 기상 특보가 있어 추천 점수를 0점 처리했습니다."
            },
        }

    # 3. 날씨 점수
    weather_score = score_weather_total(
        sky_condition=weather_data.get("sky_condition", ""),
        rain_probability=weather_data.get("rain_probability", 100),
        pm10_level=weather_data.get("pm10_level", ""),
        pm25_level=weather_data.get("pm25_level", ""),
    )

    # 4. 거리 점수
    travel_data = get_travel_time_data(origin, region, transport_type)
    travel_minutes = travel_data.get("minutes", 120)
    distance_score = score_travel_time(travel_minutes)

    # 5. 키워드 점수
    destination_keywords = get_destination_keywords(region)
    keyword_score = score_keywords(selected_keywords, destination_keywords)

    # 6. 최종 점수
    final_score = weather_score + distance_score + keyword_score

    return {
        "region": region,
        "weather_score": weather_score,
        "distance_score": distance_score,
        "keyword_score": keyword_score,
        "final_score": final_score,
        "has_alert": False,
        "alerts": [],
        "details": {
            "sky_condition": weather_data.get("sky_condition"),
            "rain_probability": weather_data.get("rain_probability"),
            "pm10_level": weather_data.get("pm10_level"),
            "pm25_level": weather_data.get("pm25_level"),
            "travel_minutes": travel_minutes,
            "selected_keywords": selected_keywords,
            "destination_keywords": destination_keywords,
        },
    }