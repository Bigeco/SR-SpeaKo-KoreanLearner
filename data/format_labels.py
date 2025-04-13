import argparse
from pathlib import Path
import json
from typing import List, Dict, Any
from data.utils import save_json


def parse_format_1(json_path: Path, txt_path: Path, corpus_name, category, corpus_key) -> dict:
    with open(json_path, "r", encoding="utf-8") as jf:
        meta = json.load(jf)
    with open(txt_path, "r", encoding="utf-8") as tf:
        text = tf.read().strip()

    return {
        corpus_key: corpus_name,
        "category": category,
        "file_name": meta["original"],
        "text": [text],
        "start": meta["start"],
        "end": meta["end"],
        "length": meta["length"]
    }

def parse_format_2(json_path: Path, corpus_name, category, corpus_key) -> dict:
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    file_name = data.get("fileName")
    record_time = float(data.get("file_info", {}).get("recordTime", 0.0))
    text = data.get("transcription", {}).get("ReadingLabelText", "")

    if not file_name or not text:
        return None

    return {
        corpus_key: corpus_name,
        "category": category,
        "file_name": file_name,
        "text": [text],
        "start": 0.0,
        "end": record_time,
        "length": record_time
    }

def parse_format_3(json_path: Path, corpus_name: str, corpus_key: str) -> dict:
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    file_stem = json_path.stem  # ex: SPK020YTNSO138F010
    file_name = f"{file_stem}.wav"

    text = data["script"]["text"]
    category = data["script"]["press_field"]
    start = float(data["file_information"]["utterance_start"])
    end = float(data["file_information"]["utterance_end"])
    length = float(data["file_information"]["audio_duration"])

    return {
        corpus_key: corpus_name,
        "category": category,
        "file_name": file_name,
        "text": [text],
        "start": start,
        "end": end,
        "length": length
    }

def convert_labels_to_json(
    root_dir: str,
    corpus_name: str,
    category: str,
    dataset_format: str,
    corpus_key: str = "corpus"
) -> List[Dict[str, Any]]:
    results = []
    root_path = Path(root_dir).expanduser().resolve()

    if dataset_format == "format1":
        for sub_dir in root_path.iterdir():
            if not sub_dir.is_dir():
                continue
            for json_path in sub_dir.glob("*.json"):
                txt_path = json_path.with_suffix(".txt")
                if not txt_path.exists():
                    continue
                item = parse_format_1(json_path, txt_path, corpus_name, category, corpus_key)
                results.append(item)

    elif dataset_format == "format2":
        for json_path in root_path.glob("*.json"):
            item = parse_format_2(json_path, corpus_name, category, corpus_key)
            if item:
                results.append(item)

    elif dataset_format == "format3":
        for json_path in root_path.glob("*.json"):
            item = parse_format_3(json_path, corpus_name, corpus_key)
            if item:
                results.append(item)

    else:
        raise ValueError(f"Unsupported dataset format: {dataset_format}")

    return results


def remove_label_files(root_dir: str, dataset_format: str) -> None:
    root_path = Path(root_dir).expanduser().resolve()
    count = 0

    # format1: json + txt 삭제
    if dataset_format == "format1":
        for sub_dir in root_path.iterdir():
            if not sub_dir.is_dir():
                continue
            for ext in ("*.json", "*.txt"):
                for file_path in sub_dir.glob(ext):
                    file_path.unlink()
                    count += 1

    # format2: json + csv 삭제
    elif dataset_format == "format2":
        for ext in ("*.json", "*.csv"):
            for file_path in root_path.glob(ext):
                file_path.unlink()
                count += 1

    # format3: json 삭제
    elif dataset_format == "format3":
        for ext in ("*.json",):
            for file_path in root_path.glob(ext):
                file_path.unlink()
                count += 1

    else:
        print(f"⚠️ 삭제 대상이 지정되지 않은 포맷입니다: {dataset_format}")
        return

    print(f"🧹 {count}개의 라벨 파일이 삭제되었습니다.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Convert label files to training JSON format.")
    parser.add_argument("--root_dir", type=str, required=True, help="Path to the root folder of the dataset.")
    parser.add_argument("--corpus_name", type=str, required=True, help="Name of the dataset source (e.g., '한국인대화음성').")
    parser.add_argument("--category", type=str, required=True, help="Category of the speech content (e.g., '일상안부').")
    parser.add_argument("--dataset_format", type=str, required=True, choices=["format1", "format2", "format3"], help="Format type of dataset (e.g., 'format1', 'format2').")
    parser.add_argument("--corpus_key", type=str, default="corpus", help="Key name to use for corpus (default: 'corpus').")
    parser.add_argument("--output_path", type=str, default="label_data.json", help="Output file name (default: 'label_data.json').")
    parser.add_argument("--remove", action="store_true", help="If set, deletes all .json and .txt label files after processing.")
    return parser.parse_args()

def main():
    args = parse_args()

    json_data = convert_labels_to_json(
        root_dir=args.root_dir,
        corpus_name=args.corpus_name,
        category=args.category,
        dataset_format=args.dataset_format, 
        corpus_key=args.corpus_key
    )

    save_json(json_data, output_path=args.output_path)

    if args.remove:
        remove_label_files(args.root_dir, args.dataset_format)


if __name__ == "__main__":
    main()


# Example usage:
# -----------------------------------------------------
# [FORMAT 1] json + txt 쌍으로 구성된 데이터셋 (ex. dialog_01)
# python format_labels.py \
#     --root_dir /home/pasong/data/dialog_01 \
#     --corpus_name 한국인대화음성 \
#     --category 일상안부 \
#     --dataset_format format1 \
#     --corpus_key corpus \
#     --output_path ko_dialog_01_labels.json \
#     --remove

# [FORMAT 2] json + csv 파일이 루트에 있는 데이터셋 (ex. 한국일반)
# python format_labels.py \
#     --root_dir "/home/pasong/data/1. 한국일반" \
#     --corpus_name 인공지능학습 \
#     --category 1.한국일반 \
#     --dataset_format format2 \
#     --corpus_key corpus \
#     --output_path en_01_general_labels.json \
#     --remove

# [FORMAT 3] (추후 지원 예정)
# python format_labels.py \
#     --root_dir "/home/pasong/data/SPK_01" \
#     --corpus_name "아나운서음성" \
#     --category unused \
#     --dataset_format format3 \
#     --corpus_key corpus \
#     --output_path ko_announcer_labels_01.json \
#     --remove
