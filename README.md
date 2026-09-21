# LLM Bible Community v2.3.0

**LLM Bible**은 초보자가 AI/LLM의 기본을 배우고, 실제 Prompt·Skill·MCP·Agent 패턴을 복사해 적용하고, 실패 원인과 평가 방법까지 연결해서 볼 수 있는 **근거 중심 지식베이스 + 검수형 Prompt → Result 커뮤니티**입니다.

이번 v2.3.0은 2026-09-21 심층 리서치를 웹서비스 데이터 구조로 반영하고, 네트워크 부담을 줄이기 위해 **카테고리 우선 lazy loading**과 **복사 중심 UX**를 추가했습니다.

## Research corpus

정적 GitHub Pages에서도 즉시 탐색할 수 있지만, 1MB가 넘는 전체 corpus를 첫 화면에서 한 번에 받지 않습니다. 원본은 `research-source/research-corpus.json`에 보존하고, 배포용 데이터는 `public/data/` 아래의 **작은 catalog + 카테고리 shard + 검색 index**로 자동 분리합니다.

- **Prompt examples 240개** — 12개 패턴 × 20개 업무 상황
- **Skill / Plugin patterns 120개**
- **MCP / Agent recipes 50개**
- **Common failure patterns 30개**
- **Primary / original sources 41개**
- **18단계 초보→운영 커리큘럼**
- **Quick / Precise / Grounded / Deep / Agent / Safe 6개 작업 모드**
- 업무별 Evaluation metric 11개 그룹
- 최신성 재검증 정책 9개 그룹

### Category-first loading

```text
첫 접속
→ data/catalog.js (~28 KB)

Prompt 메뉴
→ 카테고리만 표시
→ Instruction 선택 시 data/prompts/instruction.json (~56 KB)만 로드

전체 검색 입력
→ data/index/prompts.json (~92 KB) 추가 로드
```

Prompt 12개 패턴, Skill 12개 업무 영역, Recipe 7개 상위 유형, Failure 6개 문제 영역으로 먼저 분류합니다. `npm run data` 또는 `npm run build`가 canonical corpus를 자동으로 shard로 재생성합니다.

### Copy-ready UX

상세 화면에서 다음 값은 별도 편집 없이 바로 복사할 수 있습니다.

- Prompt: 전체 Prompt / Quick Mode / 검증법 / JSON / 전체 패키지
- `{{variable}}`이 있는 Prompt: 변수값 입력 → 최종 Prompt 복사
- Skill: `SKILL.md` / Sample Prompt / JavaScript / Python / JSON
- Recipe: Prompt / 단계 / Architecture / Verification / JSON
- Failure: 수정안 / 예방책 / Test·Eval / 전체 체크 / JSON
- Community: Prompt / Result / Prompt+Result

개별 benchmark가 없는 응용 예시는 `measurement_status = "unspecified — 로컬 eval 필요"`로 표시합니다. 공식 가이드의 일반 패턴과 특정 Prompt의 실제 성능 향상을 같은 주장으로 취급하지 않습니다.

각 Prompt 상세 화면에는 다음을 제공합니다.

```text
언제 쓰는가 / 언제 쓰지 않는가
Bad → Better → Best
복사 가능한 Prompt
왜 좋아지는가
예상 출력
Quick Mode
자주 실패하는 형태
검증 방법
Evidence / Source
Last verified
```

전체 리서치 원문도 배포본에 포함됩니다.

```text
public/research/deep-research-report-2026-09-21.md
```

> WebP/WebM은 **사용자 커뮤니티 업로드를 위한 저장 인프라**일 뿐, LLM 지식 리서치 카테고리에는 포함하지 않습니다.

## Information architecture

```text
시작
├─ 18단계 학습
├─ Task-first navigation
└─ Quick / Precise / Grounded / Deep / Agent / Safe

프롬프트
├─ Instruction
├─ System message
├─ Few-shot
├─ Structured output
├─ RAG grounded
├─ Agent / tool
├─ Reasoning scaffold
├─ Quick mode
├─ Long context
├─ Safety filter
├─ Verification
└─ Multi-stage

스킬·MCP
├─ Prompt Template
├─ Agent Skill
├─ Function Tool
├─ Hosted Tool
├─ MCP stdio
├─ MCP remote
└─ MCP App

레시피
├─ RAG
├─ Coding
├─ Research
├─ Operations
├─ Router / Specialist
├─ Planner / Executor / Verifier
└─ Safety

실패·점검
├─ 30개 Anti-pattern
├─ 1분 체크리스트
└─ Progressive optimization ladder

Community
├─ 검수된 사례
├─ 새 사례 제출
├─ 내 제출
└─ 관리자 검수
```

