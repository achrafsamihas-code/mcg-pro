"use client";

import React, { useEffect, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchPayouts,
  fetchTripEarnings,
  fetchWalletSummary,
} from "@/lib/logistics/data";
import type {
  Payout,
  PayoutStatus,
  TripEarning,
  WalletSummary,
} from "@/lib/logistics/types";
import { formatCurrency, formatPct } from "@/lib/admin/format";

const PAYOUT_COLOR: Record<PayoutStatus, "success" | "warning" | "error"> = {
  paid: "success",
  processing: "warning",
  failed: "error",
};

export default function EarningsClient() {
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [earnings, setEarnings] = useState<TripEarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetchWalletSummary(),
      fetchPayouts(),
      fetchTripEarnings(),
    ]).then(([w, p, e]) => {
      if (mounted) {
        setWallet(w);
        setPayouts(p);
        setEarnings(e);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Wallet & Earnings" />

      {/* Wallet summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.4fr]">
        {loading || !wallet ? (
          <div className="h-44 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
        ) : (
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white dark:border-gray-800">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <span className="text-sm text-white/80">Available Balance</span>
            <div className="mt-1 text-3xl font-bold">
              {formatCurrency(wallet.balance)}
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-white/20 pt-4 text-sm">
              <div>
                <div className="text-white/70">Pending</div>
                <div className="font-semibold">{formatCurrency(wallet.pending)}</div>
              </div>
              <div className="text-right">
                <div className="text-white/70">Lifetime Net</div>
                <div className="font-semibold">{formatCurrency(wallet.lifetimeNet)}</div>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-5 w-full !bg-white/10 !text-white !ring-white/30 hover:!bg-white/20"
            >
              Withdraw Funds
            </Button>
          </div>
        )}

        {/* Recent payouts */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
              Recent Payouts
            </h3>
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
            <ul className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {payouts.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between px-6 py-3.5"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {formatCurrency(p.amount)}
                    </div>
                    <span className="text-xs text-gray-400">
                      {p.reference} · {p.method}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge size="sm" color={PAYOUT_COLOR[p.status]}>
                      {p.status}
                    </Badge>
                    <span className="text-xs text-gray-400">{p.date}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Trip earnings ledger */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            Completed Trips Ledger
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gross pay, platform commission, and net payout per trip
          </p>
        </div>

        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
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
                  {["Trip", "Route", "Completed", "Gross", "Commission", "Net Payout"].map(
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
                {earnings.map((e) => (
                  <TableRow
                    key={e.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 dark:border-gray-800/60 dark:hover:bg-white/[0.02]"
                  >
                    <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {e.reference}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {e.route}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {e.completedAt}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {formatCurrency(e.gross)}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-error-600 dark:text-error-500">
                      −{formatCurrency(e.commission)}
                      <span className="ml-1 text-xs text-gray-400">
                        ({formatPct(e.commissionRate * 100).replace("+", "")})
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm font-semibold text-success-600 dark:text-success-500">
                      {formatCurrency(e.net)}
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
