from collections import Counter

from django.db.models import Q
from django.http import JsonResponse
from django.views import View
from rest_framework.response import Response
from rest_framework.views import APIView

from places.keyword_classifier import CATEGORY_KEYWORDS, classify_place
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

PAGE_SIZE = 50


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
        queryset = TourismPlace.objects.filter(is_active=True).order_by("-id")  # score 없으니 id 기준

        region = normalize_region_name((request.GET.get("region") or "").strip())
        area_code = (request.GET.get("area_code") or "").strip()
        sigungu_code = (request.GET.get("sigungu_code") or "").strip()
        category_key = (request.GET.get("category") or "").strip()
        content_type_id = (request.GET.get("content_type_id") or "").strip()

        try:
            page = max(int(request.GET.get("page", 1)), 1)
        except ValueError:
            page = 1

        detailed_region_keyword = ""
        if not area_code and region:
            area_code = REGION_AREA_CODE_MAP.get(region, "")
            if not area_code:
                detailed_region_keyword = region

        keyword_tags = [t.strip() for t in request.GET.getlist("keyword_tag") if t.strip()]

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
        if keyword_tags:
            q = Q()
            for tag in keyword_tags:
                q |= Q(keyword_tags__contains=tag)
            queryset = queryset.filter(q)

        total = queryset.count()
        offset = (page - 1) * PAGE_SIZE
        serializer = TourismPlaceSerializer(queryset[offset:offset + PAGE_SIZE], many=True)

        return Response({
            "count": total,
            "page": page,
            "page_size": PAGE_SIZE,
            "total_pages": (total + PAGE_SIZE - 1) // PAGE_SIZE,
            "results": serializer.data,
        })


class KeywordClassificationAPIView(APIView):
    """
    GET /api/places/keyword-classification/
    저장된 장소들을 프로젝트 키워드 카테고리별로 집계해서 반환합니다.

    쿼리 파라미터:
      - region: 지역 이름으로 필터 (선택)
    """

    def get(self, request):
        region = normalize_region_name((request.GET.get("region") or "").strip())
        qs = TourismPlace.objects.filter(is_active=True)

        if region:
            area_code = REGION_AREA_CODE_MAP.get(region, "")
            if area_code:
                qs = qs.filter(area_code=area_code)

        tag_counter: Counter = Counter()
        unclassified_ids: list[int] = []

        for place in qs.only("content_id", "keyword_tags"):
            tags = place.keyword_tags or []
            if tags:
                for tag in tags:
                    tag_counter[tag] += 1
            else:
                unclassified_ids.append(place.content_id)

        summary = {
            category: tag_counter.get(category, 0)
            for category in CATEGORY_KEYWORDS
        }
        summary["미분류"] = len(unclassified_ids)

        return Response(
            {
                "region": region or "전체",
                "total": qs.count(),
                "classification": summary,
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