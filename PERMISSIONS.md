# LLM Bible 권한 설정

## 현재 화면의 `public.submissions` 오류

이 오류는 로그인 문제가 아니라 **LLM Bible 전용 DB 스키마가 아직 Supabase 프로젝트에 설치되지 않았다는 뜻**입니다.

프로젝트 루트에서 `setup-permissions.cmd`를 실행하세요. 스크립트가 `supabase/schema.sql`을 클립보드에 복사하고 Supabase SQL Editor를 엽니다. SQL을 붙여넣고 **Run**을 누르면 `profiles`, `submissions`, `submission_media`, `moderation_events` 및 RLS/Storage 정책이 설치됩니다.

## 사용자 권한

- `user`: 공개 자료 읽기, 사례 제출, 자기 제출 상태 조회
- `admin`: 위 기능 + 전체 검수 큐 조회 + 공개/보관/폐기 결정

비밀번호는 `public.profiles`에 저장하지 않습니다. Supabase Auth가 관리하고, `profiles.role`에는 `user/admin` 역할만 저장합니다.

## 관리자 승격

`setup-permissions.cmd`에서 관리자 이메일을 입력하면 실행할 SQL을 자동으로 복사합니다. 수동으로 할 경우:

```sql
insert into public.profiles(id, display_name, role)
select id,
       coalesce(nullif(raw_user_meta_data->>'display_name',''), split_part(email,'@',1), '관리자'),
       'admin'
from auth.users
where email='YOUR_EMAIL'
on conflict(id) do update set role='admin';
```

실행 후 사이트에서 로그아웃 → 다시 로그인하세요.

## 이메일 인증 링크가 localhost로 가는 경우

Supabase Dashboard → Authentication → URL Configuration에서:

```text
Site URL
https://ko9ma7.github.io/llm-bible-community/

Redirect URL
https://ko9ma7.github.io/llm-bible-community/**
```

을 추가/저장하세요. 다른 서비스가 같은 Supabase 프로젝트를 쓰고 있다면 기존 Redirect URL은 삭제하지 마세요.

이미 발송된 `localhost` 링크는 바뀌지 않으므로 URL 설정 후 **새 인증 메일을 재전송**해야 합니다.
