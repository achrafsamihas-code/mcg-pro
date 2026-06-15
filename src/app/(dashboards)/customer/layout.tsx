import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { UserRole } from "@/types";

export default function CustomerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout role={UserRole.CUSTOMER}>
      {children}
    </DashboardLayout>
  );
}
