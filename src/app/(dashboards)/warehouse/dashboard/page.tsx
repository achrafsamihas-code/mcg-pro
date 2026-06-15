import type { Metadata } from "next";
import WarehouseDashboardClient from "@/components/warehouse/WarehouseDashboardClient";

export const metadata: Metadata = {
  title: "Warehouse Console | B2B Trade & Logistics",
  description:
    "Warehouse overview: space utilisation, rental earnings, active tenants, and live inbound/outbound logistics.",
};

export default function WarehouseDashboardPage() {
  return <WarehouseDashboardClient />;
}
