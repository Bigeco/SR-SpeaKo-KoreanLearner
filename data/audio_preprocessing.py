from pydub import AudioSegment
import librosa
import soundfile as sf
import io

def process_audio(input_file: str, output_file: str) -> None:
    audio = AudioSegment.from_wav(input_file)
    audio = audio.set_channels(1)
    audio = audio.set_frame_rate(22050) # 샘플링 레이트 조정

    normalized_audio = audio.normalize() # 볼륨 정규화

    with io.BytesIO() as buffer:
        normalized_audio.export(buffer, format="wav")
        buffer.seek(0)

        y, sr = librosa.load(buffer, sr=None, mono=True)

        sf.write(output_file, y, sr)