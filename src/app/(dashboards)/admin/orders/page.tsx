import type { Metadata } from "next";
import OrdersClient from "@/components/admin/OrdersClient";

export const metadata: Metadata = {
  title: "Logistics & Order Tracker | B2B Trade & Logistics",
  description:
    "Global order monitoring with a 6-stage trade deal tracker: Received to Delivered.",
};

export default function OrdersPage() {
  return <OrdersClient />;
}
