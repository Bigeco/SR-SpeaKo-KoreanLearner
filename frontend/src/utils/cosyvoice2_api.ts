const COSYVOICE2_SERVER_URL = 'https://speako-cosyvoice2-server.hf.space';

export interface CosyVoice2Response {
  audio: string; // Base64 encoded audio data
  error?: string;
}

export const textToSpeech = async (
  audioFile: File,
  promptText: string = '안녕하세요',
  targetText: string
): Promise<{ audio?: string; error?: string }> => {
  console.log('🎤 TTS API 호출 시작:', {
    serverUrl: COSYVOICE2_SERVER_URL,
    promptText,
    targetText,
    audioFileSize: audioFile.size
  });

  try {
    const formData = new FormData();
    formData.append('prompt_audio', audioFile);
    formData.append('prompt_text', promptText);
    formData.append('text', targetText);

    const response = await fetch(`${COSYVOICE2_SERVER_URL}/submit`, {
      method: 'POST',
      body: formData,
    });

    console.log('📥 TTS API 응답:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('💥 서버 응답 에러:', JSON.stringify(errorData));
      throw new Error(`서버 오류: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    // HTML 응답을 파싱하여 오디오 파일 URL 추출
    const htmlText = await response.text();
    const audioUrlMatch = htmlText.match(/\/download\/outputs\/[^"]+/);
    
    if (!audioUrlMatch) {
      throw new Error('오디오 파일 URL을 찾을 수 없습니다.');
    }

    const audioUrl = `${COSYVOICE2_SERVER_URL}${audioUrlMatch[0]}`;
    console.log('🔍 오디오 파일 URL:', audioUrl);

    // 오디오 파일 다운로드
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error('오디오 파일 다운로드 실패');
    }

    const audioBlob = await audioResponse.blob();
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        const base64Audio = reader.result as string;
        const base64Data = base64Audio.split(',')[1];
        resolve({ audio: base64Data });
      };
      reader.onerror = () => reject(new Error('오디오 파일 변환 실패'));
      reader.readAsDataURL(audioBlob);
    });
  } catch (error) {
    console.error('💥 음성 합성 실패:', error);
    return { error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' };
  }
};

export async function checkServerHealth(): Promise<boolean> {
  try {
    console.log('🔍 서버 상태 확인 중:', COSYVOICE2_SERVER_URL);
    const response = await fetch(`${COSYVOICE2_SERVER_URL}/`);
    console.log('📥 서버 상태 응답:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });
    return response.ok;
  } catch (error) {
    console.error('💥 서버 상태 확인 실패:', error);
    return false;
  }
} 