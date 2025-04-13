import json
from typing import List, Dict, Any


def save_json(data: List[Dict[str, Any]], output_path: str = "label_data.json") -> None:
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ JSON 파일 저장 완료: {output_path}")