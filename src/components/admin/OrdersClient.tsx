"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import { fetchTradeDeals } from "@/lib/admin/data";
import { ORDER_STAGES, type TradeDeal } from "@/lib/admin/types";
import { formatCurrency, formatRelativeTime } from "@/lib/admin/format";

function DealSkeleton() {
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

/* -------------------------------------------------------------------------- */
/* Stepper                                                                    */
/* -------------------------------------------------------------------------- */

function Stepper({ stageIndex }: { stageIndex: number }) {
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

/* -------------------------------------------------------------------------- */
/* Deal card                                                                  */
/* -------------------------------------------------------------------------- */

function DealCard({ deal }: { deal: TradeDeal }) {
  const stageLabel = ORDER_STAGES[deal.stageIndex];
  const isDelivered = deal.stageIndex === ORDER_STAGES.length - 1;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 dark:text-white/90">
              {deal.reference}
            </span>
            {deal.flagged && (
              <Badge size="sm" color="error">
                flagged
              </Badge>
            )}
            <Badge size="sm" color={isDelivered ? "success" : "info"}>
              {stageLabel}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {deal.product} · {deal.buyer} ⇄ {deal.supplier}
          </p>
        </div>
        <div className="text-right">
          <div className="font-bold text-gray-800 dark:text-white/90">
            {formatCurrency(deal.value)}
          </div>
          <div className="text-xs text-gray-400">
            {deal.destination} · {formatRelativeTime(deal.updatedAt)}
          </div>
        </div>
      </div>

      <Stepper stageIndex={deal.stageIndex} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page client                                                                */
/* -------------------------------------------------------------------------- */

const FILTERS = ["All", ...ORDER_STAGES] as const;

export default function OrdersClient() {
  const [deals, setDeals] = useState<TradeDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  useEffect(() => {
    let mounted = true;
    fetchTradeDeals().then((res) => {
      if (mounted) {
        setDeals(res);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "All") return deals;
    return deals.filter((d) => ORDER_STAGES[d.stageIndex] === filter);
  }, [deals, filter]);

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Logistics & Order Tracker" />

      {/* Stage filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                active
                  ? "bg-brand-500 text-white"
                  : "bg-white text-gray-600 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 dark:bg-white/[0.03] dark:text-gray-400 dark:ring-gray-800"
              }`}
            >
              {f}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <DealSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
          No deals in the “{filter}” stage.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      )}
    </div>
  );
}
