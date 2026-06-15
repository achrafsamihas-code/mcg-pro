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
import {
  fetchManagedAccounts,
  setSupplierVerified,
  updateAccountStatus,
} from "@/lib/admin/data";
import type {
  AccountStatus,
  AccountType,
  ManagedAccount,
} from "@/lib/admin/types";
import { CheckCircleIcon } from "@/icons";

const TABS: { key: AccountType; label: string }[] = [
  { key: "user", label: "Users" },
  { key: "supplier", label: "Suppliers" },
  { key: "driver", label: "Drivers" },
  { key: "warehouse", label: "Warehouses" },
];

const STATUS_COLOR: Record<AccountStatus, "success" | "warning" | "error" | "light"> = {
  active: "success",
  pending: "warning",
  suspended: "error",
  rejected: "error",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
        />
      ))}
    </div>
  );
}

export default function ManagementClient() {
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AccountType>("user");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchManagedAccounts().then((res) => {
      if (mounted) {
        setAccounts(res);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const rows = useMemo(
    () => accounts.filter((a) => a.type === activeTab),
    [accounts, activeTab]
  );

  const tabCount = (type: AccountType) =>
    accounts.filter((a) => a.type === type).length;

  /* ----------------------------- action triggers ----------------------------- */

  const handleStatus = async (id: string, status: AccountStatus) => {
    setBusyId(id);
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
    await updateAccountStatus(id, status);
    setBusyId(null);
  };

  const handleVerify = async (id: string, verified: boolean) => {
    setBusyId(id);
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, verified } : a))
    );
    await setSupplierVerified(id, verified);
    setBusyId(null);
  };

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="User & Supplier Control Center" />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-1.5 dark:border-gray-800 dark:bg-white/[0.03]">
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-brand-500 text-white shadow-theme-xs"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.05]"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${
                  active
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {tabCount(tab.key)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {loading ? (
          <TableSkeleton />
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
            No {activeTab}s found.
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-gray-800">
                <TableRow>
                  {["Account", "Region", "Joined", "Status", "Actions"].map(
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
                {rows.map((acc) => (
                  <TableRow
                    key={acc.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 dark:border-gray-800/60 dark:hover:bg-white/[0.02]"
                  >
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
                          {initials(acc.name)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-gray-800 dark:text-white/90">
                              {acc.name}
                            </span>
                            {acc.type === "supplier" && acc.verified && (
                              <CheckCircleIcon className="size-4 text-brand-500" />
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            {acc.email}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {acc.region}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {acc.joinedAt}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <Badge size="sm" color={STATUS_COLOR[acc.status]}>
                        {acc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      <RowActions
                        account={acc}
                        busy={busyId === acc.id}
                        onStatus={handleStatus}
                        onVerify={handleVerify}
                      />
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

/* -------------------------------------------------------------------------- */
/* Row action triggers — contextual by account type/status                    */
/* -------------------------------------------------------------------------- */

function ActionButton({
  label,
  tone,
  disabled,
  onClick,
}: {
  label: string;
  tone: "approve" | "danger" | "neutral" | "brand";
  disabled?: boolean;
  onClick: () => void;
}) {
  const tones: Record<typeof tone, string> = {
    approve:
      "text-success-600 ring-success-200 hover:bg-success-50 dark:text-success-500 dark:ring-success-500/30 dark:hover:bg-success-500/10",
    danger:
      "text-error-600 ring-error-200 hover:bg-error-50 dark:text-error-500 dark:ring-error-500/30 dark:hover:bg-error-500/10",
    neutral:
      "text-gray-600 ring-gray-200 hover:bg-gray-50 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.05]",
    brand:
      "text-brand-600 ring-brand-200 hover:bg-brand-50 dark:text-brand-400 dark:ring-brand-500/30 dark:hover:bg-brand-500/10",
  };
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

function RowActions({
  account,
  busy,
  onStatus,
  onVerify,
}: {
  account: ManagedAccount;
  busy: boolean;
  onStatus: (id: string, status: AccountStatus) => void;
  onVerify: (id: string, verified: boolean) => void;
}) {
  const { id, type, status, verified } = account;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Driver registration approval flow */}
      {type === "driver" && status === "pending" && (
        <>
          <ActionButton label="Approve" tone="approve" disabled={busy} onClick={() => onStatus(id, "active")} />
          <ActionButton label="Reject" tone="danger" disabled={busy} onClick={() => onStatus(id, "rejected")} />
        </>
      )}

      {/* Supplier verification badge */}
      {type === "supplier" &&
        (verified ? (
          <ActionButton label="Revoke Badge" tone="neutral" disabled={busy} onClick={() => onVerify(id, false)} />
        ) : (
          <ActionButton label="Grant Verified" tone="brand" disabled={busy} onClick={() => onVerify(id, true)} />
        ))}

      {/* Pending supplier/user approval */}
      {(type === "supplier" || type === "user" || type === "warehouse") &&
        status === "pending" && (
          <ActionButton label="Activate" tone="approve" disabled={busy} onClick={() => onStatus(id, "active")} />
        )}

      {/* Ban / reactivate */}
      {status === "active" && (
        <ActionButton label="Ban / Deactivate" tone="danger" disabled={busy} onClick={() => onStatus(id, "suspended")} />
      )}
      {status === "suspended" && (
        <ActionButton label="Reactivate" tone="approve" disabled={busy} onClick={() => onStatus(id, "active")} />
      )}
    </div>
  );
}
