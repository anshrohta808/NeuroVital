"use client";

import { useState } from "react";

export default function PdfUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const upload = async () => {
    if (!file) {
      setStatus("Please select a PDF file.");
      return;
    }

    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload-lab", {
      method: "POST",
      body: formData
    });

    const payload = await response.json();

    if (response.ok) {
      setStatus("Lab report processed and stored.");
      setFile(null);
    } else {
      setStatus(payload.error ?? "Unable to process PDF.");
    }

    setLoading(false);
  };

  return (
    <div className="card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="section-title">Lab upload</p>
          <h3 className="mt-2 text-lg font-semibold">PDF parsing pipeline</h3>
        </div>
        <span className="badge bg-leaf/10 text-leaf">PDF</span>
      </div>

      <div className="mt-5 space-y-5">
        <input
          className="input"
          type="file"
          accept="application/pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <button className="button-primary w-full" onClick={upload} disabled={loading}>
          {loading ? "Processing..." : "Upload and extract"}
        </button>
        {status ? <p className="text-sm text-slate/70">{status}</p> : null}
      </div>
    </div>
  );
}
