import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { UserRole } from "@/types";

export default function WarehouseDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout role={UserRole.WAREHOUSE}>
      {children}
    </DashboardLayout>
  );
}
