"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { TrashBinIcon, PlusIcon } from "@/icons";
import type {
  NewProductInput,
  PriceTier,
  ProductStatus,
} from "@/lib/supplier/types";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: NewProductInput) => Promise<void> | void;
}

const STATUS_OPTIONS: { value: ProductStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "out_of_stock", label: "Out of stock" },
];

const EMPTY_TIER: PriceTier = { minQty: 0, unitPrice: 0 };

export default function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
}: ProductFormModalProps) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<ProductStatus>("active");
  const [stock, setStock] = useState<number>(0);
  const [basePrice, setBasePrice] = useState<number>(0);
  const [tiers, setTiers] = useState<PriceTier[]>([
    { minQty: 100, unitPrice: 0 },
    { minQty: 1000, unitPrice: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setSku("");
    setCategory("");
    setStatus("active");
    setStock(0);
    setBasePrice(0);
    setTiers([
      { minQty: 100, unitPrice: 0 },
      { minQty: 1000, unitPrice: 0 },
    ]);
  };

  const updateTier = (index: number, patch: Partial<PriceTier>) => {
    setTiers((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...patch } : t))
    );
  };

  const addTier = () => setTiers((prev) => [...prev, { ...EMPTY_TIER }]);
  const removeTier = (index: number) =>
    setTiers((prev) => prev.filter((_, i) => i !== index));

  const canSubmit = name.trim() && sku.trim() && category.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const cleanTiers = tiers
      .filter((t) => t.minQty > 0 && t.unitPrice > 0)
      .sort((a, b) => a.minQty - b.minQty);
    await onSubmit({
      name: name.trim(),
      sku: sku.trim(),
      category: category.trim(),
      status,
      stock,
      basePrice,
      tiers: cleanTiers,
    });
    setSubmitting(false);
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="m-4 max-w-2xl p-6 sm:p-8"
    >
      <div className="max-h-[80vh] overflow-y-auto custom-scrollbar pr-1">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Add New Product
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Define the listing and configure B2B volume-based pricing tiers.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="p-name">Product name</Label>
            <Input
              id="p-name"
              placeholder="e.g. Industrial Steel Coils"
              defaultValue={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="p-sku">SKU</Label>
            <Input
              id="p-sku"
              placeholder="e.g. STL-COIL-G3"
              defaultValue={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="p-cat">Category</Label>
            <Input
              id="p-cat"
              placeholder="e.g. Metals"
              defaultValue={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="p-stock">Stock quantity</Label>
            <Input
              id="p-stock"
              type="number"
              min="0"
              defaultValue={stock}
              onChange={(e) => setStock(Number(e.target.value))}
            />
          </div>
          <div>
            <Label htmlFor="p-price">Base unit price (USD)</Label>
            <Input
              id="p-price"
              type="number"
              min="0"
              step={0.01}
              defaultValue={basePrice}
              onChange={(e) => setBasePrice(Number(e.target.value))}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="p-status">Status</Label>
            <select
              id="p-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProductStatus)}
              className="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="dark:bg-gray-900">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tiered pricing */}
        <div className="mt-7 rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-950/40">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                B2B Tiered Pricing
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Lower the unit price as order quantity increases.
              </p>
            </div>
            <button
              onClick={addTier}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-brand-600 ring-1 ring-inset ring-brand-200 transition hover:bg-brand-50 dark:text-brand-400 dark:ring-brand-500/30 dark:hover:bg-brand-500/10"
            >
              <PlusIcon className="size-4" />
              Add tier
            </button>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_auto] gap-3 px-1 text-xs font-medium uppercase tracking-wide text-gray-400">
              <span>Min quantity</span>
              <span>Unit price (USD)</span>
              <span className="sr-only">Remove</span>
            </div>
            {tiers.map((tier, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-center gap-3">
                <Input
                  type="number"
                  min="0"
                  defaultValue={tier.minQty}
                  onChange={(e) => updateTier(i, { minQty: Number(e.target.value) })}
                />
                <Input
                  type="number"
                  min="0"
                  step={0.01}
                  defaultValue={tier.unitPrice}
                  onChange={(e) =>
                    updateTier(i, { unitPrice: Number(e.target.value) })
                  }
                />
                <button
                  onClick={() => removeTier(i)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition hover:bg-error-50 hover:text-error-500 dark:hover:bg-error-500/10"
                  aria-label="Remove tier"
                >
                  <TrashBinIcon className="size-5" />
                </button>
              </div>
            ))}
            {tiers.length === 0 && (
              <p className="py-2 text-center text-xs text-gray-400">
                No tiers — buyers pay the base unit price at any quantity.
              </p>
            )}
          </div>
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
            {submitting ? "Saving…" : "Create Product"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
