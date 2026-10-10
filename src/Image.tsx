import type { ImgHTMLAttributes } from "react";
import { imageVariants } from "./lib/image-assets";

/** Keep responsive image delivery and the documented editorial fallback in one place. */
export function Image({
  src,
  sizes,
  onError,
  loading = "lazy",
  decoding = "async",
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const variants = src ? imageVariants(src) : [];
  const srcSet = variants.length > 1 ? variants.map(image => `${image.src} ${image.width}w`).join(", ") : undefined;
  return (
    <img
      {...props}
      src={variants[Math.min(1, variants.length - 1)]?.src || src}
      srcSet={srcSet}
      loading={loading}
      decoding={decoding}
      width={1200}
      height={1600}
      sizes={sizes || "(max-width: 560px) 90vw, (max-width: 900px) 45vw, 30vw"}
      onError={(event) => {
        const element = event.currentTarget;
        if (!element.src.endsWith("/reference.svg")) {
          element.removeAttribute("srcset");
          element.src = "/reference.svg";
        }
        onError?.(event);
      }}
    />
  );
}