## Existing Supabase project connection

이 프로젝트는 이전에 제공된 예시 서비스에서 사용하던 **동일한 Supabase 프로젝트의 browser-safe Project URL + Publishable Key**를 기본 연결값으로 재사용하도록 구성했습니다.

따라서 별도로 URL/key를 다시 입력하지 않아도 다음은 동작할 수 있습니다.

- Supabase Auth endpoint 연결
- 이메일/비밀번호 회원가입
- 이메일/비밀번호 로그인
- 브라우저 세션 유지

다만 이전 예시 프로젝트에는 LLM Bible 전용 테이블이 없으므로 아래는 **최초 1회 설치**해야 합니다.

- `profiles`
- `submissions`
- `submission_media`
- `moderation_events`
- `prompt_examples`
- `skills`
- `agent_recipes`
- `failure_patterns`
- `sources`
- `eval_runs`
- `security_checks`
- Storage/RLS
- 관리자 역할
- moderation Edge Function

기존 예시 프로젝트의 데이터는 삭제하거나 변경하지 않습니다. LLM Bible은 별도 테이블을 추가합니다.

## 가장 먼저 실행할 것

Windows에서는 프로젝트 폴더에서:

```cmd
backend-bootstrap.cmd
```

이 스크립트가 다음을 안내합니다.

```text
기존 Supabase 프로젝트 연결 확인
→ GitHub Actions에 browser-safe Supabase 값 동기화
→ schema.sql 클립보드 복사 + SQL Editor 열기
→ research_seed.sql 클립보드 복사 + SQL Editor 열기
→ Auth Redirect URL 확인
→ 관리자 사용자 생성/선택
→ profiles.role = admin 승격 SQL
→ moderate-submission Edge Function 배포 시도
```

**SQL Editor에서 Run 버튼을 누르는 단계와 관리자 계정 비밀번호 설정은 Supabase Dashboard 권한이 필요하므로 자동으로 우회하지 않습니다.**

그 다음 상태 확인:

```cmd
verify-backend.cmd
```

정상이면 대략 다음처럼 보입니다.

```text
[OK] Supabase Auth endpoint is reachable.
[OK] LLM Bible schema is installed.
[OK] Research seed data is present.
```

그리고 배포:

```cmd
redeploy-pages.cmd
```

또는 처음 Repository 설정까지 다시 할 경우:

```cmd
github-bootstrap.cmd
```

## Auth Redirect URL

동일 Supabase 프로젝트를 여러 사이트가 사용할 수 있으므로 기존 Redirect URL을 지우지 마세요. 아래를 **추가**합니다.

```text
https://ko9ma7.github.io/llm-bible-community/**
```

회원가입 확인 메일의 `emailRedirectTo`도 LLM Bible의 `#/account`로 설정되어 있습니다.

## Administrator

관리자 비밀번호를 일반 DB 테이블에 저장하지 않습니다.

```text
Supabase Auth
  └─ 이메일 / 비밀번호 credential

public.profiles
  └─ role = user | admin
```

관리자 사용자를 Auth에 만든 뒤 SQL Editor에서:

```sql
insert into public.profiles(id, display_name, role)
select id,
       coalesce(nullif(raw_user_meta_data->>'display_name',''), split_part(email,'@',1), '관리자'),
       'admin'
from auth.users
where email = 'ADMIN_EMAIL'
on conflict(id) do update set role = 'admin';
```

관리자 페이지:

```text
https://ko9ma7.github.io/llm-bible-community/#/admin
```

관리자는 각 사용자 제출을 다음 6개 축으로 검수합니다.

- 명확성
- 재현성
- 결과 품질
- 정확성
- 안전성
- 학습 가치

그리고 공개 / 보관 / 폐기를 결정합니다.

## Community upload storage

사용자 사례의 예시 이미지는 WebP, 영상은 WebM으로 정규화해 저장합니다. 이것은 **콘텐츠 연구 주제가 아니라 운영상의 저장 정책**입니다.

```text
사용자 제출
→ submission-inbox (private)
→ 관리자 검수
   ├─ publish → published-media
   ├─ archive → private 유지
   └─ reject → Storage object 삭제 + audit log
```

## DB seed

