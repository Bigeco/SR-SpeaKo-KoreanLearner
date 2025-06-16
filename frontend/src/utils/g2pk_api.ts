export async function convertToG2pk(text: string): Promise<string> {
  try {
    // 서버 상태 먼저 확인
    const healthCheck = await fetch('https://speako-backend-server.hf.space/healthcheck');
    if (!healthCheck.ok) {
      console.error('G2PK 서버가 실행되지 않았습니다.');
      return text;
    }

    const response = await fetch('https://speako-backend-server.hf.space/g2pk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      throw new Error(`서버 오류: ${response.status}`);
    }
    
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('G2PK 변환 실패:', error);
    return text;
  }
}