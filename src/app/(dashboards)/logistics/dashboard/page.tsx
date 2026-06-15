import type { Metadata } from "next";
import LogisticsDashboardClient from "@/components/logistics/LogisticsDashboardClient";

export const metadata: Metadata = {
  title: "Driver Console | B2B Trade & Logistics",
  description:
    "Driver overview: completed deliveries, active shipments, earnings, and current active route.",
};

export default function LogisticsDashboardPage() {
  return <LogisticsDashboardClient />;
}
