export const IMAGE_WIDTHS = [480, 900, 1600];
export const responsiveSources = (src: string) => src.startsWith("https://images.unsplash.com/")
  ? IMAGE_WIDTHS.map(width => src.replace(/([?&])w=\d+/, `$1w=${width}`))
  : [src];
export const uniqueImageSources = (sources: string[]) => [...new Set(sources.flatMap(responsiveSources))];
