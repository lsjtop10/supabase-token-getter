# Artifact: Svelte 5 Runes Optimization

## 작업 내용
Svelte 5의 Runes 시스템을 활용하여 `src/routes/dashboard/+page.svelte`의 상태 관리 로직을 최적화하고, `state_referenced_locally` 경고를 해결했습니다.

## 주요 변경 사항

### 1. 상태 선언 최적화 (Runes 활용)
- **`$state` → `$derived` 전환**: 다른 상태값에 의존하여 계산되는 `decodedPayload`, `isExpired`, `remainingTime`을 `$derived`로 변경했습니다. 이를 통해 데이터 소스가 변경될 때 수동으로 상태를 업데이트하던 로직을 제거하고 선언적 반응성을 확보했습니다.
- **반응형 시간(`now`) 도입**: 현재 시각을 `$state`로 관리하고 1초마다 업데이트하도록 설정했습니다. 이제 `remainingTime`은 `now`가 바뀔 때마다 자동으로 재계산됩니다.
- **Props 동기화**: 서버로부터 전달받은 `data`가 변경될 때 로컬 `$state`들이 함께 업데이트되도록 `$effect` 블록을 추가했습니다.

### 2. 유틸리티 함수 개선 (`src/lib/jwt.ts`)
- `formatRemainingTime` 함수가 외부에서 `now` 시각을 주입받을 수 있도록 매개변수를 추가했습니다. 이는 Svelte 5의 `$derived`와 결합하여 반응형 업데이트를 훨씬 간결하게 만듭니다.

### 3. 코드 안정성 및 경고 해결
- `state_referenced_locally` 경고를 모두 해결하여 빌드 타임 및 런타임 안정성을 높였습니다.
- 불필요한 상태 업데이트 로직(setInterval 내의 수동 할당 등)을 제거하여 코드가 더 간결해졌습니다.

## 파일별 변경 요약
- `src/lib/jwt.ts`: `formatRemainingTime` 매개변수 추가
- `src/routes/dashboard/+page.svelte`: Runes 기반 리팩토링 및 `$effect` 추가
- `plan.md`: 최적화 계획 문서화 추가
