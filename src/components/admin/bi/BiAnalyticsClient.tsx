"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import { fetchBiAnalytics } from "@/lib/admin/data";
import type { BiAnalytics } from "@/lib/admin/types";
import { formatNumber, formatPct } from "@/lib/admin/format";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const BRAND = "#465fff";
const PALETTE = ["#465fff", "#9b8afb", "#12b76a", "#f79009", "#f04438"];

function ChartCard({
  title,
  desc,
  children,
  className = "",
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
          {title}
        </h3>
        {desc && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {desc}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function BiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-80 animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <div className="mb-4 h-4 w-40 rounded bg-gray-100 dark:bg-gray-800" />
          <div className="h-56 rounded-xl bg-gray-100 dark:bg-gray-800" />
        </div>
      ))}
    </div>
  );
}

export default function BiAnalyticsClient() {
  const [data, setData] = useState<BiAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchBiAnalytics().then((res) => {
      if (mounted) {
        setData(res);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Business Intelligence" />

      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Strategic Analytics
        </h2>
        <p className="mt-1 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
          Demand signals, supplier performance, global trade hotspots, and
          forward-looking AI growth forecasting for the next quarter.
        </p>
      </div>

      {loading || !data ? (
        <BiSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TopProductsChart data={data} />
            <TradeVolumeChart data={data} />
          </div>

          <SupplierPerformanceChart data={data} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <HotspotsPanel data={data} />
            <ForecastPanel data={data} />
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 1. Top 5 products — horizontal bar                                         */
/* -------------------------------------------------------------------------- */

function TopProductsChart({ data }: { data: BiAnalytics }) {
  const options: ApexOptions = {
    chart: { type: "bar", fontFamily: "Outfit, sans-serif", toolbar: { show: false } },
    colors: PALETTE,
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 5,
        distributed: true,
        barHeight: "60%",
      },
    },
    dataLabels: { enabled: true, formatter: (v: number) => formatNumber(v) },
    legend: { show: false },
    xaxis: {
      categories: data.topProducts.map((p) => p.name),
      labels: { style: { colors: "#9ca3af" } },
    },
    yaxis: { labels: { style: { colors: "#9ca3af" } } },
    grid: { borderColor: "#e5e7eb33" },
    tooltip: { y: { formatter: (v: number) => `${formatNumber(v)} requests` } },
  };

  return (
    <ChartCard
      title="Top 5 Requested B2B Products"
      desc="Most in-demand products by buyer request volume"
    >
      <ReactApexChart
        options={options}
        series={[{ name: "Requests", data: data.topProducts.map((p) => p.requests) }]}
        type="bar"
        height={300}
      />
    </ChartCard>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Monthly trade volume — area                                             */
/* -------------------------------------------------------------------------- */

function TradeVolumeChart({ data }: { data: BiAnalytics }) {
  const options: ApexOptions = {
    chart: {
      type: "area",
      fontFamily: "Outfit, sans-serif",
      toolbar: { show: false },
    },
    colors: [BRAND],
    stroke: { curve: "smooth", width: 3 },
    fill: {
      type: "gradient",
      gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: data.tradeVolume.map((d) => d.month),
      labels: { style: { colors: "#9ca3af" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: "#9ca3af" } } },
    grid: { borderColor: "#e5e7eb33" },
    tooltip: { y: { formatter: (v: number) => `${formatNumber(v)}K units` } },
  };

  return (
    <ChartCard
      title="Monthly Trade Volume"
      desc="Platform-wide trade throughput trend (in thousands of units)"
    >
      <ReactApexChart
        options={options}
        series={[{ name: "Volume", data: data.tradeVolume.map((d) => d.volume) }]}
        type="area"
        height={300}
      />
    </ChartCard>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Top-performing suppliers — multi-series line                            */
/* -------------------------------------------------------------------------- */

function SupplierPerformanceChart({ data }: { data: BiAnalytics }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const options: ApexOptions = {
    chart: { type: "line", fontFamily: "Outfit, sans-serif", toolbar: { show: false } },
    colors: PALETTE,
    stroke: { curve: "smooth", width: 3 },
    markers: { size: 0, hover: { size: 5 } },
    dataLabels: { enabled: false },
    legend: { position: "top", horizontalAlign: "left", labels: { colors: "#9ca3af" } },
    xaxis: {
      categories: months,
      labels: { style: { colors: "#9ca3af" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: "#9ca3af" } } },
    grid: { borderColor: "#e5e7eb33" },
  };

  return (
    <ChartCard
      title="Top-Performing Suppliers"
      desc="Monthly trade volume by leading supplier"
    >
      <ReactApexChart
        options={options}
        series={data.supplierPerformance.map((s) => ({
          name: s.supplier,
          data: s.monthlyVolume,
        }))}
        type="line"
        height={320}
      />
    </ChartCard>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Hotspots — styled intensity list                                        */
/* -------------------------------------------------------------------------- */

function HotspotsPanel({ data }: { data: BiAnalytics }) {
  return (
    <ChartCard
      title="Trade Hotspots"
      desc="Top importing / destination cities by shipment volume"
    >
      <div className="space-y-4">
        {data.hotspots.map((h) => (
          <div key={`${h.city}-${h.country}`} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800 dark:text-white/90">
                  {h.city}
                </span>
                <span className="text-xs text-gray-400">{h.country}</span>
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {formatNumber(h.shipments)}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-700"
                style={{ width: `${h.intensity}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. AI growth forecasting — radial + signal cards                           */
/* -------------------------------------------------------------------------- */

function ForecastPanel({ data }: { data: BiAnalytics }) {
  const signalColor = (signal: string) =>
    signal === "bullish" ? "success" : signal === "bearish" ? "error" : "warning";

  return (
    <ChartCard
      title="Next-Quarter AI Growth Forecast"
      desc="Model-projected indicators with confidence levels"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {data.forecasts.map((f) => {
          const positive = f.projectedGrowthPct >= 0;
          return (
            <div
              key={f.label}
              className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-950/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {f.label}
                </span>
                <Badge size="sm" color={signalColor(f.signal)}>
                  {f.signal}
                </Badge>
              </div>
              <div
                className={`mt-2 text-2xl font-bold ${
                  positive ? "text-success-600 dark:text-success-500" : "text-error-600 dark:text-error-500"
                }`}
              >
                {formatPct(f.projectedGrowthPct)}
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Confidence</span>
                  <span>{f.confidence}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${f.confidence}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}
