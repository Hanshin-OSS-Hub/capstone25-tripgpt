from django.db import models

from django.contrib.auth.models import AbstractUser
import uuid

# 1. USER 테이블 (Django 기본 User 모델 확장)
# 주의: settings.py에서 AUTH_USER_MODEL 설정이 필요합니다.
class User(AbstractUser):
    # Supabase Auth와 연동하기 위해 UUID를 PK로 사용
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # username, email, date_joined(created_at)는 AbstractUser에 이미 포함되어 있으나,
    # 명확한 제약조건을 위해 오버라이딩하거나 그대로 둡니다. (Django 기본이 이미 잘 되어 있음)
    
    # 추가 필드: 선호 키워드 (JSONB)
    preference_keywords = models.JSONField(null=True, blank=True, help_text="사용자 선호 키워드/가중치")

    class Meta:
        db_table = 'users'  # 테이블 이름 지정 (선택사항)

# 2. ATTRACTIONS 테이블 (마스터 데이터)
class Attraction(models.Model):
    # id는 Django가 자동으로 BigAutoField(Integer)를 생성해줍니다.
    name = models.CharField(max_length=255, verbose_name="여행지 공식 이름")
    type = models.CharField(max_length=50, verbose_name="여행지 유형")
    
    # 위치 정보 (소수점 저장)
    latitude = models.DecimalField(max_digits=10, decimal_places=7, verbose_name="위도")
    longitude = models.DecimalField(max_digits=10, decimal_places=7, verbose_name="경도")
    
    description = models.TextField(null=True, blank=True, verbose_name="상세 설명")

    def __str__(self):
        return self.name

# 3. ATTRACTIONS_FEATURES 테이블 (ML 피처)
class AttractionFeature(models.Model):
    # Foreign Key 설정 (Attraction이 삭제되면 피처도 삭제됨: CASCADE)
    attraction = models.ForeignKey(Attraction, on_delete=models.CASCADE, related_name='features')
    
    keyword_json = models.JSONField(verbose_name="여행지별 키워드 데이터")
    review_sentiment_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    base_score = models.DecimalField(max_digits=5, decimal_places=2, verbose_name="ML 모델 기초 점수")

# 4. TRIP_SCORES 테이블 (결과 데이터)
class TripScore(models.Model):
    attraction = models.ForeignKey(Attraction, on_delete=models.CASCADE)
    # User가 삭제되어도 점수 기록은 남기고 싶다면 on_delete=models.SET_NULL (null=True 필수)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    final_score = models.DecimalField(max_digits=4, decimal_places=2)
    weather_impact = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    traffic_impact = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    
    # calculated_at은 auto_now_add=True를 쓰면 생성 시 자동 기록
    calculated_at = models.DateTimeField(auto_now_add=True)
