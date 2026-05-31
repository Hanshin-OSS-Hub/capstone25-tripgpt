from django.db.models import Q
from django.http import JsonResponse
from django.views import View
from rest_framework.response import Response
from rest_framework.views import APIView

from places.models import TourismPlace
from places.recommendation.data_providers import REGION_AREA_CODE_MAP, normalize_region_name
from places.recommendation.score_rules import (
    build_place_score,
    score_base_quality,
    score_distance_convenience,
    score_landmark_value,
    score_season_time_fit,
    score_weather_total,
)
from places.recommendation.service import calculate_recommendation_score
from places.recommendation.data_providers import get_weather_data
from places.serializers import TourismPlaceSerializer


DETAILED_REGION_ALIASES = {
    "잠실": ["잠실", "잠실동", "잠실역", "잠실새내", "송파구 잠실"],
    "성수": ["성수", "성수동", "성수역", "서울숲", "성수동1가", "성수동2가"],
    "홍대": ["홍대", "홍대입구", "홍대입구역", "서교동", "연남동", "합정", "상수"],
    "강남": ["강남", "강남역", "역삼동", "논현동", "신사동", "압구정", "청담동"],
    "명동": ["명동", "명동역", "을지로입구", "충무로", "중구 명동"],
    "여의도": ["여의도", "여의도역", "여의나루", "영등포구 여의도"],
    "해운대": ["해운대", "해운대역", "우동", "중동", "달맞이", "해운대해수욕장"],
    "광안리": ["광안리", "광안동", "민락동", "광안리해수욕장"],
    "서면": ["서면", "서면역", "부전동", "전포동", "전포카페거리"],
    "남포동": ["남포동", "자갈치", "국제시장", "부평깡통시장", "광복동"],
    "애월": ["애월", "애월읍", "애월리", "곽지", "한담"],
    "협재": ["협재", "협재해수욕장", "한림", "금능"],
    "중문": ["중문", "중문관광단지", "색달동", "예래동"],
    "황리단길": ["황리단길", "황남동", "대릉원", "첨성대", "경주 황남동"],
    "동성로": ["동성로", "중앙로", "반월당", "대구 중구 동성로"],
    "송도": ["송도", "송도국제도시", "센트럴파크", "연수구 송도"],
}


def get_detailed_region_terms(region: str):
    if not region:
        return []

    terms = [region]
    terms.extend(DETAILED_REGION_ALIASES.get(region, []))
    return list(dict.fromkeys(term.strip() for term in terms if term.strip()))


class TourismPlaceListAPIView(APIView):
    def get(self, request):
        queryset = TourismPlace.objects.filter(is_active=True).order_by("title")

        region = normalize_region_name((request.GET.get("region") or "").strip())
        area_code = (request.GET.get("area_code") or "").strip()
        sigungu_code = (request.GET.get("sigungu_code") or "").strip()
        category_key = (request.GET.get("category") or "").strip()
        content_type_id = (request.GET.get("content_type_id") or "").strip()
        keywords_param = request.GET.get("keywords", "")
        selected_keywords = [k.strip() for k in keywords_param.split(",") if k.strip()]
        try:
            limit = min(max(int(request.GET.get("limit", 100)), 1), 5000)
        except ValueError:
            limit = 100

        detailed_region_keyword = ""
        if not area_code and region:
            area_code = REGION_AREA_CODE_MAP.get(region, "")
            if not area_code:
                detailed_region_keyword = region

        if area_code:
            queryset = queryset.filter(area_code=area_code)
        elif detailed_region_keyword:
            alias_terms = get_detailed_region_terms(detailed_region_keyword)
            detailed_query = Q()
            for term in alias_terms:
                detailed_query |= (
                    Q(addr1__icontains=term)
                    | Q(addr2__icontains=term)
                    | Q(title__icontains=term)
                )
            queryset = queryset.filter(detailed_query)
        if sigungu_code:
            queryset = queryset.filter(sigungu_code=sigungu_code)
        if category_key:
            queryset = queryset.filter(category_key=category_key)
        if content_type_id:
            queryset = queryset.filter(content_type_id=content_type_id)

        places = list(queryset[:limit])
        score_map = {}

        if places:
            weather_data = get_weather_data(region or "")
            weather_score = score_weather_total(
                sky_condition=weather_data.get("sky_condition", ""),
                rain_probability=weather_data.get("rain_probability", 100),
                pm10_level=weather_data.get("pm10_level", ""),
                pm25_level=weather_data.get("pm25_level", ""),
            )
            base_quality_score = score_base_quality()
            distance_score = score_distance_convenience(0)

            from django.utils import timezone

            now = timezone.localtime()

            for place in places:
                place_keywords = list(place.keyword_tags or [])
                if place.category_label and place.category_label not in place_keywords:
                    place_keywords.append(place.category_label)

                season_time_score = score_season_time_fit(
                    destination_keywords=place_keywords,
                    month=now.month,
                    hour=now.hour,
                )
                landmark_score = score_landmark_value(place_keywords)
                score_map[place.content_id] = build_place_score(
                    base_quality_score=base_quality_score,
                    weather_score=weather_score,
                    distance_score=distance_score,
                    season_time_score=season_time_score,
                    landmark_score=landmark_score,
                    selected_keywords=selected_keywords,
                    place_keywords=place_keywords,
                )

        serializer = TourismPlaceSerializer(places, many=True, context={"score_map": score_map})
        return Response(
            {
                "count": queryset.count(),
                "results": serializer.data,
            }
        )


class RecommendationAPIView(View):
    def get(self, request):
        region = normalize_region_name((request.GET.get("region") or "").strip())
        origin = (request.GET.get("origin") or "서울역").strip()
        transport_type = (request.GET.get("transport_type") or "transit").strip()

        keywords_param = request.GET.get("keywords", "")
        selected_keywords = [k.strip() for k in keywords_param.split(",") if k.strip()]

        if not region:
            return JsonResponse(
                {"error": "region 파라미터가 필요합니다."},
                status=400,
                json_dumps_params={"ensure_ascii": False},
            )

        result = calculate_recommendation_score(
            region=region,
            selected_keywords=selected_keywords,
            origin=origin,
            transport_type=transport_type,
        )

        return JsonResponse(result, json_dumps_params={"ensure_ascii": False})
