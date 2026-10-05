// Genera los íconos PNG de la app instalable (public/icon-192.png, icon-512.png, apple-touch-icon.png)
// con el mismo dibujo que public/favicon.svg: paño verde, dos naipes con borde dorado y un oro.
// Sin dependencias: rasteriza con supermuestreo y codifica el PNG a mano. Uso: node scripts/build-icons.mjs
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const PANO = hex('#14532d');
const NAIPE = hex('#fefce8');
const ORO = hex('#ca8a04');

// Todo en coordenadas del favicon (64 × 64)
function rotate(x, y, cx, cy, deg) {
  const r = (deg * Math.PI) / 180;
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * Math.cos(r) - dy * Math.sin(r), cy + dx * Math.sin(r) + dy * Math.cos(r)];
}

/** Distancia con signo a un rectángulo redondeado (negativa adentro). */
function roundRectDist(x, y, rx, ry, w, h, rad) {
  const cx = rx + w / 2;
  const cy = ry + h / 2;
  const qx = Math.abs(x - cx) - (w / 2 - rad);
  const qy = Math.abs(y - cy) - (h / 2 - rad);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rad;
}

/** Un naipe (rect 26 × 38, radio 4, borde dorado de 2) girado `deg` alrededor de (cx, cy). */
function card(x, y, ox, oy, deg, cx, cy) {
  const [ux, uy] = rotate(x, y, cx, cy, -deg);
  const d = roundRectDist(ux, uy, ox, oy, 26, 38, 4);
  if (d > 1) return null;
  return d > -1 ? ORO : NAIPE;
}

function colorAt(x, y, { padded }) {
  // Ícono "maskable": en Android el sistema recorta un círculo; con padding el dibujo queda adentro
  if (padded) {
    x = 32 + (x - 32) * 1.25;
    y = 32 + (y - 32) * 1.25;
  }
  let c = PANO;
  c = card(x, y, 14, 10, -12, 27, 29) || c;
  const front = card(x, y, 24, 14, 10, 37, 33);
  if (front) {
    c = front;
    const [ux, uy] = rotate(x, y, 37, 33, -10);
    if (Math.hypot(ux - 37, uy - 33) <= 7) c = ORO;
  }
  return c;
}

function render(size, { padded = false, rounded = false } = {}) {
  const scale = 64 / size;
  const SS = 4; // supermuestreo para bordes suaves
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let py = 0; py < size; py++) {
    raw[py * (size * 4 + 1)] = 0; // filtro "none"
    for (let px = 0; px < size; px++) {
      const acc = [0, 0, 0, 0];
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px + (sx + 0.5) / SS) * scale;
          const y = (py + (sy + 0.5) / SS) * scale;
          if (rounded && roundRectDist(x, y, 0, 0, 64, 64, 14) > 0) continue; // transparente fuera del cuadrado redondeado
          const c = colorAt(x, y, { padded });
          acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2]; acc[3] += 255;
        }
      }
      const n = SS * SS;
      const o = py * (size * 4 + 1) + 1 + px * 4;
      const alpha = acc[3] / n;
      for (let i = 0; i < 3; i++) raw[o + i] = alpha ? Math.round((acc[i] / n) * (255 / alpha)) : 0;
      raw[o + 3] = Math.round(alpha);
    }
  }
  return png(size, size, raw);
}

// ─── Codificador PNG mínimo (RGBA 8 bits) ─────────────────
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(width, height, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bits por canal
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const out = (name) => new URL(`../public/${name}`, import.meta.url);
writeFileSync(out('icon-192.png'), render(192, { rounded: true }));
writeFileSync(out('icon-512.png'), render(512, { rounded: true }));
writeFileSync(out('icon-maskable-512.png'), render(512, { padded: true }));
writeFileSync(out('apple-touch-icon.png'), render(180, { padded: true }));
console.log('Íconos generados en public/');
