/**
 * Wav2Vec2 API 관련 유틸리티 함수들 (디버깅 버전)
 */

const WAV2VEC2_SERVER_URL = 'https://speako-wav2vec2-server.hf.space';

export interface Wav2Vec2Response {
  transcription: string;
  status: string;
}

/**
 * 오디오 Blob을 Wav2Vec2 서버로 전송하여 음성 인식 수행
 */
export async function transcribeAudioWithWav2Vec2(
  audioBlob: Blob,
  filename: string = "recording.wav"
): Promise<Wav2Vec2Response> {
  try {
    // 디버깅 정보 출력
    console.log('🎤 Wav2Vec2 API 호출 시작');
    console.log('📋 요청 정보:', {
      url: `${WAV2VEC2_SERVER_URL}/transcribe`,
      fileSize: `${(audioBlob.size / 1024).toFixed(2)} KB`,
      fileType: audioBlob.type,
      filename: filename
    });

    // FormData 생성
    const formData = new FormData();
    formData.append('file', audioBlob, filename);

    // 추가 디버깅: Blob 내용 확인
    console.log('🔍 오디오 Blob 정보:', {
      size: audioBlob.size,
      type: audioBlob.type,
      constructor: audioBlob.constructor.name
    });

    // API 호출 시작 시간 기록
    const startTime = Date.now();

    const response = await fetch(`${WAV2VEC2_SERVER_URL}/transcribe`, {
      method: 'POST',
      body: formData,
      mode: 'cors',
    });

    const endTime = Date.now();
    console.log(`⏱️ API 응답 시간: ${endTime - startTime}ms`);

    if (!response.ok) {
      console.error('❌ HTTP 오류:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const result: Wav2Vec2Response = await response.json();
    
    console.log('✅ Wav2Vec2 서버 응답:', {
      transcription: result.transcription,
      status: result.status,
      transcriptionLength: result.transcription?.length || 0
    });

    if (result.status !== 'success') {
      console.error('❌ 서버 처리 실패:', result);
      throw new Error(`서버 오류: ${result.status}`);
    }

    return result;

  } catch (error) {
    console.error('💥 Wav2Vec2 음성 인식 오류:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🌐 네트워크 오류 - 서버 연결 실패');
      throw new Error('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
    }
    
    if (error instanceof Error) {
      throw new Error(`음성 인식 실패: ${error.message}`);
    }
    
    throw new Error('알 수 없는 오류가 발생했습니다.');
  }
}

/**
 * 웹 UI와 동일한 방식으로 테스트 (디버깅용)
 */
export async function transcribeAudioWithSubmit(
  audioBlob: Blob,
  filename: string = "recording.wav"
): Promise<Wav2Vec2Response> {
  try {
    console.log('🌐 웹 UI 방식으로 테스트 (/submit 엔드포인트)');
    
    const formData = new FormData();
    formData.append('audio_file', audioBlob, filename); // 웹 UI와 동일한 필드명

    const response = await fetch(`${WAV2VEC2_SERVER_URL}/submit`, {
      method: 'POST',
      body: formData,
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    // /submit은 HTML을 반환하므로 텍스트로 받아서 파싱
    const htmlText = await response.text();
    console.log('📄 웹 UI 응답 (HTML):', htmlText.substring(0, 500) + '...');
    
    // HTML에서 결과 추출 (정규식 사용)
    const transcriptionMatch = htmlText.match(/<pre[^>]*>([^<]+)<\/pre>/);
    const transcription = transcriptionMatch ? transcriptionMatch[1].trim() : '';
    
    console.log('🎯 웹 UI에서 추출된 결과:', transcription);

    return {
      transcription,
      status: transcription ? 'success' : 'error'
    };

  } catch (error) {
    console.error('💥 웹 UI 방식 테스트 실패:', error);
    throw error;
  }
}

/**
 * 오디오 파일을 다운로드하여 비교 분석 (디버깅용)
 */
export async function downloadAudioForAnalysis(audioBlob: Blob, filename: string = "debug-recording.wav") {
  try {
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`💾 오디오 파일 다운로드됨: ${filename}`);
    console.log('📝 이 파일을 웹 UI에 직접 업로드해서 결과를 비교해보세요!');
  } catch (error) {
    console.error('💥 오디오 다운로드 실패:', error);
  }
}

/**
 * 오디오 Blob의 상세 정보 분석
 */
export async function analyzeAudioBlob(audioBlob: Blob): Promise<void> {
  console.log('🔬 오디오 Blob 분석 시작');
  
  try {
    // 기본 정보
    console.log('📊 기본 정보:', {
      size: `${(audioBlob.size / 1024).toFixed(2)} KB`,
      type: audioBlob.type,
      lastModified: new Date().toISOString()
    });

    // ArrayBuffer로 변환하여 헤더 분석
    const arrayBuffer = await audioBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // WAV 헤더 확인
    const header = String.fromCharCode(...uint8Array.slice(0, 12));
    console.log('🎵 파일 헤더:', {
      header: header,
      isWAV: header.includes('RIFF') && header.includes('WAVE'),
      firstBytes: Array.from(uint8Array.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')
    });

    // Audio 객체로 메타데이터 확인
    const audio = new Audio();
    const url = URL.createObjectURL(audioBlob);
    
    return new Promise((resolve) => {
      audio.addEventListener('loadedmetadata', () => {
        console.log('🎼 오디오 메타데이터:', {
          duration: `${audio.duration?.toFixed(2)}초`,
          channels: 'unknown', // MediaRecorder로는 확인 어려움
          sampleRate: 'unknown'
        });
        URL.revokeObjectURL(url);
        resolve();
      });
      
      audio.addEventListener('error', () => {
        console.warn('⚠️ 오디오 메타데이터 로드 실패');
        URL.revokeObjectURL(url);
        resolve();
      });
      
      audio.src = url;
    });

  } catch (error) {
    console.error('💥 오디오 분석 실패:', error);
  }
}

// 기존 함수들...
export async function checkWav2Vec2ServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${WAV2VEC2_SERVER_URL}/health`, {
      method: 'GET',
      mode: 'cors',
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.warn('Wav2Vec2 서버 헬스체크 실패:', response.status);
      return false;
    }

    const healthData = await response.json();
    console.log('Wav2Vec2 서버 상태:', healthData);
    
    return healthData.status === 'ok';

  } catch (error) {
    console.error('Wav2Vec2 서버 헬스체크 오류:', error);
    return false;
  }
}

export function validateAudioFile(file: File | Blob): boolean {
  const supportedTypes = [
    'audio/wav',
    'audio/wave', 
    'audio/x-wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/flac',
    'audio/x-flac',
    'audio/m4a',
    'audio/mp4'
  ];

  if (file instanceof Blob && !(file instanceof File)) {
    return true;
  }

  if (file instanceof File) {
    return supportedTypes.includes(file.type);
  }

  return false;
}

export function validateAudioSize(audioBlob: Blob, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return audioBlob.size <= maxSizeBytes;
}

export async function sttCrrStep1(audio1: File, reference: string) {
  const formData = new FormData();
  formData.append('file', audio1);         // 백엔드 파라미터명과 맞춰야 함!
  formData.append('reference', reference);
  const res = await fetch('/transcribe', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('API 실패');
  return res.json(); // { transcription, status, crr }
}
