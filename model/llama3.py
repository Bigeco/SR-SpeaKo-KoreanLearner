import yaml
import argparse
from openai import OpenAI

# TODO 1: 하이퍼파라미터 조정 필요. (실험 테스트 필요)
# TODO 2: 결과가 ()->() 벗어날 경우를 대비해 처리 코드 작성 필요.
# TODO 3: 결과 에서 자모 기준으로 잘못 발음한 부분 추출 코드 작성 필요.
# TODO 4: 다중 입력 처리(batch)	처리 가능하도록. 파일이나 리스트로 여러 user_input/correct_input 받아 일괄 처리
# TODO 5: 생성 결과 평가 지표 필요.	
class LLaMA3:
    def __init__(self, config: str):
        # OpenRouter API 클라이언트 초기화
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=config["openrouter_token"]
        )
        
        # 프롬프트 템플릿 설정
        self.prompt_template = config["prompt_template"]
        
        # 모델 설정
        self.model = config["model"]["id"]

    def generate(self, user_input: str, correct_input: str) -> str:
        prompt = self.prompt_template.format(
            user_input=user_input, correct_input=correct_input
        )
        
        completion = self.client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": "https://speako-kor.netlify.app/",
                "X-Title": "SpeaKo Korean Learner",
            },
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        return completion.choices[0].message.content

def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="LLaMA3 pronunciation correction pipeline.")
    parser.add_argument("--config_path", type=str, default="data/config/llama3.yaml", help="모델 설정 및 프롬프트 정보를 담은 YAML 파일 경로")
    parser.add_argument("--user_input", type=str, default="박끼", help="잘못 발음된 단어")
    parser.add_argument("--correct_input", type=str, default="발끼", help="정확한 발음 단어")
    return parser.parse_args()

def main():
    args = parse_args()

    # 설정 파일 로드
    with open(args.config_path, "r") as f:
        config = yaml.safe_load(f)

    # 모델 로드 및 결과 반환
    llama3 = LLaMA3(config)
    output = llama3.generate(args.user_input, args.correct_input)
    print(output)

if __name__ == "__main__":
    main()
