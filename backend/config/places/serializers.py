from rest_framework import serializers

from places.models import TourismPlace


class TourismPlaceSerializer(serializers.ModelSerializer):
    sub_category = serializers.SerializerMethodField()
    recommendation_score = serializers.SerializerMethodField()

    class Meta:
        model = TourismPlace
        fields = [
            "content_id",
            "content_type_id",
            "title",
            "addr1",
            "addr2",
            "zipcode",
            "tel",
            "homepage",
            "area_code",
            "sigungu_code",
            "cat1",
            "cat2",
            "cat3",
            "category_key",
            "category_label",
            "keyword_tags",
            "sub_category",
            "recommendation_score",
            "latitude",
            "longitude",
            "image_url",
            "thumbnail_url",
            "overview",
            "source_modified_time",
        ]

    def get_sub_category(self, obj):
        return obj.cat3 or obj.cat2 or obj.cat1 or ""

    def get_recommendation_score(self, obj):
        score_map = self.context.get("score_map", {})
        return score_map.get(obj.content_id)
