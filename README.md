# SpeaKo: AI-Powered Korean Pronunciation Practice (A Team Project) 🇰🇷

**[View Live Demo](https://speako-kor.netlify.app/)**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Responding to the global rise of K-culture and the corresponding demand for Korean language learning, our team identified a significant gap in the market: a lack of dedicated tools for pronunciation practice. SpeaKo was developed to address this need, providing learners with immediate, multi-faceted feedback to improve their Korean pronunciation effectively.

This repository contains the source code for SpeaKo, an AI-powered web application that offers both visual and auditory feedback to guide learners toward fluency.

## ✨ Core Features

SpeaKo provides a comprehensive learning experience by breaking down pronunciation feedback into multiple, easy-to-understand components.

### Visual Feedback
*   **Literal Transcription (`Fine-tuned Wav2Vec2`)**: See exactly *how* you pronounced a sentence, not just what you said. Our custom-tuned model captures phonetic nuances (e.g., transcribing "수하글 배오를 이써요" as spoken).
*   **Autocorrected Suggestion (`Web Speech API`)**: Get a real-time suggestion of the sentence you likely intended to say (e.g., "저는 수학을 배우고 있어요"), providing a clear target.
*   **Syllable-Level Error Highlighting**: Incorrectly pronounced syllables are immediately underlined, with romanization guides to show the phonetic difference between your version and the standard pronunciation.
*   **Phoneme Analysis & Oral Structure Guide**: Get a list of specific vowels and consonants you struggle with. Click the `+` button to see detailed mouth shape diagrams and pronunciation tips for each phoneme.

### Auditory Feedback
*   **Listen to Yourself**: Replay your own recording at any time to self-assess your pronunciation.
*   **Hear the Correction in *Your* Voice (`CosyVoice2`)**: This is our key feature. Using Zero-Shot voice cloning, you can listen to the correctly pronounced sentence synthesized with **your own voice style**, creating a powerful and intuitive learning loop.

### Gamified Learning
*   **Pronunciation Growth Game**: Engage in a fun practice mode where you are challenged with random words. As you pronounce them correctly (based on a CRR score), you watch a character grow from a small seed into a blooming flower, making repetitive practice rewarding.


+ 사진
+ 스피코앱 다운로드 방법

## 🏛️ Architecture & Technical Decisions

SpeaKo is built on a Microservices Architecture (MSA) to separate the responsive frontend from the computationally intensive AI models. This design was crucial for achieving real-time feedback.

- **Frontend**: A React-based Progressive Web App (PWA) that captures user audio and visualizes the analysis results.
- **Backend**: A group of specialized AI models deployed as independent Docker services on **Hugging Face Spaces**. We chose Spaces for its **GPU support (NVIDIA T4)**, which is essential for running heavy models like Wav2Vec2 and CosyVoice2 with low latency.

![image](https://github.com/user-attachments/assets/9233e350-2823-47a4-99f8-0c0f68894edd)

### Key Technical Implementations
1.  **Pronunciation-First Speech Recognition**: We fine-tuned the `kresnik/wav2vec2-large-xlsr-korean` model. Crucially, our training text data was first converted to its phonetic representation using `g2pk2`. This trained the model to transcribe *how* something was said (e.g., "힘든 하루여써") rather than its standard spelling ("힘든 하루였어"), enabling precise error analysis.
2.  **Enhanced G2P Conversion**: The standard `g2pk2` library was extended to better handle common colloquialisms and linguistic exceptions (e.g., correctly processing "밝기" -> "박끼" and "줄게" -> "줄께"), resulting in a more accurate standard pronunciation guide.
3.  **Rule-Based Romanization**: While an initial prototype used LLaMA3, we pivoted to the `hangul_romanize` library. This rule-based approach provides the consistency and accuracy required for reliable phonetic comparison, a task where LLMs can be unpredictable.
4.  **Zero-Shot Voice Cloning for Personalized Feedback**: We implemented a auditory feedback loop using `CosyVoice2`. By engineering prompts with three components—the user's own audio (`Prompt Audio`), their literal transcribed text (`Prompt Text`), and the correct sentence (`Target Text`)—the system synthesizes the correct pronunciation while preserving the user's unique vocal timbre.

## 🛠️ Tech Stack

| Component      | Technologies                                                                          |
|----------------|---------------------------------------------------------------------------------------|
| **Frontend**   | `React`, `TypeScript`, `Vite`, `Tailwind CSS`, `PWA`                                  |
| **Backend**    | `Python`, `FastAPI`, `Docker`                                                         |
| **AI Models**  | `Wav2Vec2` (STT), `CosyVoice2` (TTS), `g2pk` (G2P), `hangul_romanize`                 |
| **Infra**      | `Hugging Face Spaces` (T4 GPU for AI models) + `Docker`                               |

## 🗂️ Project Structure

```
SR-SpeaKo-KoreanLearner/
├── frontend/              # Source code for the React PWA
├── model/                 # Python scripts for model training and evaluation, inference
├── data/                  # Scripts for data preprocessing and formatting
└── README.md              # You are here!
```

## 🚀 Getting Started

To run the frontend application locally:

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [yarn](https://yarnpkg.com/) or `npm`

### Installation & Running

1.  **Clone the repository:**
    ```shell
    git clone https://github.com/your-username/SR-SpeaKo-KoreanLearner.git
    cd SR-SpeaKo-KoreanLearner
    ```

2.  **Navigate to the frontend directory:**
    ```shell
    cd frontend
    ```

3.  **Install dependencies:**
    ```shell
    yarn install
    # or
    npm install
    ```

4.  **Run the development server:**
    ```shell
    yarn dev
    # or
    npm run dev
    ```

The application will be available at `http://localhost:5173`. The frontend is pre-configured to communicate with the live backend services hosted on Hugging Face Spaces.

## Team Members
This project is a team project from the Department of Artificial Intelligence at Hanyang University ERICA Campus, focusing on Speech Recognition. 

<a href="https://github.com/Bigeco/SR-SpeaKo-KoreanLearner/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=bigeco/SR-SpeaKo-KoreanLearner"  alt=""/>
</a>

- **Songeun Lee**
  - Role: PWA Setup, Frontend (Onboarding, StartRecord), Data (Wav2Vec2 Dataset), Backend (Wav2Vec2, CosyVoice2), Romanizer.
    
  - GitHub: [@bigeco](https://github.com/bigeco)


- **Jihye Park**
  - Role: Frontend (Recording, ReelsGame), Backend (CosyVoice2), TTS Model.

  - GitHub: [@park-ji-hye](https://github.com/park-ji-hye)


- **Daeun Song**
  - Role: Frontend (Onboarding, StartRecord), Data (Wav2Vec2 Dataset), Backend (g2pk2), Wav2Vec2 Finetuning.

  - GitHub: [@Song-Daeun](https://github.com/Song-Daeun)

- **Hayeon Choi**
  - Role: Frontend (StartRecord, Oral Structure Page), Data (Wav2Vec2 Dataset), Model (g2pk2 Enhancement, CER Logic).

  - GitHub: [@Song-Daeun](https://github.com/Song-Daeun)


## License

This project is licensed under the MIT License.
