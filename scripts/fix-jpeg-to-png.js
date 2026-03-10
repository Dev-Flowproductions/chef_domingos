// Converts JPEG files that were saved with .png extension into real PNGs
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('@napi-rs/canvas');

const files = [
  'src/assets/bg-illustration.png',
  'src/assets/pizza-lab-food.png',
  'src/assets/portuguese-lab-food.png',
];

async function convertToPng(filePath) {
  const img = await loadImage(filePath);
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buf);
  console.log(`✓ ${path.basename(filePath)} → real PNG (${buf.length} bytes)`);
}

Promise.all(files.map(convertToPng))
  .then(() => console.log('Done!'))
  .catch(e => console.error(e));
