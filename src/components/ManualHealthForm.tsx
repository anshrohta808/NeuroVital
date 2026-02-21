"use client";

import { useEffect, useState } from "react";
import type { FamilyHistoryInput, VitalsInput } from "@/lib/types";

const emptyVitals = {
  height_cm: "",
  weight_kg: ""
};

const formatNumber = (value: number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

const toVitalsForm = (input?: VitalsInput | null) => ({
  height_cm: formatNumber(input?.height_cm),
  weight_kg: formatNumber(input?.weight_kg)
});

const toFamilyForm = (input?: FamilyHistoryInput | null) => ({
  has_diabetes: input?.has_diabetes ?? false,
  has_heart_disease: input?.has_heart_disease ?? false,
  has_hypertension: input?.has_hypertension ?? false,
  has_cancer: input?.has_cancer ?? false,
  notes: input?.notes ?? ""
});

type ManualHealthFormProps = {
  initialVitals?: VitalsInput | null;
  initialFamilyHistory?: FamilyHistoryInput | null;
  onSaved?: () => void;
};

export default function ManualHealthForm({
  initialVitals,
  initialFamilyHistory,
  onSaved
}: ManualHealthFormProps) {
  const [vitals, setVitals] = useState(() => (initialVitals ? toVitalsForm(initialVitals) : emptyVitals));
  const [family, setFamily] = useState(() =>
    initialFamilyHistory ? toFamilyForm(initialFamilyHistory) : toFamilyForm(null)
  );
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [vitalsDirty, setVitalsDirty] = useState(false);
  const [familyDirty, setFamilyDirty] = useState(false);

  useEffect(() => {
    if (vitalsDirty) {
      return;
    }
    setVitals(initialVitals ? toVitalsForm(initialVitals) : emptyVitals);
  }, [initialVitals, vitalsDirty]);

  useEffect(() => {
    if (familyDirty) {
      return;
    }
    setFamily(toFamilyForm(initialFamilyHistory));
  }, [initialFamilyHistory, familyDirty]);

  const handleVitalsSubmit = async () => {
    setLoading(true);
    setStatus(null);

    const payload = {
      height_cm: Number(vitals.height_cm),
      weight_kg: Number(vitals.weight_kg)
    };

    const response = await fetch("/api/vitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      setStatus("Vitals saved.");
      setVitals(toVitalsForm(payload));
      setVitalsDirty(false);
      onSaved?.();
    } else {
      const error = await response.json();
      setStatus(error.error ?? "Unable to save vitals.");
    }

    setLoading(false);
  };

  const handleFamilySubmit = async () => {
    setLoading(true);
    setStatus(null);

    const payload = {
      ...family,
      notes: family.notes ? family.notes : null
    };

    const response = await fetch("/api/family-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      setStatus("Family history saved.");
      setFamily(toFamilyForm(payload));
      setFamilyDirty(false);
      onSaved?.();
    } else {
      const error = await response.json();
      setStatus(error.error ?? "Unable to save family history.");
    }

    setLoading(false);
  };

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-title">Manual health entry</p>
          <h3 className="mt-2 text-lg font-semibold">Vitals + family history</h3>
        </div>
        <span className="badge bg-gold/10 text-gold">Secure</span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate">Vitals</p>
          {[
            { key: "height_cm", label: "Height (cm)" },
            { key: "weight_kg", label: "Weight (kg)" }
          ].map((field) => (
            <div key={field.key}>
              <label className="text-xs text-slate/70">{field.label}</label>
              <input
                className="input mt-1"
                value={vitals[field.key as keyof typeof vitals]}
                onChange={(event) => {
                  setVitalsDirty(true);
                  setVitals((prev) => ({
                    ...prev,
                    [field.key]: event.target.value
                  }));
                }}
              />
            </div>
          ))}
          <button className="button-primary w-full" onClick={handleVitalsSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save vitals"}
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate">Family history</p>
          {[
            { key: "has_diabetes", label: "Diabetes" },
            { key: "has_heart_disease", label: "Heart disease" },
            { key: "has_hypertension", label: "Hypertension" },
            { key: "has_cancer", label: "Cancer" }
          ].map((field) => (
            <label key={field.key} className="flex items-center justify-between rounded-xl border border-slate/10 bg-white/80 px-4 py-3 text-sm">
              {field.label}
              <input
                type="checkbox"
                checked={family[field.key as keyof typeof family] as boolean}
                onChange={(event) => {
                  setFamilyDirty(true);
                  setFamily((prev) => ({
                    ...prev,
                    [field.key]: event.target.checked
                  }));
                }}
              />
            </label>
          ))}
          <div>
            <label className="text-xs text-slate/70">Tell me about your habits</label>
            <textarea
              className="input mt-1 h-24"
              value={family.notes}
              onChange={(event) => {
                setFamilyDirty(true);
                setFamily((prev) => ({ ...prev, notes: event.target.value }));
              }}
            />
          </div>
          <button className="button-primary w-full" onClick={handleFamilySubmit} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {status ? <p className="mt-4 text-sm text-slate/80">{status}</p> : null}
    </div>
  );
}
