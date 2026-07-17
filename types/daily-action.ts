export const actionCategories = [
  "diet_fitness",
  "vibe_coding",
  "writing",
] as const;

export const dailyActionSlots = ["diet", "fitness", "vibe_coding", "writing"] as const;

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

export const slotMeta: Record<
  DailyActionSlot,
  {
    label: string;
    category: ActionCategory;
    description: string;
  }
> = {
  diet: {
    label: "식단",
    category: "diet_fitness",
    description: "오늘 지킨 식단 한 가지",
  },
  fitness: {
    label: "운동",
    category: "diet_fitness",
    description: "오늘 실행한 운동 한 가지",
  },
  vibe_coding: {
    label: "Vibe Coding",
    category: "vibe_coding",
    description: "오늘 진행한 코딩 학습/구현 한 가지",
  },
  writing: {
    label: "작문",
    category: "writing",
    description: "오늘 쓴 글 또는 문장 한 가지",
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
    label: "Vibe Coding",
    shortLabel: "Coding",
    description: "바이브코딩 학습과 실험",
    tone: "sky",
  },
  writing: {
    label: "Writing",
    shortLabel: "Writing",
    description: "작문, 메모, 글쓰기 루틴",
    tone: "rose",
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
