// src/components/KakaoMap.tsx
import { useEffect, useRef } from "react";

interface KakaoMapProps {
  address: string;
  height?: number;
}

export function KakaoMap({ address, height = 260 }: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    console.log("[KakaoMap] 마운트 / address =", address);
    const w = window as any;

    // 1) DOM 있는지 확인
    if (!mapRef.current) {
      console.warn("[KakaoMap] mapRef.current 없음");
      return;
    }

    // 2) kakao SDK 로딩 확인
    if (!w.kakao) {
      console.error("[KakaoMap] window.kakao 없음 - SDK가 안 불러와졌을 가능성");
      return;
    }
    if (!w.kakao.maps) {
      console.error("[KakaoMap] window.kakao.maps 없음");
      return;
    }

    console.log("[KakaoMap] kakao.maps 존재 ✅", w.kakao.maps);

    w.kakao.maps.load(() => {
      console.log("[KakaoMap] kakao.maps.load 콜백 실행됨");

      const container = mapRef.current;
      if (!container) {
        console.warn("[KakaoMap] load 안에서 container 없음");
        return;
      }

      const kakao = w.kakao;
      const options = {
        center: new kakao.maps.LatLng(37.5665, 126.9780),
        level: 5,
      };

      console.log("[KakaoMap] 지도 생성 시작");
      const map = new kakao.maps.Map(container, options);
      const geocoder = new kakao.maps.services.Geocoder();

      if (!address) {
        console.warn("[KakaoMap] address 없음, 기본 중심만 표시");
        return;
      }

      console.log("[KakaoMap] 주소 검색 시작:", address);
      geocoder.addressSearch(address, (result: any[], status: any) => {
        console.log("[KakaoMap] addressSearch 콜백:", { result, status });

        if (status === kakao.maps.services.Status.OK && result[0]) {
          const { x, y } = result[0];
          console.log("[KakaoMap] 주소 검색 성공, 좌표:", { x, y });
          const coord = new kakao.maps.LatLng(y, x);

          map.setCenter(coord);
          const marker = new kakao.maps.Marker({
            map,
            position: coord,
          });

          const info = new kakao.maps.InfoWindow({
            content: `<div style="padding:6px 10px;font-size:12px;">${address}</div>`,
          });
          info.open(map, marker);
        } else {
          console.warn("[KakaoMap] 주소 검색 실패:", status);
        }
      });
    });
  }, [address]);

  return (
    <div
      ref={mapRef}
      style={{
        width: "100%",
        height: `${height}px`,
        background: "#e5e7eb", // 회색 배경 (지도 안 뜰 때 박스 보이게)
      }}
    >
      {/* 디버그용 텍스트 */}
      <span style={{ fontSize: 12, color: "#4b5563", padding: 4 }}>
        {address ? `지도를 불러오는 중... (${address})` : "주소 정보 없음"}
      </span>
    </div>
  );
}
