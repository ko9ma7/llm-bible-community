# Administrator Setup

## 왜 일반 admin 테이블에 비밀번호를 넣지 않나

프론트가 GitHub Pages이므로 브라우저 코드에 DB 비밀번호나 Supabase secret key(legacy `service_role` 포함)를 넣을 수 없습니다. 관리자 credential은 Supabase Auth가 관리하고, `profiles.role`은 권한 정보만 보관합니다.

## 최초 관리자 만들기

1. Supabase Authentication에서 이메일/비밀번호 사용자를 생성합니다.
2. `supabase/schema.sql`이 실행되어 profile row가 만들어졌는지 확인합니다.
3. SQL Editor에서:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@example.com');
```

4. 사이트 `#/admin`에서 이메일/비밀번호로 로그인합니다.

## 관리자 결정

- 공개 승인: 미디어를 `published-media`로 이동하고 `published` 처리
- 보관만: 미디어를 private `submission-inbox`에 유지하고 `archived` 처리
- 폐기: 미디어를 Storage에서 삭제하고 `rejected` 처리
- 모든 결정은 `moderation_events`에 남음

## 권장 운영

- 관리자 계정에는 강한 고유 비밀번호 사용
- 가능하면 Supabase Auth MFA/2FA 기능 적용
- 공유 PC에서 관리자 로그인 유지 금지
- 정기적으로 `moderation_events`와 rejected 항목 retention 정책 점검
