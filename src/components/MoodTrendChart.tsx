"use client";

import { useMemo } from "react";

type MoodPoint = {
  logged_at: string;
  mood_score: number;
};

export default function MoodTrendChart({ data }: { data: MoodPoint[] }) {
  const points = useMemo(() => {
    if (!data.length) return [];
    const sorted = [...data].sort(
      (a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime()
    );
    const min = Math.min(...sorted.map((item) => item.mood_score));
    const max = Math.max(...sorted.map((item) => item.mood_score));
    const range = Math.max(max - min, 1);
    return sorted.map((item, index) => {
      const x = (index / Math.max(sorted.length - 1, 1)) * 260 + 20;
      const y = 120 - ((item.mood_score - min) / range) * 90;
      return { x, y, label: item.mood_score };
    });
  }, [data]);

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");

  return (
    <div className="card">
      <p className="section-title">Mood trend</p>
      <h3 className="mt-2 text-lg font-semibold">14-day emotional curve</h3>
      <div className="mt-5 rounded-2xl bg-white/80 p-4">
        {points.length === 0 ? (
          <p className="text-sm text-slate/70">Log a few mood entries to see your trend line.</p>
        ) : (
          <svg width="100%" height="150" viewBox="0 0 320 140">
            <defs>
              <linearGradient id="moodGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#3DD6C5" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#3DD6C5" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path d={`${path} L300,130 L20,130 Z`} fill="url(#moodGradient)" />
            <path d={path} fill="none" stroke="#0B0F14" strokeWidth="2" />
            {points.map((point, idx) => (
              <circle key={idx} cx={point.x} cy={point.y} r="4" fill="#FF7A59" />
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}
