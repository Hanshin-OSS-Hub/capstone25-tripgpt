CONTENT_TYPE_CATEGORY_MAP = {
    12: ("tourist_spot", "관광지"),
    14: ("tourist_spot", "관광지"),
    15: ("tourist_spot", "관광지"),
    25: ("tourist_spot", "관광지"),
    28: ("tourist_spot", "관광지"),
    32: ("stay", "숙소"),
    38: ("shopping", "쇼핑"),
    39: ("food", "음식점"),
}


def get_place_category(content_type_id):
    key, label = CONTENT_TYPE_CATEGORY_MAP.get(
        int(content_type_id or 0),
        ("other", "기타"),
    )
    return {
        "category_key": key,
        "category_label": label,
    }
