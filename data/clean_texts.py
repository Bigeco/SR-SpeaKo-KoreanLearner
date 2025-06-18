import re
import argparse
import json
from pathlib import Path
from typing import List, Dict


def clean_text(text: str) -> str:
    # 1. 괄호 치환: (first)/(second) → second
    text = re.sub(r'\([^()]+\)/\(([^()]+)\)', r'\1', text)
    # 2. 단독 슬래시 제거 (슬래시 주변 공백이 있거나 없는 경우 모두 처리)
    text = re.sub(r'\s*/\s*', ' ', text)
    # 3. + 문자 제거 (공백 포함)
    text = re.sub(r'\s*\+\s*', ' ', text)
    # 4. * 문자 제거
    text = text.replace("*", "")
    # 5. 불필요한 공백 정리
    return re.sub(r'\s{2,}', ' ', text).strip()

def clean_json_texts(input_path: str, output_path: str = None, text_key: str = "text") -> None:
    input_path = Path(input_path).expanduser().resolve()

    with open(input_path, "r", encoding="utf-8") as f:
        data: List[Dict] = json.load(f)

    for item in data:
        if text_key in item:
            item[text_key] = [clean_text(t) for t in item[text_key]]

    if output_path is None:
        output_path = input_path

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✅ 텍스트 정제 완료: {output_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Clean 'text' field in a converted label JSON file.")
    parser.add_argument("--input_path", type=str, required=True, help="Path to the label JSON file to be cleaned.")
    parser.add_argument("--output_path", type=str, default=None, help="Optional output path. If not set, overwrites input file.")
    return parser.parse_args()

def main():
    args = parse_args()
    clean_json_texts(
        input_path=args.input_path,
        output_path=args.output_path
    )

if __name__ == "__main__":
    main()


# Example usage:
# -----------------------------------------------------
# [TEXT CLEANING] 변환된 라벨 JSON 파일의 text 필드를 정제
#
# (1) 기존 파일을 덮어쓰는 경우
# python clean_texts.py \
#     --input_path ./ko_dialog_01_labels.json
#
# (2) 정제된 결과를 새 파일로 저장하는 경우
# python clean_texts.py \
#     --input_path ./ko_dialog_01_labels.json \
#     --output_path ./ko_dialog_01_labels_cleaned.json