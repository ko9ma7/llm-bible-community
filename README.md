# LLM Bible Community

초보자가 AI/LLM을 개념부터 실제 사례까지 학습할 수 있도록 만든 **근거 중심 지식베이스 + 검수형 Prompt → Result 커뮤니티**입니다.

정적 ES module 프론트는 GitHub Pages에 배포하고, 인증·DB·Storage·관리자 검수는 Supabase를 사용합니다. 이미지와 영상은 업로드 전에 브라우저에서 각각 **WebP / WebM**으로 정규화합니다.

## 핵심 흐름

```text
회원가입 / 로그인
  ↓
Prompt + Result + Model + 재현 메모 + 예시 미디어 작성
  ↓
브라우저에서 이미지 → WebP / 영상 → WebM 변환
  ↓
Supabase private bucket: submission-inbox
  ↓
관리자 검수: 명확성 / 재현성 / 결과 품질 / 안전성 / 학습 가치
  ├─ 공개 → published-media로 이동 + 커뮤니티 노출
  ├─ 보관 → private 상태 유지
  └─ 폐기 → 미디어 삭제 + 감사 로그 유지
```

## Features

- 리서치 기반 초보자 LLM 지식 라이브러리
- 회원가입 / 이메일·비밀번호 로그인
- 일반 회원 Prompt → Result 사례 제출
- 이미지 WebP 리사이즈·메타데이터 제거
- 영상 WebM 변환(MediaRecorder + Canvas, 브라우저 내 처리)
- Pending / Published / Archived / Rejected 상태 관리
- 관리자 전용 검수 Desk
- 관리자 5개 기준 점수 + 검수 메모
- 공개 승인 전 private Storage
- 공개 승인 시 public Storage 이동
- 공개 → 보관 변경 시 다시 private Storage 회수
- 폐기 시 실제 미디어 파일 삭제
- `moderation_events` 감사 로그
- Supabase RLS + Auth 기반 권한
- 사용자별 한 시간 최대 5건 제출 DB guard
- GitHub Pages / Actions 자동 배포
- GitHub About / Homepage / Topics / Variables 자동 설정 CMD
- 반응형 / 다크모드 / 즐겨찾기 / SEO / OG / PWA / 404

## Architecture

```text
GitHub Pages (static ES module frontend)
         │
         ├─ Supabase Auth
         ├─ Postgres + RLS
         ├─ Storage
         │   ├─ submission-inbox (private)
         │   └─ published-media (public)
         └─ Edge Function
             └─ moderate-submission
```

관리자 비밀번호를 `admins` 같은 일반 테이블에 평문으로 저장하지 않습니다. 이메일/비밀번호 credential은 **Supabase Auth**가 DB-backed 방식으로 안전하게 관리하고, `public.profiles.role = 'admin'`에는 권한만 저장합니다.

## Local Development

```bash
npm install
copy .env.example .env   # Windows CMD
# 또는: cp .env.example .env
npm run dev
```

`.env`:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_SITE_URL=http://localhost:5173
VITE_REPO_NAME=llm-bible-community
```

브라우저 번들에 들어가는 값이므로 **publishable key만** 사용합니다. Supabase secret key(legacy `service_role` 포함), DB password, GitHub PAT는 넣지 마세요.

## Backend Setup

### 1. Supabase project

Supabase 프로젝트를 하나 생성합니다.

### 2. Schema

Supabase `SQL Editor`에서 [`supabase/schema.sql`](./supabase/schema.sql)을 실행합니다.

이 SQL이 생성하는 주요 데이터:

- `profiles`
- `submissions`
- `submission_media`
- `moderation_events`
- `submission_intake_events` (삭제 우회가 어려운 durable rate-limit 기록)
- private `submission-inbox` bucket
- public `published-media` bucket
- RLS policies
- 신규 회원 profile trigger
- rate-limit trigger

### 3. Administrator

먼저 관리자용 사용자를 `Authentication → Users`에서 생성하거나 사이트에서 회원가입합니다.

그 후 SQL Editor에서 한 번 실행합니다.

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'admin@example.com'
);
```

관리자 로그인 화면의 **ID는 이 이메일**이며 비밀번호는 Supabase Auth가 관리합니다.

### 4. Edge Function

Supabase CLI로 배포합니다. npm을 사용할 경우 CLI는 프로젝트/일회성 실행 방식이므로 `npx`를 사용합니다.

```bash
npx supabase@latest login
npx supabase@latest functions deploy moderate-submission --project-ref YOUR_PROJECT_REF
```

Scoop/Homebrew 등으로 Supabase CLI를 전역 설치했다면 `supabase functions deploy ...` 형태도 사용할 수 있습니다. `supabase/config.toml`에는 이 함수의 JWT 검증을 켜 두었습니다.

또는 GitHub Secrets에 아래를 넣고 `Deploy Supabase moderation function` workflow를 수동 실행할 수 있습니다.

```text
SUPABASE_ACCESS_TOKEN
SUPABASE_PROJECT_ID
```

### 5. Auth URL settings

Supabase `Authentication → URL Configuration`에서 배포 URL을 Site URL / Redirect URLs에 추가합니다.

예:

```text
https://USERNAME.github.io/llm-bible-community/
```

## Windows one-click setup

### Git + Repository + Pages

압축을 푼 폴더에서:

```cmd
github-bootstrap.cmd
```

자동 처리:

