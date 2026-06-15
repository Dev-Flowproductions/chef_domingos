const https = require('https');
const fs = require('fs');
const path = require('path');

const assets = [
  // Restaurant logo (both restaurants use same logo)
  { url: 'https://www.figma.com/api/mcp/asset/75629714-453b-4ff2-be91-638b8ddad5e8', file: 'restaurant-logo.png' },
  // Portuguese Lab food image
  { url: 'https://www.figma.com/api/mcp/asset/f7c7cff8-df0b-4c05-8c1f-e7b061afe04e', file: 'portuguese-lab-food.png' },
  // Pizza Lab food image (voucher bg / pizza image)
  { url: 'https://www.figma.com/api/mcp/asset/1b65fac4-ffbf-4c0f-9e8d-bd0dbc38f4b6', file: 'pizza-lab-food.png' },
  // QR code image
  { url: 'https://www.figma.com/api/mcp/asset/4037806f-b8ad-49db-8bf6-cdc9d745e71c', file: 'qr-code.png' },
  // Background illustration
  { url: 'https://www.figma.com/api/mcp/asset/ae8f57a5-0c66-40e5-bae6-3dd8ce0cfc34', file: 'bg-illustration.png' },
  // Wallet history logo
  { url: 'https://www.figma.com/api/mcp/asset/1eed4702-23a9-4d56-9022-2e4e5580b913', file: 'bg-illustration-2.png' },
];

const outDir = path.join(__dirname, '../src/assets');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

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
        const size = fs.statSync(dest).size;
        console.log(`✓ ${path.basename(dest)} (${size} bytes)`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

Promise.all(assets.map(a => download(a.url, path.join(outDir, a.file))))
  .then(() => console.log('All done!'))
  .catch(e => console.error(e));
