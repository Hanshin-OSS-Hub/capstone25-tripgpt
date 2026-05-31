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
            "keyword_tags",
            "latitude",
            "longitude",
            "image_url",
            "thumbnail_url",
        ]
        # overview, homepage, tel, zipcode, cat1/2/3, source_modified_time 제거

    def get_sub_category(self, obj):
        return obj.cat3 or obj.cat2 or obj.cat1 or ""
