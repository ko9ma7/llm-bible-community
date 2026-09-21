window.LLM_BIBLE_DATA = {
  categories: ["전체", "기초", "프롬프트", "RAG", "평가", "비용·성능", "튜닝", "안전"],
  roadmap: [
    {step:"01", title:"LLM의 기본 구조", desc:"모델·컨텍스트·토큰·추론·도구 호출을 한 장으로 이해합니다.", ids:["mental-model"]},
    {step:"02", title:"프롬프트보다 평가", desc:"좋고 나쁨을 먼저 정의해야 프롬프트 개선이 재현됩니다.", ids:["eval-loop"]},
    {step:"03", title:"외부 지식은 RAG", desc:"최신·사내 지식은 파라미터가 아니라 검색 컨텍스트로 연결합니다.", ids:["rag-grounding"]},
    {step:"04", title:"비용과 지연 측정", desc:"토큰뿐 아니라 cache hit, TTFT, p95, task success를 함께 봅니다.", ids:["cost-latency"]},
    {step:"05", title:"필요할 때만 튜닝", desc:"LoRA·QLoRA·DPO는 서로 목적이 다릅니다. 문제 유형부터 구분합니다.", ids:["tuning-map"]},
    {step:"06", title:"안전은 별도 축", desc:"prompt injection·privacy·model safety를 성능 점수와 분리합니다.", ids:["safety-first"]}
  ],
  models: [
    {name:"OpenAI GPT-6 Astra", snapshot:"2026-09-03 공개", axis:"범용 reasoning · agentic 작업 · 안전 평가", ops:"P0 · 일일"},
    {name:"Anthropic Claude", snapshot:"Fable 5.1 · Opus 5 · Sonnet 5 · Haiku 4.5", axis:"긴 context · coding/agent · 가격 계층", ops:"P0 · 일일"},
    {name:"Google Gemini", snapshot:"Gemini 3.8 Flash stable 등", axis:"multimodal · agent · 속도/비용 계층", ops:"P0 · 일일"},
    {name:"Mistral", snapshot:"Medium 3.5 · Small 4 등", axis:"상용+open · coding/agent/multimodal", ops:"P0"},
    {name:"Qwen", snapshot:"Qwen3.5 계열", axis:"open-weight · multimodal · agent", ops:"P0"},
    {name:"DeepSeek", snapshot:"V4 계열 · V4.1 Flash 등", axis:"reasoning · 효율 · API/open 생태계", ops:"P0"},
    {name:"NAVER HyperCLOVA X", snapshot:"SEED 8B Omni 등", axis:"한국어 · 국내 활용 · multimodal", ops:"P0 Korea"}
  ],
  knowledge: [
    {
      id:"mental-model", category:"기초", tier:"A", badge:"Official", freshness:"2026-09-21", title:"LLM을 ‘모델 하나’로 보지 마세요", summary:"실제 서비스는 모델 + 컨텍스트 + 도구 + 평가 + 비용 + 안전의 조합입니다.",
      tags:["기초","아키텍처","초보"], applicability:"모든 LLM 앱", risk:"낮음",
      insight:"파라미터 수보다 capability, context, modality, deployment, pricing, license, verification date가 실제 선택에 더 직접적입니다.",
      before:"‘가장 좋은 모델’을 하나 고르고 모든 요청을 보낸다.",
      after:"작업 유형을 정의하고, 품질·비용·지연·안전 지표별로 모델/도구 조합을 평가한다.",
      evidence:"첨부 리서치의 2026-09 모델 지형 및 평가 설계 요약.", metrics:["quality","cost","latency","safety"], code:null
    },
    {
      id:"eval-loop", category:"평가", tier:"A", badge:"Official", freshness:"2026-09-21", title:"프롬프트 최적화 전에 성공 기준과 Eval부터", summary:"‘느낌상 좋아졌다’를 막는 가장 중요한 생산 환경 습관입니다.",
      tags:["eval","prompt","production"], applicability:"프롬프트·RAG·Agent 전반", risk:"낮음",
      insight:"Prompt + 적용 모델/버전 + 테스트셋 + 결과 + 비용 + 날짜를 한 단위로 관리해야 변경 효과를 재현할 수 있습니다.",
      before:"프롬프트 문장을 계속 바꾸며 몇 개 예시만 눈으로 확인한다.",
      after:"성공 기준 → 고정 테스트셋 → baseline 실행 → prompt 변경 → 품질/비용/지연 회귀 비교 순서로 실험한다.",
      evidence:"OpenAI/Anthropic 공식 프롬프트 가이드의 공통 패턴을 리서치에서 정리.", metrics:["accuracy / rubric","schema-valid %","cost / success","p50/p95"],
      code:`const run = {\n  promptVersion: "v12",\n  model: "model-id",\n  dataset: "support_eval_v3",\n  quality: 0.91,\n  costPerSuccess: 0.014,\n  verifiedAt: "2026-09-21"\n};`
    },
    {
      id:"structured-prompt", category:"프롬프트", tier:"A", badge:"Official", freshness:"2026-09-21", title:"역할·목표·컨텍스트·출력 형식을 분리하세요", summary:"마법 문장보다 구조와 검증 규칙이 중요합니다.",
      tags:["prompt","few-shot","structured output"], applicability:"분류·추출·리서치·자동화", risk:"중간",
      insight:"명확한 목적, 필요한 외부 문맥, few-shot examples, structured output을 분리하면 테스트와 재사용이 쉬워집니다.",
      before:"이 문서를 잘 읽고 중요한 내용을 알려줘.",
      after:"역할: 기술 리서치 분석가. 규칙: 제공된 source_id에서 확인되는 사실만 사용. 확인 불가 값은 null. 출력은 지정 JSON Schema를 따른다.",
      evidence:"첨부 리서치의 프롬프트 엔지니어링 패턴 표와 예시.", metrics:["constraint satisfaction","schema-valid %"],
      code:`[System / stable prefix]\n역할: 기술 리서치 분석가\n규칙:\n- source_id로 확인되는 사실만 사용\n- 확인 불가 값은 null\n\n[Dynamic context]\n{{retrieved_chunks}}\n\n[User]\n{{query}}`
    },
    {
      id:"cache-prefix", category:"비용·성능", tier:"A", badge:"Official", freshness:"2026-09-21", title:"Prompt Caching은 ‘같은 prefix’가 핵심", summary:"긴 정적 규칙과 공통 문맥을 앞쪽에, 사용자별 동적 입력을 뒤쪽에 배치합니다.",
      tags:["cache","tokens","latency"], applicability:"반복 요청이 많은 API 앱", risk:"중간",
      insight:"정적 지시·참고 데이터를 앞쪽에 고정하면 prefix 재사용이 쉬워집니다. 작은 수정이 앞부분에 생기면 cache hit가 깨질 수 있습니다.",
      before:"매 요청마다 시스템 규칙, 사용자 정보, 공통 문서, 질문 순서를 임의로 섞는다.",
      after:"[고정 시스템 규칙] → [공통 긴 문서] → [few-shot] → [사용자별 정보] → [질문] 순서로 prefix를 안정화한다.",
      evidence:"OpenAI·Gemini 공식 caching 문서의 공통 운영 패턴을 리서치에서 정리.", metrics:["cache-hit %","cached tokens","TTFT"], code:null
    },
    {
      id:"rag-grounding", category:"RAG", tier:"B", badge:"Original research + Official", freshness:"2026-09-21", title:"RAG는 ‘더 많이 넣기’가 아니라 ‘필요한 근거만 넣기’", summary:"검색된 문서 조각과 출처 ID를 컨텍스트로 제공하고, retrieval 품질과 답변 근거성을 따로 측정합니다.",
      tags:["RAG","retrieval","grounding"], applicability:"사내 지식·최신 정보·문서 QA", risk:"중간",
      insight:"RAG의 핵심은 외부 non-parametric retrieval memory와 모델을 결합하는 것입니다. top-k를 무조건 늘리면 토큰과 잡음이 증가할 수 있습니다.",
      before:"관련될 수도 있는 문서 30개를 통째로 프롬프트에 붙인다.",
      after:"질문 → retrieval → rerank/필터 → 근거 chunk + source_id → 답변 + citation → faithfulness 평가.",
      evidence:"RAG 원 논문 계보와 첨부 리서치의 production 최적화 표.", metrics:["retrieval recall","faithfulness","citation correctness","context tokens"], code:null
    },
    {
      id:"cost-latency", category:"비용·성능", tier:"A", badge:"Official + Open-source", freshness:"2026-09-21", title:"비용 최적화는 토큰 줄이기보다 넓습니다", summary:"모델 라우팅, caching, RAG top-k, 출력 길이, batch, self-host serving까지 분리해서 봅니다.",
      tags:["cost","latency","routing","vLLM"], applicability:"Production API·자체호스팅", risk:"중간",
      insight:"API 환경에서는 작은 모델 라우팅·prompt cache·출력 제어가 중요하고, 자체 호스팅에서는 continuous batching·KV/prefix caching·quantization이 큰 비중을 차지합니다.",
      before:"평균 토큰 수만 보고 비용 최적화를 판단한다.",
      after:"quality/$, cache hit, output tokens, TTFT, p95, req/s, GPU utilization을 작업 유형별로 추적한다.",
      evidence:"OpenAI/Gemini caching 문서와 vLLM/TensorRT-LLM/llama.cpp 관련 리서치 요약.", metrics:["quality/$","cache-hit %","TTFT","p95","req/s"], code:null
    },
    {
      id:"tuning-map", category:"튜닝", tier:"B", badge:"Original research", freshness:"2026-09-21", title:"LoRA · QLoRA · DPO는 같은 경쟁군이 아닙니다", summary:"무엇을 학습하고 어느 training stage에서 쓰는지 먼저 구분하세요.",
      tags:["LoRA","QLoRA","DPO","PEFT"], applicability:"도메인 적응·행동 조정·선호 최적화", risk:"중간",
      insight:"LoRA는 저랭크 adapter, QLoRA는 4-bit base + LoRA, DPO는 preference pair 기반 선호 최적화입니다.",
      before:"‘가장 좋은 파인튜닝 기법’을 하나 골라 모든 문제에 적용한다.",
      after:"도메인 지식/형식 학습인지, 메모리 제약인지, 선호 정렬인지 목적을 먼저 정의하고 training_stage와 objective를 분리한다.",
      evidence:"LoRA·QLoRA·DPO 원 논문 기반. 리서치에는 QLoRA가 원 논문 실험에서 65B 모델을 단일 48GB GPU로 미세조정했고 Prefix Tuning이 약 0.1% 수준의 파라미터를 학습했다고 정리되어 있습니다.", metrics:["trainable params","VRAM","task quality"], code:null
    },
    {
      id:"eval-matrix", category:"평가", tier:"C", badge:"Reproducible tooling", freshness:"2026-09-21", title:"평가는 하나의 종합 점수가 아니라 다축 구조로", summary:"quality, grounding, instruction following, safety, latency, cost, stability를 각각 봅니다.",
      tags:["benchmark","LM Evaluation Harness","SWE-bench"], applicability:"모델·RAG·Agent 비교", risk:"낮음",
      insight:"코드는 pass@k·tests passed, RAG는 recall·faithfulness, agent는 task completion·tool error rate처럼 작업에 맞는 metric을 사용합니다.",
      before:"벤치마크 점수 하나로 모델을 선택한다.",
      after:"업무 성공 기준과 연결된 metric set을 정의하고 vendor-reported / independent / reproduced_local을 구분한다.",
      evidence:"HELM, LM Evaluation Harness, SWE-bench 등 평가 프로젝트에 대한 첨부 리서치 정리.", metrics:["Exact Match / F1","faithfulness","schema-valid %","attack success rate","task completion"], code:null
    },
    {
      id:"safety-first", category:"안전", tier:"A", badge:"Standard / Official", freshness:"2026-09-21", title:"안전·보안은 성능 카드와 분리하세요", summary:"prompt injection, privacy, data security, agentic security를 독립적인 평가 영역으로 둡니다.",
      tags:["NIST","OWASP","prompt injection","privacy"], applicability:"사용자 데이터·도구 호출·Agent 시스템", risk:"높음",
      insight:"성능이 높아도 공격 성공률이나 데이터 노출 위험이 크면 production-ready라고 볼 수 없습니다.",
      before:"품질 점수가 높으면 안전성도 충분하다고 가정한다.",
      after:"모델 성능 eval과 별도로 prompt-injection success, data handling, tool permission, privacy 회귀 테스트를 운영한다.",
      evidence:"NIST AIRC/AI RMF, OWASP GenAI Security Project 및 모델 시스템 카드 관련 리서치 요약.", metrics:["attack success rate","policy violation rate","tool-error rate"], code:null
    },
    {
      id:"source-tiering", category:"기초", tier:"A", badge:"Research method", freshness:"2026-09-21", title:"공식성·최신성·재현성을 따로 표시하세요", summary:"‘공식 문서’라고 해서 독립 검증이 된 것은 아니고, ‘오래된 논문’이라고 해서 가치가 사라지는 것도 아닙니다.",
      tags:["source","evidence","freshness"], applicability:"리서치·지식베이스·모델 비교", risk:"낮음",
      insight:"Tier A 공식 자료, Tier B 원 논문, Tier C 관리되는 커뮤니티, Tier D 2차 자료로 역할을 분리하고 최신성은 별도 축으로 관리합니다.",
      before:"최신 글이면 신뢰도가 높다고 간주한다.",
      after:"source_tier + date_published + date_updated + observed_at + valid_from/to를 분리해 기록한다.",
      evidence:"첨부 리서치의 소스 계층과 최신성 관리 원칙.", metrics:["source tier","observed_at","validity window"], code:null
    }
  ]
};
