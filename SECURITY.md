# Security Model — LLM Bible v2.1.1

LLM Bible의 프론트는 공개 GitHub Pages입니다. 브라우저에 들어가는 모든 값은 방문자에게 보일 수 있다는 전제로 설계합니다.

## 공개 가능한 연결값

- Supabase Project URL
- Supabase Publishable Key
- GitHub Pages URL

이 프로젝트는 기존 예시 서비스에서 사용하던 동일 Supabase 프로젝트의 이 browser-safe 값을 재사용합니다.

## 절대 커밋하지 않는 값

- Supabase Secret key (`sb_secret_...`)
- legacy `service_role` key
- Database password
- GitHub Personal Access Token
- 관리자 비밀번호
- private encryption key

## Authentication

사용자와 관리자는 Supabase Auth 이메일/비밀번호 인증을 사용합니다.

- 세션은 Supabase client가 브라우저 storage에 유지
- 회원가입 확인 redirect는 LLM Bible `#/account`
- 기존 프로젝트를 함께 사용하므로 기존 Redirect URL은 유지하고 LLM Bible URL을 추가

## Authorization

- Postgres RLS 사용
- `profiles.role`은 user/admin 권한만 저장
- 클라이언트의 admin 주장만으로 권한을 부여하지 않음
- 관리자 Edge Function이 사용자 JWT + DB role을 다시 검증
- 정적 research corpus는 공개 정보
- 커뮤니티 pending 데이터는 사용자 본인/관리자만 접근

## Curated research corpus

정적 seed 예시는 공식 패턴을 응용한 데이터입니다. 독립 benchmark가 없는 항목은 `로컬 eval 필요`로 표시해 검증 수준을 과장하지 않습니다.

공식/원 연구/커뮤니티 discovery를 서로 다른 evidence tier로 관리합니다.

## Tool / MCP / Agent safety principles

- least privilege
- read-before-write
- destructive/write/send/payment 작업은 확인 절차
- tool result를 system instruction으로 승격하지 않음
- max steps / retry budget / cost budget
- secret / PII 검출
- prompt injection 경계

## Community media isolation

WebP/WebM은 사용자 업로드 운영 정책입니다.

- 검수 전: `submission-inbox` private
- 승인 후: `published-media` public
- 공개 해제: private 회수
- 폐기: Storage API를 통한 object 삭제

## Abuse controls

기본 DB trigger는 사용자당 시간당 제출 수를 제한합니다. 실제 대규모 공개 운영에서는 추가로 CAPTCHA/Turnstile, Edge rate limiting, 신고/appeal, malware scanning, 관리자 MFA를 권장합니다.
