# app_name/services.py
from decimal import Decimal

class TripScoringService:
    """
    여행지 점수 산출을 위한 통합 서비스
    """
    
    # --- [상수 설정] ---
    SCORE_WEATHER_MAX = 6.0   # 날씨(2) + 강수(2) + 미세먼지(2) = 6점 (특보는 0점 처리)
    SCORE_TRAFFIC_MAX = 10.0  # 교통 만점
    SCORE_KEYWORD_MAX = 30.0  # 키워드 매칭 만점 (10개 * 3점)

    # 1. 날씨 점수 계산 로직
    @classmethod
    def calculate_weather_score(cls, weather_data: dict) -> float:
        """
        weather_data 예시:
        {
            "condition": "Sunny",  # Sunny, Cloudy, Rain, Snow 등
            "rain_prob": 30,       # 0 ~ 100
            "dust_status": "Good", # VeryGood, Good, Moderate, Bad, VeryBad
            "warning": False       # True면 기상특보 발효
        }
        """
        # [Rule] 기상 특보/주의보 발효 시 -> 즉시 0점 반환 (또는 별도 플래그 처리)
        if weather_data.get("warning", False):
            return -1.0  # -1은 '여행 불가' 신호로 사용

        score = 0.0

        # (1) 하늘 상태 (맑음 2, 흐림 1, 비/기타 0)
        condition = weather_data.get("condition", "").lower()
        if condition in ["sunny", "clear", "맑음"]:
            score += 2.0
        elif condition in ["cloudy", "overcast", "흐림"]:
            score += 1.0
        else:
            score += 0.0

        # (2) 강수 확률 (0~40%: 2, 40~70%: 1, 70%~: 0)
        rain_prob = weather_data.get("rain_prob", 0)
        if rain_prob <= 40:
            score += 2.0
        elif rain_prob <= 70:
            score += 1.0
        else:
            score += 0.0

        # (3) 미세먼지 (좋음/매우좋음: 2, 보통: 1, 나쁨: 0)
        dust = weather_data.get("dust_status", "").lower()
        if dust in ["verygood", "good", "좋음", "매우좋음"]:
            score += 2.0
        elif dust in ["moderate", "보통"]:
            score += 1.0
        else:
            score += 0.0
            
        return score

    # 2. 이동 시간(교통) 점수 계산 로직
    @classmethod
    def calculate_traffic_score(cls, duration_minutes: int) -> float:
        """
        duration_minutes: 분 단위 소요 시간
        """
        if duration_minutes <= 30:
            return 10.0
        elif duration_minutes <= 90: # 1시간 30분
            return 5.0
        else:
            return 0.0

    # 3. [ML 파트] 지역 및 키워드 가중치 매칭 로직
    @classmethod
    def calculate_ml_keyword_score(cls, user_prefs: dict, attraction_features: dict) -> float:
        """
        사용자 선호도(User Prefs)와 여행지 특성(Attraction Features)의 벡터 유사도 계산.
        단순 일치가 아니라 '가중치'를 곱하여 합산합니다.
        
        user_prefs: {"서울": 0.8, "힐링": 0.9, "카페": 0.5 ...}
        attraction_features: {"지역_서울": 1.0, "힐링": 0.8, "카페": 1.0 ...}
        """
        total_score = 0.0
        
        # 지역 가중치 (서울, 경기도 등) - ML 모델이 '사용자가 서울을 좋아한다'고 판단한 가중치
        # 10개 키워드 * 최대 3점 = 30점 만점으로 스케일링
        
        # 교집합 키워드 찾기
        common_keys = set(user_prefs.keys()) & set(attraction_features.keys())
        
        for key in common_keys:
            # 사용자 가중치 (0~1) * 여행지 특성 점수 (0~1) * 3점(키워드당 배점)
            u_weight = float(user_prefs.get(key, 0))
            a_weight = float(attraction_features.get(key, 0))
            
            # 여기서 ML적 요소: 단순히 있다/없다가 아니라 '얼마나(Weight)' 매칭되는지 계산
            total_score += (u_weight * a_weight * 3.0)
            
        # 최대 점수를 30점으로 제한 (캡핑)
        return min(total_score, cls.SCORE_KEYWORD_MAX)

    # 4. 최종 점수 통합
    @classmethod
    def get_final_trip_score(cls, user, attraction_feature, weather_data, traffic_minutes):
        # A. 날씨 점수
        weather_score = cls.calculate_weather_score(weather_data)
        if weather_score == -1.0:
            return {
                "final_score": 0,
                "is_available": False,
                "message": "기상 특보로 인해 여행이 권장되지 않습니다."
            }

        # B. 교통 점수
        traffic_score = cls.calculate_traffic_score(traffic_minutes)

        # C. ML 키워드/지역 점수
        ml_score = cls.calculate_ml_keyword_score(
            user.preference_keywords, 
            attraction_feature.keyword_json
        )
        
        # D. 기본 점수 (Attraction 자체의 Base Score)
        base_score = float(attraction_feature.base_score)

        # 최종 합산
        final_total = base_score + weather_score + traffic_score + ml_score
        
        return {
            "final_score": round(final_total, 2),
            "is_available": True,
            "details": {
                "base": base_score,
                "weather": weather_score,
                "traffic": traffic_score,
                "ai_match": ml_score
            }
        }