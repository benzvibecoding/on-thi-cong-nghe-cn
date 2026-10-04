// Generate PWA icons with pure Node (zlib) — no new dependencies.
// Simple honest mark: teal rounded field, amber ring, dark center.
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { deflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");
mkdirSync(outDir, { recursive: true });

const TEAL = [14, 124, 107];
const AMBER = [245, 158, 11];
const DARK = [6, 37, 31];

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function writePng(path, size, paint) {
  const raw = Buffer.alloc(size * size * 4 + size);
  let offset = 0;
  for (let y = 0; y < size; y++) {
    raw[offset++] = 0; // filter byte: none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = paint(x / size, y / size);
      raw[offset++] = r;
      raw[offset++] = g;
      raw[offset++] = b;
      raw[offset++] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  writeFileSync(path, png);
  console.log(`[icons] wrote ${path} (${png.length} bytes)`);
}

function paint(u, v) {
  const dx = u - 0.5;
  const dy = v - 0.42;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d < 0.13) return DARK;
  if (d < 0.21) return AMBER;
  if (d < 0.24) return TEAL;
  // trace lines at the bottom third
  if (v > 0.72 && (Math.abs(((u * 8) % 1) - 0.5) < 0.04 || Math.abs(v - 0.78) < 0.012)) return AMBER;
  return TEAL;
}

writePng(join(outDir, "icon-192.png"), 192, paint);
writePng(join(outDir, "icon-512.png"), 512, paint);
writePng(join(outDir, "maskable-512.png"), 512, (u, v) => {
  // maskable: keep the mark small and centered (safe zone)
  const s = 0.72;
  const cu = 0.5 + (u - 0.5) * s;
  const cv = 0.5 + (v - 0.5) * s;
  return paint(cu, cv);
});
