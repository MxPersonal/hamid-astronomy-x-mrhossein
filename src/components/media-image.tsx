import Image from "next/image";

interface MediaImageProps {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export function MediaImage({
  src,
  alt,
  className = "",
  sizes,
  priority = false,
}: MediaImageProps) {
  if (/^https?:\/\//i.test(src)) {
    return (
      // Remote administrator-provided images stay client-side and bypass the
      // Next.js image proxy to avoid making the server fetch arbitrary URLs.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={`native-remote-image ${className}`}
        loading={priority ? "eager" : "lazy"}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      priority={priority}
      unoptimized={src.startsWith("data:")}
    />
  );
}
