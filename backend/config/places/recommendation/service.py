from typing import Dict, List

from .data_providers import (
    get_destination_keywords,
    get_travel_time_data,
    get_weather_data,
)
from .score_rules import (
    has_weather_alert,
    score_keywords,
    score_travel_time,
    score_weather_total,
)


def calculate_recommendation_score(
    region: str,
    selected_keywords: List[str] = None,
    origin: str = "서울역",
    transport_type: str = "transit",
) -> Dict:
    selected_keywords = selected_keywords or []

    weather_data = get_weather_data(region)

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
                "message": "해당 지역에 기상 특보가 있어 추천 점수를 0점으로 처리했습니다.",
            },
        }

    weather_score = score_weather_total(
        sky_condition=weather_data.get("sky_condition", ""),
        rain_probability=weather_data.get("rain_probability", 100),
        pm10_level=weather_data.get("pm10_level", ""),
        pm25_level=weather_data.get("pm25_level", ""),
    )

    # 거리 점수 임시 정책
    # 현재 메인 검색 화면에서는 실제 출발지(origin)를 추천 API로 전달하지 않고 있어
    # 사용자 기준 거리 점수가 정확하지 않습니다.
    #
    # 그래서 당분간은 거리 점수를 최대치로 고정합니다.
    # 나중에 실제 거리 점수로 복구할 때는 아래 3줄을 다시 사용하면 됩니다.
    #
    # travel_data = get_travel_time_data(origin, region, transport_type)
    # travel_minutes = travel_data.get("minutes", 120)
    # distance_score = score_travel_time(travel_minutes)
    travel_minutes = 0
    distance_score = score_travel_time(travel_minutes)

    destination_keywords = get_destination_keywords(region)
    keyword_score = score_keywords(selected_keywords, destination_keywords)

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
