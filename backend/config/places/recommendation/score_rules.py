from typing import List


def score_sky_condition(condition: str) -> int:
    if not condition:
        return 0

    value = condition.strip().lower()

    if value in ["맑음", "sunny", "clear"]:
        return 10
    if value in ["흐림", "cloudy", "overcast"]:
        return 5
    if value in ["비", "천둥", "우박", "눈", "rain", "storm", "hail", "snow"]:
        return 0
    return 0


def score_rain_probability(rain_prob: int) -> int:
    if rain_prob <= 40:
        return 10
    if rain_prob <= 70:
        return 5
    return 0


def score_air_quality(level: str) -> int:
    if not level:
        return 0

    value = level.strip().lower()

    if value in ["매우좋음", "좋음", "very_good", "good"]:
        return 10
    if value in ["보통", "normal", "moderate"]:
        return 5
    if value in ["나쁨", "매우나쁨", "bad", "very_bad"]:
        return 0
    return 0


def score_weather_total(
    sky_condition: str,
    rain_probability: int,
    pm10_level: str,
    pm25_level: str,
) -> int:
    # 날씨 총점 최대 40점
    total = 0
    total += score_sky_condition(sky_condition)
    total += score_rain_probability(rain_probability)
    total += score_air_quality(pm10_level)
    total += score_air_quality(pm25_level)
    return total


def has_weather_alert(alerts: List[str]) -> bool:
    return len(alerts) > 0


def score_travel_time(minutes: int) -> int:
    # 거리/이동 점수 최대 35점
    if minutes <= 30:
        return 35
    if minutes <= 90:
        return 20
    return 0


def score_keywords(selected_keywords: List[str], destination_keywords: List[str]) -> int:
    # 키워드 점수 최대 25점
    # 1개 중첩: 7점 / 2개: 15점 / 3개 이상: 25점
    if not selected_keywords or not destination_keywords:
        return 0

    normalized_destination_keywords = [
        destination_keyword.strip().lower()
        for destination_keyword in destination_keywords
        if destination_keyword
    ]
    matched_keywords = []

    for keyword in selected_keywords:
        normalized_keyword = keyword.strip().lower()
        if not normalized_keyword:
            continue

        if any(
            normalized_keyword in destination_keyword
            or destination_keyword in normalized_keyword
            for destination_keyword in normalized_destination_keywords
        ):
            matched_keywords.append(normalized_keyword)

    matched_count = len(matched_keywords)

    if matched_count >= 3:
        return 25
    if matched_count == 2:
        return 15
    if matched_count == 1:
        return 7
    return 0
