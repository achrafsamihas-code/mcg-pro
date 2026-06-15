import type { Metadata } from "next";
import DisputesClient from "@/components/admin/DisputesClient";

export const metadata: Metadata = {
  title: "Dispute & Ticket Resolution | B2B Trade & Logistics",
  description:
    "Dual-panel ticketing hub for the admin team to mediate disputes between parties.",
};

export default function DisputesPage() {
  return <DisputesClient />;
}
