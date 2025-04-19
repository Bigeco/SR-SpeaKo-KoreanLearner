import json
from typing import List, Dict, Any
from pydub import AudioSegment


def save_json(data: List[Dict[str, Any]], output_path: str = "label_data.json") -> None:
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ JSON 파일 저장 완료: {output_path}")


def convert_wav_to_mp3(input_path, output_path, ffmpeg_path):
    AudioSegment.converter = ffmpeg_path
    sound = AudioSegment.from_wav(input_path)
    sound.export(output_path, format="mp3", bitrate="320k")