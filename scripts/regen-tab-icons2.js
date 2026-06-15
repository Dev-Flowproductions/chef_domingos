// Regenerate tab icons preserving their original stroke/fill structure
// Just replace CSS color variables with a neutral dark color
// tintColor in React Native will then recolor the whole image
const fs = require('fs');
const path = require('path');
const svg2img = require('svg2img');

const dir = path.join(__dirname, '../src/assets');

const icons = [
  // Home is a filled solid icon — keep fill, set to black
  {
    svgFile: 'tab-home.svg',
    outFile: 'tab-home.png',
    // Replace fill color and stroke var
    transform: (svg) => svg
      .replace(/fill="#BF994E"/g, 'fill="#000000"')
      .replace(/var\(--stroke-0,[^)]+\)/g, '#000000'),
  },
  // Wallet is stroke-only — paths have no fill, just stroke
  {
    svgFile: 'tab-wallet.svg',
    outFile: 'tab-wallet.png',
    transform: (svg) => svg
      .replace(/fill="#666666"/g, 'fill="none"')
      .replace(/var\(--stroke-0,[^)]+\)/g, '#000000'),
  },
  // Gift is stroke-only
  {
    svgFile: 'tab-gift.svg',
    outFile: 'tab-gift.png',
    transform: (svg) => svg
      .replace(/fill="#666666"/g, 'fill="none"')
      .replace(/var\(--stroke-0,[^)]+\)/g, '#000000'),
  },
  // Person is filled paths (no stroke)
  {
    svgFile: 'tab-person.svg',
    outFile: 'tab-person.png',
    transform: (svg) => svg
      .replace(/fill="#666666"/g, 'fill="#000000"')
      .replace(/var\(--stroke-0,[^)]+\)/g, '#000000'),
  },
  // QR icon — all filled paths, white → black for tintColor
  {
    svgFile: 'tab-ganhar-qr.svg',
    outFile: 'tab-ganhar-qr.png',
    transform: (svg) => svg
      .replace(/fill="#FFFFFF"/g, 'fill="#000000"')
      .replace(/fill="white"/g, 'fill="#000000"'),
  },
];

icons.forEach(({ svgFile, outFile, transform }) => {
  const raw = fs.readFileSync(path.join(dir, svgFile), 'utf8');
  const fixed = transform(raw);
  svg2img(fixed, { width: 64, height: 64 }, (err, buf) => {
    if (err) { console.error(svgFile, err); return; }
    fs.writeFileSync(path.join(dir, outFile), buf);
    console.log(`✓ ${outFile}`);
  });
});
