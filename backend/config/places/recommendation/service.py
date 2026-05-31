from typing import Dict, List

from django.utils import timezone

from .data_providers import (
    get_destination_keywords,
    get_travel_time_data,
    get_weather_data,
)
from .score_rules import (
    has_weather_alert,
    score_base_quality,
    score_category_fit,
    score_distance_convenience,
    score_landmark_value,
    score_season_time_fit,
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
            "base_quality_score": 0,
            "category_score": 0,
            "distance_score": 0,
            "weather_score": 0,
            "season_time_score": 0,
            "landmark_score": 0,
            "keyword_score": 0,
            "final_score": 0,
            "has_alert": True,
            "alerts": alerts,
            "details": {
                "message": "해당 지역에 기상 경보가 있어 추천 점수를 0으로 처리했습니다.",
            },
        }

    base_quality_score = score_base_quality()
    destination_keywords = get_destination_keywords(region)
    category_score = score_category_fit(selected_keywords, destination_keywords)

    # Main search still does not send a reliable user origin for recommendation.
    # Until that is wired end-to-end, keep the distance component at max.
    #
    # To restore real distance scoring later, use:
    # travel_data = get_travel_time_data(origin, region, transport_type)
    # travel_minutes = travel_data.get("minutes", 120)
    # distance_score = score_distance_convenience(travel_minutes)
    travel_minutes = 0
    distance_score = score_distance_convenience(travel_minutes)

    weather_score = score_weather_total(
        sky_condition=weather_data.get("sky_condition", ""),
        rain_probability=weather_data.get("rain_probability", 100),
        pm10_level=weather_data.get("pm10_level", ""),
        pm25_level=weather_data.get("pm25_level", ""),
    )

    now = timezone.localtime()
    season_time_score = score_season_time_fit(
        destination_keywords=destination_keywords,
        month=now.month,
        hour=now.hour,
    )
    landmark_score = score_landmark_value(destination_keywords)

    final_score = (
        base_quality_score
        + category_score
        + distance_score
        + weather_score
        + season_time_score
        + landmark_score
    )

    return {
        "region": region,
        "base_quality_score": base_quality_score,
        "category_score": category_score,
        "distance_score": distance_score,
        "weather_score": weather_score,
        "season_time_score": season_time_score,
        "landmark_score": landmark_score,
        # Keep keyword_score for compatibility with current frontend/UI.
        "keyword_score": category_score,
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
            "current_month": now.month,
            "current_hour": now.hour,
        },
    }
