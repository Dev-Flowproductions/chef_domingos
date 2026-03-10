const fs = require('fs');
const path = require('path');
const svg2img = require('svg2img');

const dir = path.join(__dirname, '../src/assets');

// Fix home icon: change fill to none, keep stroke as black
const raw = fs.readFileSync(path.join(dir, 'tab-home.svg'), 'utf8');
const fixed = raw
  .replace(/fill="#BF994E"/g, 'fill="none"')       // remove path fill
  .replace(/var\(--stroke-0,[^)]+\)/g, '#000000')   // fix stroke color
  .replace(/^(<svg[^>]*) fill="#BF994E"/, '$1 fill="none"'); // fix root svg fill

fs.writeFileSync(path.join(dir, 'tab-home.svg'), fixed);

svg2img(fixed, { width: 64, height: 64 }, (err, buf) => {
  if (err) { console.error(err); return; }
  fs.writeFileSync(path.join(dir, 'tab-home.png'), buf);
  console.log('✓ tab-home.png regenerated');
});
