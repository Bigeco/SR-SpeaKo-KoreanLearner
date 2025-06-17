# ============================== # 
# 데이터셋 구조 예시
# ============================== # 
"""
/data/
├── chinese/
│   ├── ch_labels.json
│   └── raw/
│       └── *.wav
├── english/
│   ├── en_labels.json
│   └── raw/
│       └── *.wav
...
"""

# ============================== # 
# 허깅페이스 데이터셋 업로드용 코드
# ============================== # 
import os
import json
from datasets import Dataset, DatasetDict, Audio
import pandas as pd

# 한글 카테고리 → 영어 split 이름 매핑
CATEGORY_MAP = {
    "중국어": "chinese",
    "일본어": "japanese",
    "태국어": "thai",
    "베트남어": "vietnamese",
    "영어": "english",
    "기타": "others"
}

def load_label_json(json_path, audio_base_dir, override_split_name=None):
    with open(json_path, "r", encoding="utf-8") as f:
        items = json.load(f)

    lang_data = {}

    for entry in items:
        # category 기반 split 결정
        category_kr = entry.get("category", None)
        split_name = CATEGORY_MAP.get(category_kr, override_split_name)

        # fallback
        if split_name is None:
            print(f"❗ Split name not determined for {json_path}")
            continue

        audio_path = os.path.join(audio_base_dir, split_name, "raw", entry["file_name"])
        if not os.path.exists(audio_path):
            print(f"⚠️ Missing audio file: {audio_path}")
            continue

        if split_name not in lang_data:
            lang_data[split_name] = []

        lang_data[split_name].append({
            "file_name": entry["file_name"],
            "text": entry["text"][0],
            "audio": audio_path
        })

    return lang_data

def build_dataset_dict_multi(root_dir):
    all_data = {}

    for lang in os.listdir(root_dir):
        lang_path = os.path.join(root_dir, lang)
        if not os.path.isdir(lang_path):
            continue

        # Find label file (*.json)
        label_file = next((f for f in os.listdir(lang_path) if f.endswith(".json")), None)
        if not label_file:
            print(f"⛔ No JSON file in {lang_path}")
            continue

        json_path = os.path.join(lang_path, label_file)
        lang_data = load_label_json(json_path, root_dir)

        # 병합
        for split_name, records in lang_data.items():
            if split_name not in all_data:
                all_data[split_name] = []
            all_data[split_name].extend(records)

    # DatasetDict로 변환
    dataset_dict = {}
    for split, records in all_data.items():
        df = pd.DataFrame(records)
        dataset = Dataset.from_pandas(df)
        dataset = dataset.cast_column("audio", Audio())
        dataset_dict[split] = dataset

    return DatasetDict(dataset_dict)

def main():
    root_dir = "./data"
    dataset_dict = build_dataset_dict_multi(root_dir)

    # Push to Hugging Face
    dataset_dict.push_to_hub("speako/wav2vec2-test-dataset")

if __name__ == "__main__":
    main()
