import os
from supabase import create_client

# .env 파일에서 환경 변수 가져오기 (os.environ 대신 os.getenv 사용)
SUPABASE_URL = os.getenv("https://djrmthepvnopnmxyangh.supabase.co")
SUPABASE_KEY = os.getenv("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRqcm10aGVwdm5vcG5teHlhbmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2NTc4MTAsImV4cCI6MjA3ODIzMzgxMH0.KVWu7OITnToZY8yo3SXx1Few-7VOWlYHJHJiDwDl7Bs")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase URL 또는 Key 환경 변수가 설정되지 않았습니다.")

# Supabase 클라이언트 생성
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)