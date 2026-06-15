"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import BulkOrderModal from "@/components/customer/BulkOrderModal";
import { useModal } from "@/hooks/useModal";
import { fetchMarketplaceProducts, placeBulkOrder } from "@/lib/customer/data";
import type { BulkOrderInput, MarketplaceProduct } from "@/lib/customer/types";
import { resolveTierPrice, tierSavingsPct } from "@/lib/customer/pricing";
import { formatCurrency, formatNumber } from "@/lib/admin/format";
import { CheckCircleIcon } from "@/icons";

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4 h-32 rounded-xl bg-gray-100 dark:bg-gray-800" />
      <div className="space-y-2">
        <div className="h-4 w-2/3 rounded bg-gray-100 dark:bg-gray-800" />
        <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-gray-800" />
      </div>
    </div>
  );
}

export default function MarketplaceClient() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("All");
  const [selected, setSelected] = useState<MarketplaceProduct | null>(null);
  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    let mounted = true;
    fetchMarketplaceProducts().then((res) => {
      if (mounted) {
        setProducts(res);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const visible = useMemo(
    () => (category === "All" ? products : products.filter((p) => p.category === category)),
    [products, category]
  );

  const openOrder = (product: MarketplaceProduct) => {
    setSelected(product);
    openModal();
  };

  const handleSubmit = async (input: BulkOrderInput) => {
    await placeBulkOrder(input);
  };

  return (
    <div className="space-y-6">
      <PageBreadCrumb pageTitle="B2B Marketplace" />

      {/* Category filter */}
      {!loading && (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                  active
                    ? "bg-brand-500 text-white"
                    : "bg-white text-gray-600 ring-1 ring-inset ring-gray-200 hover:bg-gray-50 dark:bg-white/[0.03] dark:text-gray-400 dark:ring-gray-800"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <ProductCard key={p.id} product={p} onOrder={() => openOrder(p)} />
          ))}
        </div>
      )}

      <BulkOrderModal
        isOpen={isOpen}
        onClose={closeModal}
        product={selected}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Product card with dynamic tier-pricing selector                            */
/* -------------------------------------------------------------------------- */

function ProductCard({
  product,
  onOrder,
}: {
  product: MarketplaceProduct;
  onOrder: () => void;
}) {
  // Quantity points used by the interactive price slider = tier breakpoints.
  const breakpoints = useMemo(() => {
    const pts = [product.moq, ...product.tiers.map((t) => t.minQty)];
    return Array.from(new Set(pts)).sort((a, b) => a - b);
  }, [product]);

  const [qtyIndex, setQtyIndex] = useState(0);
  const quantity = breakpoints[qtyIndex] ?? product.moq;
  const unitPrice = resolveTierPrice(product, quantity);
  const savings = tierSavingsPct(product, quantity);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Visual header */}
      <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-brand-50 to-gray-100 dark:from-brand-500/10 dark:to-gray-900">
        <span className="text-3xl font-bold text-brand-500/40 dark:text-brand-400/30">
          {product.name.slice(0, 2).toUpperCase()}
        </span>
        <div className="absolute left-3 top-3">
          <Badge size="sm" color="light">
            {product.category}
          </Badge>
        </div>
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center gap-0.5 rounded-md bg-warning-50 px-1.5 py-0.5 text-xs font-medium text-warning-600 dark:bg-warning-500/15 dark:text-orange-400">
            ★ {product.rating.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-semibold text-gray-800 dark:text-white/90">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="text-xs text-gray-400">{product.supplier}</span>
          {product.supplierVerified && (
            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-brand-500">
              <CheckCircleIcon className="size-3.5" />
              Verified
            </span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-gray-400">
          From {product.origin} · {formatNumber(product.stock)} in stock
        </p>

        {/* Dynamic price by quantity */}
        <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/60 p-4 dark:border-gray-800 dark:bg-gray-950/40">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs text-gray-400">
                Unit price @ {formatNumber(quantity)} units
              </span>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-xl font-bold text-gray-800 dark:text-white/90">
                  {formatCurrency(unitPrice)}
                </span>
                {savings > 0 && (
                  <Badge size="sm" color="success">
                    −{savings}%
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-400">Base</span>
              <div className="text-sm text-gray-400 line-through">
                {formatCurrency(product.basePrice)}
              </div>
            </div>
          </div>

          {breakpoints.length > 1 && (
            <div className="mt-3">
              <input
                type="range"
                min={0}
                max={breakpoints.length - 1}
                step={1}
                value={qtyIndex}
                onChange={(e) => setQtyIndex(Number(e.target.value))}
                className="w-full accent-brand-500"
              />
              <div className="mt-1 flex justify-between text-[11px] text-gray-400">
                {breakpoints.map((bp, i) => (
                  <span
                    key={bp}
                    className={i === qtyIndex ? "font-semibold text-brand-500" : ""}
                  >
                    {formatNumber(bp)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button className="mt-4 w-full" onClick={onOrder}>
          Place Bulk Order
        </Button>
      </div>
    </div>
  );
}
