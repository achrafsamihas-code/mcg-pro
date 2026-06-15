import type { Metadata } from "next";
import ManagementClient from "@/components/admin/ManagementClient";

export const metadata: Metadata = {
  title: "User & Supplier Control Center | B2B Trade & Logistics",
  description:
    "Manage users, suppliers, drivers, and warehouses: ban, verify, and approve registrations.",
};

export default function ManagementPage() {
  return <ManagementClient />;
}
