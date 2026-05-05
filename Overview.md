# 📘 Personal Daily Action Log App - Overview

## 1. 🎯 프로젝트 목적

이 프로젝트는 단순한 기록 앱이 아니라,

> **“오늘 내가 성장에 도움이 되는 행동을 했는가?”를 관리하는 개인 운영 시스템**이다.

수치(체중, 칼로리 등) 중심이 아니라
**행동(Action) + 회고(Reflection)** 중심으로 설계한다.

---

## 2. 🧩 핵심 컨셉

* 기록보다 **행동**
* 데이터보다 **일관성**
* 분석보다 **회고**

### 관리 카테고리 (3개)

1. **diet_fitness** — 다이어트 / 운동
2. **vibe_coding** — 바이브코딩 학습
3. **writing** — 작문 / 글쓰기

---

## 3. 🏗️ 앱 구조

### 주요 페이지

```
/ (Today)
- 오늘 행동 기록
- 카테고리별 액션 리스트
- 오늘 회고

/review
- 최근 7일 행동 요약
- 카테고리별 수행률
- 주간 회고

/category
- 특정 카테고리 행동 히스토리

/settings
- 템플릿 / 기본 세팅
```

---

## 4. 🗃️ 데이터 구조 (Supabase)

### 1) daily_logs

```sql
- id (uuid)
- date (date)
- daily_mood (text)
- daily_reflection (text)
- created_at
- updated_at
```

---

### 2) daily_actions

```sql
- id (uuid)
- daily_log_id (uuid)
- category (text) 
    -- diet_fitness | vibe_coding | writing

- title (text)
- description (text)

- status (text)
    -- done | partial | skipped

- satisfaction (int) 
    -- 1 ~ 5

- reflection (text)

- created_at
- updated_at
```

---

## 5. ⚙️ 기술 스택

### Frontend

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* shadcn/ui

### Backend

* Supabase

  * PostgreSQL DB
  * Auth (추후)
  * Realtime (옵션)

### 기타

* Chart 라이브러리 (추후)
* OpenAI API (추후: 회고 요약)

---

## 6. 🧱 폴더 구조

```
app/
├─ page.tsx              # Today
├─ review/page.tsx
├─ category/page.tsx
├─ settings/page.tsx

components/
├─ ActionCard.tsx
├─ ActionForm.tsx
├─ DailyReflection.tsx
├─ CategorySection.tsx

lib/
├─ supabase.ts
├─ utils.ts
├─ score.ts

types/
├─ daily-log.ts
├─ daily-action.ts
```

---

## 7. 🔄 핵심 사용자 흐름

### Daily Flow

```
1. Today 페이지 진입
2. 오늘 행동 추가
3. 상태 체크 (done / partial / skipped)
4. 간단한 메모 작성
5. 하루 마무리 시 회고 작성
```

---

### Weekly Flow

```
1. Review 페이지 진입
2. 최근 7일 행동 확인
3. 카테고리별 수행률 확인
4. 주간 회고 작성
```

---

## 8. 🤖 바이브코딩 가이드라인

### 기본 원칙

* 작은 단위로 나눠서 구현
* UI → 기능 → 데이터 순으로 개발
* 완벽한 구조보다 **빠른 실행** 우선

---

### 프롬프트 작성 기준

항상 다음을 포함:

* 기술 스택 명시
* 기능 범위 제한
* UI 요구사항 (모바일 우선)
* 컴포넌트 분리 요청

---

### 예시 프롬프트

```
Next.js App Router, TypeScript, Tailwind, Supabase를 사용해서
Today 페이지를 만들어줘.

기능:
- 오늘 날짜의 action list 조회
- 새로운 action 추가
- 카테고리별 그룹화 (diet_fitness, vibe_coding, writing)
- 상태 변경 (done / partial / skipped)

UI:
- 모바일 우선
- 카드 형태 리스트
- shadcn 스타일

코드는 components로 분리해줘.
```

---

## 9. 🚀 개발 단계 (로드맵)

### 1단계 (MVP)

* Today 페이지
* action CRUD
* Supabase 연결

---

### 2단계

* Review 페이지
* 최근 7일 요약

---

### 3단계

* 카테고리 필터링
* UI 개선

---

### 4단계 (확장)

* AI 회고 요약
* 행동 추천
* 알림 기능

---

## 10. ⚠️ 중요한 설계 원칙

### ❌ 하지 말 것

* 처음부터 복잡한 테이블 설계
* 과도한 기능 추가
* 완벽한 UX 집착

---

### ✅ 반드시 지킬 것

* 입력은 1분 이내
* 클릭 중심 UX
* 매일 사용 가능해야 함

---

## 11. 🧠 이 앱의 본질

이 앱은 기록 도구가 아니라:

> **“행동 → 회고 → 개선” 루프를 만드는 시스템**

이다.

---

## 12. 📌 핵심 한 줄 정의

> **“오늘 나는 제대로 살았는가?”를 체크하는 앱**
