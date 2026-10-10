import localImages from "./local-images.json";
const local = localImages as Record<string, Array<{ src: string; width: number }>>;
export const IMAGE_WIDTHS = [480, 900, 1600];
export function imageVariants(src: string) {
  const key = src.startsWith("https://images.unsplash.com/") ? src.split("?")[0] : src;
  if (local[key]) return local[key];
  return src.startsWith("https://images.unsplash.com/")
    ? IMAGE_WIDTHS.map(width => ({ src: src.replace(/([?&])w=\d+/, `$1w=${width}`), width }))
    : [{ src, width: 0 }];
}
export const responsiveSources = (src: string) => imageVariants(src).map(variant => variant.src);
export const uniqueImageSources = (sources: string[]) => [...new Set(sources.flatMap(responsiveSources))];
