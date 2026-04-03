from django.test import TestCase

from places.management.commands.import_tourism_places import (
    build_place_defaults,
    build_region_category_key,
)


class ImportTourismPlacesCommandTests(TestCase):
    def test_build_place_defaults_maps_tour_api_fields(self):
        item = {
            "contenttypeid": "12",
            "title": "Gyeongbokgung",
            "addr1": "161 Sajik-ro",
            "addr2": "Jongno-gu",
            "zipcode": "03045",
            "tel": "02-3700-3900",
            "homepage": "https://example.com",
            "areacode": "1",
            "sigungucode": "23",
            "cat1": "A02",
            "cat2": "A0201",
            "cat3": "A02010100",
            "mapx": "126.97704100",
            "mapy": "37.57961700",
            "firstimage": "https://example.com/1.jpg",
            "firstimage2": "https://example.com/2.jpg",
            "overview": "Palace",
            "modifiedtime": "20260318093000",
        }

        defaults = build_place_defaults(item)

        self.assertEqual(defaults["content_type_id"], 12)
        self.assertEqual(defaults["title"], "Gyeongbokgung")
        self.assertEqual(str(defaults["latitude"]), "37.57961700")
        self.assertEqual(str(defaults["longitude"]), "126.97704100")
        self.assertEqual(str(defaults["mapx"]), "126.97704100")
        self.assertEqual(str(defaults["mapy"]), "37.57961700")
        self.assertEqual(defaults["image_url"], "https://example.com/1.jpg")
        self.assertEqual(defaults["thumbnail_url"], "https://example.com/2.jpg")
        self.assertEqual(defaults["raw_data"], item)

    def test_build_region_category_key_uses_region_and_category(self):
        item = {
            "areacode": "1",
            "sigungucode": "23",
            "cat1": "A02",
            "cat2": "A0201",
            "cat3": "A02010100",
        }

        self.assertEqual(build_region_category_key(item), "1:23:A02010100")
