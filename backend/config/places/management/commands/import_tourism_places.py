import os
from decimal import Decimal, InvalidOperation

import requests
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from places.category_map import get_place_category
from places.curated_region_map import (
    REGION_CATEGORY_MAP,
    REGION_NAME_TO_AREA_CODE,
    flatten_region_keywords,
)
from places.keyword_tags import infer_keyword_tags
from places.models import TourismPlace


TOUR_API_URL = "http://apis.data.go.kr/B551011/KorService2/areaBasedList2"
DEFAULT_AREA_CODES = ["1"]
ALL_AREA_CODES = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "31",
    "32",
    "33",
    "34",
    "35",
    "36",
    "37",
    "38",
    "39",
]


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


def build_region_category_key(item):
    area_code = as_string(item.get("areacode")) or "all"
    sigungu_code = as_string(item.get("sigungucode")) or "all"
    category_code = (
        as_string(item.get("cat3"))
        or as_string(item.get("cat2"))
        or as_string(item.get("cat1"))
        or as_string(item.get("contenttypeid"))
        or "uncategorized"
    )
    return f"{area_code}:{sigungu_code}:{category_code}"


def build_place_defaults(item):
    category = get_place_category(item.get("contenttypeid"))
    latitude = as_decimal(item.get("mapy"))
    longitude = as_decimal(item.get("mapx"))
    image_url = as_string(item.get("firstimage"))
    thumbnail_url = as_string(item.get("firstimage2"))

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
        "category_key": category["category_key"],
        "category_label": category["category_label"],
        "cat1": as_string(item.get("cat1")),
        "cat2": as_string(item.get("cat2")),
        "cat3": as_string(item.get("cat3")),
        "latitude": latitude,
        "longitude": longitude,
        "mapx": longitude,
        "mapy": latitude,
        "image_url": image_url,
        "thumbnail_url": thumbnail_url,
        "first_image": image_url,
        "first_image2": thumbnail_url,
        "region_category_key": build_region_category_key(item),
        "keyword_tags": infer_keyword_tags(
            as_string(item.get("title")),
            category["category_label"],
            as_string(item.get("overview")),
            as_string(item.get("addr1")),
            as_string(item.get("addr2")),
        ),
        "overview": as_string(item.get("overview")),
        "source_modified_time": as_string(item.get("modifiedtime")),
        "raw_data": item,
        "is_active": True,
    }


def normalize_keyword(value):
    return as_string(value).replace(" ", "").lower()


