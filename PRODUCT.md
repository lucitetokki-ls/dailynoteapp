---
name: Lucitetokki Daily Action Log
register: product
stage: personal production app
primary_user: solo daily operator
---

# Product Definition

Lucitetokki Daily Action Log is a private daily execution log. It is not a general todo app, habit tracker, calorie tracker, journal platform, or analytics dashboard.

The product answers one question:

> What did I actually do today, and what do I want to remember from it?

The app is built for one person who records daily actions across a small fixed set of growth areas. The product should reduce friction, preserve memory, and make recurring effort visible without turning the experience into guilt, gamification, or excessive tracking.

## Product Purpose

The app exists to support a daily loop:

1. Record today's fixed actions.
2. Write a short reflection.
3. Review recent rhythm.
4. Search or revisit past notes when needed.
5. Keep writing separately in a focused long-form space.

The product is about action and reflection, not performance pressure.

## Core Principles

- **Action over intention:** record what was actually done.
- **Reflection over analytics:** numbers are secondary; written memory is primary.
- **Fixed slots over open task lists:** the daily structure should stay small and predictable.
- **Low friction over completeness:** daily input should be fast enough to keep using.
- **Private utility over social features:** no feeds, sharing, likes, or public identity.
- **Personal operating system over generic tracker:** the interface should feel like a control panel for one person's routine.

## Target User

Primary user:

- A solo user who records personal growth actions every day.
- Comfortable with technical/productivity interfaces.
- Wants an app that feels disciplined and custom, not soft or generic.
- Uses both desktop and mobile.
- Cares about writing, coding practice, diet/fitness, and day-level reflection.

Context:

- Desktop is used for deeper review, writing, and management.
- Mobile is used for quick checking, input, and reading.
- The app may be used daily, so repeated-use ergonomics matter more than onboarding copy.

## Current Product Shape

### Today

The daily dashboard.

Purpose:

- Record one action per fixed slot.
- Write today's reflection.
- See basic slot completion at a glance.

Fixed slots:

- Diet
- Fitness
- Vibe Coding
- Writing summary

Important distinction:

- Today Writing is a short summary/reflection.
- Writing page is long-form composition.
- These should not be automatically merged.

### Review

The weekly rhythm view.

Purpose:

- Show the last 7 days of action density.
- Help the user notice rhythm, gaps, and category balance.
- Keep metrics supportive, not judgmental.

The review page should not make "did I record?" the main product thesis. Recording completeness is useful context, not the point of the app.

### Writing

The long-form writing workspace.

Purpose:

- Save one long-form writing entry per day.
- Keep the writing area clean and spacious.
- Avoid unnecessary tools or distractions.

Writing entries are intentionally separate from the short Today writing slot.

### Category

The category history page.

Purpose:

- Review past actions by category.
- Make each growth area easy to revisit.

### Calendar

The date-based memory surface.

Purpose:

- Browse actions and reflections by day.
- Show compact daily summaries.
- Allow full text viewing without stretching the whole layout.

### Search

The retrieval utility.

Purpose:

- Find past actions and reflections by text.
- Filter by category.
- Stay simple. Query plus category is enough for the current product.

### Settings

The configuration surface.

Purpose:

- Manage app setup and Supabase status.
- Stay protected behind a light password gate for personal use.

The current client-side password gate is convenience protection, not real authentication.

## Data Model

Primary entities:

- `daily_logs`: one row per day, including date and daily reflection.
- `daily_actions`: individual recorded actions, linked to a day.
- `weekly_reflections`: weekly notes and review text.
- `writing_entries`: daily long-form writing entries.
- templates/settings as needed.

Daily action fields should support:

- date
- slot
- category
- title or summary
- description
- satisfaction
- reflection
- timestamps

Historical compatibility may keep status fields, but the product UI should assume the user records completed actions only.

## UX Priorities

1. Fast daily input.
2. Reliable saving.
3. Clear separation between short daily notes and long writing.
4. Calendar and review surfaces that make history easy to inspect.
5. Mobile readability and tap comfort.
6. Search that helps retrieve memory without complex filters.

## UX Non-Goals

- Social sharing.
- Public profiles.
- Gamified streak pressure.
- Full task management.
- Complex habit scoring.
- Calorie, weight, or health analytics.
- Multi-user collaboration.
- Heavy onboarding.
- AI features that replace the user's own reflection.

## Voice And Copy

Tone:

- Direct.
- Quiet.
- Disciplined.
- Personal.
- Slightly technical.

Good copy:

- "행동의 흐름을 보는 보조 지도입니다."
- "작성 후 언제든 다시 수정할 수 있습니다."
- "검색어와 카테고리를 조금 넓혀서 다시 확인하세요."

Avoid:

- Motivational fluff.
- Shame-based language.
- Over-explaining obvious controls.
- Marketing-style hero copy.

## Success Criteria

The app is successful if:

- The user can record a day in under a minute.
- The user can comfortably write long-form text in the Writing page.
- Past entries are easy to find by date, category, or search.
- Mobile feels like the same product as desktop, not a degraded fallback.
- The design feels custom, disciplined, and recognizable.
- Metrics support reflection without becoming the main reason to use the app.

## Future Product Directions

Possible extensions:

- Better export/backup flows.
- Private authentication if the app becomes more sensitive.
- Weekly or monthly reflection summaries.
- Optional AI-assisted summarization after the user writes first.
- Better mobile nav grouping if the route count grows.
- Richer writing archive and date navigation.

Do not add these until the daily recording loop remains fast and stable.
