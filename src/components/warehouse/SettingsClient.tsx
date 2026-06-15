"use client";

import React, { useEffect, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Switch from "@/components/form/switch/Switch";
import {
  fetchWarehouseConfig,
  fetchWarehouseSnapshot,
  saveWarehouseConfig,
} from "@/lib/warehouse/data";
import type { WarehouseConfig } from "@/lib/warehouse/types";
import { formatCurrency } from "@/lib/admin/format";

function SectionCard({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h3>
        {desc && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{desc}</p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function SettingsClient() {
  const [config, setConfig] = useState<WarehouseConfig | null>(null);
  const [occupancyPct, setOccupancyPct] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchWarehouseConfig(), fetchWarehouseSnapshot()]).then(
      ([cfg, snap]) => {
        if (mounted) {
          setConfig(cfg);
          const pct = snap.capacity.totalPallets
            ? Math.round(
                (snap.capacity.occupiedPallets / snap.capacity.totalPallets) *
                  100
              )
            : 0;
          setOccupancyPct(pct);
          setLoading(false);
        }
      }
    );
    return () => {
      mounted = false;
    };
  }, []);

  const update = <K extends keyof WarehouseConfig>(
    key: K,
    value: WarehouseConfig[K]
  ) => {
    setConfig((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    await saveWarehouseConfig(config);
    setSaving(false);
    setSaved(true);
  };

  if (loading || !config) {
    return (
      <div className="space-y-6">
        <PageBreadCrumb pageTitle="Pricing & Capacity" />
        <div className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
        <div className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
      </div>
    );
  }

  const alertActive =
    config.occupancyAlertEnabled &&
    occupancyPct >= config.occupancyAlertThreshold;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadCrumb pageTitle="Pricing & Capacity" />
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-success-600 dark:text-success-500">
              Saved
            </span>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* High-occupancy live alert */}
      {alertActive && (
        <div className="flex items-start gap-3 rounded-2xl border border-error-200 bg-error-50 p-4 dark:border-error-500/30 dark:bg-error-500/10">
          <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 size-5 shrink-0 text-error-500">
            <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-error-700 dark:text-error-400">
              Occupancy alert: {occupancyPct}% utilised
            </p>
            <p className="text-sm text-error-600 dark:text-error-500/90">
              Current occupancy has exceeded your {config.occupancyAlertThreshold}% threshold. Consider pausing new booking approvals.
            </p>
          </div>
        </div>
      )}

      {/* Pricing */}
      <SectionCard
        title="Pricing Variables"
        desc="Set the rates charged to suppliers for storage."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="price-sqm">Price per square meter / month (USD)</Label>
            <Input
              id="price-sqm"
              type="number"
              min="0"
              step={0.01}
              defaultValue={config.pricePerSqm}
              onChange={(e) => update("pricePerSqm", Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="price-pallet">Price per pallet / day (USD)</Label>
            <Input
              id="price-pallet"
              type="number"
              min="0"
              step={0.01}
              defaultValue={config.pricePerPalletDay}
              onChange={(e) =>
                update("pricePerPalletDay", Number(e.target.value))
              }
            />
          </div>
        </div>
      </SectionCard>

      {/* Capacity */}
      <SectionCard
        title="Capacity Thresholds"
        desc="Define the total storage capacity of this warehouse."
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="cap-pallets">Total capacity (pallets)</Label>
            <Input
              id="cap-pallets"
              type="number"
              min="0"
              defaultValue={config.capacityPallets}
              onChange={(e) =>
                update("capacityPallets", Number(e.target.value))
              }
            />
          </div>
          <div>
            <Label htmlFor="cap-sqm">Total floor area (m²)</Label>
            <Input
              id="cap-sqm"
              type="number"
              min="0"
              defaultValue={config.capacitySqm}
              onChange={(e) => update("capacitySqm", Number(e.target.value))}
            />
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 text-sm dark:border-gray-800 dark:bg-gray-950/40">
          <span className="text-gray-500 dark:text-gray-400">
            Estimated full-occupancy monthly revenue:{" "}
          </span>
          <span className="font-semibold text-gray-800 dark:text-white/90">
            {formatCurrency(config.capacityPallets * config.pricePerPalletDay * 30)}
          </span>
        </div>
      </SectionCard>

      {/* Occupancy alert config */}
      <SectionCard
        title="Occupancy Alert"
        desc="Get notified automatically when the warehouse fills up."
      >
        <div className="space-y-5">
          <Switch
            label="Enable high-occupancy alert"
            defaultChecked={config.occupancyAlertEnabled}
            onChange={(checked) => update("occupancyAlertEnabled", checked)}
          />

          <div>
            <Label htmlFor="threshold">
              Alert when occupancy exceeds ({config.occupancyAlertThreshold}%)
            </Label>
            <input
              id="threshold"
              type="range"
              min={50}
              max={100}
              step={1}
              value={config.occupancyAlertThreshold}
              onChange={(e) =>
                update("occupancyAlertThreshold", Number(e.target.value))
              }
              disabled={!config.occupancyAlertEnabled}
              className="mt-2 w-full accent-brand-500 disabled:opacity-50"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-400">
              <span>50%</span>
              <span>Current occupancy: {occupancyPct}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
