import type { MarketplaceProduct, PriceTier } from "./types";

/**
 * Resolve the effective unit price for a given quantity using the product's
 * tiered pricing. Returns the price of the highest tier whose `minQty` is met,
 * falling back to the base price when no tier qualifies.
 */
export function resolveTierPrice(
  product: MarketplaceProduct,
  quantity: number
): number {
  let price = product.basePrice;
  // Tiers are stored ascending by minQty; pick the best (last) qualifying tier.
  const sorted: PriceTier[] = [...product.tiers].sort(
    (a, b) => a.minQty - b.minQty
  );
  for (const tier of sorted) {
    if (quantity >= tier.minQty) {
      price = tier.unitPrice;
    }
  }
  return price;
}

/** Percentage saved vs. the base price at a given quantity (0..100). */
export function tierSavingsPct(
  product: MarketplaceProduct,
  quantity: number
): number {
  if (product.basePrice <= 0) return 0;
  const price = resolveTierPrice(product, quantity);
  return Math.round(((product.basePrice - price) / product.basePrice) * 100);
}
