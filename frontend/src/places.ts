export interface PlaceApiResult {
  content_id: number;
  title: string;
  addr1: string;
  addr2: string;
  area_code: string;
  sigungu_code: string;
  category_key: string;
  category_label: string;
  sub_category: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string;
  thumbnail_url: string;
  overview: string;
}

export const REGION_AREA_CODES: Record<string, string> = {
  "서울": "1",
  "인천": "2",
  "대전": "3",
  "대구": "4",
  "광주": "5",
  "부산": "6",
  "울산": "7",
  "세종": "8",
  "경기": "31",
  "강원": "32",
  "충북": "33",
  "충남": "34",
  "경북": "35",
  "경남": "36",
  "전북": "37",
  "전남": "38",
  "제주": "39",
};

export const REGION_OPTIONS = Object.keys(REGION_AREA_CODES);

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80";

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function inferFrontendTags(place: PlaceApiResult) {
  const text = [
    place.category_label,
    place.sub_category,
    place.title,
    place.overview,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const tags: string[] = [];

  if (place.category_key === "food") {
    tags.push("맛집", "한식", "중식", "일식", "양식", "시장", "먹거리거리");
  }

  if (place.category_key === "shopping") {
    tags.push("쇼핑", "시장", "핫플");
  }

  if (place.category_key === "stay") {
    tags.push("숙소", "핫플");
  }

  if (includesAny(text, ["해수욕장", "바다", "해변", "섬", "폭포", "산", "공원", "자연", "계곡", "동굴"])) {
    tags.push("자연", "바다", "산", "폭포", "섬", "캠핑");
  }

  if (includesAny(text, ["궁", "사찰", "유적", "박물관", "전통", "역사", "문화재", "한옥"])) {
    tags.push("역사", "전통문화", "유적", "박물관");
  }

  if (includesAny(text, ["타워", "전망", "랜드마크", "다리", "광장"])) {
    tags.push("랜드마크", "전망");
  }

  if (includesAny(text, ["레포츠", "체험", "놀이공원", "테마파크", "스키", "스포츠", "액티비티"])) {
    tags.push("액티비티", "체험", "테마파크");
  }

  if (includesAny(text, ["축제", "행사", "공연", "페스티벌"])) {
    tags.push("이벤트", "축제", "공연");
  }

  if (includesAny(text, ["사진", "야경", "포토", "핫플", "카페"])) {
    tags.push("핫플", "포토존", "야경", "카페거리");
  }

  if (tags.length === 0) {
    tags.push(place.category_label || "관광");
  }

  return unique(tags);
}

function inferFrontendCategory(place: PlaceApiResult, tags: string[]) {
  if (place.category_key === "food") return "맛집";
  if (place.category_key === "shopping") return "쇼핑";
  if (place.category_key === "stay") return "숙소";
  if (tags.includes("역사")) return "역사/문화";
  if (tags.includes("자연")) return "자연";
  if (tags.includes("랜드마크")) return "랜드마크";
  if (tags.includes("액티비티")) return "액티비티";
  if (tags.includes("이벤트")) return "이벤트";
  if (tags.includes("핫플")) return "핫플";
  return place.category_label || "관광";
}

export function mapPlaceToAttraction(place: PlaceApiResult) {
  const tags = inferFrontendTags(place);

  return {
    id: place.content_id,
    name: place.title,
    location: [place.addr1, place.addr2].filter(Boolean).join(" ") || "주소 정보 없음",
    score: 85,
    imageUrl: place.image_url || place.thumbnail_url || PLACEHOLDER_IMAGE,
    category: inferFrontendCategory(place, tags),
    categoryKey: place.category_key || "other",
    region: place.area_code,
    tags,
    nearbyActivities: place.overview ? [place.overview] : [],
    latitude: place.latitude,
    longitude: place.longitude,
  };
}
