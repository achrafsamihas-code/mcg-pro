import type { Metadata } from "next";
import SupplierDashboardClient from "@/components/supplier/SupplierDashboardClient";

export const metadata: Metadata = {
  title: "Supplier Console | B2B Trade & Logistics",
  description:
    "Supplier overview: total sales, active listings, pending shipments, ongoing negotiations, and recent orders.",
};

export default function SupplierDashboardPage() {
  return <SupplierDashboardClient />;
}
