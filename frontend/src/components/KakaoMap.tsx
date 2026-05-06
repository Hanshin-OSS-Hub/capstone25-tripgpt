// src/components/KakaoMap.tsx
import { useEffect, useRef, useState } from "react";

interface KakaoMapProps {
  /** 검색할 주소 (예: "경복궁", "서울 종로구 사직로 161") */
  address: string;
  /** 장소명 (선택사항, 주소만으로 검색되지 않을 때 사용) */
  name?: string;
  /** 지도 높이(px) – 기본값 260 */
  height?: number;
}

// 공백 제거 + 소문자로 통일해서 비교용
const normalize = (s: string) => s.replace(/\s/g, "").toLowerCase();

// 시/구 정도로 너무 러프한 주소인지 판단 (예: "서울 종로구")
const isTooGenericAddress = (addr: string | undefined | null) => {
  if (!addr) return true;
  const trimmed = addr.trim();
  // 길이가 너무 짧거나, "구"로 끝나면 시/구 수준이라고 대충 판단
  return trimmed.length <= 8 || /구$/.test(trimmed);
};

export function KakaoMap({ address, name, height = 260 }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string>("");

  useEffect(() => {
    if (!mapRef.current) {
      console.warn("[KakaoMap] mapRef 없음");
      return;
    }
    if (!address) {
      console.warn("[KakaoMap] address 없음");
      return;
    }

    const kakao = (window as any).kakao;
    if (!kakao || !kakao.maps) {
      console.error("[KakaoMap] window.kakao/maps 없음 - SDK 로딩 확인 필요");
      return;
    }

    console.log("[KakaoMap] props:", { name, address });

    kakao.maps.load(() => {
      const container = mapRef.current;
      if (!container) return;

      // 로딩 시작 시 다시 초기화
      setResolvedAddress("");

      // 기본 서울 중심(임시)
      const options = {
        center: new kakao.maps.LatLng(37.5665, 126.978),
        level: 5,
      };

      const map = new kakao.maps.Map(container, options);
      const geocoder = new kakao.maps.services.Geocoder();
      const places = new kakao.maps.services.Places();

      // 🔹 검색 전략 구성
      const strategies: string[] = [];

      // 1) 장소명 우선
      if (name && name.trim()) {
        strategies.push(name.trim());
      }

      // 2) 너무 러프하지 않은 주소 + 장소명
      if (name && address && !isTooGenericAddress(address)) {
        strategies.push(`${address} ${name}`.trim());
      }

      // 3) 너무 러프하지 않은 주소만
      if (address && !isTooGenericAddress(address)) {
        strategies.push(address.trim());
      }

      // 모든 게 걸러졌는데 address는 있으면 어쩔 수 없이 마지막 폴백으로 사용
      if (strategies.length === 0 && address) {
        strategies.push(address.trim());
      }

      console.log("[KakaoMap] 시도할 검색 키워드 목록:", strategies);

      // 주소검색(geocoder) 폴백 함수
      const runAddressFallback = () => {
        const fallbackKeyword = address;
        console.log(
          "[KakaoMap] 장소검색 모두 실패 — 주소검색 폴백:",
          fallbackKeyword
        );

        geocoder.addressSearch(
          fallbackKeyword,
          (result: any[], status: string) => {
            if (status !== kakao.maps.services.Status.OK || !result[0]) {
              console.warn(
                "[KakaoMap] 주소 검색 실패:",
                fallbackKeyword,
                status
              );
              setResolvedAddress(address);
              return;
            }

            const first = result[0];
            const road = first.road_address?.address_name;
            const jibun = first.address?.address_name;
            const basic = first.address_name;
            const displayAddress = road || jibun || basic || address;
            setResolvedAddress(displayAddress);

            console.log("[KakaoMap] 주소검색 결과:", {
              road,
              jibun,
              basic,
              displayAddress,
              lat: first.y,
              lng: first.x,
            });

            const coord = new kakao.maps.LatLng(first.y, first.x);
            map.setCenter(coord);
            const marker = new kakao.maps.Marker({ map, position: coord });
            const info = new kakao.maps.InfoWindow({
              content: `
                <div style="padding:6px 10px;font-size:12px;">
                  ${displayAddress}
                </div>
              `,
            });
            info.open(map, marker);
          }
        );
      };

      // 🔥 Places.keywordSearch를 순차적으로 시도
      const tryPlaceSearch = (idx: number) => {
        if (idx >= strategies.length) {
          // 모든 키워드 실패 → 주소검색 폴백
          runAddressFallback();
          return;
        }

        const keyword = strategies[idx];
        if (!keyword) {
          tryPlaceSearch(idx + 1);
          return;
        }

        console.log("[KakaoMap] 장소검색 시도:", keyword);
        places.keywordSearch(
          keyword,
          (placeResult: any[], placeStatus: string) => {
            if (
              placeStatus === kakao.maps.services.Status.OK &&
              placeResult &&
              placeResult.length > 0
            ) {
              // ✅ name과 가장 잘 맞는 결과를 우선 선택
              let p = placeResult[0];

              if (name && name.trim()) {
                const normName = normalize(name);
                const exact = placeResult.find(
                  (r) => normalize(r.place_name) === normName
                );
                const contains = placeResult.find((r) =>
                  normalize(r.place_name).includes(normName)
                );

                if (exact) p = exact;
                else if (contains) p = contains;
              }

              const road = p.road_address_name;
              const addr = p.address_name;
              const displayAddress = road || addr || keyword;
              setResolvedAddress(displayAddress);

              console.log("[KakaoMap] 장소검색 결과 선택:", {
                keyword,
                place_name: p.place_name,
                displayAddress,
                lat: p.y,
                lng: p.x,
              });

              const coord = new kakao.maps.LatLng(p.y, p.x);
              map.setCenter(coord);
              const marker = new kakao.maps.Marker({ map, position: coord });
              const info = new kakao.maps.InfoWindow({
                content: `
                  <div style="padding:6px 10px;font-size:12px;">
                    ${displayAddress}
                  </div>
                `,
              });
              info.open(map, marker);
              return;
            }

            console.log(
              "[KakaoMap] 장소검색 결과 없음, 다음 키워드 시도:",
              keyword
            );
            tryPlaceSearch(idx + 1);
          }
        );
      };

      // 검색 시작
      tryPlaceSearch(0);
    });
  }, [address, name]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: `${height}px`,
        position: "relative",
        backgroundColor: "#e5e7eb", // 로딩/실패 시 회색 배경
      }}
    >
      {/* 지도 로딩 중일 때 간단한 텍스트 */}
      {!resolvedAddress && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "#4b5563",
          }}
        >
          {address
            ? `지도를 불러오는 중입니다... (${address}${
                name ? ` / ${name}` : ""
              })`
            : "주소 정보가 없습니다."}
        </div>
      )}
    </div>
  );
}
