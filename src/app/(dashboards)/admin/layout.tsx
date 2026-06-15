import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { UserRole } from "@/types";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout role={UserRole.SUPER_ADMIN}>
      {children}
    </DashboardLayout>
  );
}
