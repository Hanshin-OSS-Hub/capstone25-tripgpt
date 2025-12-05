# data_loader.py (프로젝트 루트 디렉토리나 적절한 위치에 생성)

import csv
import json
from utils.supabase_client import supabase # 위에서 만든 클라이언트 불러오기

# ⚠️ 표준 데이터 파일 경로를 정확하게 지정하세요.
CSV_FILE_PATH = '전국문화축제표준데이터.csv'
TARGET_TABLE_NAME = 'festivals' # Supabase에 생성된 테이블 이름으로 변경

def load_data_from_csv(file_path):
    """CSV 파일을 읽어 딕셔너리 리스트로 변환합니다."""
    data_list = []
    try:
        with open(file_path, mode='r', encoding='utf-8') as file:
            # 전국문화축제 표준데이터의 실제 컬럼명과 DB 테이블의 컬럼명이 일치해야 합니다.
            csv_reader = csv.DictReader(file)
            for row in csv_reader:
                # 💡 필요한 데이터만 필터링하거나 데이터 형태를 변환하는 로직을 여기에 추가합니다.
                data_list.append(row)
        return data_list
    except FileNotFoundError:
        print(f"오류: {file_path} 파일을 찾을 수 없습니다.")
        return []
    except Exception as e:
        print(f"CSV 읽기 중 오류 발생: {e}")
        return []


def clear_and_insert_data(data):
    """기존 데이터를 삭제하고 새 데이터를 삽입합니다."""
    print(f"테이블 '{TARGET_TABLE_NAME}'의 기존 데이터 삭제 중...")
    # 1. 모든 데이터 삭제 (주의: 실제 프로덕션 환경에서는 매우 신중해야 합니다!)
    # Supabase에서는 delete().gt('id', 0) 등의 조건을 사용해 모든 행을 삭제할 수 있습니다.
    delete_response = supabase.table(TARGET_TABLE_NAME).delete().neq('id', 0).execute()
    if delete_response.error:
        print("기존 데이터 삭제 실패:", delete_response.error)
        return

    print(f"총 {len(data)} 개의 새로운 데이터를 삽입합니다.")
    # 2. 새로운 데이터 삽입
    # Supabase는 단일 요청으로 많은 데이터를 삽입할 때 성능상 제약이 있을 수 있습니다.
    # 대규모 데이터인 경우, 청크(chunk) 단위로 나누어 삽입하는 것이 좋습니다.
    
    chunk_size = 500
    for i in range(0, len(data), chunk_size):
        chunk = data[i:i + chunk_size]
        insert_response = supabase.table(TARGET_TABLE_NAME).insert(chunk).execute()
        
        if insert_response.error:
            print(f"데이터 삽입 실패 (청크 {i//chunk_size + 1}):", insert_response.error)
            return
        print(f"성공적으로 {len(chunk)}개 데이터 삽입 완료. (총 {i + len(chunk)}개)")
        

if __name__ == "__main__":
    festival_data = load_data_from_csv(CSV_FILE_PATH)
    if festival_data:
        clear_and_insert_data(festival_data)
        print("데이터 로드 및 삽입 프로세스 완료.")