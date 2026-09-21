export const TAXONOMY = [
  {
    id:'foundation',order:'01',title:'시작 · 기초',icon:'◎',summary:'AI/LLM을 처음 접할 때 필요한 개념·실습·선택 기준.',href:'#/learn',
    groups:[
      ['LLM 기본',['모델·토큰·컨텍스트','System/User/Assistant 역할','확률적 생성','Temperature·sampling','모델 버전·snapshot','Context window','Input vs Output token','Reasoning budget']],
      ['Prompt 기본',['명확한 목표','Context 분리','Few-shot','Structured Output','검증 지시','Prompt versioning','성공 기준·Eval']],
      ['지식 연결',['Search','RAG','Grounding','Citation','Tool Calling','Function Calling','MCP','Connectors']],
      ['운영 기본',['비용','지연','Caching','Routing','Fallback','Observability','Security','Regression test']],
      ['확장 경로',['Agent','Multi-agent','Memory','Fine-tuning','LoRA/QLoRA','Distillation','Self-hosting','Deployment']]
    ]
  },
  {
    id:'prompts',order:'02',title:'Prompt Library',icon:'⌘',summary:'복사 가능한 프롬프트를 목적·패턴·업무·실패 형태로 탐색.',href:'#/prompts',current:240,target:'500+',
    groups:[
      ['Instruction Core',['Direct instruction','Role + objective','Constraints','Delimiter','XML/Markdown sections','Output order','Negative constraints','Clarifying question','Assumption control','Refusal/fallback']],
      ['Examples · Format',['Zero-shot','One-shot','Few-shot','Positive examples','Counter examples','Edge-case examples','JSON Schema','Table output','CSV output','Citation format']],
      ['Reasoning · Verification',['Decomposition','Plan → Execute','Critique → Revise','Verifier pass','Checklist','Self-consistency','Alternative hypotheses','Calculation check','Source check','Uncertainty label']],
      ['Context Engineering',['Long-context layout','Stable prefix','Context selection','Context compression','Summarization','Memory recap','Relevant-first ordering','Lost-in-the-middle mitigation','Document boundary','Conflict handling']],
      ['RAG · Research',['Query rewrite','Multi-query','HyDE prompt','Grounded answer','Citation prompt','Insufficient evidence','Source conflict','Freshness check','Claim extraction','Research synthesis']],
      ['Tool · Agent',['Tool selection','Function calling','Read-before-write','Planner','Executor','Verifier','Human confirmation','Retry/fallback','Budget guard','Tool result compression']],
      ['Quick · Cost',['Quick mode','Short answer','Output budget','Small-model route','Cache-friendly prefix','Batch prompt','Classification shortcut','Extraction shortcut','Escalation rule','Stop condition']],
      ['Coding',['Code explain','Bug reproduce','Patch plan','Unit test','Integration test','Refactor','Migration','API integration','Security review','PR review','Commit message','Release note']],
      ['Data',['CSV profiling','SQL analysis','Data cleaning','Anomaly detection','KPI diagnosis','Schema mapping','ETL validation','Chart interpretation','Forecast critique','Experiment analysis']],
      ['Documents · Work',['PDF summary','Contract review','Policy compare','Meeting notes','Email draft','Report','RFP','SOP','Checklist','Decision memo','Executive brief']],
      ['Content · Language',['Writing','Editing','Translation','Localization','Tone transfer','SEO','Marketing','Support reply','Education','Quiz','Flashcards']],
      ['Multimodal',['Image understanding','Screenshot QA','Chart/Table extraction','UI critique','Diagram explain','Image generation brief','Audio summary','Video scene analysis','OCR validation','Visual comparison']]
    ]
  },
  {
    id:'skills',order:'03',title:'Skills · Plugins · Connectors',icon:'◇',summary:'반복 업무를 재사용 모듈로 만들고 앱·파일·서비스와 연결.',href:'#/tools?view=skill',current:120,target:'250+',
    groups:[
      ['Skill Anatomy',['SKILL.md','Name/Description','Trigger conditions','Inputs','Outputs','Allowed tools','Resources','Scripts','Assets','Failure modes','Security','Examples']],
      ['Software',['Repo explorer','PR review','Test generator','Bug reproduction','Refactor planner','Migration','Release','Dependency audit','CI diagnosis','Docs sync','Code ownership','Security patch']],
      ['Research',['Web research','Paper compare','Source verify','Contradiction finder','Literature map','Fact checker','Benchmark reader','Trend monitor','Citation formatter','Research memo']],
      ['Documents · Data',['PDF analyzer','Contract checker','Policy compare','Table extractor','CSV profiler','SQL analyst','KPI diagnosis','Data QA','Spreadsheet helper','Report builder']],
      ['Product · Business',['PRD review','Acceptance criteria','Experiment design','User feedback synthesis','RFP analyzer','Lead brief','CRM updater','Competitive brief','Roadmap review','Meeting follow-up']],
      ['Operations · Security',['Incident triage','Runbook','SLO review','Backup verifier','Prompt injection review','Secret scan','Permission check','Threat model','Audit evidence','Change review']],
      ['Connectors',['Email','Calendar','Drive/Docs','GitHub','Jira','Slack','Figma','CRM','Postgres','Warehouse','Sentry','Cloud/Deploy','Browser','Knowledge base','Ticketing']]
    ]
  },
  {
    id:'mcp',order:'04',title:'MCP · Tool Calling',icon:'⇄',summary:'모델이 외부 시스템을 표준화된 도구·리소스로 안전하게 사용하는 구조.',href:'#/tools?view=mcp',current:72,target:'150+',
    groups:[
      ['Protocol Core',['Client','Server','Tool','Resource','Prompt','Sampling','Elicitation','MCP Apps','Capabilities','Initialization','Version negotiation','List discovery']],
      ['Tool Design',['JSON Schema','Tool naming','Description','Read vs Write','Idempotency','Pagination','Result compression','Error taxonomy','Retry budget','Timeout','Parallel calls','Confirmation gate']],
      ['Resources · Prompts',['Resource URI','MIME type','Read handler','Resource templates','Subscriptions','Prompt arguments','Reusable workflow prompt','Context packaging','Large resource strategy','Caching']],
      ['Transport · Deploy',['stdio','Streamable HTTP','Local server','Remote server','Stateless scale-out','Origin validation','Gateway','Health check','Observability','Backpressure','Version pin','Graceful shutdown']],
      ['Auth · Security',['OAuth','Scopes','Least privilege','Identity propagation','Secret isolation','Prompt injection','Data exfiltration','Sandbox','Human approval','Audit log','Tenant isolation','Rate limit']],
      ['Integration',['Filesystem','GitHub','Database read','Database write','Browser/Search','Slack/Jira','Figma','Calendar/Email','Cloud deploy','Observability','CRM','Document store']],
      ['Workflow',['Research agent','Coding agent','Incident triage','Document QA','RAG retrieval','Planner→Executor','Router→Specialist','Human-in-loop','Multi-server','Tool fallback','Verifier','Cost-aware route']]
    ]
  },
  {
    id:'recipes',order:'05',title:'실전 Recipes',icon:'▦',summary:'문제 → 선택 → Prompt/Skill/MCP → 단계 → 검증을 한 묶음으로 제공.',href:'#/recipes',current:50,target:'150+',
    groups:[
      ['Research',['최신 웹 조사','논문 비교','시장 조사','출처 검증','반대 근거','Deep Research','다국어 조사','정책 비교','벤치마크 읽기','Fact table']],
      ['Coding',['코드베이스 이해','Issue 수정','PR review','Bug fix','Test generation','API integration','Migration','Refactor','Security fix','CI failure','Release']],
      ['Documents',['긴 PDF','여러 파일 비교','계약 검토','회의 후속','RFP','정책 요약','표 추출','문서 QA','보고서','Executive summary']],
      ['Data',['CSV 분석','SQL read-only','KPI diagnosis','Data cleaning','Schema mapping','Anomaly','Experiment','Dashboard QA','ETL validation','Spreadsheet automation']],
      ['RAG',['Chunking','Hybrid retrieval','Reranking','Query rewrite','Citation validator','Long-doc QA','Agentic RAG','GraphRAG','Freshness','RAG eval']],
      ['Agent',['Planner→Executor','Router→Specialist','Verifier','Human approval','Multi-agent research','Coding agent','Support agent','Ops agent','Browser agent','Cost router']],
      ['Automation',['Email triage','Calendar planning','Ticket routing','CRM update','Slack summary','Jira creation','GitHub workflow','Figma→frontend','Incident report','Knowledge sync']]
    ]
  },
  {
    id:'rag',order:'06',title:'RAG · Grounding',icon:'⌕',summary:'검색부터 citation·평가까지 근거 기반 응답 전체 파이프라인.',href:'#/recipes?cat=rag-grounding',target:'100+',
    groups:[
      ['Ingestion',['Parsing','Chunking','Semantic chunk','Late chunking','Metadata','Deduplication','Document version','OCR QA','PII filtering','Freshness']],
      ['Retrieval',['Embeddings','BM25','Hybrid search','Metadata filter','Multi-query','HyDE','Query rewrite','Parent-child','Graph retrieval','Recency boost']],
      ['Ranking',['Reranker','Cross-encoder','Top-k tuning','Diversity','Context selection','Score threshold','Budgeted context','Duplicate removal']],
      ['Generation',['Grounded answer','Citation','Quote span','Conflict handling','Insufficient evidence','Abstention','Context compression','Answer synthesis']],
      ['Evaluation',['Retrieval recall','MRR/nDCG','Context relevance','Faithfulness','Answer relevance','Citation correctness','Freshness','Latency','Cost']]
    ]
  },
  {
    id:'eval',order:'07',title:'Evaluation · Reliability',icon:'✓',summary:'품질·안정성·비용을 baseline과 regression으로 측정.',href:'#/failures?cat=evaluation-reliability',target:'100+',
    groups:[
      ['Task Metrics',['Accuracy','Precision/Recall/F1','Exact Match','Field accuracy','Schema-valid','Semantic-valid','Pass@k','Tests passed','Issue resolved']],
      ['Generation Eval',['Rubric','Pairwise','Reference-based','LLM judge','Human review','Order swap','Bias audit','Calibration','Variance']],
      ['RAG Eval',['Recall','Context relevance','Faithfulness','Answer relevance','Citation correctness','Abstention accuracy']],
      ['Agent Eval',['Task success','Tool success','Step count','Retry count','Intervention','Unsafe action','Cost/success','Time/success']],
      ['Operations',['Regression suite','Golden set','A/B','Online feedback','Tracing','Prompt version','Model version','Dataset version','Canary']]
    ]
  },
  {
    id:'optimize',order:'08',title:'Cost · Latency · Caching',icon:'↯',summary:'성공률을 유지하면서 토큰·비용·지연·처리량을 개선.',href:'#/failures?cat=cost-performance',target:'100+',
    groups:[
      ['Prompt/Context',['Shorter context','Selective context','Compression','Output control','Stable prefix','Prompt reuse','Summary memory']],
      ['Caching',['Prompt cache','Prefix cache','KV cache','Semantic cache','Cache key','Invalidation','Hit-rate monitoring']],
      ['Routing',['Small-model first','Cascade','Fallback','Confidence route','Task route','Reasoning effort','Batch route']],
      ['Serving',['Batching','Continuous batching','PagedAttention','Quantization','Speculative decoding','Tensor parallel','Chunked prefill','Multi-LoRA']],
      ['Metrics',['Input/output tokens','Cached tokens','Cost/request','Cost/success','TTFT','p50/p95','Tokens/sec','Throughput','GPU utilization']]
    ]
  },
  {
    id:'failures',order:'09',title:'실패 · Troubleshooting',icon:'!',summary:'증상에서 시작해 원인·수정·예방·검증으로 해결.',href:'#/failures',current:30,target:'100+',
    groups:[
      ['Prompt',['애매한 목표','지시 충돌','과도한 role','Too many rules','예시 부족','잘못된 format','무조건 CoT','질문 없이 추정','Model drift']],
      ['Context',['Too much context','Lost in middle','Stale context','중복 context','캐시 깨짐','잘못된 요약','Memory pollution']],
      ['RAG',['Bad chunk','Wrong embedding','Retrieval noise','Top-k 과다','No rerank','Citation hallucination','Stale index','No abstention']],
      ['Tool/Agent',['Weak schema','Wrong tool','Tool loop','Retry storm','Over-agenting','Multi-agent 과사용','No idempotency','권한 과다','No confirmation']],
      ['Evaluation',['No baseline','Cherry-pick','Judge bias','Benchmark mismatch','No regression','Single-run success','No cost metric']],
      ['Security',['Prompt injection','Secret leak','Data exfiltration','RAG poisoning','Client-side secret','Admin spoofing','Missing audit']]
    ]
  },
  {
    id:'security',order:'10',title:'Security · Safety',icon:'◆',summary:'Prompt injection·secret·권한·외부 전송을 독립적인 품질 축으로 관리.',href:'#/failures?cat=security-permission',target:'80+',
    groups:[
      ['Threats',['Direct injection','Indirect injection','RAG poisoning','Tool abuse','Data exfiltration','Secret exposure','Cross-tenant leak','Unsafe code','Supply-chain skill']],
      ['Controls',['Least privilege','Read/write split','Sandbox','Allowlist','Confirmation','Secret store','PII redaction','Output sanitization','Rate limit','Audit log']],
      ['Testing',['Red team','Attack success rate','Unsafe action rate','Permission tests','Injection regression','Secret scan','Human review','Incident drill']]
    ]
  },
  {
    id:'models',order:'11',title:'Model Guide',icon:'◈',summary:'모델을 순위가 아니라 작업·비용·지연·도구·배포 조건으로 선택.',href:'#/learn',target:'living',
    groups:[
      ['Capabilities',['Reasoning','Coding','Tool use','Long context','Multimodal','Structured output','Language']],
      ['Economics',['Input price','Output price','Cached price','Batch price','Rate limits','Latency tier']],
      ['Operations',['Snapshot','Version pin','Deprecation','Migration','Regression','Fallback','Provider outage']],
      ['Deployment',['API','Open weight','Local','Cloud GPU','Quantization','License','Privacy']],
      ['Strategy',['Frontier vs Small','Fast vs Deep','Router/Cascade','Specialist model','Fine-tuned model','Open vs Closed']]
    ]
  },
  {
    id:'community',order:'12',title:'Community · 사례 공유',icon:'○',summary:'Prompt만이 아니라 결과·재현 조건·검수 상태까지 공유.',href:'#/community',target:'growing',
    groups:[
      ['Submission',['Prompt','Result','Model','Version','Settings','Reproduction notes','Evidence','Media optional']],
      ['Moderation',['Clarity','Reproducibility','Quality','Accuracy','Safety','Learning value','Duplicate check']],
      ['State',['Pending','Published','Archived','Rejected','Re-review','Version history']],
      ['Trust',['Author','Evidence badge','Last verified','Eval result','Moderator note','Report/feedback']]
    ]
  }
];

