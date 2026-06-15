import type { Metadata } from "next";
import MarketplaceClient from "@/components/customer/MarketplaceClient";

export const metadata: Metadata = {
  title: "B2B Marketplace | B2B Trade & Logistics",
  description:
    "Browse verified suppliers, compare B2B tiered pricing, and place bulk orders.",
};

export default function CustomerMarketplacePage() {
  return <MarketplaceClient />;
}
