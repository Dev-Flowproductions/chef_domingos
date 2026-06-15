// Regenerate all tab icons as solid black so tintColor works in React Native
const fs = require('fs');
const path = require('path');
const svg2img = require('svg2img');

const dir = path.join(__dirname, '../src/assets');

const icons = [
  { svgFile: 'tab-home.svg', outFile: 'tab-home.png' },
  { svgFile: 'tab-wallet.svg', outFile: 'tab-wallet.png' },
  { svgFile: 'tab-gift.svg', outFile: 'tab-gift.png' },
  { svgFile: 'tab-person.svg', outFile: 'tab-person.png' },
  { svgFile: 'tab-ganhar-qr.svg', outFile: 'tab-ganhar-qr.png' },
];

icons.forEach(({ svgFile, outFile }) => {
  let svg = fs.readFileSync(path.join(dir, svgFile), 'utf8');
  // Force all fills to black so tintColor works properly in RN
  svg = svg
    .replace(/fill="[^"]*"/g, 'fill="#000000"')
    .replace(/var\(--[^)]+\)/g, '#000000');
  // Restore fill=none on the root SVG element only (for clip paths etc.)
  // Actually keep all black — tintColor replaces the whole image color
  svg2img(svg, { width: 64, height: 64 }, (err, buf) => {
    if (err) { console.error(svgFile, err); return; }
    fs.writeFileSync(path.join(dir, outFile), buf);
    console.log(`✓ ${outFile} (${buf.length} bytes)`);
  });
});
