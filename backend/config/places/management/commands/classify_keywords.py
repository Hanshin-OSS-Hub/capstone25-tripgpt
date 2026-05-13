"""
management command: classify_keywords

저장된 모든 TourismPlace 에 keyword_tags 를 채웁니다.
usage:
    python manage.py classify_keywords          # 전체 재분류
    python manage.py classify_keywords --empty  # keyword_tags 가 비어있는 것만
"""
from collections import Counter

from django.core.management.base import BaseCommand

from places.keyword_classifier import CATEGORY_KEYWORDS, classify_place
from places.models import TourismPlace


class Command(BaseCommand):
    help = "TourismPlace 레코드를 프로젝트 키워드 카테고리로 분류합니다."

    def add_arguments(self, parser):
        parser.add_argument(
            "--empty",
            action="store_true",
            help="keyword_tags 가 비어있는 장소만 처리합니다.",
        )

    def handle(self, *args, **options):
        qs = TourismPlace.objects.filter(is_active=True)
        if options["empty"]:
            qs = qs.filter(keyword_tags=[])

        total = qs.count()
        self.stdout.write(f"대상 장소 수: {total}개")

        updated = 0
        batch: list[TourismPlace] = []

        for place in qs.iterator():
            tags = classify_place(
                title=place.title,
                category_label=place.category_label,
                overview=place.overview,
                addr1=place.addr1,
                addr2=place.addr2,
            )
            place.keyword_tags = tags
            batch.append(place)

            if len(batch) >= 200:
                TourismPlace.objects.bulk_update(batch, ["keyword_tags"])
                updated += len(batch)
                batch = []
                self.stdout.write(f"  {updated}/{total} 처리 중...")

        if batch:
            TourismPlace.objects.bulk_update(batch, ["keyword_tags"])
            updated += len(batch)

        self.stdout.write(self.style.SUCCESS(f"\n완료: {updated}개 장소 분류됨"))

        # ── 분류 결과 요약 ──────────────────────────────────────────────
        self.stdout.write("\n[카테고리별 장소 수]")
        tag_counter: Counter = Counter()
        for place in TourismPlace.objects.filter(is_active=True).only("keyword_tags"):
            for tag in (place.keyword_tags or []):
                tag_counter[tag] += 1

        for category in CATEGORY_KEYWORDS:
            cnt = tag_counter.get(category, 0)
            self.stdout.write(f"  {category:8s}: {cnt}개")

        unclassified = TourismPlace.objects.filter(is_active=True, keyword_tags=[]).count()
        self.stdout.write(f"\n  미분류    : {unclassified}개")
