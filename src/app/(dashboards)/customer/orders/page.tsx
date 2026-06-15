import type { Metadata } from "next";
import BuyerNegotiationsClient from "@/components/customer/BuyerNegotiationsClient";

export const metadata: Metadata = {
  title: "My Negotiations | B2B Trade & Logistics",
  description:
    "Track bulk negotiations, review supplier counter-offers, and accept or submit new offers.",
};

export default function CustomerOrdersPage() {
  return <BuyerNegotiationsClient />;
}
