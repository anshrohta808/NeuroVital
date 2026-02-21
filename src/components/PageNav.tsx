"use client";

import { NavBar } from "@/components/ui/tubelight-navbar";
import {
  LayoutDashboard,
  FileText,
  Sparkles,
  ShieldCheck,
  Upload
} from "lucide-react";

export default function PageNav() {
  return (
    <div className="flex w-full justify-center">
      <NavBar
        items={[
          { name: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
          { name: "Insights", url: "/insights", icon: FileText },
          { name: "Lifestyle", url: "/lifestyle", icon: Sparkles },
          { name: "MedFact", url: "/medfact", icon: ShieldCheck },
          { name: "Upload labs", url: "/upload", icon: Upload }
        ]}
        className="!static !left-auto !translate-x-0 !mb-0 !pt-0"
      />
    </div>
  );
}
