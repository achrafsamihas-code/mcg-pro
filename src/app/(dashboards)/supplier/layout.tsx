import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { UserRole } from "@/types";

export default function SupplierDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout role={UserRole.SUPPLIER}>
      {children}
    </DashboardLayout>
  );
}
