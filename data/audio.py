import pyaudio
import wave
import webrtcvad
import time

CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 16000  # webrtcvad는 16000Hz 필요
WAVE_OUTPUT_FILENAME = 'output.wav'
SILENCE_LIMIT = 5  # 5초 이상 조용하면 종료

p = pyaudio.PyAudio()
vad = webrtcvad.Vad()
vad.set_mode(1)  # 0~3 (3이 가장 민감함)

stream = p.open(format=FORMAT,
                channels=CHANNELS,
                rate=RATE,
                input=True,
                frames_per_buffer=CHUNK)

print("녹음 시작")

frames = []
last_voice_time = time.time()

try:
    while True:
        data = stream.read(CHUNK)
        frames.append(data)
        
        # 20ms만큼 자르고 VAD 검사
        is_speech = vad.is_speech(data[:640], RATE)  # 16bit * 16000Hz * 0.02s = 640 bytes
        if is_speech:
            last_voice_time = time.time()
        
        if time.time() - last_voice_time > SILENCE_LIMIT:
            print("사용자의 발화 끝, 종료")
            break

except KeyboardInterrupt:
    print("수동 종료")

stream.stop_stream()
stream.close()
p.terminate()

# 저장
wf = wave.open(WAVE_OUTPUT_FILENAME, 'wb')
wf.setnchannels(CHANNELS)
wf.setsampwidth(p.get_sample_size(FORMAT))
wf.setframerate(RATE)
wf.writeframes(b''.join(frames))
wf.close()

print("녹음 완료 및 저장:", WAVE_OUTPUT_FILENAME)
