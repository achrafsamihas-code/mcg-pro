import type { Metadata } from "next";
import DisputesClient from "@/components/customer/DisputesClient";

export const metadata: Metadata = {
  title: "Dispute & Claims Center | B2B Trade & Logistics",
  description:
    "Open conflict tickets against suppliers, warehouses, or logistics and message the mediator.",
};

export default function CustomerDisputesPage() {
  return <DisputesClient />;
}
