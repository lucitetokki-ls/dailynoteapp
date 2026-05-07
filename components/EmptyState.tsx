import { CircleDashed } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state survey-card rounded-lg border border-dashed border-zinc-300 bg-white/70 p-6 text-zinc-600 sm:p-8">
      <div className="empty-state-icon" aria-hidden="true">
        <CircleDashed size={20} />
      </div>
      <div className="min-w-0">
        <p className="empty-state-title">{title}</p>
        <p className="empty-state-description">{description}</p>
      </div>
    </div>
  );
}
