const COSYVOICE2_SERVER_URL = 'https://speako-cosyvoice2-server.hf.space';

export interface CosyVoice2Response {
  audio: string; // Base64 encoded audio data
  error?: string;
}

export async function textToSpeech(
  promptAudio: File,
  promptText: string,
  targetText: string
): Promise<CosyVoice2Response> {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('prompt_audio', promptAudio);
    formData.append('prompt_text', promptText);
    formData.append('target_text', targetText);

    const response = await fetch(`${COSYVOICE2_SERVER_URL}/tts`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`서버 오류: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('음성 합성 실패:', error);
    return {
      audio: '',
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    };
  }
}

export async function checkServerHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${COSYVOICE2_SERVER_URL}/healthcheck`);
    return response.ok;
  } catch (error) {
    console.error('서버 상태 확인 실패:', error);
    return false;
  }
} 