from rest_framework.response import Response
from rest_framework.views import APIView

from places.models import TourismPlace
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
