import Link from "next/link";
import { ArrowLeft, ArrowRight, Calendar, Share2 } from "lucide-react";
import { label, type Locale } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

type SeedCardProps = {
  id: string;
  title: string;
  progress: number;
  status: string;
  theme: { nameEn: string; nameFa: string; color: string };
  currentStage?: string | null;
  shared?: boolean;
  ownerName?: string;
  locale: Locale;
};

export function SeedCard({
  id,
  title,
  progress,
  status,
  theme,
  currentStage,
  shared,
  ownerName,
  locale,
}: SeedCardProps) {
  const Arrow = locale === "fa" ? ArrowLeft : ArrowRight;

  return (
    <Link
      href={`/seeds/${id}`}
      className="group block rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.color }} />
            <span className="text-xs font-medium uppercase tracking-wide text-emerald-700/70">
              {label(locale, theme.nameEn, theme.nameFa)}
            </span>
            {shared && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                <Share2 className="h-3 w-3" />
                {ownerName}
              </span>
            )}
          </div>
          <h2 className="mt-2 text-lg font-semibold text-emerald-950 group-hover:text-emerald-800">{title}</h2>
        </div>
        <Arrow className="mt-1 h-5 w-5 shrink-0 text-emerald-400 group-hover:text-emerald-600" />
      </div>

      <div className="mt-5">
        <div className="mb-1.5 flex justify-between text-xs">
          <span className="font-medium text-emerald-800/80">{progress}%</span>
          <span className="capitalize text-emerald-700/60">{status.toLowerCase()}</span>
        </div>
        <div className="h-2 rounded-full bg-emerald-100">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {currentStage && (
        <p className="mt-3 text-xs text-emerald-800/60">
          <Calendar className="inline h-3.5 w-3.5 me-1" />
          {currentStage}
        </p>
      )}
    </Link>
  );
}
