"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchRentalBookings, updateBookingStatus } from "@/lib/warehouse/data";
import type {
  RentalBooking,
  RentalBookingStatus,
} from "@/lib/warehouse/types";
import { formatCurrency, formatNumber } from "@/lib/admin/format";

const STATUS_META: Record<
  RentalBookingStatus,
  { label: string; color: "warning" | "success" | "light" | "error" }
> = {
  pending_approval: { label: "Pending Approval", color: "warning" },
  active: { label: "Active", color: "success" },
  expired: { label: "Expired", color: "light" },
  rejected: { label: "Rejected", color: "error" },
  terminated: { label: "Terminated", color: "error" },
};

type FilterKey = "all" | "pending_approval" | "active" | "expired";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending_approval", label: "Pending Requests" },
  { key: "active", label: "Active Tenants" },
  { key: "expired", label: "Expired" },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ActionButton({
  label,
  tone,
  disabled,
  onClick,
}: {
  label: string;
  tone: "approve" | "danger" | "neutral";
  disabled?: boolean;
  onClick: () => void;
}) {
  const tones = {
    approve:
      "text-success-600 ring-success-200 hover:bg-success-50 dark:text-success-500 dark:ring-success-500/30 dark:hover:bg-success-500/10",
    danger:
      "text-error-600 ring-error-200 hover:bg-error-50 dark:text-error-500 dark:ring-error-500/30 dark:hover:bg-error-500/10",
    neutral:
      "text-gray-600 ring-gray-200 hover:bg-gray-50 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.05]",
  } as const;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]}`}
    >
      {label}
    </button>
  );
}

export default function BookingsClient() {
  const [bookings, setBookings] = useState<RentalBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchRentalBookings().then((res) => {
      if (mounted) {
        setBookings(res);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const rows = useMemo(
    () => (filter === "all" ? bookings : bookings.filter((b) => b.status === filter)),
    [bookings, filter]
  );

  const countFor = (key: FilterKey) =>
    key === "all" ? bookings.length : bookings.filter((b) => b.status === key).length;

  const setStatus = async (id: string, status: RentalBookingStatus) => {
    setBusyId(id);
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    );
    await updateBookingStatus(id, status);
    setBusyId(null);
  };

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Booking & Tenant Manager" />

      {/* Filters */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-1.5 dark:border-gray-800 dark:bg-white/[0.03]">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-brand-500 text-white shadow-theme-xs"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.05]"
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  active
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {countFor(f.key)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
            No bookings in this view.
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  {["Tenant", "Pallets", "Term", "Monthly Value", "Status", "Actions"].map(
                    (h) => (
                      <TableCell
                        key={h}
                        isHeader
                        className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-400"
                      >
                        {h}
                      </TableCell>
                    )
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((b) => (
                  <TableRow
                    key={b.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 dark:border-gray-800/60 dark:hover:bg-white/[0.02]"
                  >
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                          {initials(b.supplier)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-white/90">
                            {b.supplier}
                          </div>
                          <span className="text-xs text-gray-400">
                            {b.reference} · {b.supplierEmail}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {formatNumber(b.pallets)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {b.startDate} → {b.endDate ?? "open"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {formatCurrency(b.monthlyValue)}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Badge size="sm" color={STATUS_META[b.status].color}>
                        {STATUS_META[b.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {b.status === "pending_approval" && (
                          <>
                            <ActionButton
                              label="Approve"
                              tone="approve"
                              disabled={busyId === b.id}
                              onClick={() => setStatus(b.id, "active")}
                            />
                            <ActionButton
                              label="Reject"
                              tone="danger"
                              disabled={busyId === b.id}
                              onClick={() => setStatus(b.id, "rejected")}
                            />
                          </>
                        )}
                        {b.status === "active" && (
                          <ActionButton
                            label="Terminate Lease"
                            tone="danger"
                            disabled={busyId === b.id}
                            onClick={() => setStatus(b.id, "terminated")}
                          />
                        )}
                        {b.status === "expired" && (
                          <ActionButton
                            label="End Contract"
                            tone="neutral"
                            disabled={busyId === b.id}
                            onClick={() => setStatus(b.id, "terminated")}
                          />
                        )}
                        {(b.status === "rejected" || b.status === "terminated") && (
                          <span className="text-xs text-gray-400">No actions</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
