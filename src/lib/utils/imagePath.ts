/**
 * Resolves a public asset path.
 *
 * On Vercel the app is served from the domain root, so assets resolve directly
 * from `/public`. The previous GitHub-Pages `basePath` prefix has been removed
 * along with `output: 'export'` in next.config.ts. Kept as a single indirection
 * point in case a CDN prefix is ever reintroduced via env.
 */
export const getImagePath = (path: string): string => {
  const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX ?? "";
  return `${assetPrefix}${path}`;
};
