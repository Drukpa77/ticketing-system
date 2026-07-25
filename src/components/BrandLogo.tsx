type BrandLogoProps = {
  size?: number;
  className?: string;
  alt?: string;
};

/** Site header mark from /public/loogo.png */
export function BrandLogo({
  size = 36,
  className = "",
  alt = "",
}: BrandLogoProps) {
  return (
    <img
      src="/loogo.png"
      alt={alt}
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`.trim()}
    />
  );
}
