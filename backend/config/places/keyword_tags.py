from __future__ import annotations


DETAIL_TAG_RULES: dict[str, list[str]] = {
    "자연": ["바다", "해변", "해수욕장", "계곡", "폭포", "산", "공원", "숲", "섬", "오름"],
    "랜드마크": ["타워", "전망대", "대교", "광장", "궁", "궁궐", "다리", "스카이워크"],
    "액티비티": ["놀이공원", "테마파크", "체험", "레포츠", "캠핑장", "스키장", "서핑", "카트"],
    "스포츠": ["야구", "축구", "농구", "배구", "골프", "볼링"],
    "맛집": ["시장", "먹거리거리", "카페거리", "해산물", "중식", "일식", "양식", "한식", "디저트", "카페"],
    "이벤트": ["축제", "공연", "뮤지컬", "전시", "팝업"],
    "핫플": ["포토존", "야경", "뷰포인트", "드라이브", "카페거리"],
    "역사": ["전통문화", "사찰", "유적", "박물관", "궁궐", "한옥", "향교"],
}

SPORTS_TAG_ALIASES: dict[str, list[str]] = {
    "야구장": [
        "야구장",
        "스카이돔",
        "랜더스필드",
        "라이온즈파크",
        "챔피언스필드",
        "위즈파크",
        "볼파크",
        "NC파크",
    ],
    "축구장": [
        "축구장",
        "월드컵경기장",
        "축구전용구장",
        "스틸야드",
        "축구센터",
        "스타디움",
    ],
    "배구장": [
        "배구",
        "체육관",
        "실내체육관",
        "아레나",
        "페퍼스타디움",
    ],
}


def unique(values: list[str]) -> list[str]:
    return list(dict.fromkeys([value for value in values if value]))


def infer_keyword_tags(*parts: str) -> list[str]:
    source_text = " ".join([part for part in parts if part])
    tags: list[str] = []

    for group, keywords in DETAIL_TAG_RULES.items():
        matched = [keyword for keyword in keywords if keyword in source_text]
        if matched:
            tags.append(group)
            tags.extend(matched)

    for tag, aliases in SPORTS_TAG_ALIASES.items():
        if any(alias in source_text for alias in aliases):
            tags.append("스포츠")
            tags.append(tag)

    return unique(tags)
