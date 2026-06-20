// Zero-dependency placeholder PWA icon generator.
// Emits valid PNGs (cream background + centered sage square) at the sizes the manifest
// references, plus an apple-touch-icon. These are CLEARLY placeholders — swap them with
// real brand icons before launch. Run: `bun run icons` (or `node scripts/gen-icons.mjs`).
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const CREAM = [250, 247, 239]; // matches --background token
const SAGE = [124, 139, 122]; // matches --primary token

// ── CRC32 (PNG chunk checksums) ───────────────────────────────────────────────
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function makePNG(size) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); // width
  ihdr.writeUInt32BE(size, 4); // height
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const inset = Math.round(size * 0.22); // keep the mark inside the maskable safe zone
  const stride = 1 + size * 3;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // per-row filter byte: none
    for (let x = 0; x < size; x++) {
      const inSquare = x >= inset && x < size - inset && y >= inset && y < size - inset;
      const [r, g, b] = inSquare ? SAGE : CREAM;
      const o = y * stride + 1 + x * 3;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
    }
  }
  const idat = deflateSync(raw);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", idat), chunk("IEND", Buffer.alloc(0))]);
}

mkdirSync("public/icons", { recursive: true });
const targets = {
  "public/icons/icon-192.png": 192,
  "public/icons/icon-512.png": 512,
  "public/icons/maskable-192.png": 192,
  "public/icons/maskable-512.png": 512,
  "public/icons/apple-touch-icon-180.png": 180,
};
for (const [path, size] of Object.entries(targets)) {
  writeFileSync(path, makePNG(size));
  console.log("wrote", path);
}
