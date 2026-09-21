# Administrator Setup — v2.1.1

## 구조

관리자 ID/비밀번호는 일반 테이블에 직접 저장하지 않습니다.

- Credential: Supabase Auth
- 권한: `public.profiles.role`
- 관리자 판단 이력: `public.moderation_events`
- 관리자 실제 처리: `moderate-submission` Edge Function

브라우저가 `role=admin`이라고 주장하는 값을 신뢰하지 않고 서버 함수가 현재 사용자와 DB role을 다시 확인합니다.

## 기존 Supabase 프로젝트 사용

이 프로젝트는 이전 예시 서비스와 같은 Supabase 프로젝트의 browser-safe 연결값을 재사용합니다. 기존 테이블을 지우지 않고 LLM Bible 전용 스키마만 추가합니다.

### 1. `backend-bootstrap.cmd`

실행하면 `supabase/schema.sql`을 클립보드에 넣고 해당 프로젝트 SQL Editor를 엽니다. 붙여넣고 **Run**을 누릅니다.

### 2. Research seed — 카테고리별 선택 적재

정적 웹은 DB mirror 없이도 모든 리서치 데이터를 카테고리 JSON shard에서 읽습니다. DB에도 보관하고 싶을 때만 `seed-category.cmd`를 실행하세요.

먼저 `Sources` 41개를 1회 적용한 뒤, 다음 그룹에서 필요한 파트만 선택합니다.

- Prompt Library: 12개 파트 × 20개
- Skills / Plugins: 12개 파트 × 10개
- MCP / Agent Recipes: 7개 파트
- Failure / Troubleshooting: 6개 파트

한 번에 약 2~80KB 정도만 클립보드로 복사되어 Supabase SQL Editor에서 실행할 수 있습니다. 모든 SQL은 재실행 가능한 upsert 방식입니다. 기존 `supabase/research_seed.sql`은 전체 백업/일괄 적재용으로만 남겨 둡니다.

### 3. Auth Redirect URL

기존 설정을 삭제하지 말고 다음 URL을 추가합니다.

```text
https://ko9ma7.github.io/llm-bible-community/**
```

### 4. 관리자 Auth 사용자

Supabase `Authentication → Users`에서 관리자 이메일 사용자를 생성하거나 사이트 `#/account`에서 회원가입합니다.

### 5. 관리자 승격

```sql
insert into public.profiles(id, display_name, role)
select id,
       coalesce(nullif(raw_user_meta_data->>'display_name',''), split_part(email,'@',1), '관리자'),
       'admin'
from auth.users
where email = 'ADMIN_EMAIL'
on conflict(id) do update set role = 'admin';
```

### 6. Edge Function

```bash
npx supabase@latest login
npx supabase@latest functions deploy moderate-submission --project-ref YOUR_PROJECT_REF
```

`backend-bootstrap.cmd`도 이 배포를 자동으로 시도합니다.

## 관리자 검수 기준

각 제출은 1~5점으로:

1. 명확성
2. 재현성
3. 결과 품질
4. 정확성
5. 안전성
6. 학습 가치

를 기록합니다.

처리:

- `publish`: 공개
- `archive`: 비공개 보관
- `reject`: 폐기

모든 결정은 `moderation_events`에 기록합니다.

## 확인

```cmd
verify-backend.cmd
```

그 후:

```text
https://ko9ma7.github.io/llm-bible-community/#/account
https://ko9ma7.github.io/llm-bible-community/#/admin
```

---

## v2.2 이메일 인증 상태

회원가입 직후 로그인에서 `Email not confirmed`가 나오면 계정 생성은 되었지만 이메일 확인 링크를 아직 클릭하지 않은 상태입니다.

1. 가입한 이메일의 받은편지함과 스팸함을 확인합니다.
2. Supabase가 보낸 인증 메일의 확인 링크를 누릅니다.
3. `/#/account`로 돌아와 같은 이메일/비밀번호로 로그인합니다.
4. 메일이 오지 않으면 계정 화면의 **인증 메일 다시 보내기**를 사용합니다.

개발 중 이메일 인증을 완전히 끄는 방식은 운영 정책과 보안 수준을 낮출 수 있으므로 기본값으로 자동 변경하지 않습니다.