```text
Git / Node / npm / GitHub CLI 확인
→ GitHub 로그인 확인
→ 실제 Pages URL 계산
→ npm install / check / build
→ Repository 생성 또는 재사용
→ About / Homepage / Topics 설정
→ GitHub Actions Variables 설정
→ Commit / Push
→ GitHub Pages Actions 방식 활성화
→ Deploy workflow 실행
→ v2.0.0 Release 생성
```

기존 원격 `main`에 커밋이 있어도 force push를 사용하지 않고 히스토리를 병합합니다.

### Supabase backend assistant

```cmd
backend-bootstrap.cmd
```

처리:

```text
.env 확인
→ schema.sql 클립보드 복사
→ Supabase SQL Editor 열기
→ 관리자 계정 생성 페이지 열기
→ admin 승격 SQL 클립보드 복사
→ Supabase CLI가 있으면 Edge Function 배포
```

Supabase DDL/관리자 credential은 publishable browser key로 안전하게 자동 생성할 수 없으므로 최초 1회 SQL 실행과 관리자 계정 생성 단계는 Dashboard 권한으로 진행합니다.

## GitHub Pages deployment

`main`에 push하면 `.github/workflows/deploy.yml`이:

```text
npm ci
→ npm run build
→ dist 업로드
→ GitHub Pages 배포
```

모든 로컬 asset은 상대 경로를 사용하며 라우팅은 Hash route(`#/...`)라 project Pages 하위 경로와 새로고침 404 문제를 피합니다.

## Moderation statuses

| 상태 | 공개 여부 | 미디어 위치 | 의미 |
|---|---|---|---|
| `pending` | 비공개 | `submission-inbox` | 검수 대기 |
| `published` | 공개 | `published-media` | 승인됨 |
| `archived` | 비공개 | `submission-inbox` | 보관만 |
| `rejected` | 비공개 | 삭제 | 폐기 |

## Media policy

- 최대 5개
- 이미지 원본 최대 20 MB
- 영상 원본 최대 120 MB
- 영상 최대 90초
- 이미지 저장 형식: `image/webp`
- 영상 저장 형식: `video/webm`
- 이미지 long edge 최대 1920 px
- WebP quality 기본 0.84
- Storage bucket 자체도 MIME을 `image/webp`, `video/webm`으로 제한
- 공개 승인 시 Edge Function이 파일 magic signature(WebP RIFF/WEBP, WebM EBML)를 다시 확인

영상 변환은 Canvas + MediaRecorder를 이용해 브라우저에서 실시간으로 WebM을 다시 인코딩합니다. 브라우저가 WebM MediaRecorder를 지원하지 않으면 업로드를 중단하고 안내합니다. 오디오 보존은 브라우저의 `captureStream()` 지원 여부에 따라 달라질 수 있으므로, 영상+오디오를 반드시 보존해야 하는 운영 환경이나 대용량 서비스에서는 서버/Cloud transcoding queue로 이전하는 편이 좋습니다.

## Security

자세한 내용은 [`SECURITY.md`](./SECURITY.md)를 참고하세요.

중요:

- `VITE_SUPABASE_PUBLISHABLE_KEY`는 브라우저 공개용
- 2026년 Supabase의 권장 키 체계를 따라 브라우저는 publishable key, 서버는 secret key를 사용합니다. Edge Function은 `@supabase/server`가 플랫폼의 키 환경변수를 자동 사용합니다.
- legacy `anon` / `service_role` 키를 프론트 코드에 넣지 않습니다.
- admin password는 Supabase Auth가 관리
- RLS로 제출물/미디어 접근 분리
- 공개 미디어와 검수 미디어 bucket 분리
- Edge Function이 관리자 role을 서버에서 다시 확인

## Project Structure

```text
/
├─ src/
│  ├─ main.js
│  ├─ styles.css
│  ├─ config.js
│  └─ lib/
│     ├─ media.js
│     ├─ repository.js
│     ├─ supabase.js
│     └─ utils.js
├─ public/
│  ├─ data/knowledge.js
│  ├─ assets/
│  ├─ manifest.webmanifest
│  ├─ robots.txt
│  ├─ sitemap.xml
│  ├─ 404.html
│  └─ .nojekyll
├─ supabase/
│  ├─ schema.sql
│  └─ functions/moderate-submission/index.ts
├─ scripts/
│  ├─ check.mjs
│  ├─ github-bootstrap.ps1
│  └─ backend-bootstrap.ps1
├─ .github/workflows/
│  ├─ deploy.yml
│  └─ deploy-edge-function.yml
├─ github-bootstrap.cmd
├─ backend-bootstrap.cmd
├─ .env.example
├─ index.html
└─ package.json
```

## Future production upgrades

공개 사용자가 많아지면 다음을 권장합니다.

- CAPTCHA / Turnstile
- Edge rate limiting
- 악성 파일 scanner
- 서버측 media transcode queue
- 신고/숨김/appeal workflow
- 관리자 2FA 강제
- 별도의 canonical technique / source / claim 데이터 모델과 커뮤니티 사례 연결
- 정기 backup / retention policy

## License

프로젝트 코드에는 MIT License를 적용할 수 있습니다. 사용자 업로드 콘텐츠의 이용 조건은 운영 전 Terms / Content License 정책을 별도로 확정하세요.


## Repository Social Preview

`public/assets/repository-social-preview.png`를 준비해 두었습니다. GitHub는 Repository Social Preview 이미지 업로드를 `gh repo edit`로 자동 설정하는 공개 CLI 옵션을 제공하지 않으므로, 저장소 `Settings → General → Social preview`에서 이 파일을 한 번 업로드하세요. About description, homepage, topics, issues 설정은 `github-bootstrap.cmd`가 자동 처리합니다.
