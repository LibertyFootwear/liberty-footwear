// Generates the gift-card images: public/products/KS0020|21|22.png and public/categories/gift-cards.png (shop category tile)
// Usage: node scripts/make-giftcard-images.mjs
import sharp from "sharp";
import { readFileSync } from "fs";

const LOGO = "public/logo/logo-white.png";
const AMOUNTS = { KS0020: 100, KS0021: 200, KS0022: 300 };
const RED = "#d1282a";
const TAN = "#c4a882";

// Match the card colour to the logo's own background so the logo blends in.
const { data } = await sharp(LOGO).extract({ left: 40, top: 40, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
const NAVY = `rgb(${data[0]},${data[1]},${data[2]})`;
const logoUri = "data:image/png;base64," + readFileSync(LOGO).toString("base64");

const defs = `
  <defs>
    <clipPath id="c"><rect width="880" height="530" rx="30"/></clipPath>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="150%">
      <feGaussianBlur stdDeviation="22"/>
    </filter>
    <pattern id="st" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
      <rect width="26" height="26" fill="none"/><rect width="2" height="26" fill="#ffffff" opacity="0.035"/>
    </pattern>
  </defs>`;

// The card artwork itself (880×530). `label` is the big amount text; `size` its font size.
const card = (label, size, tagline = true) => `
  <g>
    <g clip-path="url(#c)">
      <rect width="880" height="530" fill="${NAVY}"/>
      <rect width="880" height="530" fill="url(#st)"/>
      <image href="${logoUri}" x="30" y="26" width="380" height="190"/>
      <rect y="462" width="880" height="68" fill="${RED}"/>
      <text x="440" y="506" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="21" letter-spacing="6" fill="#fff">BUILT IN AMERICA · GRAND RAPIDS, MI</text>
    </g>
    <text x="840" y="105" text-anchor="end" font-family="Georgia, serif" font-weight="700" font-size="50" letter-spacing="7" fill="#fff">GIFT CARD</text>
    <rect x="600" y="128" width="240" height="4" fill="${RED}"/>
    <text x="840" y="335" text-anchor="end" font-family="Georgia, serif" font-weight="700" font-size="${size}" fill="#fff">${label}</text>
    ${tagline ? `<text x="840" y="396" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="25" letter-spacing="3" fill="${TAN}">BOOTS · APPAREL · ACCESSORIES</text>` : ""}
    <text x="48" y="400" font-family="Helvetica, Arial, sans-serif" font-size="25" letter-spacing="2" fill="${TAN}">libertyfootwear.com</text>
    <text x="48" y="435" font-family="Helvetica, Arial, sans-serif" font-size="19" letter-spacing="2" fill="#ffffff" opacity="0.6">REDEEM ONLINE OR IN STORE</text>
  </g>`;

// Product detail image: card on white (the shop multiplies it onto cream).
const productSvg = (amount) => `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
  ${defs}
  <rect width="1000" height="1000" fill="#ffffff"/>
  <rect x="75" y="262" width="850" height="520" rx="30" fill="#000" opacity="0.22" filter="url(#sh)"/>
  <g transform="translate(60 225)">${card(`$${amount}`, 150)}</g>
</svg>`;

// Category tile image: transparent background, all three amounts on one card.
const categorySvg = () => `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="620" viewBox="0 0 960 620">
  ${defs}
  <rect x="55" y="62" width="850" height="520" rx="30" fill="#000" opacity="0.35" filter="url(#sh)"/>
  <g transform="translate(40 30)">${card("$100 · $200 · $300", 66, false)}</g>
</svg>`;

for (const [stock, amount] of Object.entries(AMOUNTS)) {
  await sharp(Buffer.from(productSvg(amount))).png({ compressionLevel: 9 }).toFile(`public/products/${stock}.png`);
  console.log("wrote", stock, `$${amount}`);
}

import { mkdirSync } from "fs";
mkdirSync("public/categories", { recursive: true });
await sharp(Buffer.from(categorySvg())).png({ compressionLevel: 9 }).toFile("public/categories/gift-cards.png");
console.log("wrote categories/gift-cards.png");
