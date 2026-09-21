import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'research-source', 'research-corpus.json');
const outRoot = path.join(root, 'public', 'data');
const data = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

const rmTargets = ['prompts','skills','recipes','failures','index'];
for (const name of rmTargets) fs.rmSync(path.join(outRoot, name), { recursive: true, force: true });
fs.mkdirSync(outRoot, { recursive: true });
for (const name of rmTargets) fs.mkdirSync(path.join(outRoot, name), { recursive: true });

const writeJson = (file, value) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value));
};
const slug = (value) => String(value || '')
  .toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'other';

const skillDescriptions = {
  Software: 'PR 리뷰, 테스트 생성, 버그 재현, 리팩터링 등 소프트웨어 개발 작업',
  Research: '웹·논문 조사, 출처 검증, 비교 연구와 반대 근거 탐색',
  Documents: 'PDF·계약서·정책·표 등 문서 기반 작업',
  Data: 'CSV profiling, SQL 분석, KPI 진단과 데이터 검증',
  Operations: '장애 triage, runbook, SLO, 백업 검증 등 운영 업무',
  Security: 'Prompt injection, secret, 권한, 정책 점검 등 보안 업무',
  Support: '티켓 분류, KB 검색, 답변 초안, escalation',
  Content: 'SEO, 브랜드 톤, 번역 QA, 콘텐츠 검토',
  Business: 'RFP, 영업 브리프, CRM, 제안서 업무',
  Product: 'PRD, acceptance criteria, 실험 설계, 제품 검토',
  Connectors: 'GitHub, Jira, Slack, DB, Figma 등 외부 시스템 연결',
  Education: '학습 계획, 설명, 퀴즈, 개념 검증 등 교육 작업'
};

const recipeGroups = [
  { id:'rag-grounding', label:'RAG · Grounding', description:'검색, rerank, 근거 기반 답변과 citation 검증', categories:['RAG','Documents/RAG'] },
  { id:'coding-software', label:'Coding · Software', description:'GitHub issue, PR, 코드 수정, 테스트와 마이그레이션', categories:['Coding Agent','Software','Coding'] },
  { id:'research-data', label:'Research · Data', description:'리서치, 데이터 분석, 문서 분석과 근거 검증', categories:['Research','Research Agent','Data Agent','Data','Documents'] },
  { id:'workflow-ops', label:'Workflow · Operations', description:'업무 자동화, 운영, 비즈니스, 지원 프로세스', categories:['Workflow','Operations','Automation','Business','Content','Support'] },
  { id:'agent-architecture', label:'Agent Architecture', description:'Planner/Executor, Router/Specialist, reliability 구조', categories:['Agent Architecture','Agent Optimization','Agent Reliability'] },
  { id:'optimization-eval', label:'Optimization · Evaluation', description:'비용 라우팅, 품질 평가, 관측성과 운영 지표', categories:['Optimization','Evaluation','Observability'] },
  { id:'security-safety', label:'Security · Safety', description:'고위험 행동, 권한, 승인, injection 방어', categories:['Security','Safety','High-risk Agent'] }
];

const failureGroups = [
  { id:'prompt-context', label:'Prompt · Context', description:'지시 충돌, 과도한 역할극, 긴 context와 모델 변화', ids:['failure-01','failure-03','failure-12','failure-14','failure-15','failure-16'] },
  { id:'rag-grounding', label:'RAG · Grounding', description:'검색 노이즈, chunking, embedding, citation과 환각', ids:['failure-04','failure-17','failure-18','failure-19','failure-20','failure-21'] },
  { id:'tools-agents', label:'Tools · Agents', description:'tool schema, loop, idempotency, 과도한 agent 구성', ids:['failure-05','failure-06','failure-24','failure-25','failure-26','failure-27'] },
  { id:'cost-performance', label:'Cost · Performance', description:'reasoning/tool 비용 폭증과 cache miss', ids:['failure-08','failure-09'] },
  { id:'evaluation-reliability', label:'Evaluation · Reliability', description:'검증 없는 튜닝, judge bias, benchmark mismatch, observability', ids:['failure-10','failure-11','failure-13','failure-28','failure-29','failure-30'] },
  { id:'security-permission', label:'Security · Permission', description:'Prompt injection, 과도한 권한, secret/admin 신뢰 문제', ids:['failure-02','failure-07','failure-22','failure-23'] }
];

// Prompt shards: one file per canonical prompt pattern.
const promptCategories = [];
for (const pattern of data.patterns || []) {
  const items = (data.prompts || []).filter(x => x.pattern_id === pattern.id || x.pattern === pattern.name);
  const file = `data/prompts/${pattern.id}.json`;
  writeJson(path.join(root, 'public', file), items);
  promptCategories.push({
    id: pattern.id,
    label: pattern.name,
    count: items.length,
    difficulty: pattern.difficulty,
    description: pattern.purpose,
    evidence: pattern.evidence,
    file
  });
}
const promptIndex = (data.prompts || []).map(x => ({
  id:x.id, slug:x.slug, title:x.title, intent:x.intent, pattern:x.pattern, pattern_id:x.pattern_id,
  domain:x.domain, difficulty:x.difficulty, measurement_status:x.measurement_status, last_verified:x.last_verified,
  shard:`data/prompts/${x.pattern_id}.json`
}));
writeJson(path.join(outRoot,'index','prompts.json'), promptIndex);

