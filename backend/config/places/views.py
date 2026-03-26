# places/views.py

from django.http import JsonResponse
from django.views import View

from .recommendation import calculate_recommendation_score


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
