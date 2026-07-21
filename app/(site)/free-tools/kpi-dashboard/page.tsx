import type { Metadata } from "next";
import KpiDashboard from "@/components/tools/KpiDashboard";
import ToolShell from "@/components/tools/ToolShell";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Marketing KPI Dashboard: Track CPL, CAC and ROAS",
  description:
    "Free marketing KPI tracker — enter spend, leads, customers and revenue each month and see cost per lead, conversion rate and ROAS at a glance.",
  alternates: { canonical: `${SITE_URL}/free-tools/kpi-dashboard` },
};

export default function KpiDashboardPage() {
  return (
    <ToolShell
      slug="kpi-dashboard"
      title="Marketing KPI"
      titleAccent="dashboard"
      intro="Enter each month's spend, leads, customers and revenue — cost per lead, conversion rate and ROAS work themselves out."
    >
      <KpiDashboard />
    </ToolShell>
  );
}
