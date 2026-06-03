import { mkdir, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";

const sizes = [16, 32, 64, 80];
await mkdir("assets", { recursive: true });

for (const size of sizes) {
  await writeFile(`assets/icon-${size}.png`, createIcon(size));
}

console.log(`Generated ${sizes.length} icon files in assets/.`);

function createIcon(size) {
  const width = size;
  const height = size;
  const radius = Math.max(3, Math.round(size * 0.18));
  const data = Buffer.alloc((width * 4 + 1) * height);
  let offset = 0;

  for (let y = 0; y < height; y += 1) {
    data[offset] = 0;
    offset += 1;

    for (let x = 0; x < width; x += 1) {
      const inside = isInsideRoundedRect(x, y, width, height, radius);
      const line = isLinePixel(x, y, size);
      const color = line ? [255, 255, 255, 255] : inside ? [25, 107, 82, 255] : [0, 0, 0, 0];

      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = color[3];
      offset += 4;
    }
  }

  const chunks = [
    pngChunk("IHDR", ihdr(width, height)),
    pngChunk("IDAT", deflateSync(data)),
    pngChunk("IEND", Buffer.alloc(0))
  ];

  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ...chunks]);
}

function isLinePixel(x, y, size) {
  const marginX = Math.round(size * 0.22);
  const lineWidth = size - marginX * 2;
  const top = Math.round(size * 0.32);
  const middle = Math.round(size * 0.5);
  const bottom = Math.round(size * 0.68);
  const heavy = Math.max(1, Math.round(size * 0.06));
  const light = Math.max(1, Math.round(size * 0.04));
  const withinX = x >= marginX && x < marginX + lineWidth;

  return withinX && (Math.abs(y - top) <= heavy || Math.abs(y - middle) <= light || Math.abs(y - bottom) <= heavy);
}

function isInsideRoundedRect(x, y, width, height, radius) {
  const left = radius;
  const right = width - radius - 1;
  const top = radius;
  const bottom = height - radius - 1;

  if ((x >= left && x <= right) || (y >= top && y <= bottom)) {
    return true;
  }

  const cornerX = x < left ? left : right;
  const cornerY = y < top ? top : bottom;
  return (x - cornerX) ** 2 + (y - cornerY) ** 2 <= radius ** 2;
}

function ihdr(width, height) {
  const buffer = Buffer.alloc(13);
  buffer.writeUInt32BE(width, 0);
  buffer.writeUInt32BE(height, 4);
  buffer[8] = 8;
  buffer[9] = 6;
  buffer[10] = 0;
  buffer[11] = 0;
  buffer[12] = 0;
  return buffer;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}
