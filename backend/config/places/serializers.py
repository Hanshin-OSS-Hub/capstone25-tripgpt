from rest_framework import serializers
from places.models import TourismPlace


class TourismPlaceSerializer(serializers.ModelSerializer):
    sub_category = serializers.SerializerMethodField()
    recommendation_score = serializers.SerializerMethodField()

    class Meta:
        model = TourismPlace
        fields = [
            "content_id",
            "title",
            "addr1",
            "addr2",
            "area_code",
            "sigungu_code",
            "category_key",
            "category_label",
            "keyword_tags",
            "sub_category",
            "recommendation_score",
            "latitude",
            "longitude",
            "image_url",
            "thumbnail_url",
        ]

    def get_sub_category(self, obj):
        return obj.cat3 or obj.cat2 or obj.cat1 or ""

    def get_recommendation_score(self, obj):
        return getattr(obj, "recommendation_score", None)
