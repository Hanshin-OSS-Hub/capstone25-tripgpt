import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DestinationCard } from "./components/DestinationCard";
import { LoginDialog } from "./components/LoginDialog";
import { SignupDialog } from "./components/SignupDialog";
import { MyPageDialog } from "./components/MyPageDialog";
import { SearchBar } from "./components/SearchBar";
import { ChatInput } from "./components/ChatInput";
import { AttractionDetailDialog } from "./components/AttractionDetailDialog";
import { Button } from "./components/ui/button";
import { LogIn, LogOut, User, Plane, Globe, Languages } from "lucide-react";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner@2.0.3";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import myeongdongImage from "figma:asset/0770d9d3ce5a6ffbfdb1fb147a646aec241ad03e.png";
import seoullandImage from "figma:asset/9e963221c3f1733a027a15bc5330b412361c056e.png";
import itaewonImage from "figma:asset/317ecf22f4837f9b82c5c22fbf3f2d1c8e4fd081.png";

// 지역별 세부 관광지 데이터
const attractionsByRegion: { [key: string]: any[] } = {
  서울: [
    {
      id: 101,
      name: "서울랜드",
      location: "서울특별시 과천시",
      score: 88,
      imageUrl: seoullandImage,
      category: "놀이공원",
      region: "서울",
      tags: ["놀이공원", "액티비티", "테마파크", "가족", "데이트"],
      nearbyActivities: [
        "국립현대미술관 과천관 - 현대미술 작품 감상",
        "서울대공원 - 동물원과 산책로",
        "과천 렛츠런파크 - 승마 체험 및 공연 관람",
        "청계산 등산 - 자연 속 하이킹",
      ],
    },
    {
      id: 102,
      name: "경복궁",
      location: "서울특별시 종로구",
      score: 94,
      imageUrl: "https://images.unsplash.com/photo-1625551922738-3fb390d041dc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxHeWVvbmdib2tndW5nJTIwcGFsYWNlJTIwU2VvdWx8ZW58MXx8fHwxNzYyMzMyNDUzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "문화/역사",
      region: "서울",
      tags: ["역사", "문화", "궁궐", "랜드마크", "박물관", "유적"],
      nearbyActivities: [
        "국립고궁박물관 - 조선시대 왕실 문화재 관람",
        "국립민속박물관 - 한국 전통 문화 체험",
        "인사동 거리 - 전통 공예품 쇼핑 및 찻집 방문",
        "북촌 한옥마을 - 전통 한옥 거리 산책",
      ],
    },
    {
      id: 103,
      name: "남산타워",
      location: "서울특별시 용산구",
      score: 92,
      imageUrl: "https://images.unsplash.com/photo-1652172175826-4d769c1ffcec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxOYW1zYW4lMjB0b3dlciUyMFNlb3VsfGVufDF8fHx8MTc2MjMzMjQ1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "관광명소",
      region: "서울",
      tags: ["랜드마크", "타워", "전망", "데이트", "야경", "산", "핫플", "포토존"],
      nearbyActivities: [
        "남산 케이블카 - 케이블카로 편하게 이동",
        "남산 공원 산책로 - 도심 속 숲길 산책",
        "한옥마을 - 전통 한옥 체험",
        "명동 쇼핑 거리 - 도보 10분 거리 쇼핑가",
      ],
    },
    {
      id: 104,
      name: "이태원",
      location: "서울특별시 용산구",
      score: 87,
      imageUrl: itaewonImage,
      category: "쇼핑/식당",
      region: "서울",
      tags: ["쇼핑", "맛집", "문화", "거리", "먹거리거리", "카페거리"],
      nearbyActivities: [
        "이태원 앤틱 가구 거리 - 독특한 인테리어 소품 쇼핑",
        "경리단길 - 감성 카페와 레스토랑 투어",
        "전쟁기념관 - 한국 전쟁 역사 학습",
        "용산 가족공원 - 가족 나들이 및 피크닉",
      ],
    },
    {
      id: 105,
      name: "홍대",
      location: "서울특별시 마포구",
      score: 90,
      imageUrl: "https://images.unsplash.com/photo-1748696009693-a04d400d08de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxIb25nZGFlJTIwU2VvdWwlMjBuaWdodGxpZmV8ZW58MXx8fHwxNzYyMzM2NDczfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "문화/공연",
      region: "서울",
      tags: ["공연", "거리", "쇼핑", "야경", "예술", "핫플", "이벤트", "카페거리"],
      nearbyActivities: [
        "홍대 거리 공연 - 버스킹과 거리 예술 감상",
        "트릭아이 미술관 - 착시 미술 체험",
        "망원 한강공원 - 한강 피크닉 및 자전거",
        "연남동 카페거리 - 독특한 테마 카페 투어",
      ],
    },
    {
      id: 106,
      name: "롯데타워",
      location: "서울특별시 송파구",
      score: 91,
      imageUrl: "https://images.unsplash.com/photo-1662075241003-9b937a892123?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxMb3R0ZSUyMFRvd2VyJTIwU2VvdWx8ZW58MXx8fHwxNzYyMzM2NDc0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "관광명소",
      region: "서울",
      tags: ["랜드마크", "타워", "전망", "쇼핑", "야경", "핫플", "포토존"],
      nearbyActivities: [
        "롯데월드 - 실내외 테마파크",
        "석촌호수 - 벚꽃 명소 및 산책로",
        "롯데월드몰 - 쇼핑 및 맛집 탐방",
        "서울스카이 - 123층 전망대에서 야경 감상",
      ],
    },
    {
      id: 107,
      name: "명동",
      location: "서울특별시 중구",
      score: 89,
      imageUrl: myeongdongImage,
      category: "쇼핑",
      region: "서울",
      tags: ["쇼핑", "맛집", "거리", "먹거리거리", "핫플"],
      nearbyActivities: [
        "명동성당 - 한국 천주교 역사 유적",
        "남대문시장 - 전통 시장에서 쇼핑",
        "덕수궁 돌담길 - 로맨틱한 산책로",
        "을지로 - 빈티지 감성의 카페와 술집",
      ],
    },
    {
      id: 108,
      name: "북촌 한옥마을",
      location: "서울특별시 종로구",
      score: 93,
      imageUrl: "https://images.unsplash.com/photo-1630135199928-55a43e87350d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxCdWtjaG9uJTIwSGFub2slMjBVaWxsYWdlfGVufDF8fHx8MTc2MjMzNjQ3NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "문화/역사",
      region: "서울",
      tags: ["역사", "문화", "한옥", "사진", "핫플", "포토존", "체험"],
      nearbyActivities: [
        "삼청동 카페거리 - 감성 카페와 갤러리 투어",
        "전통문화체험관 - 한복 체험 및 전통공예",
        "인사동 - 전통 찻집과 공예품 쇼핑",
        "창덕궁 후원 - 비원 산책 (사전 예약 필수)",
      ],
    },
    {
      id: 109,
      name: "강남",
      location: "서울특별시 강남구",
      score: 86,
      imageUrl: "https://images.unsplash.com/photo-1602921738381-46ab2f34ed5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxHYW5nbmFtJTIwU2VvdWx8ZW58MXx8fHwxNzYyMzM2NDc1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "쇼핑/엔터테인먼트",
      region: "서울",
      tags: ["쇼핑", "맛집", "야경", "거리", "핫플"],
      nearbyActivities: [
        "코엑스몰 - 대형 쇼핑몰과 별마당 도서관",
        "봉은사 - 도심 속 전통 사찰",
        "가로수길 - 트렌디한 카페와 부티크 쇼핑",
        "선릉 - 조선시대 왕릉 산책",
      ],
    },
  ],
  부산: [
    {
      id: 201,
      name: "해운대 해수욕장",
      location: "부산광역시 해운대구",
      score: 93,
      imageUrl: "https://images.unsplash.com/photo-1647767444107-8f383924382d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxIYWV1bmRhZSUyMGJlYWNoJTIwQnVzYW58ZW58MXx8fHwxNzYyMzMyNDU1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "해변",
      region: "부산",
      tags: ["바다", "해변", "여름", "휴양"],
      nearbyActivities: [
        "동백섬 누리마루 - 해안 산책로와 APEC 하우스",
        "더베이101 - 요트 투어 및 해양 레저",
        "해운대 전통시장 - 해산물과 먹거리 쇼핑",
        "달맞이길 - 야경 명소",
      ],
    },
    {
      id: 202,
      name: "감천문화마을",
      location: "부산광역시 사하구",
      score: 89,
      imageUrl: "https://images.unsplash.com/photo-1710007220521-0102eaf43a32?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxHYW1jaGVvbiUyMHZpbGxhZ2UlMjBCdXNhbnxlbnwxfHx8fDE3NjIzMzI0NTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "문화/예술",
      region: "부산",
      tags: ["문화", "예술", "마을", "사진"],
      nearbyActivities: [
        "마을 벽화 골목 - 포토존 투어",
        "작은박물관 - 마을 역사 체험",
        "하늘마루 전망대 - 마을 전경 감상",
        "아트샵과 카페 - 기념품 쇼핑",
      ],
    },
    {
      id: 203,
      name: "광안리 해수욕장",
      location: "부산광역시 수영구",
      score: 91,
      imageUrl: "https://images.unsplash.com/photo-1732517400836-3cb8f1be5204?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxHd2FuZ2FuJTIwQnJpZGdlJTIwQnVzYW58ZW58MXx8fHwxNzYyMzM2NDc1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "해변",
      region: "부산",
      tags: ["바다", "해변", "야경", "랜드마크"],
      nearbyActivities: [
        "광안대교 야경 - 다이아몬드 브릿지 조명쇼",
        "민락회센터 - 횟집 거리",
        "광안리 카페거리 - 바다뷰 카페",
        "수변공원 - 산책 및 자전거",
      ],
    },
    {
      id: 204,
      name: "태종대",
      location: "부산광역시 영도구",
      score: 88,
      imageUrl: "https://images.unsplash.com/photo-1699324908366-33788d82761a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxUYWVqb25nZGFlJTIwQnVzYW4lMjBjbGlmZnxlbnwxfHx8fDE3NjIzMzY0NzV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "자연",
      region: "부산",
      tags: ["자연", "바다", "절벽", "사진"],
      nearbyActivities: [
        "다누비 열차 - 해안 절경 순환 열차",
        "태종대 등대 - 전망대 및 기념관",
        "신선바위 - 절벽 위 전망",
        "영도대교 도개 - 다리가 열리는 광경",
      ],
    },
    {
      id: 205,
      name: "자갈치시장",
      location: "부산광역시 중구",
      score: 86,
      imageUrl: "https://images.unsplash.com/photo-1671087478128-a4ea2e91473e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxKYWdhbGNoaSUyMGZpc2glMjBtYXJrZXQlMjBCdXNhbnxlbnwxfHx8fDE3NjIzMzY0Nzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "시장",
      region: "부산",
      tags: ["맛집", "시장", "문화", "해산물"],
      nearbyActivities: [
        "국제시장 - 전통 시장 쇼핑",
        "BIFF 광장 - 영화제 거리와 먹거리",
        "보수동 책방골목 - 헌책방 탐방",
        "남포동 먹거리 거리 - 부산 대표 맛집",
      ],
    },
    {
      id: 206,
      name: "용두산공원",
      location: "부산광역시 중구",
      score: 85,
      imageUrl: "https://images.unsplash.com/photo-1652337469924-f8d6d20316c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxZb25nZHVzYW4lMjBQYXJrJTIwQnVzYW58ZW58MXx8fHwxNzYyMzM2NDc5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "공원",
      region: "부산",
      tags: ["공원", "전망", "랜드마크"],
      nearbyActivities: [
        "부산타워 - 전망대에서 시내 전경",
        "용두산 산책로 - 도심 속 휴식",
        "광복동 쇼핑거리 - 패션 쇼핑",
        "차이나타운 - 중국 음식과 문화",
      ],
    },
  ],
  경주: [
    {
      id: 301,
      name: "불국사",
      location: "경상북도 경주시",
      score: 95,
      imageUrl: "https://images.unsplash.com/photo-1534213469793-c32466377e9c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxCdWxndWtzYSUyMHRlbXBsZSUyMEd5ZW9uZ2p1fGVufDF8fHx8MTc2MjMzMjQ1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "문화/역사",
      region: "경주",
      tags: ["역사", "문화", "사찰", "유네스코", "랜드마크"],
      nearbyActivities: [
        "석굴암 - 불국사 인근 석굴 사찰",
        "토함산 등산로 - 사찰 주변 산책",
        "경주 ��물관 - 신라 문화재 전시",
        "보문호수 - 리조트 및 자전거 투어",
      ],
    },
    {
      id: 302,
      name: "첨성대",
      location: "경상북도 경주시",
      score: 91,
      imageUrl: "https://images.unsplash.com/photo-1572608957298-845202fad05d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxHeWVvbmdqdSUyMHRlbXBsZSUyMEtvcmVhfGVufDF8fHx8MTc2MjMyODIzNnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "문화/역사",
      region: "경주",
      tags: ["역사", "천문대", "문화", "랜드마크"],
    },
    {
      id: 303,
      name: "석굴암",
      location: "경상북도 경주시",
      score: 96,
      imageUrl: "https://images.unsplash.com/photo-1708758172682-5fc51b7922ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTZW9rZ3VyYW0lMjBncm90dG8lMjBLb3JlYXxlbnwxfHx8fDE3NjIzMzY0Nzl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "문화/역사",
      region: "경주",
      tags: ["역사", "문화", "사찰", "유네스코", "랜드마크"],
    },
    {
      id: 304,
      name: "대릉원",
      location: "경상북도 경주시",
      score: 89,
      imageUrl: "https://images.unsplash.com/photo-1644647926885-fe106de1c4d0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxEYWVyZXVuZ3dvbiUyMHRvbWJzJTIwR3llb25nanV8ZW58MXx8fHwxNzYyMzM2NDgwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "문화/역사",
      region: "경주",
      tags: ["역사", "문화", "공원", "사진"],
    },
  ],
  제주: [
    {
      id: 401,
      name: "성산일출봉",
      location: "제주특별자치도 서귀포시",
      score: 96,
      imageUrl: "https://images.unsplash.com/photo-1578341358423-fab765ac3e5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTZW9uZ3NhbiUyMHN1bnJpc2UlMjBwZWFrJTIwSmVqdXxlbnwxfHx8fDE3NjIzMzI0NTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "자연",
      region: "제주",
      tags: ["자연", "산", "일출", "유네스코", "랜드마크"],
    },
    {
      id: 402,
      name: "한라산",
      location: "제주특별자치도",
      score: 94,
      imageUrl: "https://images.unsplash.com/photo-1633570172409-a08cae80e33d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxIYWxsYXNhbiUyMG1vdW50YWluJTIwSmVqdXxlbnwxfHx8fDE3NjIzMDM0ODB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "자연/산",
      region: "제주",
      tags: ["자연", "산", "등산", "국립공원"],
    },
    {
      id: 403,
      name: "협재 해수욕장",
      location: "제주특별자치도 제주시",
      score: 92,
      imageUrl: "https://images.unsplash.com/photo-1708881419465-4d3d88035999?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxIeWVvcGphZSUyMGJlYWNoJTIwSmVqdXxlbnwxfHx8fDE3NjIzMzY0ODB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "해변",
      region: "제주",
      tags: ["바다", "해변", "휴양", "여름"],
    },
    {
      id: 404,
      name: "우도",
      location: "제주특별자치도 제주시",
      score: 93,
      imageUrl: "https://images.unsplash.com/photo-1700419193663-e138f21dc410?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxVZG8lMjBpc2xhbmQlMjBKZWp1fGVufDF8fHx8MTc2MjMzNjQ4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "섬",
      region: "제주",
      tags: ["자연", "바다", "섬", "사진"],
    },
    {
      id: 405,
      name: "천지연폭포",
      location: "제주특별자치도 서귀포시",
      score: 88,
      imageUrl: "https://images.unsplash.com/photo-1757454391661-2d7f6b71e660?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxDaGVvbmppeWVvbiUyMHdhdGVyZmFsbCUyMEplanV8ZW58MXx8fHwxNzYyMzM2NDgxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "자연",
      region: "제주",
      tags: ["자연", "폭포", "사진"],
    },
    {
      id: 406,
      name: "만장굴",
      location: "제주특별자치도 제주시",
      score: 90,
      imageUrl: "https://images.unsplash.com/photo-1509689266740-ecc1b3c3de2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxNYW5qYW5nZ3VsJTIwY2F2ZSUyMEplanV8ZW58MXx8fHwxNzYyMzM2NDgxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "자연",
      region: "제주",
      tags: ["자연", "동굴", "유네스코"],
    },
  ],
  제주도: [
    {
      id: 401,
      name: "성산일출봉",
      location: "제주특별자치도 서귀포시",
      score: 96,
      imageUrl: "https://images.unsplash.com/photo-1578341358423-fab765ac3e5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTZW9uZ3NhbiUyMHN1bnJpc2UlMjBwZWFrJTIwSmVqdXxlbnwxfHx8fDE3NjIzMzI0NTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "자연",
      region: "제주",
      tags: ["자연", "산", "일출", "유네스코", "랜드마크"],
    },
    {
      id: 402,
      name: "한라산",
      location: "제주특별자치도",
      score: 94,
      imageUrl: "https://images.unsplash.com/photo-1633570172409-a08cae80e33d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxIYWxsYXNhbiUyMG1vdW50YWluJTIwSmVqdXxlbnwxfHx8fDE3NjIzMDM0ODB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "자연/산",
      region: "제주",
      tags: ["자연", "산", "등산", "국립공원"],
    },
    {
      id:403,
      name: "협재 해수욕장",
      location: "제주특별자치도 제주시",
      score: 92,
      imageUrl: "https://images.unsplash.com/photo-1708881419465-4d3d88035999?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxIeWVvcGphZSUyMGJlYWNoJTIwSmVqdXxlbnwxfHx8fDE3NjIzMzY0ODB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "해변",
      region: "제주",
      tags: ["바다", "해변", "휴양", "여름"],
    },
    {
      id: 404,
      name: "우도",
      location: "제주특별자치도 제주시",
      score: 93,
      imageUrl: "https://images.unsplash.com/photo-1700419193663-e138f21dc410?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxVZG8lMjBpc2xhbmQlMjBKZWp1fGVufDF8fHx8MTc2MjMzNjQ4MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "섬",
      region: "제주",
      tags: ["자연", "바다", "섬", "사진"],
    },
    {
      id: 405,
      name: "천지연폭포",
      location: "제주특별자치도 서귀포시",
      score: 88,
      imageUrl: "https://images.unsplash.com/photo-1757454391661-2d7f6b71e660?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxDaGVvbmppeWVvbiUyMHdhdGVyZmFsbCUyMEplanV8ZW58MXx8fHwxNzYyMzM2NDgxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "자연",
      region: "제주",
      tags: ["자연", "폭포", "사진"],
    },
    {
      id: 406,
      name: "만장굴",
      location: "제주특별자치도 제주시",
      score: 90,
      imageUrl: "https://images.unsplash.com/photo-1509689266740-ecc1b3c3de2a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxNYW5qYW5nZ3VsJTIwY2F2ZSUyMEplanV8ZW58MXx8fHwxNzYyMzM2NDgxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      category: "자연",
      region: "제주",
      tags: ["자연", "동굴", "유네스코"],
    },
  ],
  경기도: [
    {
      id: 701,
      name: "에버랜드",
      location: "경기도 용인시",
      score: 95,
      imageUrl: "https://images.unsplash.com/photo-1594138230954-6b6e1b9cb7e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbXVzZW1lbnQlMjBwYXJrJTIwa29yZWF8ZW58MXx8fHwxNzYyMzM2NDgxfDA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "테마파크",
      region: "경기도",
      tags: ["놀이공원", "테마파크", "액티비티", "가족", "동물원"],
      nearbyActivities: [
        "캐리비안베이 - 워터파크",
        "한국민속촌 - 전통문화 체험",
        "용인 자연휴양림 - 숲속 산책",
        "호암미술관 - 미술 작품 감상"
      ],
    },
    {
      id: 702,
      name: "수원 화성",
      location: "경기도 수원시",
      score: 92,
      imageUrl: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTdXdvbiUyMEh3YXNlb25nfGVufDF8fHx8MTc2MjMzNjQ4MXww&ixlib=rb-4.1.0&q=80&w=1080",
      category: "역사/문화",
      region: "경기도",
      tags: ["역사", "전통문화", "유적", "궁궐", "유네스코"],
      nearbyActivities: [
        "행궁동 벽화마을 - 아트 거리",
        "수원 행궁 - 임시 궁궐 관람",
        "팔달문 시장 - 전통 시장",
        "플라잉 수원 - 수원 전경 감상"
      ],
    },
    {
      id: 703,
      name: "남이섬",
      location: "경기도 가평군",
      score: 91,
      imageUrl: "https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxOYW1pc2VvbSUyMGlzbGFuZHxlbnwxfHx8fDE3NjIzMzY0ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "자연",
      region: "경기도",
      tags: ["섬", "자연", "산", "포토존", "캠핑"],
      nearbyActivities: [
        "자라섬 재즈 페스티벌 - 음악 축제",
        "쁘띠프랑스 - 프랑스 마을 테마파크",
        "제이드가든 - 수목원",
        "아침고요수목원 - 정원 산책"
      ],
    },
    {
      id: 704,
      name: "파주 출판도시",
      location: "경기도 파주시",
      score: 87,
      imageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxib29rJTIwY2l0eSUyMGtvcmVhfGVufDF8fHx8MTc2MjMzNjQ4Mnww&ixlib=rb-4.1.0&q=80&w=1080",
      category: "문화",
      region: "경기도",
      tags: ["박물관", "예술", "포토존", "카페거리"],
      nearbyActivities: [
        "헤이리 예술마을 - 갤러리 투어",
        "임진각 평화누리 - 역사 교육",
        "통일전망대 - 북한 조망",
        "프로방스 마을 - 포토존"
      ],
    },
  ],
  인천: [
    {
      id: 801,
      name: "송도 센트럴파크",
      location: "인천광역시 연수구",
      score: 89,
      imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxTb25nZG8lMjBDZW50cmFsJTIwUGFya3xlbnwxfHx8fDE3NjIzMzY0ODJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "공원",
      region: "인천",
      tags: ["공원", "산책", "데이트", "야경", "포토존"],
      nearbyActivities: [
        "트라이볼 - 전시 및 공연",
        "NC큐브 커넬워크 - 쇼핑",
        "송도 해수욕장 - 바다 산책",
        "컴팩트 스마트시티 - 미래도시 체험"
      ],
    },
    {
      id: 802,
      name: "차이나타운",
      location: "인천광역시 중구",
      score: 86,
      imageUrl: "https://images.unsplash.com/photo-1582730147164-d0bcce9c1eed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGluYXRvd24lMjBrb3JlYXxlbnwxfHx8fDE3NjIzMzY0ODN8MA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "문화",
      region: "인천",
      tags: ["중식", "먹거리거리", "전통문화", "포토존"],
      nearbyActivities: [
        "짜장면박물관 - 짜장면 역사",
        "자유공원 - 맥아더 장군 동상",
        "개항장 거리 - 근대 역사",
        "월미도 - 놀이공원과 바다"
      ],
    },
    {
      id: 803,
      name: "을왕리 해수욕장",
      location: "인천광역시 중구",
      score: 88,
      imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMHN1bnNldCUyMGtvcmVhfGVufDF8fHx8MTc2MjMzNjQ4M3ww&ixlib=rb-4.1.0&q=80&w=1080",
      category: "해변",
      region: "인천",
      tags: ["바다", "해산물", "캠핑", "야경"],
      nearbyActivities: [
        "왕산 해수욕장 - 조용한 해변",
        "실미도 - 영화 촬영지",
        "을왕리 카페거리 - 바다뷰 카페",
        "선녀바위 - 일몰 명소"
      ],
    },
  ],
  대구: [
    {
      id: 901,
      name: "팔공산",
      location: "대구광역시 동구",
      score: 90,
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3VudGFpbiUyMGtvcmVhfGVufDF8fHx8MTc2MjMzNjQ4M3ww&ixlib=rb-4.1.0&q=80&w=1080",
      category: "자연",
      region: "대구",
      tags: ["산", "사찰", "계곡", "캠핑"],
      nearbyActivities: [
        "동화사 - 천년 고찰",
        "갓바위 - 소원 기원",
        "팔공산 케이블카 - 전망대",
        "파계사 - 단풍 명소"
      ],
    },
    {
      id: 902,
      name: "서문시장",
      location: "대구광역시 중구",
      score: 87,
      imageUrl: "https://images.unsplash.com/photo-1555243896-c709bfa0b564?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFkaXRpb25hbCUyMG1hcmtldCUyMGtvcmVhfGVufDF8fHx8MTc2MjMzNjQ4M3ww&ixlib=rb-4.1.0&q=80&w=1080",
      category: "시장",
      region: "대구",
      tags: ["시장", "맛집", "먹거리거리", "한식"],
      nearbyActivities: [
        "서문시장 야시장 - 야간 먹거리",
        "중앙로 - 패션거리",
        "약령시 - 한방약재 시장",
        "진골목 - 한의학 거리"
      ],
    },
    {
      id: 903,
      name: "김광석 다시그리기길",
      location: "대구광역시 중구",
      score: 85,
      imageUrl: "https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXJhbCUyMHN0cmVldCUyMGFydHxlbnwxfHx8fDE3NjIzMzY0ODR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "문화",
      region: "대구",
      tags: ["포토존", "버스킹", "카페거리", "야경"],
      nearbyActivities: [
        "방천시장 - 전통 시장",
        "수창청춘맨숀 - 복합문화공간",
        "앞산 전망대 - 대구 야경",
        "카페거리 - 힙한 카페"
      ],
    },
  ],
  광주: [
    {
      id: 1001,
      name: "무등산",
      location: "광주광역시 동구",
      score: 91,
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxtb3VudGFpbiUyMGtvcmVhfGVufDF8fHx8MTc2MjMzNjQ4NHww&ixlib=rb-4.1.0&q=80&w=1080",
      category: "자연",
      region: "광주",
      tags: ["산", "자연", "계곡"],
      nearbyActivities: [
        "무등산 국립공원 - 등산 코스",
        "중머리재 - 능선 트레킹",
        "원효사 - 사찰 탐방",
        "증심사 - 단풍 명소"
      ],
    },
    {
      id: 1002,
      name: "양림동 역사문화마을",
      location: "광주광역시 남구",
      score: 88,
      imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2aW50YWdlJTIwdmlsbGFnZXxlbnwxfHx8fDE3NjIzMzY0ODR8MA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "문화",
      region: "광주",
      tags: ["역사", "전통문화", "포토존", "카페거리"],
      nearbyActivities: [
        "펭귄마을 - 벽화 골목",
        "1913 송정역시장 - 전통시장",
        "우일선 선교사 사택 - 근대 건축",
        "호랑가시나무 언덕 - 전망 좋은 카페"
      ],
    },
    {
      id: 1003,
      name: "국립아시아문화전당",
      location: "광주광역시 동구",
      score: 89,
      imageUrl: "https://images.unsplash.com/photo-1568876694728-451bbf694b83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcmNoaXRlY3R1cmUlMjBrb3JlYXxlbnwxfHx8fDE3NjIzMzY0ODV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "문화/예술",
      region: "광주",
      tags: ["박물관", "전시", "예술", "공연"],
      nearbyActivities: [
        "5.18 민주광장 - 역사 교육",
        "충장로 - 쇼핑거리",
        "광주극장 - 독립영화",
        "예술의 거리 - 갤러리 투어"
      ],
    },
  ],
  대전: [
    {
      id: 1101,
      name: "엑스포과학공원",
      location: "대전광역시 유성구",
      score: 86,
      imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2llbmNlJTIwcGFya3xlbnwxfHx8fDE3NjIzMzY0ODV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "과학/교육",
      region: "대전",
      tags: ["박물관", "체험", "가족", "공원"],
      nearbyActivities: [
        "국립중앙과학관 - 과학 체험",
        "한빛탑 - 전망대",
        "대전예술의전당 - 공연 관람",
        "유성온천 - 온천욕"
      ],
    },
    {
      id: 1102,
      name: "대청호",
      location: "대전광역시 동구",
      score: 87,
      imageUrl: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYWtlJTIwc2NlbmVyeXxlbnwxfHx8fDE3NjIzMzY0ODV8MA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "자연",
      region: "대전",
      tags: ["바다", "캠핑", "레저"],
      nearbyActivities: [
        "대청호 오백리길 - 트레킹",
        "대청댐 - 댐 견학",
        "문의문화재단지 - 전통문화",
        "추동습지 - 생태 탐방"
      ],
    },
    {
      id: 1103,
      name: "성심당",
      location: "대전광역시 중구",
      score: 90,
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYWtlcnklMjBzaG9wfGVufDF8fHx8MTc2MjMzNjQ4NXww&ixlib=rb-4.1.0&q=80&w=1080",
      category: "맛집",
      region: "대전",
      tags: ["디저트", "맛집"],
      nearbyActivities: [
        "으은동 카페거리 - 힙한 카페",
        "중앙시장 - 전통 시장",
        "대전역 근처 맛집 - 성심당 투어",
        "선화동 - 벽화마을"
      ],
    },
  ],
  울산: [
    {
      id: 1201,
      name: "대왕암공원",
      location: "울산광역시 동구",
      score: 89,
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxyb2NrJTIwZm9ybWF0aW9uJTIwb2NlYW58ZW58MXx8fHwxNzYyMzM2NDg2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "자연",
      region: "울산",
      tags: ["바다", "자연", "포토존", "야경"],
      nearbyActivities: [
        "슬도 등대 - 등대 전망",
        "일산해수욕장 - 해변 산책",
        "대왕암 전설 - 역사 이야기",
        "동구 해안 드라이브 - 코스"
      ],
    },
    {
      id: 1202,
      name: "간절곶",
      location: "울산광역시 울주군",
      score: 91,
      imageUrl: "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdW5yaXNlJTIwb2NlYW58ZW58MXx8fHwxNzYyMzM2NDg2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "자연",
      region: "울산",
      tags: ["바다", "일출", "포토존"],
      nearbyActivities: [
        "소망우체통 - 소원 편지",
        "간절곶 등대 - 등대 공원",
        "진하해수욕장 - 해변",
        "명선교 - 출렁다리"
      ],
    },
    {
      id: 1203,
      name: "울산대공원",
      location: "울산광역시 남구",
      score: 85,
      imageUrl: "https://images.unsplash.com/photo-1566450844439-fc2346f64d2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXJrJTIwa29yZWF8ZW58MXx8fHwxNzYyMzM2NDg2fDA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "공원",
      region: "울산",
      tags: ["공원", "산책", "가족", "캠핑"],
      nearbyActivities: [
        "장미원 - 장미 정원",
        "남구 카페거리 - 카페 투어",
        "태화강 대공원 - 십리대숲",
        "울산박물관 - 울산 역사"
      ],
    },
  ],
  충청도: [
    {
      id: 1301,
      name: "단양 도담삼봉",
      location: "충청북도 단양군",
      score: 90,
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxyb2NrJTIwZm9ybWF0aW9uJTIwcml2ZXJ8ZW58MXx8fHwxNzYyMzM2NDg3fDA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "자연",
      region: "충청도",
      tags: ["자연", "산", "포토존"],
      nearbyActivities: [
        "구담봉 - 등산",
        "사인암 - 절벽",
        "석문 - 천연 석문",
        "단양 패러글라이딩 - 레저"
      ],
    },
    {
      id: 1302,
      name: "공주 공산성",
      location: "충청남도 공주시",
      score: 88,
      imageUrl: "https://images.unsplash.com/photo-1591946614720-90a587da4a36?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxrb3JlYW4lMjBmb3J0cmVzc3xlbnwxfHx8fDE3NjIzMzY0ODd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "역사",
      region: "충청도",
      tags: ["역사", "유적", "전통문화"],
      nearbyActivities: [
        "국립공주박물관 - 백제 유물",
        "무령왕릉 - 왕릉 관람",
        "공주 한옥마을 - 전통문화",
        "금강 유람선 - 강 유람"
      ],
    },
    {
      id: 1303,
      name: "보령 머드축제",
      location: "충청남도 보령시",
      score: 87,
      imageUrl: "https://images.unsplash.com/photo-1533105079780-92b9be482077?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMGZlc3RpdmFsfGVufDF8fHx8MTc2MjMzNjQ4N3ww&ixlib=rb-4.1.0&q=80&w=1080",
      category: "축제",
      region: "충청도",
      tags: ["축제", "바다", "체험"],
      nearbyActivities: [
        "대천해수욕장 - 해변",
        "무창포 신비의 바닷길 - 모세의 기적",
        "오천항 - 해산물",
        "보령석탄박물관 - 역사 체험"
      ],
    },
  ],
  전라도: [
    {
      id: 1401,
      name: "여수 해상케이블카",
      location: "전라남도 여수시",
      score: 93,
      imageUrl: "https://images.unsplash.com/photo-1591848478625-de43268e6fb8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWJsZSUyMGNhciUyMG9jZWFufGVufDF8fHx8MTc2MjMzNjQ4N3ww&ixlib=rb-4.1.0&q=80&w=1080",
      category: "관광",
      region: "전라도",
      tags: ["바다", "야경", "포토존", "레저"],
      nearbyActivities: [
        "오동도 - 동백꽃 섬",
        "여수 밤바다 - 야경 명소",
        "이순신 광장 - 거북선 체험",
        "향일암 - 해돋이 명소"
      ],
    },
    {
      id: 1402,
      name: "순천만 국가정원",
      location: "전라남도 순천시",
      score: 92,
      imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBrb3JlYXxlbnwxfHx8fDE3NjIzMzY0ODd8MA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "자연",
      region: "전라도",
      tags: ["자연", "정원", "포토존", "산책"],
      nearbyActivities: [
        "순천만 습지 - 갈대밭",
        "낙안읍성 - 민속마을",
        "순천 드라마촬영장 - 체험",
        "선암사 - 고찰 탐방"
      ],
    },
    {
      id: 1403,
      name: "담양 죽녹원",
      location: "전라남도 담양군",
      score: 89,
      imageUrl: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiYW1ib28lMjBmb3Jlc3R8ZW58MXx8fHwxNzYyMzM2NDg4fDA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "자연",
      region: "전라도",
      tags: ["자연", "산책", "포토존"],
      nearbyActivities: [
        "메타세쿼이아 가로수길 - 드라이브",
        "관방제림 - 숲길 산책",
        "소쇄원 - 한국 정원",
        "담양 떡갈비 거리 - 맛집"
      ],
    },
  ],
  경상도: [
    {
      id: 1501,
      name: "안동 하회마을",
      location: "경상북도 안동시",
      score: 94,
      imageUrl: "https://images.unsplash.com/photo-1583417319070-4a69db38a482?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxrb3JlYW4lMjB2aWxsYWdlfGVufDF8fHx8MTc2MjMzNjQ4OHww&ixlib=rb-4.1.0&q=80&w=1080",
      category: "역사/문화",
      region: "경상도",
      tags: ["역사", "전통문화", "유네스코", "포토존"],
      nearbyActivities: [
        "하회별신굿탈놀이 - 전통 공연",
        "부용대 - 전망대",
        "병산서원 - 유교 서원",
        "안동찜닭거리 - 맛집"
      ],
    },
    {
      id: 1502,
      name: "거제 바람의 언덕",
      location: "경상남도 거제시",
      score: 91,
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxjb2FzdGFsJTIwY2xpZmZ8ZW58MXx8fHwxNzYyMzM2NDg4fDA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "자연",
      region: "경상도",
      tags: ["바다", "포토존", "야경", "섬"],
      nearbyActivities: [
        "신선대 - 해안 절경",
        "외도 보타니아 - 해상 정원",
        "학동 몽돌해변 - 몽돌 해변",
        "거제 포로수용소 - 역사 교육"
      ],
    },
    {
      id: 1503,
      name: "통영 케이블카",
      location: "경상남도 통영시",
      score: 90,
      imageUrl: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYWJsZSUyMGNhciUyMHZpZXd8ZW58MXx8fHwxNzYyMzM2NDg4fDA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "관광",
      region: "경상도",
      tags: ["바다", "야경", "포토존"],
      nearbyActivities: [
        "동피랑 벽화마을 - 포토존",
        "중앙시장 - 해산물",
        "한려수도 유람선 - 섬 투어",
        "이순신공원 - 역사 공원"
      ],
    },
  ],
  강원도: [
    {
      id: 1601,
      name: "속초 설악산",
      location: "강원도 속초시",
      score: 95,
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw2fHxtb3VudGFpbiUyMGtvcmVhfGVufDF8fHx8MTc2MjMzNjQ4OXww&ixlib=rb-4.1.0&q=80&w=1080",
      category: "자연",
      region: "강원도",
      tags: ["산", "계곡", "캠핑", "자연"],
      nearbyActivities: [
        "신흥사 - 고찰",
        "속초 관광수산시장 - 해산물",
        "외옹치 해변 - 서핑",
        "속초 등대 전망대 - 야경"
      ],
    },
    {
      id: 1602,
      name: "평창 대관령 양떼목장",
      location: "강원도 평창군",
      score: 88,
      imageUrl: "https://images.unsplash.com/photo-1500993855538-c6a99f437aa7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaGVlcCUyMGZhcm18ZW58MXx8fHwxNzYyMzM2NDg5fDA&ixlib=rb-4.1.0&q=80&w=1080",
      category: "자연/체험",
      region: "강원도",
      tags: ["자연", "체험", "포토존", "캠핑"],
      nearbyActivities: [
        "대관령 스카이라인 - 드라이브",
        "허브나라 농원 - 정원",
        "알펜시아 리조트 - 스포츠",
        "월정사 전나무숲 - 산책"
      ],
    },
    {
      id: 1603,
      name: "춘천 남이섬",
      location: "강원도 춘천시",
      score: 90,
      imageUrl: "https://images.unsplash.com/photo-1578059467715-08d8c254be1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmVlJTIwcGF0aCUyMGtvcmVhfGVufDF8fHx8MTc2MjMzNjQ4OXww&ixlib=rb-4.1.0&q=80&w=1080",
      category: "자연",
      region: "강원도",
      tags: ["섬", "자연", "산책", "포토존"],
      nearbyActivities: [
        "춘천 닭갈비 골목 - 맛집",
        "소양강 스카이워크 - 전망",
        "김유정역 - 레일바이크",
        "제이드가든 - 수목원"
      ],
    },
  ],
};

