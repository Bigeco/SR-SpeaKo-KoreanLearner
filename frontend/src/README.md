# Convention
## 폴더 구조 컨벤션
```shell
frontend/src/
├── assets/
│   └── react.svg
├── components/           # 공통 컴포넌트
│   ├── common/           # 범용적인 작은 컴포넌트들
│   │   ├── AudioWaveform.tsx
│   │   └── ...
│   ├── layout/           # 레이아웃 관련 컴포넌트들
│   │   ├── NavBar.tsx
│   │   ├── PhoneFrame.tsx  
│   │   └── ...
│   └── ...
├── pages/                # 페이지별 뷰 컴포넌트
│   ├── onboarding-view/
│   ├── oral-structure-view/
│   ├── progress-view/
│   ├── reels-view/
│   ├── start-record-view/
│   └── subtitle-view/
│       ├── components/   # subtitle-view 전용 컴포넌트
│       ├── styles/       # subtitle-view 전용 스타일
│       │   └── subtitle.css
│       └── index.tsx     # subtitle-view 메인 컴포넌트
├── router/
│   └── index.ts          # 라우터 설정
├── stores/               # 상태 관리
├── utils/                # 유틸리티 함수
├── App.css
├── App.tsx               # 메인 앱 컴포넌트
├── index.css             # 전역 CSS
├── main.tsx              # 앱 진입점
└── PWABadge.tsx          # PWA 관련 컴포넌트
```

## Export/Import 규칙
### `export default` 사용하는 경우:
- 파일당 하나의 주요 컴포넌트를 내보낼 때
- 페이지 컴포넌트 (`pages/` 폴더의 컴포넌트들)
- 주요 설정 파일 (router, store 등)

```typescript
// pages/subtitle-view/index.tsx
const SubtitleView = () => { ... };
export default SubtitleView;

// router/index.ts
const router = createBrowserRouter([...]);
export default router;
```

### `export const` 사용하는 경우:
- 여러 개의 항목을 내보낼 때
- 유틸리티 함수들
- 타입/인터페이스
- 상수
- Custom Hooks

```typescript
// utils/format.ts
export const formatDate = () => { ... };
export const formatCurrency = () => { ... };

// types/index.ts
export interface User { ... }
export type AuthState = { ... }

// hooks/useAuth.ts
export const useAuth = () => { ... };

// constants/index.ts
export const API_URL = "...";
```