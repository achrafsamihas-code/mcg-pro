import type { Metadata } from "next";
import EarningsClient from "@/components/logistics/EarningsClient";

export const metadata: Metadata = {
  title: "Wallet & Earnings | B2B Trade & Logistics",
  description:
    "Driver wallet balance, recent payouts, and a ledger of completed trips with commission breakdowns.",
};

export default function LogisticsEarningsPage() {
  return <EarningsClient />;
}
