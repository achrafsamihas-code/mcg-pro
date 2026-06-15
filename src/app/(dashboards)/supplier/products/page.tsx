import type { Metadata } from "next";
import ProductsClient from "@/components/supplier/ProductsClient";

export const metadata: Metadata = {
  title: "Product Management | B2B Trade & Logistics",
  description:
    "Supplier product catalog with quick stock/price edits and B2B tiered pricing.",
};

export default function SupplierProductsPage() {
  return <ProductsClient />;
}
