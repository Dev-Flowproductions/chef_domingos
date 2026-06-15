// Creates active (gold #BF994E) versions of inactive (grey) tab icons
const fs = require('fs');
const path = require('path');
const svg2img = require('svg2img');

const icons = [
  { svgFile: 'tab-wallet.svg', outFile: 'tab-wallet-active.png' },
  { svgFile: 'tab-gift.svg', outFile: 'tab-gift-active.png' },
  { svgFile: 'tab-person.svg', outFile: 'tab-person-active.png' },
];

const dir = path.join(__dirname, '../src/assets');

icons.forEach(({ svgFile, outFile }) => {
  const svg = fs.readFileSync(path.join(dir, svgFile), 'utf8');
  // Replace the grey color with gold
  const gold = svg.replace(/#666666/g, '#BF994E');
  svg2img(gold, { width: 64, height: 64 }, (err, buf) => {
    if (err) { console.error(err); return; }
    fs.writeFileSync(path.join(dir, outFile), buf);
    console.log(`✓ ${outFile}`);
  });
});
