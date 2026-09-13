import Image from "next/image";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="BIOCREA"
      width={160}
      height={160}
      unoptimized
      priority
      className={`object-contain ${className}`}
    />
  );
}
