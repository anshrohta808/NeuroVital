"use client";

import { useState } from "react";

export default function MoodLogForm({ onSaved }: { onSaved?: () => void }) {
  const [mood, setMood] = useState(7);
  const [energy, setEnergy] = useState(6);
  const [stress, setStress] = useState(4);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    setStatus(null);

    const response = await fetch("/api/mood-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mood_score: mood,
        energy_score: energy,
        stress_score: stress,
        notes: notes ? notes : null
      })
    });

    if (response.ok) {
      setStatus("Mood log saved.");
      setNotes("");
      onSaved?.();
    } else {
      const error = await response.json();
      setStatus(error.error ?? "Unable to save mood log.");
    }

    setLoading(false);
  };

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-title">Daily mood</p>
          <h3 className="mt-2 text-lg font-semibold">Check-in</h3>
        </div>
        <span className="badge bg-ember/10 text-ember">Today</span>
      </div>

      <div className="mt-5 space-y-5">
        {[{ label: "Mood", value: mood, setter: setMood }, { label: "Energy", value: energy, setter: setEnergy }, { label: "Stress", value: stress, setter: setStress }].map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate">{item.label}</span>
              <span className="text-slate/70">{item.value}/10</span>
            </div>
            <input
              className="mt-2 w-full"
              type="range"
              min={1}
              max={10}
              value={item.value}
              onChange={(event) => item.setter(Number(event.target.value))}
            />
          </div>
        ))}

        <textarea
          className="input h-24"
          placeholder="Notes about today"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />

        <button className="button-primary w-full" onClick={submit} disabled={loading}>
          {loading ? "Saving..." : "Save mood log"}
        </button>
        {status ? <p className="text-sm text-slate/70">{status}</p> : null}
      </div>
    </div>
  );
}
