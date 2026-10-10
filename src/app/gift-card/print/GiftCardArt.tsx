/** Printable gift-card artwork (same design as the product images), as scalable SVG. */
const NAVY = "#003c68";
const RED = "#d1282a";
const TAN = "#c4a882";

export default function GiftCardArt({ amount, code, redeemed }: { amount: number; code: string; redeemed?: boolean }) {
  return (
    <svg
      viewBox="0 0 880 530"
      role="img"
      aria-label={`Liberty Footwear gift card, $${amount}`}
      className="w-full h-auto block [print-color-adjust:exact] [-webkit-print-color-adjust:exact]"
    >
      <defs>
        <clipPath id="gc-clip"><rect width="880" height="530" rx="30" /></clipPath>
        <pattern id="gc-stripes" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <rect width="2" height="26" fill="#ffffff" opacity="0.035" />
        </pattern>
      </defs>
      <g clipPath="url(#gc-clip)">
        <rect width="880" height="530" fill={NAVY} />
        <rect width="880" height="530" fill="url(#gc-stripes)" />
        <image href="/logo/logo-white.png" x="30" y="26" width="380" height="190" />
        <rect y="462" width="880" height="68" fill={RED} />
        <text x="440" y="506" textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif" fontWeight={700} fontSize={21} letterSpacing={6} fill="#fff">
          BUILT IN AMERICA · GRAND RAPIDS, MI
        </text>
      </g>
      <text x="840" y="105" textAnchor="end" fontFamily="Georgia, serif" fontWeight={700} fontSize={50} letterSpacing={7} fill="#fff">GIFT CARD</text>
      <rect x="600" y="128" width="240" height="4" fill={RED} />
      <text x="840" y="300" textAnchor="end" fontFamily="Georgia, serif" fontWeight={700} fontSize={150} fill="#fff">${amount}</text>

      <rect x="40" y="338" width="800" height="100" rx="14" fill="none" stroke={TAN} strokeWidth={2} strokeDasharray="10 8" />
      <text x="64" y="372" fontFamily="Helvetica, Arial, sans-serif" fontSize={17} letterSpacing={4} fill={TAN}>GIFT CARD CODE</text>
      <text x="440" y="418" textAnchor="middle" fontFamily="'Courier New', monospace" fontWeight={700} fontSize={50} letterSpacing={6} fill="#fff">{code}</text>

      {redeemed && (
        <g transform="rotate(-12 440 265)">
          <rect x="250" y="215" width="380" height="90" rx="10" fill="#ffffff" opacity="0.92" stroke={RED} strokeWidth={6} />
          <text x="440" y="278" textAnchor="middle" fontFamily="Helvetica, Arial, sans-serif" fontWeight={800} fontSize={52} letterSpacing={6} fill={RED}>REDEEMED</text>
        </g>
      )}
    </svg>
  );
}
