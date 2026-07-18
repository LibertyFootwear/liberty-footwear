import sharp from "sharp";

const src = "public/logo/logo-master.png";

await sharp(src).resize(1600, null).png().toFile("public/logo/logo-1600.png");
await sharp(src).resize(800, null).png().toFile("public/logo/logo-800.png");
await sharp(src).resize(400, null).png().toFile("public/logo/logo-400.png");

// square favicon: crop the bell icon area (left portion) for a square mark
await sharp(src)
  .extract({ left: 0, top: 0, width: 1000, height: 1999 })
  .resize(512, 512, { fit: "contain", background: { r: 11, g: 49, b: 84, alpha: 1 } })
  .png()
  .toFile("public/logo/mark-512.png");

await sharp("public/logo/mark-512.png").resize(32, 32).toFile("public/favicon-32.png");
console.log("done");
