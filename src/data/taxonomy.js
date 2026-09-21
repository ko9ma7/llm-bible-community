export const TAXONOMY = [
  {
    id: 'foundation', order: '01', title: '시작 · 기초', icon: '◎', summary: 'AI/LLM을 처음 접할 때 반드시 알아야 할 개념과 학습 순서.', href: '#/learn',
    groups: [
      ['LLM 기본', ['모델·토큰·컨텍스트', 'System/User/Assistant 역할', '확률적 생성과 재현성', '모델 버전·스냅샷']],
      ['실무 기본', ['성공 기준·Eval', 'Structured Output', 'Grounding·Hallucination', '비용·지연·캐시']],
      ['확장 경로', ['RAG', 'Tool Calling', 'Skills', 'MCP', 'Agents', 'Fine-tuning', 'Security·Observability']]
    ]
  },
  {
    id: 'prompts', order: '02', title: 'Prompt Library', icon: '⌘', summary: '복사 가능한 프롬프트와 개선 전/후, 검증법을 작업 목적별로 탐색.', href: '#/prompts',
    current: 240, target: '500+',
    groups: [
      ['핵심 패턴', ['Instruction', 'System message', 'Few-shot', 'Structured output', 'Reasoning scaffold', 'Verification', 'Multi-stage']],
      ['Context · Grounding', ['Context engineering', 'Long context', 'RAG grounded', 'Query rewriting', 'Citation prompting', 'Conflict handling']],
      ['속도 · 비용', ['Quick mode', 'Output budget', 'Cache-friendly prefix', 'Router prompt', 'Compression·Summarization']],
      ['도구 · 에이전트', ['Tool-use prompt', 'Function calling', 'Planner/Executor', 'Critique/Revision', 'Human confirmation', 'Failure recovery']],
      ['업무별', ['Research', 'Coding', 'Data/SQL', 'Documents/PDF', 'Writing', 'Translation', 'Product', 'Support', 'Marketing', 'Education']],
      ['멀티모달', ['Image understanding', 'Screenshot analysis', 'Chart/Table extraction', 'Image generation brief', 'Audio/Video analysis']]
    ]
  },
  {
    id: 'skills', order: '03', title: 'Skills · Plugins · Connectors', icon: '◇', summary: '반복 업무를 재사용 가능한 모듈로 패키징하고 외부 앱과 연결.', href: '#/tools?tab=skills',
    current: 120, target: '250+',
    groups: [
      ['업무 Skill', ['Software', 'Research', 'Documents', 'Data', 'Product', 'Business', 'Content', 'Education', 'Support', 'Operations', 'Security']],
      ['개발 Skill', ['PR Review', 'Test generation', 'Bug reproduction', 'Migration', 'Release notes', 'Incident triage', 'Runbook']],
      ['Connector', ['Email', 'Calendar', 'Drive/Docs', 'GitHub', 'Jira', 'Slack', 'Figma', 'CRM', 'Database', 'Observability']],
      ['Skill 설계', ['SKILL.md', 'Description/Trigger', 'Inputs/Outputs', 'Allowed tools', 'Resources', 'Scripts', 'Assets', 'Failure modes', 'Security']]
    ]
  },
  {
    id: 'mcp', order: '04', title: 'MCP · Tool Calling', icon: '⇄', summary: '모델이 파일·DB·GitHub·브라우저·업무 시스템을 안전하게 사용하는 방법.', href: '#/tools?tab=mcp',
    target: '150+',
    groups: [
      ['MCP Core', ['Client', 'Server', 'Tools', 'Resources', 'Prompts', 'Sampling', 'Elicitation', 'MCP Apps']],
      ['Transport', ['stdio', 'Streamable HTTP', 'Local server', 'Remote server', 'Stateless design']],
      ['Tool Design', ['JSON Schema', 'Descriptions', 'Read-only vs Write', 'Idempotency', 'Result compression', 'Pagination', 'Errors/Retry']],
      ['Auth · Security', ['OAuth', 'Scopes', 'Least privilege', 'User confirmation', 'Prompt injection', 'Data exfiltration', 'Secrets']],
      ['실전 Server', ['Filesystem', 'Database', 'GitHub', 'Browser', 'Slack/Jira', 'Figma', 'Cloud/Deploy', 'Monitoring']]
    ]
  },
  {
    id: 'recipes', order: '05', title: '실전 Recipes', icon: '▦', summary: '문제 → 접근 → Prompt/Skill/MCP → 실행 단계 → 검증까지 한 묶음.', href: '#/recipes', current: 50, target: '150+',
    groups: [
      ['Research', ['웹 조사', '논문 비교', '출처 검증', '반대 근거', 'Deep Research']],
      ['Coding', ['코드베이스 이해', 'Issue 수정', 'PR 리뷰', '테스트', '디버깅', 'API 연결']],
      ['업무', ['회의 후속', '문서 작성', '고객지원', 'CRM', 'RFP', '번역 QA']],
      ['Agent', ['Planner→Executor', 'Router→Specialist', 'Verifier', 'Human-in-the-loop', 'Multi-agent']],
      ['Data', ['CSV', 'SQL', 'KPI', 'BI', '표 추출', '데이터 검증']]
    ]
  },
  {
    id: 'rag', order: '06', title: 'RAG · Grounding', icon: '⌕', summary: '최신·사내 지식을 검색하고 근거에 묶어 답하게 하는 전체 파이프라인.', href: '#/recipes?cat=rag-grounding',
    groups: [
      ['Retrieval', ['Chunking', 'Embeddings', 'Hybrid search', 'Metadata filter', 'Multi-query', 'HyDE']],
      ['Ranking', ['Reranking', 'Context selection', 'Top-k tuning', 'Late chunking']],
      ['Generation', ['Grounded answer', 'Citation', 'Conflict handling', 'Insufficient evidence']],
      ['Advanced', ['GraphRAG', 'Agentic RAG', 'Self-RAG', 'Context compression']],
      ['Evaluation', ['Retrieval recall', 'Context relevance', 'Faithfulness', 'Citation correctness']]
    ]
  },
  {
    id: 'eval', order: '07', title: 'Evaluation · Reliability', icon: '✓', summary: '감으로 프롬프트를 고치지 않고 품질·비용·안정성을 측정.', href: '#/failures?cat=evaluation-reliability',
    groups: [
      ['Task Eval', ['Accuracy/F1', 'Exact Match', 'Schema-valid', 'Semantic-valid', 'Tests passed']],
      ['LLM Judge', ['Rubric', 'Pairwise', 'Order swap', 'Bias audit', 'Human calibration']],
      ['Agent Eval', ['Task success', 'Tool success', 'Step count', 'Intervention', 'Retry']],
      ['Operations', ['Regression', 'A/B', 'Tracing', 'Prompt version', 'Dataset version', 'Online feedback']]
    ]
  },
  {
    id: 'optimize', order: '08', title: 'Cost · Latency · Caching', icon: '↯', summary: '더 빠르고 싸게 만들되 성공률을 유지하는 최적화 순서.', href: '#/failures?cat=cost-performance',
    groups: [
      ['Token', ['Shorter context', 'Output control', 'Compression', 'Prompt reuse']],
      ['Caching', ['Prompt cache', 'Prefix cache', 'Semantic cache', 'Cache key design']],
      ['Routing', ['Small-model first', 'Fallback', 'Cascade', 'Reasoning effort']],
      ['Serving', ['Batching', 'Continuous batching', 'Quantization', 'Speculative decoding', 'KV cache']],
      ['Metrics', ['Cost/success', 'TTFT', 'p50/p95', 'Throughput', 'Cache hit rate']]
    ]
  },
  {
    id: 'failures', order: '09', title: '실패 · Troubleshooting', icon: '!', summary: '증상에서 시작해 원인·수정·재발 방지·Eval까지 찾기.', href: '#/failures', current: 30, target: '100+',
    groups: [
      ['Prompt/Context', ['애매한 지시', '지시 충돌', 'Too much context', 'Lost in the middle', 'Model drift']],
      ['RAG', ['Bad chunking', 'Retrieval noise', 'Wrong top-k', 'Citation hallucination', 'Stale knowledge']],
      ['Tools/Agent', ['Weak schema', 'Tool loop', 'Over-agenting', 'Retry storm', 'Non-idempotent action']],
      ['Evaluation', ['No baseline', 'Judge bias', 'Benchmark mismatch', 'No regression']],
      ['Cost', ['Reasoning explosion', 'Cache miss', 'Frontier-model overuse']]
    ]
  },
  {
    id: 'security', order: '10', title: 'Security · Safety', icon: '◆', summary: 'Prompt injection, secret, 권한, 외부 전송을 별도 축으로 관리.', href: '#/failures?cat=security-permission',
    groups: [
      ['Threats', ['Prompt injection', 'Indirect injection', 'RAG poisoning', 'Data exfiltration', 'Tool abuse']],
      ['Controls', ['Least privilege', 'Sandbox', 'Allowlist', 'Confirmation', 'Secret isolation', 'PII handling']],
      ['Eval', ['Attack success rate', 'Unsafe action rate', 'Red team', 'Security regression']]
    ]
  },
  {
    id: 'models', order: '11', title: 'Model Guide', icon: '◈', summary: '순위가 아니라 작업·비용·지연·도구 지원·검증일로 비교.', href: '#/learn',
    groups: [
      ['선택 기준', ['Quality', 'Latency', 'Cost', 'Context', 'Tool use', 'Multimodal', 'Deployment']],
      ['운영', ['Version pinning', 'Deprecation', 'Price snapshot', 'Regression after model change']],
      ['전략', ['Frontier vs Small', 'Open vs API', 'Reasoning effort', 'Router/Cascade']]
    ]
  },
  {
    id: 'community', order: '12', title: 'Community · 사례 공유', icon: '○', summary: 'Prompt와 실제 Result를 함께 제출하고 검수 후 공개.', href: '#/community',
    groups: [
      ['제출', ['Prompt', 'Result', 'Model/version', 'Reproduction notes', 'Evidence']],
      ['검수', ['Clarity', 'Reproducibility', 'Quality', 'Accuracy', 'Safety', 'Learning value']],
      ['상태', ['Pending', 'Published', 'Archived', 'Rejected']]
    ]
  }
];

export const QUICK_ENTRIES = [
  {title:'프롬프트가 잘 안 먹혀요', hint:'Prompt 구조·예시·검증부터', href:'#/failures?cat=prompt-context'},
  {title:'최신 정보가 필요해요', hint:'검색/RAG + 근거 확인', href:'#/recipes?cat=rag-grounding'},
  {title:'외부 앱을 연결하고 싶어요', hint:'Skill / Connector / MCP 판단', href:'#/tools?tab=mcp'},
  {title:'자동으로 실제 작업을 시키고 싶어요', hint:'Tool calling → Agent 순서', href:'#/recipes?cat=agent-architecture'},
  {title:'비용이 너무 많이 나와요', hint:'Quick → Cache → Router', href:'#/failures?cat=cost-performance'},
  {title:'결과가 맞는지 모르겠어요', hint:'Eval·Verification·Grounding', href:'#/failures?cat=evaluation-reliability'}
];
