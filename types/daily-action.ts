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

export function normalizeActionTitle(
  title: string,
  category: ActionCategory,
  slot?: DailyActionSlot | null,
) {
  const isCodingAction = slot === "vibe_coding" || category === "vibe_coding";

  return isCodingAction && legacyCodingLabels.has(title.trim().toLowerCase()) ? "코딩" : title;
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
    label: "작문",
    category: "writing",
    description: "오늘 쓴 글 또는 문장 한 가지",
    actionPlaceholder: "오늘 쓴 글이나 문장 한 가지",
    reflectionPlaceholder: "잘 풀린 점과 다음에 이어 쓸 점",
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
    label: "Diet / Fitness",
    shortLabel: "Fitness",
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
    label: "Writing",
    shortLabel: "Writing",
    description: "작문, 메모, 글쓰기 루틴",
    tone: "rose",
  },
  organization: {
    label: "Organization",
    shortLabel: "정리",
    description: "공간, 파일, 미뤄둔 일 정리",
    tone: "amber",
  },
  relationships: {
    label: "Relationships",
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
    label: "Done",
    description: "완료",
  },
  partial: {
    label: "Partial",
    description: "일부 진행",
  },
  skipped: {
    label: "Skipped",
    description: "건너뜀",
  },
};
