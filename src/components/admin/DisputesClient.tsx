"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import { fetchDisputeTickets, postDisputeMessage } from "@/lib/admin/data";
import type {
  DisputeMessage,
  DisputePriority,
  DisputeStatus,
  DisputeTicket,
} from "@/lib/admin/types";
import { formatRelativeTime } from "@/lib/admin/format";
import { PaperPlaneIcon } from "@/icons";

const PRIORITY_COLOR: Record<DisputePriority, "light" | "warning" | "error"> = {
  low: "light",
  medium: "warning",
  high: "error",
  critical: "error",
};

const STATUS_COLOR: Record<DisputeStatus, "success" | "warning" | "info" | "error"> = {
  open: "info",
  in_review: "warning",
  resolved: "success",
  escalated: "error",
};

function statusLabel(s: DisputeStatus) {
  return s.replace("_", " ");
}

export default function DisputesClient() {
  const [tickets, setTickets] = useState<DisputeTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    fetchDisputeTickets().then((res) => {
      if (mounted) {
        setTickets(res);
        setActiveId(res[0]?.id ?? null);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const active = useMemo(
    () => tickets.find((t) => t.id === activeId) ?? null,
    [tickets, activeId]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, activeId]);

  const send = async () => {
    if (!draft.trim() || !active) return;
    setSending(true);
    const message: DisputeMessage = {
      id: `local-${Date.now()}`,
      author: "Platform Admin",
      authorRole: "admin",
      body: draft.trim(),
      createdAt: new Date().toISOString(),
    };
    setTickets((prev) =>
      prev.map((t) =>
        t.id === active.id
          ? { ...t, messages: [...t.messages, message], updatedAt: message.createdAt }
          : t
      )
    );
    setDraft("");
    await postDisputeMessage(active.id, message.body);
    setSending(false);
  };

  const setStatus = (status: DisputeStatus) => {
    if (!active) return;
    setTickets((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, status } : t))
    );
  };

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Dispute & Ticket Resolution Hub" />

      <div className="grid h-[calc(100vh-220px)] min-h-[520px] grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        {/* ----------------------------- LEFT: ticket list ----------------------------- */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h3 className="font-semibold text-gray-800 dark:text-white/90">
              Open Tickets
            </h3>
            <p className="text-xs text-gray-400">
              {tickets.filter((t) => t.status !== "resolved").length} active
            </p>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
                  />
                ))}
              </div>
            ) : (
              tickets.map((t) => {
                const isActive = t.id === activeId;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveId(t.id)}
                    className={`w-full border-b border-gray-50 px-5 py-4 text-left transition dark:border-gray-800/60 ${
                      isActive
                        ? "bg-brand-50/60 dark:bg-brand-500/10"
                        : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gray-400">
                        {t.reference}
                      </span>
                      <Badge size="sm" color={PRIORITY_COLOR[t.priority]}>
                        {t.priority}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm font-medium text-gray-800 dark:text-white/90">
                      {t.subject}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-400">{t.parties}</span>
                      <Badge size="sm" color={STATUS_COLOR[t.status]}>
                        {statusLabel(t.status)}
                      </Badge>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ----------------------------- RIGHT: resolution panel ----------------------------- */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
              Select a ticket to begin mediation.
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-6 py-4 dark:border-gray-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 dark:text-white/90">
                      {active.subject}
                    </h3>
                    <Badge size="sm" color={STATUS_COLOR[active.status]}>
                      {statusLabel(active.status)}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {active.reference} · Order {active.orderRef} · {active.parties}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setStatus("escalated")}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-error-600 ring-1 ring-inset ring-error-200 transition hover:bg-error-50 dark:text-error-500 dark:ring-error-500/30 dark:hover:bg-error-500/10"
                  >
                    Escalate
                  </button>
                  <button
                    onClick={() => setStatus("resolved")}
                    className="rounded-lg bg-success-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-success-600"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 space-y-4 overflow-y-auto bg-gray-50/40 px-6 py-5 custom-scrollbar dark:bg-gray-950/30"
              >
                {active.messages.map((m) => {
                  const isAdmin = m.authorRole === "admin";
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[78%] ${isAdmin ? "items-end" : "items-start"}`}>
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm ${
                            isAdmin
                              ? "rounded-br-sm bg-brand-500 text-white"
                              : "rounded-bl-sm bg-white text-gray-700 ring-1 ring-gray-200 dark:bg-white/[0.05] dark:text-gray-200 dark:ring-gray-800"
                          }`}
                        >
                          {m.body}
                        </div>
                        <div
                          className={`mt-1 flex items-center gap-1.5 text-[11px] text-gray-400 ${
                            isAdmin ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span className="font-medium capitalize">{m.author}</span>
                          <span>·</span>
                          <span>{formatRelativeTime(m.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Composer */}
              <div className="border-t border-gray-100 p-4 dark:border-gray-800">
                <div className="flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    placeholder="Type your resolution message…"
                    className="h-11 max-h-32 flex-1 resize-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
                  />
                  <button
                    onClick={send}
                    disabled={!draft.trim() || sending}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Send message"
                  >
                    <PaperPlaneIcon className="size-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
