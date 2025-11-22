// ...existing code...
import React from "react";

type Trend = { direction: "up" | "down"; percent?: number };

type Props = {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: Trend;
  colorClass?: string;
  badge?: string;
  progress?: { value: number; label?: string }; // 0-100
  onClick?: () => void;
};

export default function KpiCard({
  title,
  value,
  subtitle,
  trend,
  colorClass = "bg-white",
  badge,
  progress,
  onClick,
}: Props) {
  const trendColor = trend?.direction === "up" ? "text-green-600" : "text-red-600";
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg shadow-sm hover:shadow-md transition-transform transform hover:-translate-y-0.5 ${colorClass}`}
      aria-label={title}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500">{title}</div>
            {badge && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{badge}</span>}
          </div>
          <div className="mt-1 text-2xl font-semibold">{value}</div>
          {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}

          {progress && (
            <div className="mt-3">
              <div className="text-xs text-gray-500 mb-1 flex justify-between">
                <span>{progress.label ?? "Progress"}</span>
                <span>{progress.value}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-indigo-600 transition-width"
                  style={{ width: `${progress.value}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {trend && (
          <div className="text-right ml-4">
            <div className={`text-sm font-medium ${trendColor}`}>
              {trend.direction === "up" ? "▲" : "▼"} {trend.percent ?? ""}
            </div>
          </div>
        )}
      </div>
    </button>
  );
}