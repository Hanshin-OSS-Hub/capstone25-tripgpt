from django.db import models


class TourismPlace(models.Model):
    content_id = models.BigIntegerField(unique=True)
    content_type_id = models.IntegerField()
    title = models.CharField(max_length=255)
    addr1 = models.CharField(max_length=255, blank=True)
    addr2 = models.CharField(max_length=255, blank=True)
    zipcode = models.CharField(max_length=20, blank=True)
    tel = models.CharField(max_length=100, blank=True)
    homepage = models.TextField(blank=True)
    area_code = models.CharField(max_length=20, blank=True)
    sigungu_code = models.CharField(max_length=20, blank=True)
    cat1 = models.CharField(max_length=20, blank=True)
    cat2 = models.CharField(max_length=20, blank=True)
    cat3 = models.CharField(max_length=20, blank=True)
    mapx = models.DecimalField(max_digits=12, decimal_places=8, null=True, blank=True)
    mapy = models.DecimalField(max_digits=12, decimal_places=8, null=True, blank=True)
    first_image = models.URLField(max_length=500, blank=True)
    first_image2 = models.URLField(max_length=500, blank=True)
    overview = models.TextField(blank=True)
    source_modified_time = models.CharField(max_length=30, blank=True)
    raw_data = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["content_type_id"]),
            models.Index(fields=["area_code", "sigungu_code"]),
            models.Index(fields=["cat1", "cat2", "cat3"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.content_id})"
