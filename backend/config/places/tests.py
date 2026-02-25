from django.test import TestCase

from .models import TourismPlace


class TourismPlaceModelTests(TestCase):
    def test_tourism_place_can_be_created(self):
        place = TourismPlace.objects.create(
            content_id=1001,
            content_type_id=12,
            title="경복궁",
            addr1="서울특별시 종로구 사직로 161",
            area_code="1",
            sigungu_code="23",
            mapx=126.97704100,
            mapy=37.57961700,
            raw_data={"title": "경복궁"},
        )

        self.assertEqual(place.title, "경복궁")
        self.assertEqual(place.content_id, 1001)