// Skill shards: one file per skill domain.
const skillCategories = [];
for (const domain of [...new Set((data.skills || []).map(x => x.domain))].sort()) {
  const id = slug(domain);
  const items = (data.skills || []).filter(x => x.domain === domain);
  const file = `data/skills/${id}.json`;
  writeJson(path.join(root,'public',file), items);
  skillCategories.push({ id, label:domain, count:items.length, description:skillDescriptions[domain] || `${domain} 업무용 Skill 패턴`, file });
}
const skillIndex = (data.skills || []).map(x => ({
  id:x.id, slug:x.slug, name:x.name, purpose:x.purpose, domain:x.domain, kind:x.kind, difficulty:x.difficulty,
  evidence_level:x.evidence_level, last_verified:x.last_verified, shard:`data/skills/${slug(x.domain)}.json`
}));
writeJson(path.join(outRoot,'index','skills.json'), skillIndex);

// Recipe shards: grouped into stable beginner-facing categories.
const recipeCategories = [];
for (const group of recipeGroups) {
  const items = (data.recipes || []).filter(x => group.categories.includes(x.category));
  const file = `data/recipes/${group.id}.json`;
  writeJson(path.join(root,'public',file), items);
  recipeCategories.push({ id:group.id, label:group.label, count:items.length, description:group.description, file, source_categories:group.categories });
}
const knownRecipe = new Set(recipeGroups.flatMap(g => g.categories));
const leftovers = (data.recipes || []).filter(x => !knownRecipe.has(x.category));
if (leftovers.length) {
  const file='data/recipes/other.json'; writeJson(path.join(root,'public',file),leftovers);
  recipeCategories.push({id:'other',label:'Other Recipes',count:leftovers.length,description:'기타 실전 workflow',file,source_categories:[...new Set(leftovers.map(x=>x.category))]});
}
function recipeShard(category){
  const g=recipeGroups.find(g=>g.categories.includes(category)); return g ? `data/recipes/${g.id}.json` : 'data/recipes/other.json';
}
const recipeIndex=(data.recipes||[]).map(x=>({id:x.id,slug:x.slug,title:x.title,problem:x.problem,category:x.category,difficulty:x.difficulty,last_verified:x.last_verified,shard:recipeShard(x.category)}));
writeJson(path.join(outRoot,'index','recipes.json'),recipeIndex);

// Failure shards: explicit stable grouping.
const failureCategories=[];
for(const group of failureGroups){
  const set=new Set(group.ids); const items=(data.failures||[]).filter(x=>set.has(x.id));
  const file=`data/failures/${group.id}.json`; writeJson(path.join(root,'public',file),items);
  failureCategories.push({id:group.id,label:group.label,count:items.length,description:group.description,file});
}
const failureById=new Map(failureGroups.flatMap(g=>g.ids.map(id=>[id,g.id])));
const failureIndex=(data.failures||[]).map(x=>({id:x.id,title:x.title,symptom:x.symptom,root_cause:x.root_cause,last_verified:x.last_verified,shard:`data/failures/${failureById.get(x.id)||'prompt-context'}.json`}));
writeJson(path.join(outRoot,'index','failures.json'),failureIndex);

writeJson(path.join(outRoot,'sources.json'), data.sources || []);

const catalog = {
  meta: data.meta,
  modes: data.modes,
  curriculum: data.curriculum,
  patterns: data.patterns,
  comparisons: data.comparisons,
  models: data.models,
  eval_metrics: data.eval_metrics,
  freshness_policy: data.freshness_policy,
  source_tiers: data.source_tiers,
  collections: {
    prompts: { total:(data.prompts||[]).length, index:'data/index/prompts.json', categories:promptCategories },
    skills: { total:(data.skills||[]).length, index:'data/index/skills.json', categories:skillCategories },
    recipes: { total:(data.recipes||[]).length, index:'data/index/recipes.json', categories:recipeCategories },
    failures: { total:(data.failures||[]).length, index:'data/index/failures.json', categories:failureCategories },
    sources: { total:(data.sources||[]).length, file:'data/sources.json' }
  }
};
writeJson(path.join(outRoot,'catalog.json'), catalog);
fs.writeFileSync(path.join(outRoot,'catalog.js'), `window.LLM_BIBLE_CATALOG = Object.freeze(${JSON.stringify(catalog)});\n`);

const manifest = {
  generated_at: new Date().toISOString(), snapshot: data.meta?.snapshot || null,
  counts: { prompts:(data.prompts||[]).length, skills:(data.skills||[]).length, recipes:(data.recipes||[]).length, failures:(data.failures||[]).length, sources:(data.sources||[]).length },
  loading_strategy: 'catalog-first + category shards + search indexes',
  collections: catalog.collections
};
writeJson(path.join(outRoot,'MANIFEST.json'), manifest);

// Legacy monoliths are source-only now; never ship them to the public folder.
fs.rmSync(path.join(outRoot,'research-corpus.js'), {force:true});
fs.rmSync(path.join(outRoot,'research-corpus.json'), {force:true});

console.log(`Corpus shards generated: ${manifest.counts.prompts} prompts, ${manifest.counts.skills} skills, ${manifest.counts.recipes} recipes, ${manifest.counts.failures} failures.`);
