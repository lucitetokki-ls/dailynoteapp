export const actionCategories = [
  "diet_fitness",
  "vibe_coding",
  "writing",
  "organization",
  "relationships",
] as const;

export const dailyActionSlots = [
  "diet",
  "fitness",
  "vibe_coding",
  "writing",
  "organization",
  "relationships",
] as const;

export type ActionCategory = (typeof actionCategories)[number];
export type ActionStatus = "done" | "partial" | "skipped";
export type DailyActionSlot = (typeof dailyActionSlots)[number];

export type DailyAction = {
  id: string;
  dailyLogId: string;
  slot?: DailyActionSlot;
  category: ActionCategory;
  title: string;
  description: string;
  status: ActionStatus;
  satisfaction: number;
  reflection: string;
  createdAt: string;
  updatedAt: string;
};

const legacyCodingLabels = new Set(["coding", "vibe coding"]);
const legacyStudyLabels = new Set(["writing", "작문"]);

export function normalizeActionTitle(
  title: string,
  category: ActionCategory,
  slot?: DailyActionSlot | null,
) {
  const normalizedTitle = title.trim().toLowerCase();
  const isCodingAction = slot === "vibe_coding" || category === "vibe_coding";
  const isStudyAction = slot === "writing" || category === "writing";

  if (isCodingAction && legacyCodingLabels.has(normalizedTitle)) {
    return "코딩";
  }

  if (isStudyAction && legacyStudyLabels.has(normalizedTitle)) {
    return "공부";
  }

  return title;
}

export const slotMeta: Record<
  DailyActionSlot,
  {
    label: string;
    category: ActionCategory;
    description: string;
    actionPlaceholder: string;
    reflectionPlaceholder: string;
  }
> = {
  diet: {
    label: "식단",
    category: "diet_fitness",
    description: "오늘 지킨 식단 한 가지",
    actionPlaceholder: "오늘 식단에서 지킨 한 가지",
    reflectionPlaceholder: "이어갈 점, 고칠 점, 배운 점",
  },
  fitness: {
    label: "운동",
    category: "diet_fitness",
    description: "오늘 실행한 운동 한 가지",
    actionPlaceholder: "오늘 실행한 운동 한 가지",
    reflectionPlaceholder: "몸의 반응과 다음에 조정할 점",
  },
  vibe_coding: {
    label: "코딩",
    category: "vibe_coding",
    description: "오늘 진행한 코딩 학습/구현 한 가지",
    actionPlaceholder: "오늘 구현하거나 배운 한 가지",
    reflectionPlaceholder: "막힌 점, 해결한 점, 다음 시도",
  },
  writing: {
    label: "공부",
    category: "writing",
    description: "오늘 배운 내용 한 가지",
    actionPlaceholder: "오늘 공부하거나 배운 한 가지",
    reflectionPlaceholder: "이해한 점, 막힌 점, 다음에 복습할 점",
  },
  organization: {
    label: "정리",
    category: "organization",
    description: "오늘 닫은 열린 루프 한 가지",
    actionPlaceholder: "미뤄둔 일, 공간, 파일 중 정리한 한 가지",
    reflectionPlaceholder: "정리하고 달라진 점",
  },
  relationships: {
    label: "관계",
    category: "relationships",
    description: "오늘 관계를 위해 건넨 행동 한 가지",
    actionPlaceholder: "먼저 연락하거나 마음을 표현한 한 가지",
    reflectionPlaceholder: "상대와 나에 대해 느낀 점",
  },
};

export const categoryMeta: Record<
  ActionCategory,
  {
    label: string;
    shortLabel: string;
    description: string;
    tone: string;
  }
> = {
  diet_fitness: {
    label: "식단·운동",
    shortLabel: "건강",
    description: "식단, 운동, 컨디션 관리",
    tone: "emerald",
  },
  vibe_coding: {
    label: "코딩",
    shortLabel: "코딩",
    description: "코딩 학습과 구현",
    tone: "sky",
  },
  writing: {
    label: "공부",
    shortLabel: "공부",
    description: "독서, 강의, 복습과 학습 기록",
    tone: "rose",
  },
  organization: {
    label: "정리",
    shortLabel: "정리",
    description: "공간, 파일, 미뤄둔 일 정리",
    tone: "amber",
  },
  relationships: {
    label: "관계",
    shortLabel: "관계",
    description: "연락, 대화, 감사와 관계 행동",
    tone: "violet",
  },
};

export const statusMeta: Record<
  ActionStatus,
  {
    label: string;
    description: string;
  }
> = {
  done: {
    label: "완료",
    description: "완료",
  },
  partial: {
    label: "일부",
    description: "일부 진행",
  },
  skipped: {
    label: "건너뜀",
    description: "건너뜀",
  },
};
