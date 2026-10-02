import { CircleAlert, TriangleAlert } from "lucide-react";
import { BUDGET_WARN, formatHours } from "@/lib/work/shared";
import "./work.css";

/** Hours logged against a project's budget. Without a budget it shows the hours only. */
export function BudgetMeter({ hours, budget }: { hours: number; budget: number | null }) {
  if (!budget) {
    return (
      <div className="meter">
        <span className="meter-text">
          <span>
            <strong>{formatHours(hours)} h</strong> logged
          </span>
          <span>No budget</span>
        </span>
      </div>
    );
  }
  const share = hours / budget;
  const over = hours > budget;
  const warn = !over && share >= BUDGET_WARN;
  const label = `${formatHours(hours)} of ${formatHours(budget)} h used`;
  return (
    <div className={`meter${over ? " meter-over" : warn ? " meter-warn" : ""}`}>
      <div className="meter-track" role="meter" aria-label="Hour budget" aria-valuemin={0} aria-valuemax={budget} aria-valuenow={Math.min(hours, budget)} aria-valuetext={label}>
        <span className="meter-fill" style={{ width: `${Math.min(share, 1) * 100}%` }} />
      </div>
      <span className="meter-text">
        <span>
          <strong>{formatHours(hours)}</strong> of {formatHours(budget)} h
        </span>
        {over ? (
          <span className="flag flag-danger">
            <CircleAlert size={14} strokeWidth={1.5} aria-hidden="true" /> Over by {formatHours(hours - budget)} h
          </span>
        ) : warn ? (
          <span className="flag flag-warn">
            <TriangleAlert size={14} strokeWidth={1.5} aria-hidden="true" /> {Math.round(share * 100)}% used
          </span>
        ) : (
          <span>{Math.round(share * 100)}%</span>
        )}
      </span>
    </div>
  );
}
