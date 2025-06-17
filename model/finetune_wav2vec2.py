from datasets import load_dataset, Audio
from transformers import (
    Wav2Vec2ForCTC, Wav2Vec2Processor,
    TrainingArguments, Trainer
)
import torch
import re
import dataclasses
import numpy as np

# 1. Load dataset
dataset = load_dataset("daeunn/g2pk2_dataset", split="train")

# 2. Cast audio column and add duration
dataset = dataset.cast_column("audio", Audio(sampling_rate=16_000))

def add_duration(batch):
    audio = batch["audio"]
    batch["duration"] = len(audio["array"]) / audio["sampling_rate"]
    return batch

dataset = dataset.map(add_duration)

# Filter audio length
def filter_audio_length(batch):
    return 1.0 < batch["duration"] < 15.0

dataset = dataset.filter(filter_audio_length)

# 3. Load pretrained model and processor
model_name = "kresnik/wav2vec2-large-xlsr-korean"
processor = Wav2Vec2Processor.from_pretrained(model_name)
model = Wav2Vec2ForCTC.from_pretrained(model_name)

# 4. 기존 vocabulary 분석
vocab = processor.tokenizer.get_vocab()
print(f"Pretrained vocabulary size: {len(vocab)}")
print(f"Sample vocab: {list(vocab.keys())[:20]}")

# 5. 텍스트 정규화 함수 (기존 vocabulary에 맞춤)
def normalize_text(text):
    """기존 모델의 vocabulary에 맞게 텍스트 정규화"""
    # 기본 정리
    text = text.strip()
    
    # 영어는 대문자로 변환 (기존 모델이 대문자로 학습된 경우가 많음)
    text = re.sub(r'[a-z]', lambda m: m.group().upper(), text)
    
    # 숫자를 한글로 변환하거나 제거 (선택사항)
    # text = re.sub(r'\d+', '', text)
    
    # 특수문자 처리 (기존 vocabulary에 있는 것만 유지)
    allowed_chars = set(vocab.keys())
    allowed_chars.add(' ')  # 공백 허용
    
    # 허용되지 않는 문자 제거
    filtered_chars = []
    for char in text:
        if char in allowed_chars or char == ' ':
            filtered_chars.append(char)
        elif char not in ['\n', '\t', '\r']:  # 공백 문자가 아닌 경우만 로그
            print(f"Removing unsupported character: '{char}'")
    
    text = ''.join(filtered_chars)
    
    # 연속된 공백 제거
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()

# 6. 텍스트 전처리 적용
def apply_text_preprocessing(batch):
    batch["text"] = normalize_text(batch["text"])
    return batch

dataset = dataset.map(apply_text_preprocessing)

# 빈 텍스트 제거
dataset = dataset.filter(lambda x: len(x["text"]) > 0)

print(f"Dataset size after filtering: {len(dataset)}")

# 7. 샘플 확인
print("\nSample processed texts:")
for i in range(min(5, len(dataset))):
    print(f"Sample {i}: {dataset[i]['text']}")

# 8. 전처리 함수
def prepare_dataset(batch):
    audio = batch["audio"]
    
    # Process audio
    batch["input_values"] = processor(
        audio["array"], 
        sampling_rate=audio["sampling_rate"]
    ).input_values[0]
    
    # Process text (새로운 방식)
    batch["labels"] = processor(text=batch["text"]).input_ids
    
    return batch

# Apply preprocessing
dataset = dataset.map(
    prepare_dataset, 
    remove_columns=dataset.column_names,
    num_proc=2
)

# 9. Split dataset
train_test = dataset.train_test_split(test_size=0.1, seed=42)
train_dataset = train_test["train"]
eval_dataset = train_test["test"]

# 10. Training arguments
from transformers import TrainingArguments

