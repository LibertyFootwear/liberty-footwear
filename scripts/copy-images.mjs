import fs from "fs";
import path from "path";

const srcBase = "C:/Users/kovar/Desktop/Liberty Footwear/LF-New website pictures";
const dest = "public/products";

fs.mkdirSync(dest, { recursive: true });

const dirs = fs.readdirSync(srcBase, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

for (const dir of dirs) {
  const dirPath = path.join(srcBase, dir);
  const files = fs.readdirSync(dirPath).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
  // use stock number from dir name as key, e.g. "KS0101 _ Terry _ Jet black _ Black _ 1000x1000"
  const stockMatch = dir.match(/^(KS\w+)/i);
  if (!stockMatch) continue;
  const stockNo = stockMatch[1].toUpperCase();
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const src = path.join(dirPath, file);
    const destFile = path.join(dest, `${stockNo}${ext}`);
    fs.copyFileSync(src, destFile);
    console.log(destFile);
  }
}
console.log("done");
