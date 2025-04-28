# Convention
## 폴더 구조 컨벤션
```shell
frontend/src/
  ├── components/      # 재사용 가능한 공통 컴포넌트
  │   ├── common/     # 버튼, 입력필드 등 기본 UI 컴포넌트
  │   └── layout/     # 헤더, 푸터, 네비게이션 등
  ├── pages/          # 각 화면 컴포넌트
  │   ├── Screen1/
  │   │   ├── index.vue
  │   │   ├── components/  # 화면1 전용 컴포넌트
  │   │   └── styles/     # 화면1 전용 스타일
  │   ├── Screen2/
  │   └── Screen3/
  ├── router/         # 라우팅 설정
  │   └── index.ts
  ├── stores/         # 상태 관리 (Pinia)
  ├── styles/         # 전역 스타일
  │   ├── variables.scss
  │   └── global.scss
  ├── types/          # TypeScript 타입 정의
  ├── utils/          # 유틸리티 함수
  └── App.vue         # 루트 컴포넌트
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