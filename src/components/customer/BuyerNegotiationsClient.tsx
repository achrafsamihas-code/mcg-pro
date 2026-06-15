"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import {
  acceptSupplierCounter,
  fetchBuyerNegotiations,
  submitBuyerCounter,
} from "@/lib/customer/data";
import type {
  BuyerNegotiation,
  NegotiationStatus,
  OfferRound,
} from "@/lib/customer/types";
import { formatCurrency, formatRelativeTime } from "@/lib/admin/format";

const STATUS_META: Record<
  NegotiationStatus,
  { label: string; color: "info" | "warning" | "success" | "primary" | "error" }
> = {
  open: { label: "Open", color: "info" },
  countered: { label: "Counter Received", color: "warning" },
  accepted: { label: "Accepted", color: "success" },
  in_production: { label: "In Production", color: "primary" },
  declined: { label: "Declined", color: "error" },
};

export default function BuyerNegotiationsClient() {
  const [negotiations, setNegotiations] = useState<BuyerNegotiation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState<number>(0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchBuyerNegotiations().then((res) => {
      if (mounted) {
        setNegotiations(res);
        setActiveId(res[0]?.id ?? null);
        setCounterPrice(res[0]?.currentPrice ?? 0);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const active = useMemo(
    () => negotiations.find((n) => n.id === activeId) ?? null,
    [negotiations, activeId]
  );

  const select = (id: string) => {
    setActiveId(id);
    const next = negotiations.find((n) => n.id === id);
    setCounterPrice(next?.currentPrice ?? 0);
    setNote("");
  };

  const handleCounter = async () => {
    if (!active || counterPrice <= 0) return;
    setBusy(true);
    const round: OfferRound = {
      id: `local-${Date.now()}`,
      author: "buyer",
      unitPrice: counterPrice,
      quantity: active.quantity,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    setNegotiations((prev) =>
      prev.map((n) =>
        n.id === active.id
          ? {
              ...n,
              status: "countered",
              currentPrice: counterPrice,
              lastOfferBy: "buyer",
              rounds: [...n.rounds, round],
              updatedAt: round.createdAt,
            }
          : n
      )
    );
    setNote("");
    await submitBuyerCounter(active.id, counterPrice, active.quantity, round.note);
    setBusy(false);
  };

  const handleAccept = async () => {
    if (!active) return;
    setBusy(true);
    setNegotiations((prev) =>
      prev.map((n) => (n.id === active.id ? { ...n, status: "accepted" } : n))
    );
    await acceptSupplierCounter(active.id);
    setBusy(false);
  };

  const closed =
    active?.status === "accepted" ||
    active?.status === "in_production" ||
    active?.status === "declined";
  // Buyer can accept only when the supplier made the last move.
  const canAccept = active?.lastOfferBy === "supplier" && !closed;

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="My Negotiations" />

      <div className="grid h-[calc(100vh-220px)] min-h-[540px] grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        {/* LEFT: list */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h3 className="font-semibold text-gray-800 dark:text-white/90">
              Ongoing Negotiations
            </h3>
            <p className="text-xs text-gray-400">
              {negotiations.filter((n) => n.status === "open" || n.status === "countered").length}{" "}
              active
            </p>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
                  />
                ))}
              </div>
            ) : (
              negotiations.map((n) => {
                const isActive = n.id === activeId;
                const meta = STATUS_META[n.status];
                return (
                  <button
                    key={n.id}
                    onClick={() => select(n.id)}
                    className={`w-full border-b border-gray-50 px-5 py-4 text-left transition dark:border-gray-800/60 ${
                      isActive
                        ? "bg-brand-50/60 dark:bg-brand-500/10"
                        : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gray-400">
                        {n.reference}
                      </span>
                      <Badge size="sm" color={meta.color}>
                        {meta.label}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm font-medium text-gray-800 dark:text-white/90">
                      {n.product}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-400">
                      <span>{n.supplier}</span>
                      <span>{n.quantity.toLocaleString()} units</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: detail */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
              Select a negotiation to review.
            </div>
          ) : (
            <>
              <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800 dark:text-white/90">
                        {active.product}
                      </h3>
                      <Badge size="sm" color={STATUS_META[active.status].color}>
                        {STATUS_META[active.status].label}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {active.reference} · {active.supplier} ·{" "}
                      {active.quantity.toLocaleString()} units
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <Figure label="Your target" value={formatCurrency(active.targetPrice)} />
                  <Figure
                    label="Current offer"
                    value={formatCurrency(active.currentPrice)}
                    highlight
                  />
                  <Figure
                    label="Order value"
                    value={formatCurrency(active.currentPrice * active.quantity)}
                  />
                </div>
              </div>

              {/* Round history */}
              <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50/40 px-6 py-5 custom-scrollbar dark:bg-gray-950/30">
                {active.rounds.map((round) => {
                  const isBuyer = round.author === "buyer";
                  return (
                    <div
                      key={round.id}
                      className={`flex ${isBuyer ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[78%]">
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            isBuyer
                              ? "rounded-br-sm bg-brand-500 text-white"
                              : "rounded-bl-sm bg-white text-gray-700 ring-1 ring-gray-200 dark:bg-white/[0.05] dark:text-gray-200 dark:ring-gray-800"
                          }`}
                        >
                          <div className="text-lg font-bold">
                            {formatCurrency(round.unitPrice)}
                            <span
                              className={`ml-1 text-xs font-normal ${
                                isBuyer ? "text-white/70" : "text-gray-400"
                              }`}
                            >
                              / unit
                            </span>
                          </div>
                          {round.note && (
                            <p
                              className={`mt-1 text-sm ${
                                isBuyer ? "text-white/90" : "text-gray-600 dark:text-gray-300"
                              }`}
                            >
                              {round.note}
                            </p>
                          )}
                        </div>
                        <div
                          className={`mt-1 flex items-center gap-1.5 text-[11px] text-gray-400 ${
                            isBuyer ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span className="font-medium">
                            {isBuyer ? "You" : active.supplier}
                          </span>
                          <span>·</span>
                          <span>{formatRelativeTime(round.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="border-t border-gray-100 p-4 dark:border-gray-800">
                {closed ? (
                  <p className="py-2 text-center text-sm text-gray-400">
                    This negotiation is {STATUS_META[active.status].label.toLowerCase()}.
                  </p>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="w-full sm:w-40">
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Your counter (USD)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step={0.01}
                        defaultValue={counterPrice}
                        onChange={(e) => setCounterPrice(Number(e.target.value))}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Note (optional)
                      </label>
                      <Input
                        placeholder="Add context…"
                        defaultValue={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleCounter} disabled={busy}>
                        Submit Counter
                      </Button>
                      <Button onClick={handleAccept} disabled={busy || !canAccept}>
                        Accept Counter
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Figure({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight
          ? "border-brand-200 bg-brand-50/60 dark:border-brand-500/30 dark:bg-brand-500/10"
          : "border-gray-100 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-950/40"
      }`}
    >
      <div className="text-xs text-gray-400">{label}</div>
      <div
        className={`mt-0.5 font-bold ${
          highlight
            ? "text-brand-600 dark:text-brand-400"
            : "text-gray-800 dark:text-white/90"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
