from django.test import TestCase

from places.category_map import get_place_category


class PlaceCategoryMapTests(TestCase):
    def test_food_category_mapping(self):
        category = get_place_category(39)

        self.assertEqual(category["category_key"], "food")
        self.assertEqual(category["category_label"], "음식점")
