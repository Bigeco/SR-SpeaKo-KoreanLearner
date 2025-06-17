import os
import json
import torch
import torchaudio
from cer_module import calculate_korean_crr
from wav2vec2 import Wav2Vec2
from enhanced_g2pk import EnhancedG2p
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC
import yaml

# config 로드
config_path = "data/config/wav2vec2.yaml"
with open(config_path, 'r') as file:
    config = yaml.safe_load(file)

finetuned_model = Wav2Vec2(config=config)
g2p = EnhancedG2p()

pretrained_model_name = "kresnik/wav2vec2-large-xlsr-korean"
pretrained_processor = Wav2Vec2Processor.from_pretrained(pretrained_model_name)
pretrained_model = Wav2Vec2ForCTC.from_pretrained(pretrained_model_name).to("cuda")

USE_FINETUNED = False
USE_PRETRAINED = True

CATEGORY_MAP = {
    "중국어": "chinese", # 중국인 데이터
    "일본어": "japanese", # 일본인 데이터
    "태국어": "thai", # 태국인 데이터
    "베트남어": "vietnamese", # 베트남인 데이터
    "영어": "english", # 
    "기타": "others" # 기타 데이터
}

def transcribe_finetuned(audio_bytes, filename):
    try:
        return finetuned_model.transcribe_from_bytes(audio_bytes, filename)
    except Exception as e:
        print(f"[FT 오류] {filename}: {e}")
        return ""

def transcribe_pretrained(audio_path):
    try:
        waveform, sr = torchaudio.load(audio_path)
        if sr != 16000:
            waveform = torchaudio.transforms.Resample(sr, 16000)(waveform)

        inputs = pretrained_processor(
            waveform.squeeze().numpy(),
            sampling_rate=16000,
            return_tensors="pt",
            padding=True
        )
        inputs = {k: v.to("cuda") for k, v in inputs.items()}
        with torch.no_grad():
            logits = pretrained_model(**inputs).logits

        predicted_ids = torch.argmax(logits, dim=-1)
        return pretrained_processor.decode(predicted_ids[0])

    except Exception as e:
        print(f"[PT 오류] {audio_path}: {e}")
        return ""

def g2pk_convert(text):
    try:
        return g2p(text)
    except Exception as e:
        print(f"[G2PK 오류] {text[:30]}...: {e}")
        return text

def load_data(base_dir):
    data = []
    for lang_folder in os.listdir(base_dir):
        lang_path = os.path.join(base_dir, lang_folder)
        if not os.path.isdir(lang_path):
            continue
        json_file = next((f for f in os.listdir(lang_path) if f.endswith(".json")), None)
        if not json_file:
            continue
        with open(os.path.join(lang_path, json_file), "r", encoding="utf-8") as f:
            entries = json.load(f)
        for entry in entries:
            category = entry.get("category")
            split = CATEGORY_MAP.get(category, "others")
            file_name = entry["file_name"]
            audio_path = os.path.join(base_dir, split, "raw", file_name)
            if not os.path.exists(audio_path):
                print(f"❗ 누락된 오디오 파일: {audio_path}")
                continue
            data.append({
                "split": split,
                "file_name": file_name,
                "text": entry["text"][0],
                "audio_path": audio_path
            })
    return data

def evaluate(data_dir):
    dataset = load_data(data_dir)
    results = []

    for item in dataset:
        with open(item["audio_path"], "rb") as f:
            audio_bytes = f.read()

        gt_text = item["text"]
        gt_g2pk = g2pk_convert(gt_text)

        result_record = {
            "split": item["split"],
            "file_name": item["file_name"],
            "original_text": gt_text,
            "ground_truth_g2pk": gt_g2pk
        }

        if USE_FINETUNED:
            hyp_ft = transcribe_finetuned(audio_bytes, item["file_name"])
            hyp_ft_g2pk = g2pk_convert(hyp_ft)
            crr_ft = calculate_korean_crr(gt_g2pk, hyp_ft_g2pk)
            result_record.update({
                "ft_result": hyp_ft,
                "ft_g2pk": hyp_ft_g2pk,
                "ft_crr": crr_ft['crr'],
                "ft_sub": crr_ft['substitutions'],
                "ft_del": crr_ft['deletions'],
                "ft_ins": crr_ft['insertions']
            })
            print(f"[FT-{item['split']}] {item['file_name']} - CRR: {crr_ft['crr']:.2%}")

        if USE_PRETRAINED:
            hyp_pt = transcribe_pretrained(item["audio_path"])
            hyp_pt_g2pk = g2pk_convert(hyp_pt)
            crr_pt = calculate_korean_crr(gt_g2pk, hyp_pt_g2pk)
            result_record.update({
                "pt_result": hyp_pt,
                "pt_g2pk": hyp_pt_g2pk,
                "pt_crr": crr_pt['crr'],
                "pt_sub": crr_pt['substitutions'],
                "pt_del": crr_pt['deletions'],
                "pt_ins": crr_pt['insertions']
            })
            print(f"[PT-{item['split']}] {item['file_name']} - CRR: {crr_pt['crr']:.2%}")

        results.append(result_record)

    # 저장
    with open("evaluation_model_comparison.txt", "w", encoding="utf-8") as f:
        ft_scores, pt_scores = [], []
        ft_split_scores, pt_split_scores = {}, {}

        for r in results:
            split = r["split"]
            f.write(f"[{split.upper()}] File: {r['file_name']}\n")
            f.write(f"Original: {r['original_text']}\n")
            f.write(f"Ground Truth G2PK: {r['ground_truth_g2pk']}\n")

            if USE_FINETUNED:
                f.write(f"FT Wav2Vec2: {r['ft_result']}\n")
                f.write(f"FT G2PK: {r['ft_g2pk']}\n")
                f.write(f"FT CRR: {r['ft_crr']:.2%} (sub={r['ft_sub']}, del={r['ft_del']}, ins={r['ft_ins']})\n")
                ft_scores.append(r['ft_crr'])
                ft_split_scores.setdefault(split, []).append(r['ft_crr'])

            if USE_PRETRAINED:
                f.write(f"PT Wav2Vec2: {r['pt_result']}\n")
                f.write(f"PT G2PK: {r['pt_g2pk']}\n")
                f.write(f"PT CRR: {r['pt_crr']:.2%} (sub={r['pt_sub']}, del={r['pt_del']}, ins={r['pt_ins']})\n")
                pt_scores.append(r['pt_crr'])
                pt_split_scores.setdefault(split, []).append(r['pt_crr'])

            f.write("-" * 60 + "\n")

        if USE_FINETUNED:
            avg_ft = sum(ft_scores) / len(ft_scores)
            f.write(f"\n[✅ FT 전체 평균 CRR]: {avg_ft:.2%}\n")
            f.write("[📊 FT 언어별 평균 CRR]\n")
            for split, scores in ft_split_scores.items():
                f.write(f"- {split}: {sum(scores)/len(scores):.2%} ({len(scores)}개)\n")

        if USE_PRETRAINED:
            avg_pt = sum(pt_scores) / len(pt_scores)
            f.write(f"\n[✅ PT 전체 평균 CRR]: {avg_pt:.2%}\n")
            f.write("[📊 PT 언어별 평균 CRR]\n")
            for split, scores in pt_split_scores.items():
                f.write(f"- {split}: {sum(scores)/len(scores):.2%} ({len(scores)}개)\n")

    print("📄 결과 저장 완료: evaluation_model_comparison.txt")

if __name__ == "__main__":
    evaluate("./data")
