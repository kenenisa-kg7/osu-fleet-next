import Image from "next/image";

type LogoProps = {
  size?: number;
  className?: string;
};

export function Logo({ size = 40, className }: LogoProps) {
  return (
    <Image
      src="/osu-crest-badge.png"
      alt="Oromia State University"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}