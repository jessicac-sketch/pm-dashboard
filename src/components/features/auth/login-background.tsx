import Image from "next/image";

// Faint white silhouette of the NTV360 logo. The logo's letterforms are custom-drawn,
// so the logo itself is used instead of a font.
export const LoginBackground = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
    <Image
      src="/logo.webp"
      alt=""
      width={2101}
      height={2101}
      className="absolute -right-[8vw] -bottom-[14vw] w-[min(760px,110vw)] opacity-10 brightness-0 invert select-none"
    />
  </div>
);
