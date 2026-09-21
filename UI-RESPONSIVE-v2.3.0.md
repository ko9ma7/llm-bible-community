# LLM Bible UI / Responsive v2.3.0

## 목표
큰 빈 여백을 줄이고, 정보 밀도·시각적 계층·탐색 흐름을 개선하면서 PC/Tablet/Mobile에서 같은 구조가 자연스럽게 재배치되도록 합니다.

## 주요 설계
- Desktop: 최대 1240px shell, 전체 지도 2열, 탐색기 sidebar + 2열 결과
- Tablet: 1080px 이하에서 header를 mobile navigation으로 전환, 지도 1열
- 820px 이하: explorer sidebar를 상단 category grid로 전환
- 560px 이하: 모든 주요 grid 1열, segmented control은 수평 스크롤
- 375px 이하: 계정 chip/brand/CTA 폭을 소형 화면에 맞춰 축소

## 검수 기준
- 320 / 375 / 430 / 768 / 1024 / 1440 폭에서 불필요한 가로 스크롤이 없어야 함
- 버튼 최소 높이 약 40~44px
- heading은 word-break/균형 줄바꿈 적용
- 상세 drawer는 820px 이하에서 full-screen
- 필터/segmented control은 모바일에서 넘칠 경우 내부 스크롤

## 변경된 디자인 토큰
기존 코드에서 참조하지만 선언되지 않았던 `--border`, `--surface-soft`, `--surface-2`, `--radius-md`, `--radius-lg`, `--shadow-sm`을 실제 토큰으로 정의했습니다.
