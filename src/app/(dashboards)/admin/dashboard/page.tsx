import type { Metadata } from "next";
import DashboardClient from "@/components/admin/DashboardClient";

export const metadata: Metadata = {
  title: "CEO Command Center | B2B Trade & Logistics",
  description:
    "High-level platform metrics: users, suppliers, drivers, warehouses, orders, deals, and earnings.",
};

export default function AdminDashboardPage() {
  return <DashboardClient />;
}
