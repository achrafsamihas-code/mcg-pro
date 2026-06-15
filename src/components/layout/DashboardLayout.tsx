"use client";

import React from "react";
import Footer from "@/components/footer/Footer";
import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import { UserRole } from "@/types";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: UserRole;
}

/**
 * Reusable and centralized Dashboard Layout for the B2B Platform.
 * Adapts dynamically to any of the 5 user roles by configuring
 * the AppSidebar with the correct layout structure.
 */
export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  // Dynamic margin adjusting main content based on Sidebar open/collapse state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex bg-gray-50 dark:bg-gray-950">
      {/* Dynamic Role-Aware Sidebar */}
      <AppSidebar role={role} />
      
      {/* Mobile Sidebar Backdrop Overlay */}
      <Backdrop />
      
      {/* Main Content Pane */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Global Dashboard Header */}
        <AppHeader />
        
        {/* Main Section */}
        <main className="flex-grow p-4 mx-auto w-full max-w-(--breakpoint-2xl) md:p-6 lg:p-8">
          {children}
        </main>
        
        {/* Modular Footer */}
        <Footer />
      </div>
    </div>
  );
}
