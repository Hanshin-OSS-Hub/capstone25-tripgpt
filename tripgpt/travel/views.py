from django.shortcuts import render

# Create your views here.
from django.http import JsonResponse
from supabase import create_client
from django.conf import settings

supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def test_supabase(request):
    response = supabase.table("TripGpt_db").select("*").execute()
    return JsonResponse(response.data, safe=False)