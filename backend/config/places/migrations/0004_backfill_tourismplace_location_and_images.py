from django.db import migrations


def build_region_category_key(place):
    area_code = place.area_code or "all"
    sigungu_code = place.sigungu_code or "all"
    category_code = place.cat3 or place.cat2 or place.cat1 or str(place.content_type_id or "uncategorized")
    return f"{area_code}:{sigungu_code}:{category_code}"


def forwards(apps, schema_editor):
    TourismPlace = apps.get_model("places", "TourismPlace")

    for place in TourismPlace.objects.all().iterator():
        place.latitude = place.latitude or place.mapy
        place.longitude = place.longitude or place.mapx
        place.image_url = place.image_url or place.first_image
        place.thumbnail_url = place.thumbnail_url or place.first_image2
        place.region_category_key = place.region_category_key or build_region_category_key(place)
        place.save(
            update_fields=[
                "latitude",
                "longitude",
                "image_url",
                "thumbnail_url",
                "region_category_key",
            ]
        )


class Migration(migrations.Migration):

    dependencies = [
        ("places", "0003_tourismplace_image_url_tourismplace_latitude_and_more"),
    ]

    operations = [
        migrations.RunPython(forwards, migrations.RunPython.noop),
    ]
