const https = require('https');
const fs = require('fs');
const path = require('path');
const svg2img = require('svg2img');

const assets = [
  { url: 'https://www.figma.com/api/mcp/asset/134a44d2-f648-48f0-b7f2-5274a4b9c150', file: 'tab-wallet', color: '#666666' },
  { url: 'https://www.figma.com/api/mcp/asset/945e8328-3818-427d-8091-eb5ee27aeec8', file: 'tab-gift', color: '#666666' },
  { url: 'https://www.figma.com/api/mcp/asset/ab874be7-4b19-4734-aff2-d26a7189290e', file: 'tab-ganhar-qr', color: '#FFFFFF' },
  { url: 'https://www.figma.com/api/mcp/asset/cf966e24-4644-4899-8a69-0a33e5df6f04', file: 'tab-home', color: '#BF994E' },
  { url: 'https://www.figma.com/api/mcp/asset/7ab1a792-b153-4b89-bc8d-1b8cbebc66ea', file: 'tab-person', color: '#666666' },
];

const outDir = path.join(__dirname, '../src/assets');

function downloadSvg(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadSvg(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function processIcon(asset) {
  const svg = await downloadSvg(asset.url);
  // Replace CSS vars with explicit colors
  const fixed = svg
    .replace(/var\(--fill-0,\s*([^)]+)\)/g, asset.color)
    .replace(/var\(--fill-1,\s*([^)]+)\)/g, asset.color)
    .replace(/fill="none"/g, `fill="${asset.color}"`)  // fallback for bare none
    // but preserve explicit fill on the root SVG
    ;
  
  // Save the fixed SVG for inspection
  fs.writeFileSync(path.join(outDir, asset.file + '.svg'), fixed);
  console.log(`SVG saved: ${asset.file}.svg`);
  console.log('  preview:', fixed.substring(0, 200));
  
  return new Promise((resolve, reject) => {
    svg2img(fixed, { width: 64, height: 64 }, (err, buf) => {
      if (err) return reject(err);
      fs.writeFileSync(path.join(outDir, asset.file + '.png'), buf);
      console.log(`✓ PNG: ${asset.file}.png (${buf.length} bytes)`);
      resolve();
    });
  });
}

Promise.all(assets.map(processIcon))
  .then(() => console.log('All done!'))
  .catch(e => console.error(e));
