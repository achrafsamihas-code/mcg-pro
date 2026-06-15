"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import {
  createDispute,
  fetchBuyerDisputes,
  postBuyerDisputeMessage,
} from "@/lib/customer/data";
import type {
  BuyerDispute,
  DisputeAgainst,
  DisputeCategory,
  DisputeMessage,
  DisputePriority,
  DisputeStatus,
  NewDisputeInput,
} from "@/lib/customer/types";
import { formatRelativeTime } from "@/lib/admin/format";
import { PaperPlaneIcon, PlusIcon } from "@/icons";

const STATUS_COLOR: Record<DisputeStatus, "info" | "warning" | "success" | "error"> = {
  open: "info",
  in_review: "warning",
  resolved: "success",
  escalated: "error",
};

const PRIORITY_COLOR: Record<DisputePriority, "light" | "warning" | "error"> = {
  low: "light",
  medium: "warning",
  high: "error",
};

const CATEGORY_LABEL: Record<DisputeCategory, string> = {
  damaged_goods: "Damaged Goods",
  shipment_delay: "Shipment Delay",
  quality_issue: "Quality Issue",
  billing: "Billing",
  other: "Other",
};

function statusLabel(s: DisputeStatus) {
  return s.replace("_", " ");
}

export default function DisputesClient() {
  const [disputes, setDisputes] = useState<BuyerDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const { isOpen, openModal, closeModal } = useModal();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    fetchBuyerDisputes().then((res) => {
      if (mounted) {
        setDisputes(res);
        setActiveId(res[0]?.id ?? null);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const active = useMemo(
    () => disputes.find((d) => d.id === activeId) ?? null,
    [disputes, activeId]
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, activeId]);

  const send = async () => {
    if (!draft.trim() || !active) return;
    setSending(true);
    const message: DisputeMessage = {
      id: `local-${Date.now()}`,
      author: "You",
      authorRole: "buyer",
      body: draft.trim(),
      createdAt: new Date().toISOString(),
    };
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === active.id
          ? { ...d, messages: [...d.messages, message], updatedAt: message.createdAt }
          : d
      )
    );
    setDraft("");
    await postBuyerDisputeMessage(active.id, message.body);
    setSending(false);
  };

  const handleCreate = async (input: NewDisputeInput) => {
    const optimistic: BuyerDispute = {
      id: `local-${Date.now()}`,
      reference: `TKT-${Math.floor(5000 + Math.random() * 999)}`,
      subject: input.subject,
      category: input.category,
      against: input.against,
      orderRef: input.orderRef,
      priority: input.priority,
      status: "open",
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `local-${Date.now()}-m`,
          author: "You",
          authorRole: "buyer",
          body: input.details,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    setDisputes((prev) => [optimistic, ...prev]);
    setActiveId(optimistic.id);
    await createDispute(input);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadCrumb pageTitle="Dispute & Claims Center" />
        <Button startIcon={<PlusIcon className="size-5" />} onClick={openModal}>
          Open New Dispute
        </Button>
      </div>

      <div className="grid h-[calc(100vh-240px)] min-h-[520px] grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        {/* LEFT: ticket list */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h3 className="font-semibold text-gray-800 dark:text-white/90">
              My Tickets
            </h3>
            <p className="text-xs text-gray-400">
              {disputes.filter((d) => d.status !== "resolved").length} active
            </p>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800"
                  />
                ))}
              </div>
            ) : disputes.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400">
                No disputes raised.
              </div>
            ) : (
              disputes.map((d) => {
                const isActive = d.id === activeId;
                return (
                  <button
                    key={d.id}
                    onClick={() => setActiveId(d.id)}
                    className={`w-full border-b border-gray-50 px-5 py-4 text-left transition dark:border-gray-800/60 ${
                      isActive
                        ? "bg-brand-50/60 dark:bg-brand-500/10"
                        : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gray-400">
                        {d.reference}
                      </span>
                      <Badge size="sm" color={PRIORITY_COLOR[d.priority]}>
                        {d.priority}
                      </Badge>
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm font-medium text-gray-800 dark:text-white/90">
                      {d.subject}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs capitalize text-gray-400">
                        vs {d.against}
                      </span>
                      <Badge size="sm" color={STATUS_COLOR[d.status]}>
                        {statusLabel(d.status)}
                      </Badge>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT: conversation */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
              Select a ticket or open a new dispute.
            </div>
          ) : (
            <>
              <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-800 dark:text-white/90">
                    {active.subject}
                  </h3>
                  <Badge size="sm" color={STATUS_COLOR[active.status]}>
                    {statusLabel(active.status)}
                  </Badge>
                </div>
                <p className="mt-0.5 text-xs text-gray-400">
                  {active.reference} · {CATEGORY_LABEL[active.category]} · Order{" "}
                  {active.orderRef} · against {active.against}
                </p>
              </div>

              <div
                ref={scrollRef}
                className="flex-1 space-y-4 overflow-y-auto bg-gray-50/40 px-6 py-5 custom-scrollbar dark:bg-gray-950/30"
              >
                {active.messages.map((m) => {
                  const isBuyer = m.authorRole === "buyer";
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isBuyer ? "justify-end" : "justify-start"}`}
                    >
                      <div className="max-w-[78%]">
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm ${
                            isBuyer
                              ? "rounded-br-sm bg-brand-500 text-white"
                              : "rounded-bl-sm bg-white text-gray-700 ring-1 ring-gray-200 dark:bg-white/[0.05] dark:text-gray-200 dark:ring-gray-800"
                          }`}
                        >
                          {m.body}
                        </div>
                        <div
                          className={`mt-1 flex items-center gap-1.5 text-[11px] text-gray-400 ${
                            isBuyer ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span className="font-medium">{m.author}</span>
                          <span>·</span>
                          <span>{formatRelativeTime(m.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

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
                    placeholder="Message the mediator…"
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

      <NewDisputeModal isOpen={isOpen} onClose={closeModal} onSubmit={handleCreate} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* New dispute creation modal                                                 */
/* -------------------------------------------------------------------------- */

function NewDisputeModal({
  isOpen,
  onClose,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: NewDisputeInput) => Promise<void> | void;
}) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<DisputeCategory>("damaged_goods");
  const [against, setAgainst] = useState<DisputeAgainst>("supplier");
  const [orderRef, setOrderRef] = useState("");
  const [priority, setPriority] = useState<DisputePriority>("medium");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = subject.trim() && orderRef.trim() && details.trim();

  const reset = () => {
    setSubject("");
    setCategory("damaged_goods");
    setAgainst("supplier");
    setOrderRef("");
    setPriority("medium");
    setDetails("");
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await onSubmit({
      subject: subject.trim(),
      category,
      against,
      orderRef: orderRef.trim(),
      priority,
      details: details.trim(),
    });
    setSubmitting(false);
    reset();
    onClose();
  };

  const selectClass =
    "h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90";

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-xl p-6 sm:p-8">
      <div className="max-h-[80vh] overflow-y-auto custom-scrollbar pr-1">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Open a Dispute
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Raise an official claim. The Admin/CEO team will mediate.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <Label htmlFor="d-subject">Subject</Label>
            <Input
              id="d-subject"
              placeholder="e.g. Damaged goods on arrival"
              defaultValue={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="d-category">Category</Label>
              <select
                id="d-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as DisputeCategory)}
                className={selectClass}
              >
                {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                  <option key={value} value={value} className="dark:bg-gray-900">
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="d-against">Against</Label>
              <select
                id="d-against"
                value={against}
                onChange={(e) => setAgainst(e.target.value as DisputeAgainst)}
                className={selectClass}
              >
                <option value="supplier" className="dark:bg-gray-900">Supplier</option>
                <option value="warehouse" className="dark:bg-gray-900">Warehouse</option>
                <option value="logistics" className="dark:bg-gray-900">Logistics</option>
              </select>
            </div>
            <div>
              <Label htmlFor="d-order">Related order reference</Label>
              <Input
                id="d-order"
                placeholder="e.g. DEAL-10241"
                defaultValue={orderRef}
                onChange={(e) => setOrderRef(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="d-priority">Priority</Label>
              <select
                id="d-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as DisputePriority)}
                className={selectClass}
              >
                <option value="low" className="dark:bg-gray-900">Low</option>
                <option value="medium" className="dark:bg-gray-900">Medium</option>
                <option value="high" className="dark:bg-gray-900">High</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="d-details">Details</Label>
            <textarea
              id="d-details"
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Describe the issue in detail…"
              className="w-full resize-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? "Submitting…" : "Submit Dispute"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
