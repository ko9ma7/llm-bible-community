# Administrator Setup — v2.2.1

## 가장 쉬운 방법

프로젝트 루트에서:

```cmd
setup-permissions.cmd
```

을 실행하세요. 기존 `backend-bootstrap.cmd`도 같은 스크립트를 호출합니다.

## 왜 현재 `public.submissions` 오류가 나오는가

로그인은 Supabase Auth에서 이미 성공했습니다. 하지만 LLM Bible 전용 테이블(`submissions`, `submission_media`, `moderation_events` 등)이 같은 Supabase 프로젝트에 아직 설치되지 않았습니다.

`setup-permissions.cmd`가 `supabase/schema.sql`을 클립보드에 복사하고 SQL Editor를 엽니다. 붙여넣고 **Run**하면 됩니다. 스키마는 업그레이드를 위해 재실행 가능하게 작성되어 있습니다.

## 권한 모델

- `user`: 공개 자료 읽기, 사례 제출, 자신의 제출 상태 조회
- `admin`: user 기능 + 전체 검수 큐 + 공개/보관/폐기

Credential/password는 Supabase Auth가 관리합니다. `public.profiles.role`에는 역할만 저장합니다.

## 관리자 승격

CMD가 이메일을 물어보고 아래 SQL을 자동 생성합니다.

```sql
insert into public.profiles(id, display_name, role)
select id,
       coalesce(nullif(raw_user_meta_data->>'display_name',''), split_part(email,'@',1), '관리자'),
       'admin'
from auth.users
where email='YOUR_EMAIL'
on conflict(id) do update set role='admin';
```

실행 후 사이트에서 로그아웃 → 로그인하면 `권한 admin`으로 표시됩니다.

## Auth URL

Supabase Dashboard → Authentication → URL Configuration

```text
Site URL
https://ko9ma7.github.io/llm-bible-community/

Redirect URL
https://ko9ma7.github.io/llm-bible-community/**
```

기존 서비스가 같은 Supabase 프로젝트를 쓴다면 기존 Redirect URL은 삭제하지 말고 위 URL을 추가합니다.

오래된 인증 메일의 localhost 링크는 수정되지 않습니다. 설정 저장 후 새 인증 메일을 재전송해야 합니다.

## Edge Function

관리자의 공개/보관/폐기 처리는 `moderate-submission` Edge Function을 사용합니다. CMD에서 배포를 선택하거나 수동으로:

```bash
npx supabase@latest login
npx supabase@latest functions deploy moderate-submission --project-ref YOUR_PROJECT_REF
```

## 연구 데이터 DB mirror

웹 지식 데이터는 정적 JSON shard에서 바로 동작합니다. DB에도 넣고 싶을 때만 `seed-category.cmd`를 사용합니다.

- Sources 41
- Prompt 240
- Skills / Plugins 120
- MCP / Tool starters 72
- Recipes 50
- Failures 30

카테고리별 SQL로 나눠져 있어 한 번에 전체를 넣지 않아도 됩니다.
