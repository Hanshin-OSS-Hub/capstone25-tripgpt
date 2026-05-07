from django.core.management.base import BaseCommand
from django.db import transaction

from places.models import TourismPlace


TITLE_VARIANT_SEPARATORS = (
    " ",
    "(",
    "[",
    "·",
    ",",
    "-",
    "/",
)


def find_base_title(title, exact_titles):
    """
    Keep the exact short place title when it exists, and treat longer
    prefix variants as removable noise.

    Example:
    - keep:   "광화문"
    - remove: "광화문 한복체험"
    """

    for separator in TITLE_VARIANT_SEPARATORS:
        prefix, marker, _ = title.partition(separator)
        if marker and prefix in exact_titles:
            return prefix

    return None


class Command(BaseCommand):
    help = "Delete longer prefix-based place title variants when an exact base title exists."

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Actually delete matched rows. Without this flag, the command prints a dry-run summary.",
        )

    def handle(self, *args, **options):
        apply_changes = options["apply"]

        places = list(
            TourismPlace.objects.values("id", "title", "area_code", "category_key").order_by(
                "area_code", "title", "id"
            )
        )

        titles_by_area = {}
        for place in places:
            area_code = place["area_code"] or ""
            titles_by_area.setdefault(area_code, set()).add(place["title"])

        duplicate_ids = []
        duplicate_rows = []

        for place in places:
            area_code = place["area_code"] or ""
            base_title = find_base_title(place["title"], titles_by_area.get(area_code, set()))
            if not base_title:
                continue

            duplicate_ids.append(place["id"])
            duplicate_rows.append(
                {
                    "id": place["id"],
                    "title": place["title"],
                    "base_title": base_title,
                    "area_code": area_code,
                    "category_key": place["category_key"],
                }
            )

        preview = duplicate_rows[:20]
        self.stdout.write(f"matched_variants={len(duplicate_rows)}")
        for row in preview:
            self.stdout.write(
                f"- area={row['area_code']} keep='{row['base_title']}' "
                f"delete='{row['title']}' category={row['category_key']}"
            )

        if not apply_changes:
            self.stdout.write(self.style.WARNING("Dry run only. Re-run with --apply to delete rows."))
            return

        with transaction.atomic():
            deleted_count, _ = TourismPlace.objects.filter(id__in=duplicate_ids).delete()

        self.stdout.write(self.style.SUCCESS(f"Deleted {deleted_count} rows."))
