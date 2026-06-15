import type { Metadata } from "next";
import SettingsClient from "@/components/warehouse/SettingsClient";

export const metadata: Metadata = {
  title: "Pricing & Capacity | B2B Trade & Logistics",
  description:
    "Configure storage pricing, capacity thresholds, and high-occupancy alerts.",
};

export default function WarehouseSettingsPage() {
  return <SettingsClient />;
}