정적 데이터는 GitHub Pages에서 바로 읽기 때문에 DB가 없어도 지식 라이브러리는 보입니다. 운영 중 관리자/자동 업데이트를 위해 동일 corpus를 DB에도 넣을 수 있습니다.

```text
supabase/research_seed.sql
```

이 SQL은 재실행 가능한 upsert 형태입니다.

## Local development

```bash
npm ci
npm run dev
```

Build:

```bash
npm run build
```

검사 항목에는 corpus 최소 개수, Prompt 필수 필드, secret-like token, GitHub Pages CSS/ES-module 구조가 포함됩니다.

## GitHub Pages

`main`에 push하면:

```text
npm ci
→ npm run build
→ dist artifact
→ GitHub Pages deploy
```

라우팅은 Hash route를 사용합니다.

```text
#/home
#/learn
#/prompts
#/tools
#/recipes
#/failures
#/community
#/submit
#/account
#/admin
```

## Project structure

```text
/
├─ src/
│  ├─ main.js
│  ├─ styles.css
│  └─ lib/
│     ├─ repository.js
│     ├─ supabase.js
│     ├─ media.js
│     └─ utils.js
├─ public/
│  ├─ data/
│  │  ├─ research-corpus.js
│  │  └─ research-corpus.json
│  ├─ research/
│  │  └─ deep-research-report-2026-09-21.md
│  ├─ assets/
│  ├─ manifest.webmanifest
│  └─ 404.html
├─ supabase/
│  ├─ schema.sql
│  ├─ research_seed.sql
│  └─ functions/moderate-submission/index.ts
├─ scripts/
│  ├─ build.mjs
│  ├─ check.mjs
│  ├─ public-defaults.mjs
│  ├─ verify-backend.ps1
│  ├─ backend-bootstrap.ps1
│  └─ github-bootstrap.ps1
├─ backend-bootstrap.cmd
├─ verify-backend.cmd
├─ redeploy-pages.cmd
├─ github-bootstrap.cmd
└─ package.json
```

## Security

브라우저에는 **Project URL + Publishable Key**만 들어갑니다. 이는 RLS와 함께 사용하는 공개용 연결 정보입니다.

절대 브라우저/Repository에 넣지 않는 값:

- `sb_secret_...`
- legacy `service_role`
- Database password
- GitHub PAT
- 관리자 비밀번호

자세한 내용은 [`SECURITY.md`](./SECURITY.md)를 참고하세요.

## Production notes

- 정적 corpus는 항상 표시되며 Supabase 장애와 분리됩니다.
- Auth만 연결되고 schema가 없으면 로그인은 되지만 업로드/관리자 기능에는 설치 안내가 표시됩니다.
- 기존 Auth 사용자가 schema 설치 전에 생성됐더라도 로그인 후 normal-user profile을 bootstrap할 수 있습니다.
- Prompt/모델 변경은 같은 eval set으로 회귀 평가하는 것을 기본 원칙으로 둡니다.
- P0 operational docs는 6~72시간 단위로 다시 확인하고, foundational paper는 훨씬 느린 주기로 관리합니다.

## License

코드는 MIT License 기준으로 사용할 수 있습니다. 사용자 제출 콘텐츠의 라이선스/이용약관은 실제 공개 운영 전에 별도로 확정하세요.

## Category-sized DB seed helper

The public site does **not** need the research corpus mirrored into Supabase; it reads the small static catalog and category JSON shards directly. If you also want the research corpus in DB, use `seed-category.cmd` instead of pasting the old ~1 MB seed at once.

`seed-category.cmd` first asks for `Sources / Prompts / Skills / Recipes / Failures`, then copies only one selected SQL shard (normally about 2–80 KB) to the clipboard and opens the connected Supabase SQL Editor. Apply `00-sources.sql` first. Every part uses `ON CONFLICT DO UPDATE`, so it is safe to re-run.

This separation is intentional: **base UI → category index → selected category detail** for the browser, and **schema → source registry → selected category seed** for the optional DB mirror.


## v2.2.1 업데이트

- Prompt 240
- Skill / Plugin 120
- MCP / Tool starter 72
- Recipe 50
- Failure Pattern 30
- Source 41
- `setup-permissions.cmd`: DB schema, Auth Redirect, user/admin 권한 설정 안내
- 전체 지도는 접기/펼치기 구조로 변경되어 큰 taxonomy도 빠르게 탐색 가능

로그인은 되는데 `public.submissions`가 없다는 오류가 나오면 `setup-permissions.cmd`를 먼저 실행하세요.
