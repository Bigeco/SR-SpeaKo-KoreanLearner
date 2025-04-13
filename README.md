```shell
project_root/
├── data/                        ← Python 패키지 (★ 반드시 __init__.py)
│   ├── __init__.py
│   ├── utils.py                 ← 보조 함수 모듈
│   └── format_labels.py         ← 라벨 처리 메인 모듈
│
├── main.py                      ← 전체 파이프라인 실행을 위한 진입점 스크립트 (optional)
├── requirements.txt             ← 의존성 패키지 목록 (협업 시 설치 안내용)
├── setup.py                     ← 협업을 위한 개발 설치 환경 구성용 (예: `pip install -e .`)
└── README.md
```

팀원이 바로 설치하고 import 가능하게
```python
# setup.py 예시 (간단히 만들 경우)
from setuptools import setup, find_packages

setup(
    name="my_label_toolkit",
    version="0.1",
    packages=find_packages(),  # 'data' 포함됨
    install_requires=[],
)
```
```shell
pip install -e .
```
