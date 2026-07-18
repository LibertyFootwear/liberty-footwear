import * as mupdf from "mupdf";
import fs from "fs";
import sharp from "sharp";

const pdfPath = process.argv[2];
const outPath = process.argv[3];
const scale = Number(process.argv[4] || 8);

const data = fs.readFileSync(pdfPath);
const doc = mupdf.Document.openDocument(data, "application/pdf");
const page = doc.loadPage(0);
const matrix = mupdf.Matrix.scale(scale, scale);
const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, true);
const png = pixmap.asPNG();
fs.writeFileSync(outPath, png);
console.log("wrote", outPath, pixmap.getWidth(), pixmap.getHeight());