export const QUICK_ENTRIES = [
  {title:'프롬프트가 잘 안 먹혀요',hint:'목표 → 예시 → 출력 형식 → 검증 순서',href:'#/failures?cat=prompt-context'},
  {title:'최신 정보가 필요해요',hint:'검색/RAG + 출처 + 최신성 확인',href:'#/recipes?cat=rag-grounding'},
  {title:'외부 앱을 연결하고 싶어요',hint:'Connector → MCP → Tool 권한 설계',href:'#/tools?view=mcp'},
  {title:'반복 업무를 재사용하고 싶어요',hint:'Prompt가 아니라 Skill로 패키징',href:'#/tools?view=skill'},
  {title:'자동으로 실제 작업을 시키고 싶어요',hint:'Tool calling → 승인 → Agent 순서',href:'#/recipes?cat=agent-architecture'},
  {title:'비용이 너무 많이 나와요',hint:'Quick → Cache → Router → Batch',href:'#/failures?cat=cost-performance'},
  {title:'결과가 맞는지 모르겠어요',hint:'Eval·Verification·Grounding',href:'#/failures?cat=evaluation-reliability'},
  {title:'DB·GitHub·Slack을 묶고 싶어요',hint:'MCP multi-server workflow',href:'#/tools?view=mcp&cat=workflows'}
];
