//이미지 파일 오휴 ts크 방지용
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.svg";
// src/global.d.ts
export {};

declare global {
  interface Window {
    kakao: any;
  }
}
