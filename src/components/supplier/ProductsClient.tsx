"use client";

import React, { useEffect, useState } from "react";
import PageBreadCrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import ProductFormModal from "@/components/supplier/ProductFormModal";
import { useModal } from "@/hooks/useModal";
import {
  createProduct,
  fetchSupplierProducts,
  updateProductStockPrice,
} from "@/lib/supplier/data";
import type {
  NewProductInput,
  ProductStatus,
  SupplierProduct,
} from "@/lib/supplier/types";
import { formatCurrency, formatNumber } from "@/lib/admin/format";
import { PlusIcon, PencilIcon } from "@/icons";

const STATUS_META: Record<
  ProductStatus,
  { label: string; color: "success" | "warning" | "error" }
> = {
  active: { label: "Active", color: "success" },
  draft: { label: "Draft", color: "warning" },
  out_of_stock: { label: "Out of stock", color: "error" },
};

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

export default function ProductsClient() {
  const [products, setProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    let mounted = true;
    fetchSupplierProducts().then((res) => {
      if (mounted) {
        setProducts(res);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleCreate = async (input: NewProductInput) => {
    // Optimistic insert with a temporary id.
    const optimistic: SupplierProduct = {
      ...input,
      id: `local-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [optimistic, ...prev]);
    await createProduct(input);
  };

  const handleSaveEdit = async (
    id: string,
    stock: number,
    basePrice: number
  ) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock, basePrice } : p))
    );
    setEditingId(null);
    await updateProductStockPrice(id, { stock, basePrice });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadCrumb pageTitle="Product Management" />
        <Button startIcon={<PlusIcon className="size-5" />} onClick={openModal}>
          Add New Product
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              editing={editingId === p.id}
              onEdit={() => setEditingId(p.id)}
              onCancel={() => setEditingId(null)}
              onSave={handleSaveEdit}
            />
          ))}
        </div>
      )}

      <ProductFormModal isOpen={isOpen} onClose={closeModal} onSubmit={handleCreate} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Product card with inline stock/price edit                                  */
/* -------------------------------------------------------------------------- */

function ProductCard({
  product,
  editing,
  onEdit,
  onCancel,
  onSave,
}: {
  product: SupplierProduct;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (id: string, stock: number, basePrice: number) => void;
}) {
  const [stock, setStock] = useState(product.stock);
  const [price, setPrice] = useState(product.basePrice);
  const meta = STATUS_META[product.status];

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Visual header */}
      <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-brand-50 to-gray-100 dark:from-brand-500/10 dark:to-gray-900">
        <span className="text-3xl font-bold text-brand-500/40 dark:text-brand-400/30">
          {product.sku.slice(0, 3)}
        </span>
        <div className="absolute right-3 top-3">
          <Badge size="sm" color={meta.color}>
            {meta.label}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-800 dark:text-white/90">
            {product.name}
          </h3>
        </div>
        <p className="text-xs text-gray-400">
          {product.sku} · {product.category}
        </p>

        {/* Tier preview */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.tiers.length === 0 ? (
            <span className="text-xs text-gray-400">Flat pricing</span>
          ) : (
            product.tiers.map((t) => (
              <span
                key={t.minQty}
                className="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              >
                {formatNumber(t.minQty)}+ → {formatCurrency(t.unitPrice)}
              </span>
            ))
          )}
        </div>

        {/* Editable fields */}
        <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-800">
          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Stock
                </label>
                <Input
                  type="number"
                  min="0"
                  defaultValue={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  Base price (USD)
                </label>
                <Input
                  type="number"
                  min="0"
                  step={0.01}
                  defaultValue={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onSave(product.id, stock, price)}
                  className="flex-1"
                >
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-400">Stock</div>
                <div className="font-semibold text-gray-800 dark:text-white/90">
                  {formatNumber(product.stock)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Base price</div>
                <div className="font-semibold text-gray-800 dark:text-white/90">
                  {formatCurrency(product.basePrice)}
                </div>
              </div>
              <button
                onClick={onEdit}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-brand-500/10"
                aria-label="Edit stock and price"
              >
                <PencilIcon className="size-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