def item_matches_keywords(item, keywords):
    if not keywords:
        return True

    normalized_title = normalize_keyword(item.get("title"))
    if not normalized_title:
        return False

    for keyword in keywords:
        normalized_keyword = normalize_keyword(keyword)
        if not normalized_keyword:
            continue
        if normalized_keyword in normalized_title or normalized_title in normalized_keyword:
            return True

    return False


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
        parser.add_argument("--per-group-limit", dest="per_group_limit", type=int, default=0)
        parser.add_argument(
            "--curated",
            action="store_true",
            help="Import only places matching the curated region/category keyword map.",
        )
        parser.add_argument(
            "--curated-region",
            dest="curated_regions",
            action="append",
            help="Limit curated import to one or more named regions like 서울, 부산, 제주.",
        )
        parser.add_argument(
            "--all-areas",
            action="store_true",
            help="Import all area codes instead of the default Seoul-only import.",
        )

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
        per_group_limit = options["per_group_limit"]
        all_areas = options["all_areas"]
        curated = options["curated"]
        curated_regions = options.get("curated_regions") or []
        area_codes, curated_keywords = self.resolve_import_scope(
            area_code=area_code,
            all_areas=all_areas,
            curated=curated,
            curated_regions=curated_regions,
        )

        total_created = 0
        total_updated = 0
        total_skipped = 0

        session = requests.Session()

        for current_area_code in area_codes:
            self.stdout.write(self.style.NOTICE(f"Importing area_code={current_area_code}"))

            for page_no in range(start_page, start_page + pages):
                items = self.fetch_page(
                    session=session,
                    service_key=service_key,
                    page_no=page_no,
                    rows=rows,
                    area_code=current_area_code,
                    sigungu_code=sigungu_code,
                    content_type_id=content_type_id,
                )

                if not items:
                    self.stdout.write(
                        self.style.WARNING(
                            f"area_code={current_area_code}, page={page_no}: no items"
                        )
                    )
                    continue

                if curated_keywords:
                    items = [
                        item for item in items if item_matches_keywords(item, curated_keywords)
                    ]
                    if not items:
                        self.stdout.write(
                            self.style.WARNING(
                                f"area_code={current_area_code}, page={page_no}: no curated matches"
                            )
                        )
                        continue

                created, updated, skipped = self.save_items(
                    items,
                    per_group_limit=per_group_limit,
                )
                total_created += created
                total_updated += updated
                total_skipped += skipped

                self.stdout.write(
                    self.style.SUCCESS(
                        f"area_code={current_area_code}, page={page_no}: "
                        f"created={created}, updated={updated}, skipped={skipped}"
                    )
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. created={total_created}, updated={total_updated}, skipped={total_skipped}"
            )
        )

    def resolve_area_codes(self, *, area_code, all_areas):
        if area_code:
            return [str(area_code)]
        if all_areas:
            return ALL_AREA_CODES
        return DEFAULT_AREA_CODES

    def resolve_import_scope(self, *, area_code, all_areas, curated, curated_regions):
        if not curated and not curated_regions:
            return self.resolve_area_codes(area_code=area_code, all_areas=all_areas), []

        selected_regions = curated_regions or list(REGION_CATEGORY_MAP.keys())
        unknown_regions = [region for region in selected_regions if region not in REGION_NAME_TO_AREA_CODE]
        if unknown_regions:
            raise CommandError(
                f"Unknown curated region(s): {', '.join(unknown_regions)}"
            )

        area_codes = []
        for region in selected_regions:
            area_code_value = REGION_NAME_TO_AREA_CODE[region]
            if area_code_value not in area_codes:
                area_codes.append(area_code_value)

        return area_codes, flatten_region_keywords(selected_regions)

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

        response_data = data.get("response", {})
        body = response_data.get("body", {}) if isinstance(response_data, dict) else {}
        items_container = body.get("items", {}) if isinstance(body, dict) else {}

        if isinstance(items_container, dict):
            items = items_container.get("item", [])
        elif isinstance(items_container, list):
            items = items_container
        else:
            return []

        if isinstance(items, dict):
            return [items]
        if isinstance(items, list):
            return items
        return []

    @transaction.atomic
    def save_items(self, items, per_group_limit):
        created = 0
        updated = 0
        skipped = 0
        group_counts = {}

        for item in items:
            content_id_raw = item.get("contentid")
            content_type_id_raw = item.get("contenttypeid")
            title = as_string(item.get("title"))

            if not content_id_raw or not content_type_id_raw or not title:
                skipped += 1
                continue

            content_id = int(content_id_raw)
            defaults = build_place_defaults(item)
            region_category_key = defaults["region_category_key"]

            existing_place = TourismPlace.objects.filter(content_id=content_id).first()
            if existing_place is None and per_group_limit > 0:
                if region_category_key not in group_counts:
                    group_counts[region_category_key] = TourismPlace.objects.filter(
                        region_category_key=region_category_key
                    ).count()

                if group_counts[region_category_key] >= per_group_limit:
                    skipped += 1
                    continue

            place, is_created = TourismPlace.objects.update_or_create(content_id=content_id, defaults=defaults)
            if is_created:
                created += 1
                if per_group_limit > 0:
                    group_counts[region_category_key] = group_counts.get(region_category_key, 0) + 1
            else:
                updated += 1

        return created, updated, skipped
