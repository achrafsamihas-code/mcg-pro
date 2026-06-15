"use client";

import React, { useEffect, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import { fetchBuyerOrders } from "@/lib/customer/data";
import { ORDER_STAGES, type BuyerOrder } from "@/lib/customer/types";
import { formatCurrency, formatRelativeTime } from "@/lib/admin/format";

function OrderSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex justify-between">
        <div className="h-4 w-48 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-4 w-24 rounded bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-gray-800" />
    </div>
  );
}

/** 6-stage horizontal stepper for a buyer order. */
function OrderStepper({ stageIndex }: { stageIndex: number }) {
  return (
    <div className="flex items-center">
      {ORDER_STAGES.map((stage, i) => {
        const completed = i < stageIndex;
        const current = i === stageIndex;
        const isLast = i === ORDER_STAGES.length - 1;
        return (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                  completed
                    ? "bg-success-500 text-white"
                    : current
                    ? "bg-brand-500 text-white ring-4 ring-brand-500/20"
                    : "bg-gray-100 text-gray-400 dark:bg-gray-800"
                }`}
              >
                {completed ? (
                  <svg viewBox="0 0 24 24" fill="none" className="size-4">
                    <path d="m5 13 4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`hidden max-w-[72px] text-center text-[11px] leading-tight sm:block ${
                  current
                    ? "font-semibold text-brand-600 dark:text-brand-400"
                    : "text-gray-400"
                }`}
              >
                {stage}
              </span>
            </div>
            {!isLast && (
              <div className="mx-1 mb-5 h-0.5 flex-1 sm:mx-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    completed ? "bg-success-500" : "bg-gray-100 dark:bg-gray-800"
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function TrackingClient() {
  const [orders, setOrders] = useState<BuyerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const res = await fetchBuyerOrders();
      if (mounted) {
        setOrders(res);
        setLoading(false);
      }
    };

    load();
    // Live-read: poll for state changes triggered by suppliers/drivers.
    // Replace with a Supabase realtime channel once tables are live.
    const interval = setInterval(load, 20000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadCrumb pageTitle="Order Tracking" />
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
          </span>
          Live updates
        </span>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <OrderSkeleton key={i} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-400 dark:border-gray-700">
          No active orders to track.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const delivered = order.stageIndex === ORDER_STAGES.length - 1;
            return (
              <div
                key={order.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
              >
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800 dark:text-white/90">
                        {order.reference}
                      </span>
                      <Badge size="sm" color={delivered ? "success" : "info"}>
                        {ORDER_STAGES[order.stageIndex]}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      {order.product} · {order.quantity.toLocaleString()} units ·{" "}
                      {order.supplier}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-800 dark:text-white/90">
                      {formatCurrency(order.quantity * order.unitPrice)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {order.origin} → {order.destination}
                    </div>
                  </div>
                </div>

                <OrderStepper stageIndex={order.stageIndex} />

                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-400 dark:border-gray-800">
                  <span>Updated {formatRelativeTime(order.updatedAt)}</span>
                  <span>
                    {delivered ? "Delivered" : `ETA ${order.eta}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
