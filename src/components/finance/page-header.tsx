import { Badge } from "@/components/ui/badge";

export function PageHeader({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">{description}</p>
      </div>
      {badge ? <Badge variant="secondary">{badge}</Badge> : null}
    </div>
  );
}
