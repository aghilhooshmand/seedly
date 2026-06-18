import { formatRelative } from "@/lib/utils";
import { label, type Locale } from "@/lib/labels";
import { FileText, Flag, AlertCircle } from "lucide-react";

type Activity = {
  id: string;
  titleEn: string;
  titleFa: string | null;
  detail: string | null;
  type: string;
  createdAt: Date;
};

export function ActivityFeed({
  activities,
  locale,
}: {
  activities: Activity[];
  locale: Locale;
}) {
  if (activities.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-emerald-200 px-4 py-8 text-center text-sm text-emerald-800/60">
        —
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {activities.map((a) => (
        <li key={a.id} className="flex gap-3 rounded-xl border border-emerald-50 bg-white p-4 shadow-sm">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            {a.type === "MILESTONE" ? <Flag className="h-4 w-4" /> : a.type === "SETBACK" ? <AlertCircle className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          </span>
          <div>
            <p className="font-medium text-emerald-950">{label(locale, a.titleEn, a.titleFa)}</p>
            {a.detail && <p className="mt-1 text-sm text-emerald-800/60">{a.detail}</p>}
            <p className="mt-1 text-xs text-emerald-700/50">{formatRelative(a.createdAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