export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchedRegion, setSearchedRegion] = useState(""); // 실제 검색된 지역명 저장
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [filterKeywords, setFilterKeywords] = useState<string[]>([]);
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [selectedAttraction, setSelectedAttraction] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("한국어");

  // 페이지 로드 시 로그인 상태 확인
  useEffect(() => {
    const savedUser = localStorage.getItem("tripgpt_current_user");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("tripgpt_current_user");
    setCurrentUser(null);
    setSearchKeyword("");
    setSearchResults([]);
    setHasSearched(false);
    setFilterKeywords([]);
    setFilteredResults([]);
  };

  const handleLoginSuccess = (user: any) => {
    setCurrentUser(user);
  };

  const handleSignupSuccess = () => {
    setIsLoginOpen(true);
  };

  const handleUserUpdate = (updatedUser: any) => {
    setCurrentUser(updatedUser);
  };

  const handleMyPageClick = () => {
    setIsMyPageOpen(true);
  };

  const handleSearch = () => {
    if (!searchKeyword.trim()) {
      toast.error("검색어를 입력해주세요.");
      return;
    }

    setHasSearched(true);

    // 검색어와 일치하는 지역의 관광지 찾기
    const keyword = searchKeyword.trim();
    const results = attractionsByRegion[keyword] || [];

    if (results.length === 0) {
      toast.error(`"${keyword}"에 대한 검색 결과가 없습니다.`);
      setSearchResults([]);
      setFilterKeywords([]);
      setFilteredResults([]);
    } else {
      // 사용자가 로그인했고 선호 키워드가 있는 경우
      let sortedResults = [...results];
      let preferredKeywords: string[] = [];
      
      if (currentUser && currentUser.email) {
        const savedKeywords = localStorage.getItem(`tripgpt_keywords_${currentUser.email}`);
        if (savedKeywords) {
          preferredKeywords = JSON.parse(savedKeywords);
          
          if (preferredKeywords.length > 0) {
            // 선호 키워드와 매칭되는 관광지와 아닌 관광지 분리
            const matched = sortedResults.filter((attraction) =>
              preferredKeywords.some((keyword: string) =>
                attraction.tags.some((tag: string) => 
                  tag.includes(keyword) || keyword.includes(tag)
                )
              )
            );

            const unmatched = sortedResults.filter((attraction) =>
              !preferredKeywords.some((keyword: string) =>
                attraction.tags.some((tag: string) => 
                  tag.includes(keyword) || keyword.includes(tag)
                )
              )
            );

            // 각 그룹 내에서 점수순 정렬
            const matchedSorted = matched.sort((a, b) => b.score - a.score);
            const unmatchedSorted = unmatched.sort((a, b) => b.score - a.score);

            // 매칭된 관광지를 먼저 표시
            sortedResults = [...matchedSorted, ...unmatchedSorted];
            
            // 선호 키워드를 ChatInput에 자동으로 설정
            setFilterKeywords(preferredKeywords);
            
            // 선호 키워드로 필터링된 결과 설정
            const filtered = [...matched, ...unmatched];
            setFilteredResults(filtered);
            
            if (matched.length > 0) {
              toast.success(`${keyword}의 관광지 ${sortedResults.length}개를 찾았습니다. (선호 키워드 ${matched.length}개 우선 표시)`);
            } else {
              toast.success(`${keyword}의 관광지 ${sortedResults.length}개를 찾았습니다.`);
            }
          } else {
            // 선호 키워드가 없으면 점수순 정렬
            sortedResults.sort((a, b) => b.score - a.score);
            setFilterKeywords([]);
            setFilteredResults([]);
            toast.success(`${keyword}의 관광지 ${sortedResults.length}개를 찾았습니다.`);
          }
        } else {
          // 점수가 높은 순서대로 정렬
          sortedResults.sort((a, b) => b.score - a.score);
          setFilterKeywords([]);
          setFilteredResults([]);
          toast.success(`${keyword}의 관광지 ${sortedResults.length}개를 찾았습니다.`);
        }
      } else {
        // 로그인하지 않은 경우 점수순 정렬
        sortedResults.sort((a, b) => b.score - a.score);
        setFilterKeywords([]);
        setFilteredResults([]);
        toast.success(`${keyword}의 관광지 ${sortedResults.length}개를 찾았습니다.`);
      }

      setSearchResults(sortedResults);
      setSearchedRegion(keyword); // 실제 검색된 지역명 저장
    }
  };

  const handleKeywordsChange = (keywords: string[]) => {
    setFilterKeywords(keywords);

    if (keywords.length === 0) {
      setFilteredResults([]);
      return;
    }

    // 키워드로 필터링 - 하나라도 매칭되면 우선 표시
    const matched = searchResults.filter((attraction) =>
      keywords.some(keyword =>
        attraction.tags.some((tag: string) => 
          tag.includes(keyword) || keyword.includes(tag)
        )
      )
    );

    const unmatched = searchResults.filter((attraction) =>
      !keywords.some(keyword =>
        attraction.tags.some((tag: string) => 
          tag.includes(keyword) || keyword.includes(tag)
        )
      )
    );

    // 매칭된 관광지를 먼저, 나머지를 뒤에 배치
    const filtered = [...matched, ...unmatched];
    setFilteredResults(filtered);

    if (matched.length === 0) {
      toast.info(`선택한 키워드와 일치하는 관광지가 없습니다.`);
    } else {
      toast.success(`선택한 키워드와 일치하는 관광지 ${matched.length}개를 찾았습니다.`);
    }
  };

  // 로고 클릭 시 초기화
  const handleLogoClick = () => {
    setSearchKeyword("");
    setSearchedRegion("");
    setSearchResults([]);
    setHasSearched(false);
    setFilterKeywords([]);
    setFilteredResults([]);
  };

  // 언어 변경 핸들러
  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    toast.success(`언어가 ${language}로 변경되었습니다.`);
  };

  // 관광지가 사용자의 선호 키워드와 매칭되는지 확인
  const isAttractionPreferred = (attraction: any) => {
    if (!currentUser || !currentUser.email) return false;
    
    const savedKeywords = localStorage.getItem(`tripgpt_keywords_${currentUser.email}`);
    if (!savedKeywords) return false;
    
    const preferredKeywords = JSON.parse(savedKeywords);
    if (preferredKeywords.length === 0) return false;
    
    return preferredKeywords.some((keyword: string) =>
      attraction.tags.some((tag: string) => 
        tag.includes(keyword) || keyword.includes(tag)
      )
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Toaster />
      
      {/* Header */}
      <motion.header 
        className="relative bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-10 border-b border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* 애니메이션 배경 */}
        <motion.div
          className="absolute inset-0 opacity-50"
          animate={{
            background: [
              "linear-gradient(120deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.25) 25%, rgba(139, 92, 246, 0.35) 50%, rgba(236, 72, 153, 0.25) 75%, rgba(59, 130, 246, 0.15) 100%)",
              "linear-gradient(120deg, rgba(236, 72, 153, 0.25) 0%, rgba(59, 130, 246, 0.15) 25%, rgba(99, 102, 241, 0.25) 50%, rgba(139, 92, 246, 0.35) 75%, rgba(236, 72, 153, 0.25) 100%)",
              "linear-gradient(120deg, rgba(139, 92, 246, 0.35) 0%, rgba(236, 72, 153, 0.25) 25%, rgba(59, 130, 246, 0.15) 50%, rgba(99, 102, 241, 0.25) 75%, rgba(139, 92, 246, 0.35) 100%)",
              "linear-gradient(120deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.35) 25%, rgba(236, 72, 153, 0.25) 50%, rgba(59, 130, 246, 0.15) 75%, rgba(99, 102, 241, 0.25) 100%)",
              "linear-gradient(120deg, rgba(59, 130, 246, 0.15) 0%, rgba(99, 102, 241, 0.25) 25%, rgba(139, 92, 246, 0.35) 50%, rgba(236, 72, 153, 0.25) 75%, rgba(59, 130, 246, 0.15) 100%)",
            ],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        {/* 추가 레이어 - 움직이는 효과 */}
        <motion.div
          className="absolute inset-0 opacity-40"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)",
            backgroundSize: "200% 100%",
          }}
          animate={{
            backgroundPosition: ["0% 0%", "200% 0%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button 
                onClick={handleLogoClick}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-105"
              >
                <motion.div 
                  className="relative"
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ 
                    duration: 0.8, 
                    ease: "easeOut",
                    delay: 0.2 
                  }}
                >
                  <Globe className="w-6 h-6" />
                  <motion.div
                    initial={{ x: 20, y: 20, opacity: 0 }}
                    animate={{ x: 0, y: 0, opacity: 1 }}
                    transition={{ 
                      duration: 0.6, 
                      ease: "easeOut",
                      delay: 0.5 
                    }}
                  >
                    <Plane className="w-4 h-4 absolute -top-1 -right-1 rotate-45" />
                  </motion.div>
                </motion.div>
                <motion.h1 
                  className="text-white"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    duration: 0.5, 
                    ease: "easeOut",
                    delay: 0.4 
                  }}
                >
                  TripGpt
                </motion.h1>
              </motion.button>
              <motion.div 
                className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.5, 
                  ease: "easeOut",
                  delay: 0.6 
                }}
              >
                <span className="text-blue-600">🇰🇷</span>
                <span>국내 여행 추천</span>
              </motion.div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Languages 드롭다운 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 hover:bg-gray-50">
                    <Languages className="w-4 h-4" />
                    <span className="hidden sm:inline">{selectedLanguage}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => handleLanguageChange("한국어")}>
                    <span className="mr-2">🇰🇷</span>
                    한국어
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLanguageChange("English")}>
                    <span className="mr-2">🇺🇸</span>
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLanguageChange("日本語")}>
                    <span className="mr-2">🇯🇵</span>
                    日本語
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleLanguageChange("中文")}>
                    <span className="mr-2">🇨🇳</span>
                    中文
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {currentUser ? (
                <>
                  <button 
                    onClick={handleMyPageClick}
                    className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-600 hover:text-blue-700">{currentUser.username}님</span>
                  </button>
                  <Button variant="ghost" className="gap-2" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                    로그아웃
                  </Button>
                </>
              ) : (
                <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" onClick={() => setIsLoginOpen(true)}>
                  <LogIn className="w-4 h-4" />
                  로그인
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Login Dialog */}
      <LoginDialog 
        open={isLoginOpen} 
        onOpenChange={setIsLoginOpen}
        onSignupClick={() => setIsSignupOpen(true)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Signup Dialog */}
      <SignupDialog 
        open={isSignupOpen} 
        onOpenChange={setIsSignupOpen}
        onSignupSuccess={handleSignupSuccess}
      />

      {/* MyPage Dialog */}
      <MyPageDialog
        open={isMyPageOpen}
        onOpenChange={setIsMyPageOpen}
        currentUser={currentUser}
        onUserUpdate={handleUserUpdate}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasSearched ? (
          // 검색 전: 중앙 검색바
          <SearchBar
            value={searchKeyword}
            onChange={setSearchKeyword}
            onSearch={handleSearch}
            disabled={false}
            centered={true}
          />
        ) : (
          // 검색 후: 상단 검색바 + 결과
          <>
            <SearchBar
              value={searchKeyword}
              onChange={setSearchKeyword}
              onSearch={handleSearch}
            />

            {hasSearched && searchResults.length > 0 ? (
              <>
                <div className="mb-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h2 className="mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {searchedRegion}의 추천 관광지
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {filteredResults.length > 0 
                      ? `총 ${filteredResults.length}개의 관광지` 
                      : `총 ${searchResults.length}개의 관광지`}
                    {filterKeywords.length > 0 && ` • ${filterKeywords.length}개 필터 적용됨`}
                  </p>
                </div>

                {/* 키워드 필터 채팅바 */}
                <div className="mb-8">
                  <ChatInput 
                    onKeywordsChange={handleKeywordsChange}
                    selectedKeywords={filterKeywords}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(filteredResults.length > 0 ? filteredResults : searchResults).map((attraction, index) => {
                    const isMatched = filterKeywords.length > 0 && filterKeywords.some(keyword =>
                      attraction.tags.some((tag: string) => 
                        tag.includes(keyword) || keyword.includes(tag)
                      )
                    );
                    
                    const isPreferred = isAttractionPreferred(attraction);
                    
                    return (
                      <div
                        key={attraction.id}
                        className={isMatched ? "ring-2 ring-blue-500 rounded-2xl shadow-lg shadow-blue-100" : ""}
                      >
                        <DestinationCard
                          name={attraction.name}
                          location={attraction.location}
                          score={attraction.score}
                          imageUrl={attraction.imageUrl}
                          category={attraction.category}
                          showScore={!!currentUser}
                          isPreferred={isPreferred}
                          onClick={() => {
                            setSelectedAttraction(attraction);
                            setIsDetailOpen(true);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </>
            ) : hasSearched && searchResults.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="mb-4 text-4xl">🔍</div>
                <h3 className="mb-2">검색 결과가 없습니다</h3>
                <p className="text-sm text-gray-500">
                  다른 지역명으로 검색해보세요
                </p>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="mb-6 text-5xl">✈️</div>
                <h2 className="mb-4">여행지를 검색해보세요</h2>
                <p className="text-gray-600 mb-8">
                  원하는 지역을 입력하면 추천 관광지를 볼 수 있습니다
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {Object.keys(attractionsByRegion).filter((key) => key !== "제주도").map((region) => (
                    <Button
                      key={region}
                      variant="outline"
                      className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                      onClick={() => {
                        setSearchKeyword(region);
                        handleSearch();
                      }}
                    >
                      {region}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <AttractionDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        attraction={selectedAttraction}
        showScore={!!currentUser}
        isLoggedIn={!!currentUser}
        onLoginRequired={() => setIsLoginOpen(true)}
      />
    </div>
  );
}