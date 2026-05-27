# web/views.py
import os
import re
import requests
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.renderers import JSONRenderer
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token

from .models import CustomerProfile

EMAIL_REGEX = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


def tmap_geocode(keyword: str, app_key: str):
    if not keyword or not app_key:
        return None
    try:
        url = "https://apis.openapi.sk.com/tmap/pois"
        headers = {"appKey": app_key, "Accept": "application/json"}
        params = {"version": 1, "searchKeyword": keyword, "resCoordType": "WGS84GEO", "reqCoordType": "WGS84GEO", "count": 1}
        resp = requests.get(url, headers=headers, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        spi = data.get("searchPoiInfo")
        if not spi:
            return None
        pois = spi.get("pois", {}).get("poi")
        if not pois:
            return None
        poi0 = pois[0] if isinstance(pois, list) else pois
        lat = poi0.get("frontLat") or poi0.get("frontlat") or poi0.get("noorLat") or poi0.get("lat")
        lon = poi0.get("frontLon") or poi0.get("frontlon") or poi0.get("noorLon") or poi0.get("lon")
        if lat is None or lon is None:
            return None
        return float(lat), float(lon)
    except Exception as e:
        print(f"[tmap_geocode] error for '{keyword}':", e)
        return None


class TravelAPIView(APIView):
    renderer_classes = [JSONRenderer]

    def get(self, request):
        tmap_app_key = os.environ.get("TMAP_APP_KEY", "")
        kakao_js_key = os.environ.get("KAKAO_JS_KEY", "")
        openweather_key = os.environ.get("OPENWEATHER_API_KEY", "")

        departure = (request.GET.get("origin") or request.GET.get("departure") or "").strip()
        destination = (request.GET.get("destination") or "").strip()
        mode = (request.GET.get("mode") or "car").strip()

        response = {
            "kakao_js_key": kakao_js_key,
            "departure": departure,
            "destination": destination,
            "mode": mode,
            "weather": None,
            "car_info": None,
            "transit_info": None,
            "car_path": [],
            "transit_steps": [],
            "errors": [],
        }

        if not (departure and destination):
            response["errors"].append("출발지와 도착지가 필요합니다.")
            return Response({"duration": None, "distance": None, "steps": [], "raw": response}, status=status.HTTP_200_OK)

        if not tmap_app_key:
            response["errors"].append("TMAP_APP_KEY가 서버 환경변수에 설정되지 않았습니다.")
            return Response({"duration": None, "distance": None, "steps": ["TMAP_APP_KEY가 설정되지 않았습니다."], "raw": response}, status=status.HTTP_200_OK)

        dep_coord = tmap_geocode(departure, tmap_app_key)
        dest_coord = tmap_geocode(destination, tmap_app_key)

        dep_lat = dep_lng = None
        dest_lat = dest_lng = None

        if dep_coord:
            dep_lat, dep_lng = dep_coord
        else:
            response["errors"].append(f"'{departure}' 좌표 변환 실패")

        if dest_coord:
            dest_lat, dest_lng = dest_coord
        else:
            response["errors"].append(f"'{destination}' 좌표 변환 실패")

        if dep_lat is None or dest_lat is None:
            return Response({"duration": None, "distance": None, "steps": [], "raw": response}, status=status.HTTP_200_OK)

        if openweather_key:
            try:
                w_res = requests.get("https://api.openweathermap.org/data/2.5/weather", params={"lat": dest_lat, "lon": dest_lng, "appid": openweather_key, "units": "metric", "lang": "kr"}, timeout=5)
                w_res.raise_for_status()
                w_data = w_res.json()
                response["weather"] = {"name": w_data.get("name"), "temp": w_data["main"]["temp"], "desc": w_data["weather"][0]["description"]}
            except Exception as e:
                print("Weather error:", e)
                response["errors"].append("날씨 정보 조회 실패")

        car_info = None
        car_path = []
        try:
            headers = {"appKey": tmap_app_key, "Content-Type": "application/json", "Accept": "application/json"}
            body = {"startX": str(dep_lng), "startY": str(dep_lat), "endX": str(dest_lng), "endY": str(dest_lat), "reqCoordType": "WGS84GEO", "resCoordType": "WGS84GEO", "searchOption": "0"}
            r = requests.post("https://apis.openapi.sk.com/tmap/routes?version=1", headers=headers, json=body, timeout=7)
            r.raise_for_status()
            data = r.json()
            features = data.get("features", [])
            if features:
                props0 = features[0].get("properties", {})
                car_info = {"time_min": int(props0.get("totalTime", 0)) // 60, "distance_km": round(int(props0.get("totalDistance", 0)) / 1000, 1)}
            for f in features:
                geom = f.get("geometry", {})
                if geom.get("type") == "LineString":
                    for lng, lat in geom.get("coordinates", []):
                        car_path.append({"lat": lat, "lng": lng})
        except Exception as e:
            print("Car route error:", e)
            response["errors"].append("자동차 경로 조회 실패")

        response["car_info"] = car_info
        response["car_path"] = car_path

        transit_info = None
        transit_steps = []
        try:
            headers = {"appKey": tmap_app_key, "Content-Type": "application/json", "Accept": "application/json"}
            body = {"startX": str(dep_lng), "startY": str(dep_lat), "endX": str(dest_lng), "endY": str(dest_lat), "count": 1, "format": "json", "lang": 0}
            tr = requests.post("https://apis.openapi.sk.com/transit/routes", headers=headers, json=body, timeout=7)
            tr.raise_for_status()
            data = tr.json()
            itineraries = data.get("metaData", {}).get("plan", {}).get("itineraries", [])
            if itineraries:
                it0 = itineraries[0]
                transit_info = {"total_time_min": it0.get("totalTime", 0) // 60, "total_distance_km": round(it0.get("totalDistance", 0) / 1000, 1), "transfer_count": it0.get("transferCount", 0), "path_type": it0.get("pathType")}
                mode_ko_map = {"WALK": "도보", "BUS": "버스", "SUBWAY": "지하철", "EXPRESSBUS": "고속버스", "TRAIN": "기차", "FERRY": "해운"}
                for idx, leg in enumerate(it0.get("legs", []), start=1):
                    mode_leg = leg.get("mode")
                    sec = int(leg.get("sectionTime", 0))
                    start_name = (leg.get("start") or {}).get("name") or ""
                    end_name = (leg.get("end") or {}).get("name") or ""
                    transit_steps.append({"order": idx, "mode": mode_leg, "mode_ko": mode_ko_map.get(mode_leg, mode_leg), "summary": f"{start_name} → {end_name} ({mode_ko_map.get(mode_leg, mode_leg)}) 약 {sec // 60}분"})
        except Exception as e:
            print("Transit error:", e)
            response["errors"].append("대중교통 경로 조회 실패")

        response["transit_info"] = transit_info
        response["transit_steps"] = transit_steps

        duration = distance = None
        steps = []

        if mode == "car" and car_info:
            duration = f"약 {car_info['time_min']}분"
            distance = f"{car_info['distance_km']} km"
            steps = [f"{departure}에서 출발", f"Tmap 자동차 경로를 따라 이동 (약 {car_info['distance_km']}km)", f"{destination} 도착"]
        elif mode == "transit" and transit_info:
            duration = f"약 {transit_info['total_time_min']}분"
            distance = f"{transit_info['total_distance_km']} km"
            steps = [s["summary"] for s in transit_steps]
        elif mode == "walk" and car_info:
            walk_minutes = int(car_info["distance_km"] / 4 * 60)
            duration = f"약 {walk_minutes}분"
            distance = f"{car_info['distance_km']} km"
            steps = [f"{departure}에서 도보 출발", f"약 {car_info['distance_km']}km 도보 이동", f"{destination} 도착"]

        if duration is None:
            response["errors"].append("적절한 경로를 찾지 못했습니다.")
            return Response({"duration": None, "distance": None, "steps": [], "raw": response}, status=status.HTTP_200_OK)

        return Response({"duration": duration, "distance": distance, "steps": steps, "raw": response}, status=status.HTTP_200_OK)


class SignupAPIView(APIView):
    def post(self, request):
        username = (request.data.get("username") or "").strip()
        email = (request.data.get("email") or "").strip()
        password = request.data.get("password") or ""
        nickname = (request.data.get("nickname") or "").strip()

        if not username or not email or not password:
            return Response({"error": "username, email, password는 필수입니다."}, status=400)
        if not EMAIL_REGEX.match(email):
            return Response({"error": "이메일 형식이 올바르지 않습니다."}, status=400)
        if len(password) < 8:
            return Response({"error": "비밀번호는 8자 이상이어야 합니다."}, status=400)
        if User.objects.filter(username=username).exists():
            return Response({"error": "이미 사용 중인 아이디입니다."}, status=400)
        if User.objects.filter(email=email).exists():
            return Response({"error": "이미 사용 중인 이메일입니다."}, status=400)

        user = User.objects.create(username=username, email=email, password=make_password(password))
        CustomerProfile.objects.create(user=user, nickname=nickname)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "user": {"id": user.id, "username": user.username, "email": user.email, "nickname": nickname}}, status=201)


class LoginAPIView(APIView):
    def post(self, request):
        username = (request.data.get("username") or "").strip()
        password = request.data.get("password") or ""

        if not username or not password:
            return Response({"error": "username과 password는 필수입니다."}, status=400)

        user = authenticate(username=username, password=password)
        if not user:
            return Response({"error": "아이디 또는 비밀번호가 올바르지 않습니다."}, status=401)

        token, _ = Token.objects.get_or_create(user=user)
        profile = getattr(user, "customer_profile", None)
        return Response({"token": token.key, "user": {"id": user.id, "username": user.username, "email": user.email, "nickname": profile.nickname if profile else ""}})


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response({"message": "로그아웃 되었습니다."})


class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = getattr(user, "customer_profile", None)
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "nickname": profile.nickname if profile else "",
            "phone": profile.phone if profile else "",
            "birth_date": profile.birth_date if profile else None,
            "preferred_region": profile.preferred_region if profile else "",
            "travel_style": profile.travel_style if profile else "",
        })

    def patch(self, request):
        user = request.user
        profile, _ = CustomerProfile.objects.get_or_create(user=user)

        email = request.data.get("email")
        if email:
            if not EMAIL_REGEX.match(email.strip()):
                return Response({"error": "이메일 형식이 올바르지 않습니다."}, status=400)
            user.email = email.strip()

        password = request.data.get("password")
        if password:
            if len(password) < 8:
                return Response({"error": "비밀번호는 8자 이상이어야 합니다."}, status=400)
            user.password = make_password(password)

        user.save()
        profile.nickname = request.data.get("nickname", profile.nickname)
        profile.phone = request.data.get("phone", profile.phone)
        profile.birth_date = request.data.get("birth_date", profile.birth_date)
        profile.preferred_region = request.data.get("preferred_region", profile.preferred_region)
        profile.travel_style = request.data.get("travel_style", profile.travel_style)
        profile.save()

        return Response({"message": "프로필이 업데이트되었습니다."})