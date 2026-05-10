# Daily Note App Overview

## 목적

Lucitetokki Daily Action Log는 매일 반복해서 확인할 4개 슬롯을 빠르게 적고, 회고와 만족도를 함께 남기는 개인 기록 앱입니다. 체중이나 칼로리 같은 정량 관리보다 "오늘 실제로 한 행동"과 "다음에 이어갈 힌트"를 남기는 흐름에 맞춰져 있습니다.

## 현재 화면

- `/`: 오늘 기록. 날짜 이동, 오늘 회고, 4개 고정 슬롯, Supabase 저장 상태를 제공합니다.
- `/review`: 최근 7일 흐름, 슬롯별 기록 현황, 주간 회고를 확인합니다.
- `/writing`: 날짜별 긴 글/메모를 WYSIWYG 리치 에디터로 작성하고 Markdown 호환 데이터도 함께 유지합니다.
- `/category`: 카테고리별 기록 이력을 훑어봅니다.
- `/calendar`: 월간 기록 밀도와 선택 날짜 기록을 봅니다.
- `/search`: 행동 내용, 회고, 상태를 검색합니다.
- `/settings`: Supabase 상태/진단, 샘플 데이터, 백업/복원, 삭제 작업을 관리합니다.

## 데이터 모델

Supabase 스키마는 `supabase/schema.sql`에 모아 둡니다.

- `daily_logs`: 날짜별 일일 회고
- `daily_actions`: 날짜에 연결된 4개 슬롯 행동
- `weekly_reflections`: 주간 회고
- `daily_writings`: 날짜별 긴 글. `content`, `content_markdown`, `content_json`을 함께 저장합니다.
- `action_templates`: 액션 템플릿

앱은 먼저 `localStorage`에 저장한 뒤 Supabase 설정이 있으면 원격에도 동기화합니다. 원격 저장은 네트워크성 실패를 재시도하고, 날짜/슬롯 unique 충돌은 기존 행 갱신으로 복구합니다.

## Supabase 현황

- 브라우저에는 `NEXT_PUBLIC_SUPABASE_URL`과 publishable/anon key만 둡니다.
- `service_role` 또는 secret key는 클라이언트 환경 변수에 넣지 않습니다.
- 현재 RLS 정책은 개인용 익명 쓰기 구조입니다.
- 실제 계정별 보안을 붙일 때는 사용자 소유 컬럼과 인증 기반 RLS 정책으로 교체해야 합니다.
- Settings의 Supabase 진단은 필수 테이블 읽기와 임시 쓰기/삭제를 확인합니다.

## 기술 구성

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase JS
- lucide-react 아이콘
- Tiptap rich text editor
- react-markdown + remark-gfm

## 운영 메모

- `npm run dev`: 개발 서버
- `npm run dev:local`: `localhost:3000` 고정 개발 서버
- `npm run lint`: ESLint
- `npm run build`: 타입체크와 프로덕션 빌드
- `npm run check`: lint와 build 연속 검증
- `Run Daily Note App.bat`: Windows 로컬 실행용 배치 파일. 의존성, 기존 서버, `.env.local` 상태를 확인합니다.

## 다음 보완 후보

- Settings의 브라우저 `prompt/alert/confirm`을 앱 내부 모달로 교체
- Supabase RLS를 실제 사용자 인증 기반으로 전환
- 모바일에서 주요 입력 흐름과 설정 진단 화면을 추가 점검
- 백업 파일 구조 검증을 더 엄격하게 강화
- Writing 리치 에디터에 이미지/표 같은 고급 블록을 추가할지 검토
