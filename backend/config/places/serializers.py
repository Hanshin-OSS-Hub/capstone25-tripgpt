from rest_framework import serializers

from places.models import TourismPlace


class TourismPlaceSerializer(serializers.ModelSerializer):
    sub_category = serializers.SerializerMethodField()

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
            "sub_category",
            "latitude",
            "longitude",
            "image_url",
            "thumbnail_url",
            "overview",
            "source_modified_time",
        ]

    def get_sub_category(self, obj):
        return obj.cat3 or obj.cat2 or obj.cat1 or ""
