"use client";

import React, { useEffect, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import SupplierMetricCard from "@/components/supplier/SupplierMetricCard";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchSupplierOrders, fetchSupplierSnapshot } from "@/lib/supplier/data";
import type {
  SupplierOrder,
  SupplierOrderStage,
  SupplierSnapshot,
} from "@/lib/supplier/types";
import { formatCurrency, formatRelativeTime } from "@/lib/admin/format";

const STAGE_COLOR: Record<SupplierOrderStage, "info" | "warning" | "primary" | "success" | "light"> = {
  Received: "info",
  Negotiation: "warning",
  Production: "primary",
  Shipping: "info",
  Delivered: "success",
};

function MetricSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-between">
        <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800" />
        <div className="h-6 w-16 rounded-full bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="mt-5 space-y-2">
        <div className="h-3 w-24 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-7 w-20 rounded bg-gray-100 dark:bg-gray-800" />
      </div>
    </div>
  );
}

export default function SupplierDashboardClient() {
  const [snapshot, setSnapshot] = useState<SupplierSnapshot | null>(null);
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchSupplierSnapshot(), fetchSupplierOrders()]).then(
      ([snap, ord]) => {
        if (mounted) {
          setSnapshot(snap);
          setOrders(ord);
          setLoading(false);
        }
      }
    );
    return () => {
      mounted = false;
    };
  }, []);

  // Orders requiring immediate action float to the top.
  const actionable = [...orders].sort(
    (a, b) => Number(b.actionRequired) - Number(a.actionRequired)
  );

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Supplier Console" />

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white dark:border-gray-800 md:p-8">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <h2 className="text-xl font-semibold md:text-2xl">
          Supplier Operations Center
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          Track sales performance, manage listings, fulfil shipments, and close
          B2B negotiations — all in one place.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        {loading || !snapshot
          ? Array.from({ length: 4 }).map((_, i) => <MetricSkeleton key={i} />)
          : snapshot.metrics.map((m) => (
              <SupplierMetricCard key={m.key} metric={m} />
            ))}
      </div>

      {/* Recent orders requiring action */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div>
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Recent Orders
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Orders flagged for action appear first
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
              />
            ))}
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  {["Reference", "Product", "Buyer", "Qty", "Value", "Stage", ""].map(
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
                {actionable.map((o) => (
                  <TableRow
                    key={o.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 dark:border-gray-800/60 dark:hover:bg-white/[0.02]"
                  >
                    <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {o.reference}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {o.product}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {o.buyer}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {o.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {formatCurrency(o.quantity * o.unitPrice)}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Badge size="sm" color={STAGE_COLOR[o.stage]}>
                        {o.stage}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      {o.actionRequired ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-error-600 dark:text-error-500">
                          <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-error-400 opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-error-500" />
                          </span>
                          Action needed
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {formatRelativeTime(o.updatedAt)}
                        </span>
                      )}
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
