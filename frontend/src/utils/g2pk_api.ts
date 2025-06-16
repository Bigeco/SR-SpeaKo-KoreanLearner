export async function convertToG2pk(text: string): Promise<string> {
  try {
    const response = await fetch('http://localhost:8000/g2pk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    
    if (!response.ok) {
      throw new Error('G2PK 변환 실패');
    }
    
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('G2PK 변환 중 오류:', error);
    return text; // 오류 시 원본 반환
  }
}