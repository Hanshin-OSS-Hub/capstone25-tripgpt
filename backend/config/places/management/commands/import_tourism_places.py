import os
from decimal import Decimal, InvalidOperation

import requests
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from places.models import TourismPlace


TOUR_API_URL = "http://apis.data.go.kr/B551011/KorService2/areaBasedList2"


def as_string(value):
    if value is None:
        return ""
    return str(value).strip()


def as_decimal(value):
    value = as_string(value)
    if not value:
        return None
    try:
        return Decimal(value)
    except (InvalidOperation, TypeError, ValueError):
        return None


def build_place_defaults(item):
    return {
        "content_type_id": int(item.get("contenttypeid") or 0),
        "title": as_string(item.get("title")),
        "addr1": as_string(item.get("addr1")),
        "addr2": as_string(item.get("addr2")),
        "zipcode": as_string(item.get("zipcode")),
        "tel": as_string(item.get("tel")),
        "homepage": as_string(item.get("homepage")),
        "area_code": as_string(item.get("areacode")),
        "sigungu_code": as_string(item.get("sigungucode")),
        "cat1": as_string(item.get("cat1")),
        "cat2": as_string(item.get("cat2")),
        "cat3": as_string(item.get("cat3")),
        "mapx": as_decimal(item.get("mapx")),
        "mapy": as_decimal(item.get("mapy")),
        "first_image": as_string(item.get("firstimage")),
        "first_image2": as_string(item.get("firstimage2")),
        "overview": as_string(item.get("overview")),
        "source_modified_time": as_string(item.get("modifiedtime")),
        "raw_data": item,
        "is_active": True,
    }


class Command(BaseCommand):
    help = "Fetch tourism places from TourAPI and upsert them into places_tourismplace."

    def add_arguments(self, parser):
        parser.add_argument("--service-key", dest="service_key")
        parser.add_argument("--area-code", dest="area_code")
        parser.add_argument("--sigungu-code", dest="sigungu_code")
        parser.add_argument("--content-type-id", dest="content_type_id", type=int)
        parser.add_argument("--rows", dest="rows", type=int, default=100)
        parser.add_argument("--pages", dest="pages", type=int, default=1)
        parser.add_argument("--start-page", dest="start_page", type=int, default=1)

    def handle(self, *args, **options):
        service_key = options["service_key"] or os.getenv("TOUR_API_SERVICE_KEY")
        if not service_key:
            raise CommandError("TOUR_API_SERVICE_KEY or --service-key is required.")

        rows = options["rows"]
        pages = options["pages"]
        start_page = options["start_page"]
        area_code = options.get("area_code")
        sigungu_code = options.get("sigungu_code")
        content_type_id = options.get("content_type_id")

        total_created = 0
        total_updated = 0
        total_skipped = 0

        session = requests.Session()

        for page_no in range(start_page, start_page + pages):
            items = self.fetch_page(
                session=session,
                service_key=service_key,
                page_no=page_no,
                rows=rows,
                area_code=area_code,
                sigungu_code=sigungu_code,
                content_type_id=content_type_id,
            )

            if not items:
                self.stdout.write(self.style.WARNING(f"Page {page_no}: no items"))
                continue

            created, updated, skipped = self.save_items(items)
            total_created += created
            total_updated += updated
            total_skipped += skipped

            self.stdout.write(
                self.style.SUCCESS(
                    f"Page {page_no}: created={created}, updated={updated}, skipped={skipped}"
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. created={total_created}, updated={total_updated}, skipped={total_skipped}"
            )
        )

    def fetch_page(
        self,
        *,
        session,
        service_key,
        page_no,
        rows,
        area_code,
        sigungu_code,
        content_type_id,
    ):
        params = {
            "serviceKey": service_key,
            "MobileOS": "ETC",
            "MobileApp": "TripGPT",
            "_type": "json",
            "numOfRows": rows,
            "pageNo": page_no,
            "arrange": "A",
        }
        if area_code:
            params["areaCode"] = area_code
        if sigungu_code:
            params["sigunguCode"] = sigungu_code
        if content_type_id:
            params["contentTypeId"] = content_type_id

        response = session.get(TOUR_API_URL, params=params, timeout=20)
        if response.status_code >= 400:
            body = response.text[:500]
            raise CommandError(
                f"TourAPI request failed with status={response.status_code}, "
                f"url={response.url}, body={body}"
            )
        data = response.json()

        items = (
            data.get("response", {})
            .get("body", {})
            .get("items", {})
            .get("item", [])
        )

        if isinstance(items, dict):
            return [items]
        return items

    @transaction.atomic
    def save_items(self, items):
        created = 0
        updated = 0
        skipped = 0

        for item in items:
            content_id_raw = item.get("contentid")
            content_type_id_raw = item.get("contenttypeid")
            title = as_string(item.get("title"))

            if not content_id_raw or not content_type_id_raw or not title:
                skipped += 1
                continue

            content_id = int(content_id_raw)
            defaults = build_place_defaults(item)

            _, is_created = TourismPlace.objects.update_or_create(
                content_id=content_id,
                defaults=defaults,
            )
            if is_created:
                created += 1
            else:
                updated += 1

        return created, updated, skipped
