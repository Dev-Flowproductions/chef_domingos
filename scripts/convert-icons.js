const svg2img = require('svg2img');
const fs = require('fs');

const icons = [
  { in: 'src/assets/icon-cafe.png', out: 'src/assets/icon-cafe-rn.png' },
  { in: 'src/assets/icon-sobremesa.png', out: 'src/assets/icon-sobremesa-rn.png' },
  { in: 'src/assets/icon-refeicao.png', out: 'src/assets/icon-refeicao-rn.png' },
];

icons.forEach(function(item) {
  var svg = fs.readFileSync(item.in, 'utf8')
    .replace(/var\(--fill-0,\s*#BF994E\)/g, '#BF994E')
    .replace('width="100%" height="100%"', 'width="64" height="64"');
  svg2img(svg, { width: 64, height: 64 }, function(err, buf) {
    if (err) { console.error(item.in, err.message); return; }
    fs.writeFileSync(item.out, buf);
    console.log('Written', item.out, buf.length, 'bytes');
  });
});
