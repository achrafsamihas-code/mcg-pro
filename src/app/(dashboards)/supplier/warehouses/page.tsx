import type { Metadata } from "next";
import WarehousesClient from "@/components/supplier/WarehousesClient";

export const metadata: Metadata = {
  title: "Warehouse Booking Manager | B2B Trade & Logistics",
  description:
    "Request storage in top-rated warehouses and track booking status with live storage fee counters.",
};

export default function SupplierWarehousesPage() {
  return <WarehousesClient />;
}
