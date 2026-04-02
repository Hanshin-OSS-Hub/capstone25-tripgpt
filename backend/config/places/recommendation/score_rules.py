# places/score_rules.py

from typing import List


def score_sky_condition(condition: str) -> int:
    """
    하늘 상태 점수
    맑음: 2점
    흐림: 1점
    비/천둥/우박/눈 등: 0점
    """
    if not condition:
        return 0

    value = condition.strip().lower()

    if value in ["맑음", "sunny", "clear"]:
        return 2
    if value in ["흐림", "cloudy", "overcast"]:
        return 1
    if value in ["비", "천둥", "우박", "눈", "rain", "storm", "hail", "snow"]:
        return 0
    return 0


def score_rain_probability(rain_prob: int) -> int:
    """
    강우확률 점수
    0~40%: 2점
    41~70%: 1점
    71% 이상: 0점
    """
    if rain_prob <= 40:
        return 2
    if rain_prob <= 70:
        return 1
    return 0


def score_air_quality(level: str) -> int:
    """
    미세먼지 / 초미세먼지 공통 점수
    매우좋음, 좋음: 2점
    보통: 1점
    나쁨, 매우나쁨: 0점
    """
    if not level:
        return 0

    value = level.strip().lower()

    if value in ["매우좋음", "좋음", "very_good", "good"]:
        return 2
    if value in ["보통", "normal", "moderate"]:
        return 1
    if value in ["나쁨", "매우나쁨", "bad", "very_bad"]:
        return 0
    return 0


def score_weather_total(
    sky_condition: str,
    rain_probability: int,
    pm10_level: str,
    pm25_level: str,
) -> int:
    """
    날씨 총점: 최대 8점
    (하늘상태 2 + 강우확률 2 + 미세먼지 2 + 초미세먼지 2)
    """
    total = 0
    total += score_sky_condition(sky_condition)
    total += score_rain_probability(rain_probability)
    total += score_air_quality(pm10_level)
    total += score_air_quality(pm25_level)
    return total


def has_weather_alert(alerts: List[str]) -> bool:
    """
    특보가 하나라도 있으면 True
    """
    return len(alerts) > 0


def score_travel_time(minutes: int) -> int:
    """
    이동 시간 점수
    0~30분: 10점
    31~90분: 5점
    91분 이상: 0점
    """
    if minutes <= 30:
        return 10
    if minutes <= 90:
        return 5
    return 0


def score_keywords(selected_keywords: List[str], destination_keywords: List[str]) -> int:
    """
    키워드 점수
    일치하는 키워드 1개당 2점
    최대 10점
    """
    if not selected_keywords or not destination_keywords:
        return 0

    matched_count = 0

    for keyword in selected_keywords:
        if keyword in destination_keywords:
            matched_count += 1

    return min(matched_count * 2, 10)