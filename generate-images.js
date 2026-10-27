
import fs from "node:fs";
import path from "node:path";

const imageFolder = path.resolve("public");
const outputFile = path.resolve("src/images.json");

const extensions = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
  ".bmp",
  ".svg",
  ".mp4"
];

const files = fs
  .readdirSync(imageFolder, { withFileTypes: true })
  .filter((file) => file.isFile())
  .filter((file) =>
    extensions.includes(path.extname(file.name).toLowerCase())
  )
  .map((file) => `/${file.name}`)
  .sort((a, b) => a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: "base",
  }));

fs.writeFileSync(
  outputFile,
  JSON.stringify(files, null, 2)
);

console.log(`Generated ${files.length} image paths.`);
