"use client";

import React, { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import type {
  BulkOrderInput,
  MarketplaceProduct,
} from "@/lib/customer/types";
import { formatCurrency } from "@/lib/admin/format";
import { resolveTierPrice } from "@/lib/customer/pricing";

interface BulkOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: MarketplaceProduct | null;
  onSubmit: (input: BulkOrderInput) => Promise<void> | void;
}

export default function BulkOrderModal({
  isOpen,
  onClose,
  product,
  onSubmit,
}: BulkOrderModalProps) {
  const [quantity, setQuantity] = useState<number>(product?.moq ?? 100);
  const [targetPrice, setTargetPrice] = useState<number>(0);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Suggested unit price at the chosen quantity (from the tier table).
  const tierPrice = useMemo(
    () => (product ? resolveTierPrice(product, quantity) : 0),
    [product, quantity]
  );

  const estTotal = (targetPrice || tierPrice) * quantity;

  const handleSubmit = async () => {
    if (!product || quantity <= 0) return;
    setSubmitting(true);
    await onSubmit({
      productId: product.id,
      quantity,
      targetPrice: targetPrice || tierPrice,
      note: note.trim() || undefined,
    });
    setSubmitting(false);
    setNote("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="m-4 max-w-lg p-6 sm:p-8">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
        Place Bulk Order
      </h3>
      {product && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {product.name} · {product.supplier} · MOQ {product.moq.toLocaleString()}
        </p>
      )}

      <div className="mt-6 space-y-5">
        <div>
          <Label htmlFor="bo-qty">Quantity (units)</Label>
          <Input
            id="bo-qty"
            type="number"
            min={product?.moq?.toString() ?? "1"}
            defaultValue={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
          {product && quantity < product.moq && (
            <p className="mt-1.5 text-xs text-error-500">
              Below minimum order quantity of {product.moq.toLocaleString()}.
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="bo-target">Target unit price (USD)</Label>
          <Input
            id="bo-target"
            type="number"
            min="0"
            step={0.01}
            placeholder={tierPrice ? tierPrice.toString() : "Your offer"}
            onChange={(e) => setTargetPrice(Number(e.target.value))}
          />
          <p className="mt-1.5 text-xs text-gray-400">
            Suggested at this volume: {formatCurrency(tierPrice)} / unit
          </p>
        </div>

        <div>
          <Label htmlFor="bo-note">Note to supplier (optional)</Label>
          <Input
            id="bo-note"
            placeholder="Add context to your offer…"
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-950/40">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">
              Estimated order value
            </span>
            <span className="font-bold text-gray-800 dark:text-white/90">
              {formatCurrency(estTotal)}
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
          disabled={!product || quantity <= 0 || submitting}
        >
          {submitting ? "Submitting…" : "Initiate Negotiation"}
        </Button>
      </div>
    </Modal>
  );
}
