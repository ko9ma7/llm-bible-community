# Security Model

LLM Bible의 프론트는 공개 GitHub Pages입니다. 브라우저에 필요한 값은 방문자에게 보일 수 있다는 전제로 설계합니다.

## 공개 가능한 값

- Supabase Project URL
- Supabase Publishable key
- 배포 URL

## 절대 커밋하지 않는 값

- Supabase secret key (`sb_secret_...`) 또는 legacy `service_role` key
- Database password
- GitHub Personal Access Token
- 관리자 비밀번호
- private encryption key

## Authentication

일반 사용자와 관리자는 Supabase Auth를 사용합니다. 비밀번호는 프로젝트의 일반 테이블에 직접 저장하지 않습니다. 관리자 권한은 `profiles.role = 'admin'`으로 별도 관리합니다.

## Authorization

- Postgres RLS 활성화
- 일반 사용자는 자기 pending submission만 생성/삭제 가능
- 공개 페이지는 `published`만 조회
- private Storage는 UID top-level folder로 제한
- 관리자 검수 Edge Function은 access token의 사용자를 확인한 뒤 DB에서 `admin` role을 재검증
- secret key(또는 legacy `service_role`)는 Edge Function 런타임에만 존재

## Media isolation

- 검수 전: `submission-inbox` private bucket
- 승인 후: `published-media` public bucket
- 공개 항목을 보관으로 변경하면 다시 private bucket으로 회수
- 폐기하면 Storage object 삭제

## Abuse controls

DB trigger가 계정당 1시간 5건 제출 제한을 적용합니다. 대규모 공개 서비스에서는 이것만으로 충분하지 않으므로 CAPTCHA/Turnstile, Edge rate limiting, 파일 malware scanning을 추가하세요.

## User content

프롬프트/결과에는 API key, 개인정보, 회사 비밀, 저작권 침해 콘텐츠를 넣지 않도록 UI에서 고지합니다. 관리자는 공개 전 이를 확인해야 합니다.
