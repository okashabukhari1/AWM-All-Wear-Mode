import type { ImgHTMLAttributes } from "react";
import { IMAGE_WIDTHS, responsiveSources } from "./lib/image-assets";

/** Keep responsive image delivery and the documented editorial fallback in one place. */
export function Image({
  src,
  sizes,
  onError,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const responsive = src?.startsWith("https://images.unsplash.com/");
  const srcSet = responsive
    ? responsiveSources(src!).map((url, index) => `${url} ${IMAGE_WIDTHS[index]}w`)
        .join(", ")
    : undefined;
  return (
    <img
      {...props}
      src={src}
      srcSet={srcSet}
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
