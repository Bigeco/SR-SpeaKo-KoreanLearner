import yaml
import argparse
import torch
import transformers
import huggingface_hub

# TODO 1: 하이퍼파라미터 조정 필요. (실험 테스트 필요)
# TODO 2: 결과가 ()->() 벗어날 경우를 대비해 처리 코드 작성 필요.
# TODO 3: 결과 에서 자모 기준으로 잘못 발음한 부분 추출 코드 작성 필요.
# TODO 4: 다중 입력 처리(batch)	처리 가능하도록. 파일이나 리스트로 여러 user_input/correct_input 받아 일괄 처리
# TODO 5: 생성 결과 평가 지표 필요.	
class LLaMA3:
    def __init__(self, config: str):
        # 허깅페이스 로그인
        huggingface_hub.login(config["huggingface_token"])

        # 모델 설정 로드
        self.model_config = config["model"]
        self.generate_kwargs = config.get("generate", {}) 
        self.prompt_template = config["prompt_template"]

        # 모델 파이프라인 초기화
        self.pipeline = transformers.pipeline(
            "text-generation",
            model=self.model_config["id"],
            model_kwargs={
                "torch_dtype": getattr(torch, self.model_config["torch_dtype"])
            },
            device=self.model_config["device"],
        )

    def generate(self, user_input: str, correct_input: str) -> str:
        prompt = self.prompt_template.format(
            user_input=user_input, correct_input=correct_input
        )
        result = self.pipeline(prompt, **self.generate_kwargs)[0]["generated_text"]
        return result
    

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
