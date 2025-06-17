import torch
import torchaudio
import numpy as np
from transformers import Wav2Vec2ForCTC, Wav2Vec2Processor


class Wav2Vec2:
    def __init__(self, config: dict):
        self.config = config
        self.model_id = config["model"]["id"]
        self.device = config["model"]["device"]
        self.sampling_rate = config["model"]["sampling_rate"]
        
        # 모델과 프로세서 로드
        self.processor = Wav2Vec2Processor.from_pretrained(self.model_id)
        self.model = Wav2Vec2ForCTC.from_pretrained(self.model_id)
        
        # 디바이스 설정
        if self.device == "cuda" and torch.cuda.is_available():
            self.model = self.model.to("cuda")
        else:
            self.model = self.model.to("cpu")
            
        self.model.eval()
        
    def preprocess_audio(self, audio_data: torch.Tensor, original_sr: int) -> np.ndarray:
        """오디오 데이터 전처리"""
        # 샘플링 레이트 변환
        if original_sr != self.sampling_rate:
            resampler = torchaudio.transforms.Resample(original_sr, self.sampling_rate)
            audio_data = resampler(audio_data)
        
        # numpy로 변환
        if isinstance(audio_data, torch.Tensor):
            audio_data = audio_data.numpy()
            
        # 스테레오를 모노로 변환 (필요한 경우)
        if len(audio_data.shape) > 1:
            audio_data = np.mean(audio_data, axis=0)
        
        # float32로 변환
        if audio_data.dtype != np.float32:
            audio_data = audio_data.astype(np.float32)
            
        # 볼륨 정규화
        if np.max(np.abs(audio_data)) > 0:
            audio_data = audio_data / np.max(np.abs(audio_data))
            
        return audio_data
    
    def transcribe(self, audio_file_path: str) -> str:
        """오디오 파일을 텍스트로 변환"""
        try:
            # 오디오 파일 로드
            audio_data, sample_rate = torchaudio.load(audio_file_path)
            
            # 전처리
            audio_data = self.preprocess_audio(audio_data, sample_rate)
            
            # 모델 입력 준비
            inputs = self.processor(
                audio_data, 
                sampling_rate=self.sampling_rate, 
                return_tensors="pt", 
                padding=True
            )
            
            # 디바이스 이동
            inputs = {k: v.to(self.model.device) for k, v in inputs.items()}
            
            # 추론
            with torch.no_grad():
                logits = self.model(**inputs).logits
            
            # 디코딩
            predicted_ids = torch.argmax(logits, dim=-1)
            transcription = self.processor.batch_decode(predicted_ids)[0]
            
            return transcription.strip()
            
        except Exception as e:
            raise Exception(f"Audio transcription failed: {str(e)}")
    
    def transcribe_from_bytes(self, audio_bytes: bytes, filename: str = "temp.wav") -> str:
        """바이트 데이터에서 직접 음성 인식"""
        import tempfile
        import os
        
        try:
            # 임시 파일로 저장
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
                temp_file.write(audio_bytes)
                temp_file_path = temp_file.name
            
            # 음성 인식 수행
            result = self.transcribe(temp_file_path)
            
            # 임시 파일 삭제
            os.unlink(temp_file_path)
            
            return result
            
        except Exception as e:
            raise Exception(f"Audio transcription from bytes failed: {str(e)}")