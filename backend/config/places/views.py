from django.http import JsonResponse
from django.views import View
from rest_framework.response import Response
from rest_framework.views import APIView

from places.models import TourismPlace
from places.recommendation.service import calculate_recommendation_score
from places.serializers import TourismPlaceSerializer


class TourismPlaceListAPIView(APIView):
    def get(self, request):
        queryset = TourismPlace.objects.filter(is_active=True).order_by("title")

        area_code = (request.GET.get("area_code") or "").strip()
        sigungu_code = (request.GET.get("sigungu_code") or "").strip()
        category_key = (request.GET.get("category") or "").strip()
        content_type_id = (request.GET.get("content_type_id") or "").strip()
        try:
            limit = min(max(int(request.GET.get("limit", 100)), 1), 5000)
        except ValueError:
            limit = 100

        if area_code:
            queryset = queryset.filter(area_code=area_code)
        if sigungu_code:
            queryset = queryset.filter(sigungu_code=sigungu_code)
        if category_key:
            queryset = queryset.filter(category_key=category_key)
        if content_type_id:
            queryset = queryset.filter(content_type_id=content_type_id)

        serializer = TourismPlaceSerializer(queryset[:limit], many=True)
        return Response(
            {
                "count": queryset.count(),
                "results": serializer.data,
            }
        )


class RecommendationAPIView(View):
    def get(self, request):
        region = (request.GET.get("region") or "").strip()
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
