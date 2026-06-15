const https = require('https');
const fs = require('fs');
const path = require('path');

const assets = [
  { url: 'https://www.figma.com/api/mcp/asset/cf966e24-4644-4899-8a69-0a33e5df6f04', file: 'tab-home.png' },
  { url: 'https://www.figma.com/api/mcp/asset/134a44d2-f648-48f0-b7f2-5274a4b9c150', file: 'tab-wallet.png' },
  { url: 'https://www.figma.com/api/mcp/asset/ee8fb17e-dcd9-4d15-b7f2-79fe3c809e81', file: 'tab-ganhar-circle.png' },
  { url: 'https://www.figma.com/api/mcp/asset/ab874be7-4b19-4734-aff2-d26a7189290e', file: 'tab-ganhar-qr.png' },
  { url: 'https://www.figma.com/api/mcp/asset/945e8328-3818-427d-8091-eb5ee27aeec8', file: 'tab-gift.png' },
  { url: 'https://www.figma.com/api/mcp/asset/7ab1a792-b153-4b89-bc8d-1b8cbebc66ea', file: 'tab-person.png' },
];

const outDir = path.join(__dirname, '../src/assets');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        const bytes = fs.readFileSync(dest);
        const isSvg = bytes[0] === 0x3C;
        console.log(`${isSvg ? '⚠ SVG' : '✓ IMG'} ${path.basename(dest)} (${bytes.length} bytes)`);
        resolve({ dest, isSvg, svgContent: isSvg ? bytes.toString('utf8') : null });
      });
    }).on('error', (err) => { fs.unlink(dest, () => {}); reject(err); });
  });
}

Promise.all(assets.map(a => download(a.url, path.join(outDir, a.file))))
  .then(results => {
    // Convert any SVGs to PNG using svg2img
    const svg2img = require('svg2img');
    const svgs = results.filter(r => r.isSvg);
    if (svgs.length === 0) { console.log('All done!'); return; }
    return Promise.all(svgs.map(r => new Promise((resolve, reject) => {
      const fixed = r.svgContent.replace(/var\(--fill-0,\s*([^)]+)\)/g, '$1');
      svg2img(fixed, { width: 64, height: 64 }, (err, buf) => {
        if (err) return reject(err);
        fs.writeFileSync(r.dest, buf);
        console.log(`✓ converted SVG→PNG ${path.basename(r.dest)} (${buf.length} bytes)`);
        resolve();
      });
    }))).then(() => console.log('All done!'));
  })
  .catch(e => console.error(e));
