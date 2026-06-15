import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { UserRole } from "@/types";

export default function LogisticsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout role={UserRole.LOGISTICS}>
      {children}
    </DashboardLayout>
  );
}
