# LLM Bible Category Map — v2.2.0

초기 화면에서는 이 목차만 읽고, 사용자가 카테고리를 선택할 때 해당 JSON shard만 추가로 불러옵니다.

## 12개 상위 탐색 카테고리

| # | 카테고리 | 기본 연결 |
|---:|---|---|
| 01 | 시작·기초 | 18단계 curriculum · 6 work modes |
| 02 | Prompt Library | 12 패턴 · 240 examples |
| 03 | Skills·Plugins | 12 domain · 120 patterns |
| 04 | MCP·Tool Calling | tool/function/MCP decision & examples |
| 05 | Agent Recipes | planner/router/reliability recipes |
| 06 | RAG·Grounding | retrieval/rerank/citation |
| 07 | Evaluation | task metrics / eval workflow |
| 08 | Cost·Latency·Caching | quick/cache/router/cost |
| 09 | 실패·Troubleshooting | symptom → cause → corrected → eval |
| 10 | Security | injection/secret/permission |
| 11 | Model Guide | snapshot/role/freshness |
| 12 | Community | Prompt + Result + moderation |

## Prompt Library — 240개

| ID | 표시명 | 수량 | 설명 |
|---|---|---:|---|
| `instruction` | Instruction | 20 | 역할·목표·제약·출력 순서를 명확히 분리 |
| `system` | System message | 20 | 서비스 전역 행동 규칙과 금지사항을 안정적으로 고정 |
| `few-shot` | Few-shot | 20 | 분류·포맷·톤의 패턴을 3~5개 예시로 학습 |
| `structured` | Structured output | 20 | JSON Schema 등 기계 검증 가능한 결과 형식 생성 |
| `rag` | RAG grounded | 20 | 검색된 근거 안에서만 답하고 출처를 연결 |
| `tool` | Agent / tool | 20 | 필요한 도구만 선택하고 위험 작업은 승인 후 실행 |
| `reasoning` | Reasoning scaffold | 20 | 긴 사고과정 노출 대신 계획·근거·결과·검증을 구조화 |
| `quick` | Quick mode | 20 | 쉬운 작업에서 토큰·시간을 제한하고 실패 시에만 상향 |
| `long-context` | Long context | 20 | 긴 문서에서 문서/질문 배치와 핵심 근거 추출을 구조화 |
| `safety` | Safety filter | 20 | 외부 입력·도구 호출 전 위험과 권한을 분류 |
| `verification` | Verification | 20 | 초안 이후 근거·형식·계산·누락을 별도 검증 |
| `multi-stage` | Multi-stage | 20 | 추출→검증→작성처럼 복합 업무를 단계별 체인으로 분리 |

## Skills · Plugins — 120개

| ID | 표시명 | 수량 | 설명 |
|---|---|---:|---|
| `business` | Business | 10 | RFP, 영업 브리프, CRM, 제안서 업무 |
| `connectors` | Connectors | 10 | GitHub, Jira, Slack, DB, Figma 등 외부 시스템 연결 |
| `content` | Content | 10 | SEO, 브랜드 톤, 번역 QA, 콘텐츠 검토 |
| `data` | Data | 10 | CSV profiling, SQL 분석, KPI 진단과 데이터 검증 |
| `documents` | Documents | 10 | PDF·계약서·정책·표 등 문서 기반 작업 |
| `education` | Education | 10 | 학습 계획, 설명, 퀴즈, 개념 검증 등 교육 작업 |
| `operations` | Operations | 10 | 장애 triage, runbook, SLO, 백업 검증 등 운영 업무 |
| `product` | Product | 10 | PRD, acceptance criteria, 실험 설계, 제품 검토 |
| `research` | Research | 10 | 웹·논문 조사, 출처 검증, 비교 연구와 반대 근거 탐색 |
| `security` | Security | 10 | Prompt injection, secret, 권한, 정책 점검 등 보안 업무 |
| `software` | Software | 10 | PR 리뷰, 테스트 생성, 버그 재현, 리팩터링 등 소프트웨어 개발 작업 |
| `support` | Support | 10 | 티켓 분류, KB 검색, 답변 초안, escalation |

## Recipes — 50개

| ID | 표시명 | 수량 | 설명 |
|---|---|---:|---|
| `rag-grounding` | RAG · Grounding | 3 | 검색, rerank, 근거 기반 답변과 citation 검증 |
| `coding-software` | Coding · Software | 8 | GitHub issue, PR, 코드 수정, 테스트와 마이그레이션 |
| `research-data` | Research · Data | 9 | 리서치, 데이터 분석, 문서 분석과 근거 검증 |
| `workflow-ops` | Workflow · Operations | 11 | 업무 자동화, 운영, 비즈니스, 지원 프로세스 |
| `agent-architecture` | Agent Architecture | 5 | Planner/Executor, Router/Specialist, reliability 구조 |
| `optimization-eval` | Optimization · Evaluation | 9 | 비용 라우팅, 품질 평가, 관측성과 운영 지표 |
| `security-safety` | Security · Safety | 5 | 고위험 행동, 권한, 승인, injection 방어 |

## Failures · Troubleshooting — 30개

| ID | 표시명 | 수량 | 설명 |
|---|---|---:|---|
| `prompt-context` | Prompt · Context | 6 | 지시 충돌, 과도한 역할극, 긴 context와 모델 변화 |
| `rag-grounding` | RAG · Grounding | 6 | 검색 노이즈, chunking, embedding, citation과 환각 |
| `tools-agents` | Tools · Agents | 6 | tool schema, loop, idempotency, 과도한 agent 구성 |
| `cost-performance` | Cost · Performance | 2 | reasoning/tool 비용 폭증과 cache miss |
| `evaluation-reliability` | Evaluation · Reliability | 6 | 검증 없는 튜닝, judge bias, benchmark mismatch, observability |
| `security-permission` | Security · Permission | 4 | Prompt injection, 과도한 권한, secret/admin 신뢰 문제 |

## 복사 UX

- Prompt: 원문 / Quick / 검증법 / 전체 패키지 / JSON / 변수 적용본
- Skill: SKILL.md / Sample Prompt / JavaScript / Python / JSON
- Recipe: Prompt / Steps / Architecture / Verification / JSON
- Failure: Corrected / Prevention / Test-Eval / 전체 패키지 / JSON
- Community: Prompt / Result / Prompt+Result

## Supabase DB mirror

`seed-category.cmd`를 실행하면 Sources → Prompt / Skills / Recipes / Failures 중 하나를 선택한 뒤, 다시 세부 카테고리 한 개만 클립보드로 복사합니다. 웹서비스 자체는 DB mirror 없이 static JSON shard만으로 지식 탐색이 가능합니다.
