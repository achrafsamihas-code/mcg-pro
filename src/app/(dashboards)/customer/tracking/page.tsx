import type { Metadata } from "next";
import TrackingClient from "@/components/customer/TrackingClient";

export const metadata: Metadata = {
  title: "Order Tracking | B2B Trade & Logistics",
  description:
    "Track bulk orders live across the 6 standard stages from Received to Delivered.",
};

export default function CustomerTrackingPage() {
  return <TrackingClient />;
}
