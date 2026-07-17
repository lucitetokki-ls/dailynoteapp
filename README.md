# Lucitetokki Daily Action Log

개인용 데일리 실행 기록 앱입니다. 일반적인 할 일 관리나 습관 점수판이 아니라, 하루에 실제로 한 행동과 짧은 회고를 남기는 데 초점을 둡니다.

## 현재 구성

- **Today**: 식단, 운동, 코딩, 공부, 정리, 관계 여섯 개 고정 슬롯 기록
- **Review**: 최근 7일 슬롯 밀도, 일별 흐름, 주간 회고
- **Writing**: 날짜별 제목과 본문을 저장하는 1일 1작문 리치 에디터, 제목형 최근 목록과 전체 글 팝업
- **Category**: 카테고리별 기록 히스토리
- **Calendar**: 월간 날짜 기반 기록 탐색
- **Search**: 행동 내용, 짧은 회고, 오늘 회고 검색
- **Settings**: Supabase 상태 확인, 샘플 데이터, 백업/복원, 삭제 작업

## 실행

```bash
npm install
npm run dev:local
```

브라우저에서 `http://localhost:3000`을 엽니다.

Windows에서는 `Run Daily Note App.bat`을 실행해도 됩니다. 이 배치 파일은 Node.js/npm 확인, 현재 앱에 필요한 의존성 설치, 기존 `localhost:3000` 서버 감지, `.env.local` 안내, 브라우저 열기를 처리한 뒤 개발 서버를 시작합니다.

## 주요 명령

```bash
npm run dev
npm run dev:local
npm run lint
npm run build
npm run check
npm run start
```

## 환경 변수

Supabase 동기화를 사용하려면 `.env.local`에 아래 값을 설정합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

기존 anon key를 쓰는 프로젝트라면 `NEXT_PUBLIC_SUPABASE_ANON_KEY`도 호환됩니다. `NEXT_PUBLIC_` 값은 브라우저에 노출되므로 `service_role` 또는 secret key는 넣지 않습니다.

값이 없으면 앱은 브라우저 `localStorage`만 사용합니다. 값이 있으면 로컬 저장 후 Supabase로 동기화합니다.

## 데이터 저장

기본 저장 흐름은 로컬 우선입니다.

1. 입력 즉시 `localStorage`에 저장
2. Supabase 설정이 있으면 원격 테이블에 upsert
3. 원격 저장 실패 시 로컬 기록은 유지

사용 테이블은 `supabase/schema.sql`에 정의되어 있습니다.

- `daily_logs`
- `daily_actions`
- `weekly_reflections`
- `daily_writings`
- `action_templates`

`daily_writings`는 `title`과 기존 `content` 호환 필드, `content_markdown`, `content_json`을 저장합니다. 리치 에디터 화면은 JSON을 우선 사용하고, Markdown은 백업/이전 데이터 호환용으로 유지합니다.

`schema.sql`은 필수 테이블, 인덱스, updated_at 트리거, RLS, anon/authenticated 접근 정책을 함께 설정합니다. 현재 앱은 별도 사용자 인증 없이 브라우저에서 직접 저장하므로 정책이 개인용 공개 쓰기 구조입니다. 실제 계정별 보안을 붙일 때는 사용자 소유 컬럼과 인증 기반 RLS 정책으로 교체해야 합니다. Settings의 Supabase 진단에서 읽기와 임시 쓰기/삭제를 확인할 수 있습니다.

## 제품 원칙

- 고정 슬롯 중심: 열린 할 일 목록보다 반복 가능한 여섯 개 기록 칸을 우선합니다.
- 기록은 압박보다 회고용입니다.
- Today는 공부 행동을 짧게 기록하고, Writing 페이지는 긴 글쓰기에 집중합니다.
- 모바일은 빠른 입력, 데스크톱은 리뷰와 작성에 맞춥니다.
- Settings의 암호 게이트는 개인용 편의 장치이며 실제 인증이 아닙니다.

## 문서

- `PRODUCT.md`: 제품 정의와 비목표
- `DESIGN.md`: 디자인 시스템과 UI 원칙
- `supabase/schema.sql`: 원격 저장소 스키마