training_args = TrainingArguments(
    output_dir="./wav2vec2-korean-finetuned2",
    logging_dir="./wav2vec2-korean-finetuned2/logs", 
    logging_steps=10,               
    evaluation_strategy="steps",
    eval_steps=500,
    save_steps=500,
    per_device_train_batch_size=4,
    per_device_eval_batch_size=4,
    gradient_accumulation_steps=2,
    num_train_epochs=3,
    learning_rate=1e-4,
    warmup_steps=500,
    fp16=True,
    save_total_limit=2,
    load_best_model_at_end=True,
    metric_for_best_model="eval_loss",
    greater_is_better=False,
    dataloader_num_workers=2,
    remove_unused_columns=False,
    report_to=["tensorboard"],
)


# 11. Data collator
@dataclasses.dataclass
class DataCollatorCTCWithPadding:
    processor: Wav2Vec2Processor
    padding: bool = True
    
    def __call__(self, features):
        input_features = [{"input_values": feature["input_values"]} for feature in features]
        
        # Extract labels properly
        labels = [feature["labels"] for feature in features]
        
        batch = self.processor.pad(
            input_features,
            padding=self.padding,
            return_tensors="pt",
        )
        
        # Pad labels manually
        max_label_length = max(len(label) for label in labels)
        padded_labels = []
        
        for label in labels:
            padded_label = label + [-100] * (max_label_length - len(label))
            padded_labels.append(padded_label)
        
        batch["labels"] = torch.tensor(padded_labels, dtype=torch.long)
        return batch

data_collator = DataCollatorCTCWithPadding(processor=processor, padding=True)

# 12. Compute metrics (evaluate 모듈 없이 직접 구현)
def compute_wer(predictions, references):
    """Simple WER calculation"""
    total_errors = 0
    total_words = 0
    
    for pred, ref in zip(predictions, references):
        pred_words = pred.split()
        ref_words = ref.split()
        
        # Simple edit distance calculation
        errors = abs(len(pred_words) - len(ref_words))
        errors += sum(p != r for p, r in zip(pred_words, ref_words))
        
        total_errors += errors
        total_words += len(ref_words)
    
    return total_errors / max(total_words, 1)

def compute_metrics(pred):
    pred_logits = pred.predictions
    pred_ids = np.argmax(pred_logits, axis=-1)
    
    pred.label_ids[pred.label_ids == -100] = processor.tokenizer.pad_token_id
    
    pred_str = processor.batch_decode(pred_ids)
    label_str = processor.batch_decode(pred.label_ids, group_tokens=False)
    
    wer = compute_wer(pred_str, label_str)
    return {"wer": wer}

# 13. Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    tokenizer=processor.feature_extractor,
    data_collator=data_collator,
    compute_metrics=compute_metrics,
)

# 14. Train
print("\n=== Starting Training ===")
trainer.train()

# 15. Save model
trainer.save_model()
processor.save_pretrained(training_args.output_dir)

# 16. Test inference
def test_inference():
    print("\n=== Testing Inference ===")
    test_sample = eval_dataset[0]
    input_values = torch.tensor(test_sample["input_values"]).unsqueeze(0)
    
    with torch.no_grad():
        logits = model(input_values).logits
    
    predicted_ids = torch.argmax(logits, dim=-1)
    prediction = processor.decode(predicted_ids[0])
    
    print(f"Prediction: '{prediction}'")
    
    # Test a few more samples
    for i in range(min(3, len(eval_dataset))):
        sample = eval_dataset[i]
        input_values = torch.tensor(sample["input_values"]).unsqueeze(0)
        
        with torch.no_grad():
            logits = model(input_values).logits
        
        predicted_ids = torch.argmax(logits, dim=-1)
        prediction = processor.decode(predicted_ids[0])
        print(f"Sample {i} prediction: '{prediction}'")

test_inference()

print(f"\nModel saved to: {training_args.output_dir}")

# 17. Push to hub (선택사항)
trainer.push_to_hub("daeunn/wav2vec2-korean-finetuned2")