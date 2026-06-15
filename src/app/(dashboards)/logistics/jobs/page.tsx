import type { Metadata } from "next";
import JobsClient from "@/components/logistics/JobsClient";

export const metadata: Metadata = {
  title: "Route Tracker & Job Board | B2B Trade & Logistics",
  description:
    "Browse available delivery jobs and manage active trips with a live route status stepper.",
};

export default function LogisticsJobsPage() {
  return <JobsClient />;
}
