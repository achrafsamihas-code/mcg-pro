"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import {
  fetchWarehouseBookings,
  fetchWarehouseOptions,
  requestWarehouseBooking,
} from "@/lib/supplier/data";
import type {
  BookingStatus,
  NewBookingInput,
  WarehouseBooking,
  WarehouseOption,
} from "@/lib/supplier/types";
import { formatCurrency, formatNumber } from "@/lib/admin/format";
import { PlusIcon } from "@/icons";

const STATUS_META: Record<
  BookingStatus,
  { label: string; color: "warning" | "success" | "light" | "error" }
> = {
  pending_approval: { label: "Pending Approval", color: "warning" },
  active: { label: "Active", color: "success" },
  expired: { label: "Expired", color: "light" },
  rejected: { label: "Rejected", color: "error" },
};

/**
 * Live accrued-fee counter for active bookings.
 * Fee accrues continuously: pallets × ratePerPalletDay, prorated per second
 * from the booking start date. Demonstrates the "automated storage fee counter".
 */
function useLiveFee(booking: WarehouseBooking): number {
  const [fee, setFee] = useState(booking.accruedFee);

  useEffect(() => {
    if (booking.status !== "active") {
      setFee(booking.accruedFee);
      return;
    }
    const ratePerSecond =
      (booking.pallets * booking.ratePerPalletDay) / (24 * 60 * 60);
    const start = new Date(booking.startDate).getTime();

    const compute = () => {
      const elapsedSec = Math.max(0, (Date.now() - start) / 1000);
      setFee(elapsedSec * ratePerSecond);
    };

    compute();
    const interval = setInterval(compute, 1000);
    return () => clearInterval(interval);
  }, [booking]);

  return fee;
}

export default function WarehousesClient() {
  const [options, setOptions] = useState<WarehouseOption[]>([]);
  const [bookings, setBookings] = useState<WarehouseBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const { isOpen, openModal, closeModal } = useModal();
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseOption | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchWarehouseOptions(), fetchWarehouseBookings()]).then(
      ([opts, bks]) => {
        if (mounted) {
          setOptions(opts);
          setBookings(bks);
          setLoading(false);
        }
      }
    );
    return () => {
      mounted = false;
    };
  }, []);

  const openBookingFor = (w: WarehouseOption) => {
    setSelectedWarehouse(w);
    openModal();
  };

  const handleRequest = async (input: NewBookingInput) => {
    const warehouse = options.find((w) => w.id === input.warehouseId);
    if (!warehouse) return;
    const optimistic: WarehouseBooking = {
      id: `local-${Date.now()}`,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      city: warehouse.city,
      pallets: input.pallets,
      status: "pending_approval",
      ratePerPalletDay: warehouse.ratePerPalletDay,
      startDate: input.startDate,
      endDate: null,
      accruedFee: 0,
    };
    setBookings((prev) => [optimistic, ...prev]);
    await requestWarehouseBooking(input);
  };

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="Warehouse Booking Manager" />

      {/* Active bookings */}
      <section>
        <h3 className="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">
          My Bookings
        </h3>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
              />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400 dark:border-gray-700">
            No bookings yet. Request storage space below.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bookings.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        )}
      </section>

      {/* Available warehouses */}
      <section>
        <h3 className="mb-3 text-base font-semibold text-gray-800 dark:text-white/90">
          Top-Rated Warehouses
        </h3>
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {options.map((w) => (
              <WarehouseOptionCard key={w.id} warehouse={w} onBook={() => openBookingFor(w)} />
            ))}
          </div>
        )}
      </section>

      <BookingModal
        isOpen={isOpen}
        onClose={closeModal}
        warehouse={selectedWarehouse}
        onSubmit={handleRequest}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Booking card (with live fee counter)                                       */
/* -------------------------------------------------------------------------- */

function BookingCard({ booking }: { booking: WarehouseBooking }) {
  const liveFee = useLiveFee(booking);
  const meta = STATUS_META[booking.status];
  const isActive = booking.status === "active";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-gray-800 dark:text-white/90">
            {booking.warehouseName}
          </h4>
          <p className="text-xs text-gray-400">{booking.city}</p>
        </div>
        <Badge size="sm" color={meta.color}>
          {meta.label}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-gray-400">Pallets</div>
          <div className="font-medium text-gray-800 dark:text-white/90">
            {formatNumber(booking.pallets)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-400">Rate</div>
          <div className="font-medium text-gray-800 dark:text-white/90">
            {formatCurrency(booking.ratePerPalletDay)}/pallet·day
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/60 p-3 dark:border-gray-800 dark:bg-gray-950/40">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {isActive ? "Accrued fee (live)" : "Total fee"}
          </span>
          {isActive && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success-500" />
            </span>
          )}
        </div>
        <div className="mt-1 font-mono text-lg font-bold text-gray-800 dark:text-white/90">
          {isActive
            ? `$${liveFee.toFixed(2)}`
            : formatCurrency(booking.accruedFee)}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Warehouse option card                                                      */
/* -------------------------------------------------------------------------- */

function WarehouseOptionCard({
  warehouse,
  onBook,
}: {
  warehouse: WarehouseOption;
  onBook: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03]">
      <div>
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-800 dark:text-white/90">
            {warehouse.name}
          </h4>
          <span className="inline-flex items-center gap-0.5 rounded-md bg-warning-50 px-1.5 py-0.5 text-xs font-medium text-warning-600 dark:bg-warning-500/15 dark:text-orange-400">
            ★ {warehouse.rating.toFixed(1)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-gray-400">
          {warehouse.city}, {warehouse.country}
        </p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>{formatCurrency(warehouse.ratePerPalletDay)}/pallet·day</span>
          <span>·</span>
          <span>{formatNumber(warehouse.availablePallets)} pallets free</span>
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={onBook} startIcon={<PlusIcon className="size-4" />}>
        Request
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Booking request modal                                                      */
/* -------------------------------------------------------------------------- */

function BookingModal({
  isOpen,
  onClose,
  warehouse,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  warehouse: WarehouseOption | null;
  onSubmit: (input: NewBookingInput) => Promise<void> | void;
}) {
  const [pallets, setPallets] = useState<number>(10);
  const [startDate, setStartDate] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const estimatedDaily = useMemo(
    () => (warehouse ? pallets * warehouse.ratePerPalletDay : 0),
    [warehouse, pallets]
  );

  const handleSubmit = async () => {
    if (!warehouse || pallets <= 0 || !startDate) return;
    setSubmitting(true);
    await onSubmit({ warehouseId: warehouse.id, pallets, startDate });
    setSubmitting(false);
    setPallets(10);
    setStartDate("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-md p-6 sm:p-8">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
        Request Storage Space
      </h3>
      {warehouse && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {warehouse.name} · {warehouse.city} ·{" "}
          {formatCurrency(warehouse.ratePerPalletDay)}/pallet·day
        </p>
      )}

      <div className="mt-6 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Number of pallets
          </label>
          <Input
            type="number"
            min="1"
            max={warehouse?.availablePallets?.toString()}
            defaultValue={pallets}
            onChange={(e) => setPallets(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Start date
          </label>
          <Input type="date" onChange={(e) => setStartDate(e.target.value)} />
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-950/40">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Estimated daily fee
            </span>
            <span className="font-bold text-gray-800 dark:text-white/90">
              {formatCurrency(estimatedDaily)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-7 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!warehouse || pallets <= 0 || !startDate || submitting}
        >
          {submitting ? "Submitting…" : "Submit Request"}
        </Button>
      </div>
    </Modal>
  );
}
