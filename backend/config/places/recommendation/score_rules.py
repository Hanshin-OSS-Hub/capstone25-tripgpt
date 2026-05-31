from typing import List


# Final scoring structure
# - base quality score: 20
# - category/keyword fit: 25
# - distance convenience: 20
# - weather suitability: 15
# - season/time suitability: 10
# - representativeness / landmark value: 10

BASIC_QUALITY_SCORE = 20

SEASON_KEYWORDS = {
    "spring": {"벚꽃", "공원", "궁궐", "한옥", "산", "꽃"},
    "summer": {"바다", "해수욕장", "계곡", "섬", "서핑", "레포츠"},
    "autumn": {"단풍", "산", "궁궐", "한옥", "공원", "역사"},
    "winter": {"스키", "스키장", "온천", "전시", "박물관", "실내"},
}

DAYTIME_KEYWORDS = {"자연", "역사", "궁궐", "공원", "산", "박물관", "해수욕장"}
NIGHTTIME_KEYWORDS = {"야경", "타워", "전망대", "광장", "핫플", "랜드마크"}
REPRESENTATIVE_KEYWORDS = {
    "랜드마크",
    "역사",
    "궁궐",
    "타워",
    "전망대",
    "해수욕장",
    "박물관",
    "월드컵경기장",
    "야구장",
    "축구장",
    "배구장",
}
NEUTRAL_TIME_KEYWORDS = {"맛집", "쇼핑", "카페", "핫플"}


def normalize_keywords(values: List[str]) -> List[str]:
    return [value.strip().lower() for value in values if value and value.strip()]


def score_base_quality() -> int:
    # Fixed base score. This is intentionally constant for now.
    return BASIC_QUALITY_SCORE


def score_sky_condition(condition: str) -> int:
    if not condition:
        return 0

    value = condition.strip().lower()
    if value in ["맑음", "sunny", "clear"]:
        return 5
    if value in ["흐림", "cloudy", "overcast"]:
        return 3
    if value in ["비", "천둥", "우박", "눈", "rain", "storm", "hail", "snow"]:
        return 0
    return 1


def score_rain_probability(rain_prob: int) -> int:
    if rain_prob <= 30:
        return 5
    if rain_prob <= 60:
        return 3
    return 0


def score_air_quality(level: str) -> int:
    if not level:
        return 0

    value = level.strip().lower()
    if value in ["매우좋음", "좋음", "very_good", "good"]:
        return 3
    if value in ["보통", "normal", "moderate"]:
        return 2
    if value in ["나쁨", "매우나쁨", "bad", "very_bad"]:
        return 0
    return 1


def score_weather_total(
    sky_condition: str,
    rain_probability: int,
    pm10_level: str,
    pm25_level: str,
) -> int:
    # Weather suitability max 15
    total = 0
    total += score_sky_condition(sky_condition)
    total += score_rain_probability(rain_probability)
    total += min(score_air_quality(pm10_level) + score_air_quality(pm25_level), 5)
    return min(total, 15)


def has_weather_alert(alerts: List[str]) -> bool:
    return len(alerts) > 0


def score_distance_convenience(minutes: int) -> int:
    # Distance convenience max 20
    if minutes <= 30:
        return 20
    if minutes <= 60:
        return 15
    if minutes <= 90:
        return 10
    if minutes <= 120:
        return 5
    return 0


def score_category_fit(selected_keywords: List[str], destination_keywords: List[str]) -> int:
    # Category / keyword fit max 25
    if not selected_keywords or not destination_keywords:
        return 0

    normalized_destination_keywords = normalize_keywords(destination_keywords)
    matched_keywords = []

    for keyword in normalize_keywords(selected_keywords):
        if any(
            keyword in destination_keyword or destination_keyword in keyword
            for destination_keyword in normalized_destination_keywords
        ):
            matched_keywords.append(keyword)

    matched_count = len(set(matched_keywords))
    if matched_count >= 3:
        return 25
    if matched_count == 2:
        return 18
    if matched_count == 1:
        return 12
    return 0


def build_place_score(
    *,
    base_quality_score: int,
    weather_score: int,
    distance_score: int,
    season_time_score: int,
    landmark_score: int,
    selected_keywords: List[str],
    place_keywords: List[str],
) -> dict:
    category_score = score_category_fit(selected_keywords, place_keywords)
    final_score = (
        base_quality_score
        + category_score
        + distance_score
        + weather_score
        + season_time_score
        + landmark_score
    )
    return {
        "base_quality_score": base_quality_score,
        "category_score": category_score,
        "distance_score": distance_score,
        "weather_score": weather_score,
        "season_time_score": season_time_score,
        "landmark_score": landmark_score,
        "keyword_score": category_score,
        "final_score": final_score,
    }


def score_season_time_fit(destination_keywords: List[str], month: int, hour: int) -> int:
    # Season/time suitability max 10
    if not destination_keywords:
        return 0

    destination_set = set(destination_keywords)

    if month in [3, 4, 5]:
        season_key = "spring"
    elif month in [6, 7, 8]:
        season_key = "summer"
    elif month in [9, 10, 11]:
        season_key = "autumn"
    else:
        season_key = "winter"

    season_score = 0
    if destination_set & SEASON_KEYWORDS[season_key]:
        season_score = 5
    elif destination_set & {"역사", "랜드마크", "맛집", "쇼핑"}:
        season_score = 3

    time_score = 0
    if 18 <= hour <= 23:
        if destination_set & NIGHTTIME_KEYWORDS:
            time_score = 5
        elif destination_set & NEUTRAL_TIME_KEYWORDS:
            time_score = 3
    else:
        if destination_set & DAYTIME_KEYWORDS:
            time_score = 5
        elif destination_set & NEUTRAL_TIME_KEYWORDS:
            time_score = 3

    return min(season_score + time_score, 10)


def score_landmark_value(destination_keywords: List[str]) -> int:
    # Representativeness / landmark value max 10
    if not destination_keywords:
        return 0

    destination_set = set(destination_keywords)
    strong_count = len(destination_set & REPRESENTATIVE_KEYWORDS)

    if strong_count >= 2:
        return 10
    if strong_count == 1:
        return 7
    if len(destination_set) >= 5:
        return 5
    return 2
