const fs = require('fs');
const svg2img = require('svg2img');

const svgFiles = [
  { src: 'src/assets/qr-code.png', dest: 'src/assets/qr-code.png', size: 400 },
];

function convertOne(src, dest, size) {
  const svgData = fs.readFileSync(src, 'utf8');
  const fixed = svgData.replace(/var\(--fill-0,\s*([^)]+)\)/g, '$1');
  return new Promise((resolve, reject) => {
    svg2img(fixed, { width: size, height: size }, (err, buf) => {
      if (err) return reject(err);
      fs.writeFileSync(dest, buf);
      console.log(`✓ ${dest} (${buf.length} bytes)`);
      resolve();
    });
  });
}

Promise.all(svgFiles.map(f => convertOne(f.src, f.dest, f.size)))
  .then(() => console.log('All done!'))
  .catch(e => console.error(e));
