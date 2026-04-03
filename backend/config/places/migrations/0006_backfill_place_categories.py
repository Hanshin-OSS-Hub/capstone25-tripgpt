from django.db import migrations


CATEGORY_MAP = {
    12: ("tourist_spot", "관광지"),
    14: ("tourist_spot", "관광지"),
    15: ("tourist_spot", "관광지"),
    25: ("tourist_spot", "관광지"),
    28: ("tourist_spot", "관광지"),
    32: ("stay", "숙소"),
    38: ("shopping", "쇼핑"),
    39: ("food", "음식점"),
}


def forwards(apps, schema_editor):
    TourismPlace = apps.get_model("places", "TourismPlace")
    for place in TourismPlace.objects.all().iterator():
        category_key, category_label = CATEGORY_MAP.get(
            int(place.content_type_id or 0),
            ("other", "기타"),
        )
        place.category_key = category_key
        place.category_label = category_label
        place.save(update_fields=["category_key", "category_label"])


class Migration(migrations.Migration):
    dependencies = [
        ("places", "0005_tourismplace_category_key_and_more"),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
