# LLM Bible v2.2.0 — Framework First

이번 버전의 원칙은 **데이터를 먼저 많이 보여주지 않고, 정보 구조를 먼저 고정한 뒤 분류별로 채우는 것**입니다.

## 12개 상위 영역

1. 시작 · 기초
2. Prompt Library
3. Skills · Plugins · Connectors
4. MCP · Tool Calling
5. 실전 Recipes
6. RAG · Grounding
7. Evaluation · Reliability
8. Cost · Latency · Caching
9. 실패 · Troubleshooting
10. Security · Safety
11. Model Guide
12. Community · 사례 공유

각 영역의 세부 분류는 `src/data/taxonomy.js`에 관리합니다. 아직 데이터가 없는 분류도 삭제하지 않고 “앞으로 채울 자리”로 유지합니다.

## 화면 원칙

- 홈: 배우기 / 문제 해결 / 만들기 3개 진입점
- 전체 지도: 12개 영역과 세부 분류를 한 화면에서 확인
- Prompt / Skill / Recipe / Failure: 왼쪽 카테고리 rail + 오른쪽 결과
- 상세: 중앙 모달 대신 오른쪽 drawer
- 모든 Prompt / 코드 / JSON / 검증값: 복사 버튼 제공
- 모바일: rail을 2열/1열 카드로 전환

## 현재 Seed와 목표

- Prompt: 240 → 500+
- Skill / Plugin: 120 → 250+
- Recipe: 50 → 150+
- Failure pattern: 30 → 100+
- MCP: 현재 Skill/Recipe 안에 섞인 자료를 향후 독립 collection으로 분리

## 데이터 추가 순서

1. taxonomy slot 확정
2. 공식 출처 기반 seed 추가
3. 예시 / 코드 / 복사값 추가
4. Evidence level / Last verified 지정
5. 실제 Eval이 없으면 `로컬 eval 필요` 유지
6. 검증 후 Supabase mirror 또는 정적 shard에 반영
