function u32be(n: number): number[] {
  return [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
}

function u16le(n: number): number[] {
  return [n & 255, (n >>> 8) & 255];
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function adler32(bytes: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < bytes.length; i += 1) {
    a += bytes[i];
    if (a >= 65521) a -= 65521;
    b += a;
    if (b >= 65521) b -= 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(len);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new Uint8Array([
    type.charCodeAt(0),
    type.charCodeAt(1),
    type.charCodeAt(2),
    type.charCodeAt(3),
  ]);
  const crcInput = concat([typeBytes, data]);
  return concat([
    new Uint8Array(u32be(data.length)),
    crcInput,
    new Uint8Array(u32be(crc32(crcInput))),
  ]);
}

function zlibStore(raw: Uint8Array): Uint8Array {
  const blocks: number[] = [0x78, 0x01];
  let offset = 0;
  while (offset < raw.length) {
    const size = Math.min(65535, raw.length - offset);
    const last = offset + size >= raw.length;
    blocks.push(last ? 0x01 : 0x00);
    blocks.push(...u16le(size));
    blocks.push(...u16le(~size & 0xffff));
    for (let i = 0; i < size; i += 1) blocks.push(raw[offset + i]!);
    offset += size;
  }
  return concat([new Uint8Array(blocks), new Uint8Array(u32be(adler32(raw)))]);
}

function bytesToBase64(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const remaining = bytes.length - i;
    const n =
      (bytes[i]! << 16) |
      ((remaining > 1 ? bytes[i + 1]! : 0) << 8) |
      (remaining > 2 ? bytes[i + 2]! : 0);
    out += alphabet[(n >> 18) & 63];
    out += alphabet[(n >> 12) & 63];
    out += remaining > 1 ? alphabet[(n >> 6) & 63] : '=';
    out += remaining > 2 ? alphabet[n & 63] : '=';
  }
  return out;
}

export function qrMatrixToPngDataUri(
  dark: boolean[],
  moduleCount: number,
  quietModules: number,
  scale: number,
): { uri: string; dim: number } {
  const dim = (moduleCount + quietModules * 2) * scale;
  const raw = new Uint8Array(dim * (dim + 1));
  for (let y = 0; y < dim; y += 1) {
    const rowOff = y * (dim + 1);
    raw[rowOff] = 0;
    const my = Math.floor(y / scale) - quietModules;
    for (let x = 0; x < dim; x += 1) {
      const mx = Math.floor(x / scale) - quietModules;
      const isDark =
        mx >= 0 &&
        my >= 0 &&
        mx < moduleCount &&
        my < moduleCount &&
        Boolean(dark[my * moduleCount + mx]);
      raw[rowOff + 1 + x] = isDark ? 0 : 255;
    }
  }

  const ihdr = new Uint8Array([...u32be(dim), ...u32be(dim), 8, 0, 0, 0, 0]);
  const png = concat([
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlibStore(raw)),
    pngChunk('IEND', new Uint8Array()),
  ]);

  return { uri: `data:image/png;base64,${bytesToBase64(png)}`, dim };
}
