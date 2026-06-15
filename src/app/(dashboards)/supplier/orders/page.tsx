import type { Metadata } from "next";
import NegotiationsClient from "@/components/supplier/NegotiationsClient";

export const metadata: Metadata = {
  title: "B2B Negotiation Hub | B2B Trade & Logistics",
  description:
    "Review buyer offers, counter prices, and accept terms to move deals into production.",
};

export default function SupplierOrdersPage() {
  return <NegotiationsClient />;
}
