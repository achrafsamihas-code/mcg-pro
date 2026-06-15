"use client";

import React from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import type { CapacitySnapshot } from "@/lib/warehouse/types";
import { formatNumber } from "@/lib/admin/format";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export default function CapacityDonut({
  capacity,
  alertThreshold = 90,
}: {
  capacity: CapacitySnapshot;
  alertThreshold?: number;
}) {
  const free = Math.max(0, capacity.totalPallets - capacity.occupiedPallets);
  const occupancyPct = capacity.totalPallets
    ? Math.round((capacity.occupiedPallets / capacity.totalPallets) * 100)
    : 0;
  const overThreshold = occupancyPct >= alertThreshold;

  const options: ApexOptions = {
    chart: { type: "donut", fontFamily: "Outfit, sans-serif" },
    labels: ["Occupied", "Free"],
    colors: [overThreshold ? "#f04438" : "#465fff", "#e5e7eb"],
    legend: { show: false },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    plotOptions: {
      pie: {
        donut: {
          size: "72%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Occupancy",
              fontSize: "13px",
              color: "#9ca3af",
              formatter: () => `${occupancyPct}%`,
            },
            value: {
              fontSize: "24px",
              fontWeight: 700,
              color: overThreshold ? "#f04438" : "#465fff",
              formatter: () => `${occupancyPct}%`,
            },
          },
        },
      },
    },
    tooltip: { y: { formatter: (v: number) => `${formatNumber(v)} pallets` } },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          Space Utilisation
        </h3>
        {overThreshold && (
          <span className="rounded-full bg-error-50 px-2.5 py-0.5 text-xs font-medium text-error-600 dark:bg-error-500/15 dark:text-error-500">
            Near capacity
          </span>
        )}
      </div>

      <ReactApexChart
        options={options}
        series={[capacity.occupiedPallets, free]}
        type="donut"
        height={240}
      />

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-950/40">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
            <span className="text-xs text-gray-400">Occupied</span>
          </div>
          <div className="mt-1 font-bold text-gray-800 dark:text-white/90">
            {formatNumber(capacity.occupiedPallets)}
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-950/40">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
            <span className="text-xs text-gray-400">Free</span>
          </div>
          <div className="mt-1 font-bold text-gray-800 dark:text-white/90">
            {formatNumber(free)}
          </div>
        </div>
      </div>
    </div>
  );
}
