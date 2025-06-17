from datasets import load_dataset
import asyncio
import aiohttp
from cer_module import calculate_korean_crr

async def process_with_wav2vec2(audio_data: bytes) -> str:
    """Using the same endpoint as transcribeAudioWithWav2Vec2 from wav2vec2_api.ts"""
    try:
        async with aiohttp.ClientSession() as session:
            form_data = aiohttp.FormData()
            form_data.append('file', audio_data, filename='audio.wav')
            
            async with session.post('https://speako-wav2vec2-server.hf.space/transcribe', 
                                  data=form_data) as response:
                if not response.ok:
                    raise Exception(f"Wav2Vec2 server error: {response.status}")
                result = await response.json()
                return result.get('transcription', '')
    except Exception as e:
        print(f"Wav2Vec2 처리 오류: {str(e)}")
        return None

async def process_with_g2pk(text: str) -> str:
    """Using the same endpoint as convertToG2pk from g2pk_api.ts"""
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                'https://speako-backend-server.hf.space/g2pk',
                json={'text': text},
                headers={'Content-Type': 'application/json'}
            ) as response:
                if not response.ok:
                    raise Exception(f"G2PK server error: {response.status}")
                result = await response.json()
                return result.get('result', text)
    except Exception as e:
        print(f"G2PK 변환 오류: {str(e)}")
        return text

async def evaluate_dataset():
    dataset = load_dataset("daeunn/g2pk2_dataset")
    results = []
    
    async with aiohttp.ClientSession() as session:
        for example in dataset['train']:
            try:
                audio_path = example['audio']
                original_text = example['text']
                file_name = example['file_name']
                
                print(f"\nProcessing: {file_name}")
                print(f"Original text: {original_text}")
                
                # Download audio from dataset
                async with session.get(audio_path) as response:
                    if response.status != 200:
                        raise Exception(f"Audio download failed: {response.status}")
                    audio_data = await response.read()
                
                # 1. Wav2Vec2 처리
                wav2vec_result = await process_with_wav2vec2(audio_data)
                if not wav2vec_result:
                    continue
                print(f"Wav2Vec2 결과: {wav2vec_result}")
                
                # 2. G2PK 변환
                wav2vec_g2pk = await process_with_g2pk(wav2vec_result)
                print(f"G2PK 변환 결과: {wav2vec_g2pk}")
                
                # 3. Ground truth의 G2PK 변환
                ground_truth_g2pk = await process_with_g2pk(original_text)
                
                # 4. CRR 계산
                crr_result = calculate_korean_crr(ground_truth_g2pk, wav2vec_g2pk)
                
                results.append({
                    'file_name': file_name,
                    'original_text': original_text,
                    'wav2vec_result': wav2vec_result,
                    'wav2vec_g2pk': wav2vec_g2pk,
                    'ground_truth_g2pk': ground_truth_g2pk,
                    'crr': crr_result['crr'],
                    'substitutions': crr_result['substitutions'],
                    'deletions': crr_result['deletions'],
                    'insertions': crr_result['insertions']
                })
                
                print(f"File: {file_name}")
                print(f"CRR: {crr_result['crr']:.2%}")
                print("-" * 50)
                
            except Exception as e:
                print(f"Error processing {file_name}: {str(e)}")
    
    # Save results
    if results:
        average_crr = sum(r['crr'] for r in results) / len(results)
        print(f"\n평균 CRR ({len(results)} 개 샘플): {average_crr:.2%}")
        
        with open('evaluation_results.txt', 'w', encoding='utf-8') as f:
            for r in results:
                f.write(f"File: {r['file_name']}\n")
                f.write(f"Original: {r['original_text']}\n")
                f.write(f"Wav2Vec2: {r['wav2vec_result']}\n")
                f.write(f"Wav2Vec2 + G2PK: {r['wav2vec_g2pk']}\n")
                f.write(f"Ground Truth G2PK: {r['ground_truth_g2pk']}\n")
                f.write(f"CRR: {r['crr']:.2%}\n")
                f.write(f"Details: sub={r['substitutions']}, del={r['deletions']}, ins={r['insertions']}\n")
                f.write("-" * 50 + "\n")

if __name__ == "__main__":
    asyncio.run(evaluate_dataset())