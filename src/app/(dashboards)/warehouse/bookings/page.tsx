import type { Metadata } from "next";
import BookingsClient from "@/components/warehouse/BookingsClient";

export const metadata: Metadata = {
  title: "Booking & Tenant Manager | B2B Trade & Logistics",
  description:
    "Manage tenants and booking requests: approve/reject requests and terminate leases.",
};

export default function WarehouseBookingsPage() {
  return <BookingsClient />;
}
