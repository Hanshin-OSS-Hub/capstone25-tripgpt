# places/data_providers.py

from typing import Dict, List

from .models import TourismPlace


def get_weather_data(region: str) -> Dict:
    """
    현재는 mock 데이터
    나중에 기상청 API로 교체 가능
    반환 형식만 유지하면 recommendation.py는 수정 최소화 가능
    """
    mock_weather = {
        "서울": {
            "sky_condition": "맑음",
            "rain_probability": 20,
            "pm10_level": "좋음",
            "pm25_level": "보통",
            "alerts": [],
        },
        "경기도": {
            "sky_condition": "흐림",
            "rain_probability": 50,
            "pm10_level": "보통",
            "pm25_level": "좋음",
            "alerts": [],
        },
        "인천": {
            "sky_condition": "비",
            "rain_probability": 80,
            "pm10_level": "나쁨",
            "pm25_level": "보통",
            "alerts": ["강풍주의보"],
        },
        "경상북도": {
            "sky_condition": "맑음",
            "rain_probability": 10,
            "pm10_level": "좋음",
            "pm25_level": "좋음",
            "alerts": [],
        },
        "부산": {
            "sky_condition": "맑음",
            "rain_probability": 15,
            "pm10_level": "좋음",
            "pm25_level": "좋음",
            "alerts": [],
        },
        "경주": {
            "sky_condition": "흐림",
            "rain_probability": 35,
            "pm10_level": "보통",
            "pm25_level": "좋음",
            "alerts": [],
        },
    }

    return mock_weather.get(
        region,
        {
            "sky_condition": "흐림",
            "rain_probability": 50,
            "pm10_level": "보통",
            "pm25_level": "보통",
            "alerts": [],
        },
    )


def get_travel_time_data(origin: str, destination: str, transport_type: str) -> Dict:
    """
    현재는 mock 데이터
    나중에 Tmap/Kakao/Naver 길찾기 API로 교체 가능
    """
    mock_times = {
        ("서울역", "서울", "transit"): 20,
        ("서울역", "경기도", "transit"): 50,
        ("서울역", "인천", "transit"): 70,
        ("서울역", "경상북도", "transit"): 180,
        ("서울역", "부산", "transit"): 210,
        ("서울역", "경주", "transit"): 190,

        ("서울역", "서울", "car"): 25,
        ("서울역", "경기도", "car"): 40,
        ("서울역", "인천", "car"): 60,
        ("서울역", "경상북도", "car"): 160,
        ("서울역", "부산", "car"): 260,
        ("서울역", "경주", "car"): 230,
    }

    minutes = mock_times.get((origin, destination, transport_type), 120)
    return {"minutes": minutes}


def get_destination_keywords(region: str) -> List[str]:
    """
    1차: mock 기반
    2차: DB 조회 fallback 확장
    """
    mock_keywords = {
        "서울": ["랜드마크", "문화", "역사", "쇼핑"],
        "경기도": ["자연", "드라이브", "가족", "체험"],
        "인천": ["바다", "랜드마크", "쇼핑", "문화"],
        "경상북도": ["역사", "문화", "자연", "힐링"],
        "부산": ["바다", "야경", "랜드마크", "맛집"],
        "경주": ["역사", "문화", "유적", "힐링"],
    }

    if region in mock_keywords:
        return mock_keywords[region]

    return []


def get_destination_keywords_from_db(region: str) -> List[str]:
    """
    나중에 실제 DB 기반으로 확장하기 위한 예시 함수
    지금은 TourismPlace의 cat1, cat2, cat3 등을 키워드처럼 활용
    """
    queryset = TourismPlace.objects.filter(area_name=region)[:20]

    keywords = set()
    for place in queryset:
        if place.cat1:
            keywords.add(place.cat1)
        if place.cat2:
            keywords.add(place.cat2)
        if place.cat3:
            keywords.add(place.cat3)

    return list(keywords)
