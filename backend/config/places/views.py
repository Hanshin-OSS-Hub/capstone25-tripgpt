from collections import Counter

from django.http import JsonResponse
from django.views import View
from rest_framework.response import Response
from rest_framework.views import APIView

from places.keyword_classifier import CATEGORY_KEYWORDS, classify_place
from places.models import TourismPlace
from places.recommendation.data_providers import REGION_AREA_CODE_MAP, normalize_region_name
from places.recommendation.service import calculate_recommendation_score
from places.serializers import TourismPlaceSerializer

PAGE_SIZE = 50


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

        if not area_code and region:
            area_code = REGION_AREA_CODE_MAP.get(region, "")

        keyword_tag = (request.GET.get("keyword_tag") or "").strip()

        if area_code:
            queryset = queryset.filter(area_code=area_code)
        if sigungu_code:
            queryset = queryset.filter(sigungu_code=sigungu_code)
        if category_key:
            queryset = queryset.filter(category_key=category_key)
        if content_type_id:
            queryset = queryset.filter(content_type_id=content_type_id)
        if keyword_tag:
            queryset = queryset.filter(keyword_tags__contains=keyword_tag)

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