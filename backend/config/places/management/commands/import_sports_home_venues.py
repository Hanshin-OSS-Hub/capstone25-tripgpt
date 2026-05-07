import os
import re

import requests
from django.core.management.base import BaseCommand, CommandError

from places.management.commands.import_tourism_places import build_place_defaults
from places.models import TourismPlace
from places.sports_home_venues import SPORTS_HOME_VENUES


TOUR_API_SEARCH_URL = "http://apis.data.go.kr/B551011/KorService2/searchKeyword2"


def normalize_title(value):
    return re.sub(r"[\s\-\(\)\[\]·,/]", "", (value or "")).lower()


def select_best_item(items, aliases):
    normalized_aliases = [normalize_title(alias) for alias in aliases]
    for item in items:
        normalized_title = normalize_title(item.get("title"))
        if normalized_title in normalized_aliases:
            return item

    for item in items:
        normalized_title = normalize_title(item.get("title"))
        if any(alias in normalized_title or normalized_title in alias for alias in normalized_aliases):
            return item

    return None


class Command(BaseCommand):
    help = "Import curated professional sports home venues from TourAPI into places_tourismplace."

    def add_arguments(self, parser):
        parser.add_argument("--service-key", dest="service_key")

    def handle(self, *args, **options):
        service_key = options["service_key"] or os.getenv("TOUR_API_SERVICE_KEY")
        if not service_key:
            raise CommandError("TOUR_API_SERVICE_KEY or --service-key is required.")

        session = requests.Session()
        created = 0
        updated = 0
        skipped = 0

        for venue in SPORTS_HOME_VENUES:
            matched_item = None
            used_alias = None

            for alias in venue["aliases"]:
                items = self.search_items(session, service_key, alias)
                matched_item = select_best_item(items, venue["aliases"])
                if matched_item:
                    used_alias = alias
                    break

            if not matched_item:
                skipped += 1
                self.stdout.write(
                    self.style.WARNING(f"skip {venue['name']} (no TourAPI match)")
                )
                continue

            content_id = int(matched_item["contentid"])
            _, is_created = TourismPlace.objects.update_or_create(
                content_id=content_id,
                defaults=build_place_defaults(matched_item),
            )

            if is_created:
                created += 1
            else:
                updated += 1

            self.stdout.write(
                self.style.SUCCESS(
                    f"{'created' if is_created else 'updated'} {venue['name']} "
                    f"-> {matched_item.get('title')} (alias={used_alias})"
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. created={created}, updated={updated}, skipped={skipped}"
            )
        )

    def search_items(self, session, service_key, keyword):
        response = session.get(
            TOUR_API_SEARCH_URL,
            params={
                "serviceKey": service_key,
                "MobileOS": "ETC",
                "MobileApp": "TripGPT",
                "_type": "json",
                "numOfRows": 20,
                "pageNo": 1,
                "keyword": keyword,
            },
            timeout=20,
        )
        response.raise_for_status()
        payload = response.json()
        body = payload.get("response", {}).get("body", {})
        items_container = body.get("items", {})
        if isinstance(items_container, str):
            return []

        items = items_container.get("item", [])
        if isinstance(items, dict):
            return [items]
        if isinstance(items, list):
            return items
        return []
