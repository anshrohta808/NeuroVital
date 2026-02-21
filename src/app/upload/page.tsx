"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import PdfUploadForm from "@/components/PdfUploadForm";
import PageNav from "@/components/PageNav";

export default function UploadPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [reports, setReports] = useState<any[]>([]);

  const fetchReports = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      router.push("/login");
      return;
    }

    const { data } = await supabase
      .from("lab_reports")
      .select(
        "report_name, created_at, hemoglobin, cholesterol, vitamin_d, tsh, fasting_glucose, uric_acid, creatinine, systolic_bp, diastolic_bp"
      )
      .order("created_at", { ascending: false })
      .limit(5);
    setReports(data ?? []);
  };

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="dashboard-shell">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="card">
          <p className="section-title">Lab intake</p>
          <h1 className="mt-2 text-3xl font-semibold">Upload lab report PDFs</h1>
          <p className="mt-2 text-sm text-slate/70">
            The extraction pipeline captures hemoglobin, cholesterol, vitamin D, TSH, and fasting glucose.
          </p>
          <div className="mt-4">
            <PageNav />
          </div>
        </div>

        <PdfUploadForm />

        <div className="card">
          <p className="section-title">Recent reports</p>
          <div className="mt-5 space-y-4">
            {reports.length === 0 ? (
              <p className="text-sm text-slate/70">No lab reports uploaded yet.</p>
            ) : (
              reports.map((report) => (
                <div key={`${report.report_name}-${report.created_at}`} className="rounded-xl border border-slate/10 bg-white/80 px-4 py-3 text-sm text-slate/70">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate">{report.report_name}</span>
                    <span>{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-3 grid gap-3 text-xs md:grid-cols-3">
                    <span>Hemoglobin: {report.hemoglobin ?? "n/a"}</span>
                    <span>Cholesterol: {report.cholesterol ?? "n/a"}</span>
                    <span>Vitamin D: {report.vitamin_d ?? "n/a"}</span>
                    <span>TSH: {report.tsh ?? "n/a"}</span>
                    <span>Fasting glucose: {report.fasting_glucose ?? "n/a"}</span>
                    <span>Uric acid: {report.uric_acid ?? "n/a"}</span>
                    <span>Creatinine: {report.creatinine ?? "n/a"}</span>
                    <span>BP (sys/dia): {report.systolic_bp ?? "n/a"}/{report.diastolic_bp ?? "n/a"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
