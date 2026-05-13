# 프로젝트에서 정의한 카테고리 ↔ 키워드 매핑
# ChatInput.tsx + App.tsx 의 CATEGORY_TAGS / DETAIL_TAG_RULES 를 통합
CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "자연": [
        "바다", "해변", "해수욕장", "계곡", "폭포", "산", "공원",
        "섬", "호수", "강", "하천", "습지", "갯벌", "절벽", "동굴",
        "국립공원", "도립공원", "생태",
    ],
    "랜드마크": [
        "타워", "전망대", "대교", "광장", "건축", "빌딩", "스카이",
        "다리", "등대", "항구",
    ],
    "액티비티": [
        "놀이공원", "테마파크", "체험", "레포츠",
        "래프팅", "번지", "스카이다이빙", "집라인", "카약", "서핑",
        "패러글라이딩", "수상스키",
    ],
    "스포츠": [
        "야구", "축구", "농구", "배구", "골프", "볼링", "체육관",
        "경기장", "스타디움", "수영장", "스케이트",
        "스카이돔", "랜더스필드", "라이온즈파크", "챔피언스필드",
        "위즈파크", "볼파크", "NC파크", "월드컵경기장", "스틸야드",
    ],
    "맛집": [
        "시장", "먹거리", "카페", "한식", "중식", "일식",
        "양식", "디저트", "해산물", "맛집", "음식", "식당",
        "막걸리", "전통주", "베이커리",
    ],
    "이벤트": [
        "축제", "공연", "전시", "팝업", "뮤직", "페어",
        "박람회", "행사", "콘서트",
    ],
    "핫플": [
        "포토존", "야경", "뷰포인트", "드라이브", "카페거리",
        "인스타", "감성", "루프탑",
    ],
    "역사": [
        "궁", "궁궐", "문화재", "사찰", "박물관", "유적",
        "전통", "역사", "절", "서원", "향교", "성곽", "고택",
        "민속", "무형문화",
    ],
    "쇼핑": [
        "쇼핑", "아울렛", "백화점", "면세점", "쇼핑몰",
    ],
}


def classify_place(title: str, category_label: str, overview: str, addr1: str = "", addr2: str = "") -> list[str]:
    """
    장소의 텍스트 정보로부터 프로젝트 카테고리 + 세부 키워드 태그 목록을 반환합니다.
    반환 형식: [카테고리, 세부키워드, ...] (카테고리가 먼저, 이후 매칭된 세부키워드)
    여러 카테고리에 중복 분류될 수 있습니다.
    """
    source = " ".join(filter(None, [title, category_label, overview, addr1, addr2])).lower()

    tags: list[str] = []
    for category, keywords in CATEGORY_KEYWORDS.items():
        matched_keywords = [kw for kw in keywords if kw in source]
        if matched_keywords:
            tags.append(category)
            tags.extend(matched_keywords)

    # 중복 제거 (순서 유지)
    seen: set[str] = set()
    unique_tags: list[str] = []
    for tag in tags:
        if tag not in seen:
            seen.add(tag)
            unique_tags.append(tag)

    return unique_tags
