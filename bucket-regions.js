"use strict";

function rasterSeed(pixels, width, height, x, y) {
  if (x >= 0 && x < width && y >= 0 && y < height && pixels[y * width + x]) return y * width + x;
  for (let radius = 1; radius <= 3; radius++) {
    for (let row = Math.max(0, y - radius); row <= Math.min(height - 1, y + radius); row++) {
      for (let col = Math.max(0, x - radius); col <= Math.min(width - 1, x + radius); col++) {
        const index = row * width + col;
        if (pixels[index]) return index;
      }
    }
  }
  return -1;
}

function selectComponent(pixels, width, height, seed, observe) {
  const pending = new Int32Array(pixels.length);
  pending[0] = seed;
  pixels[seed] = 2;
  let length = 1;

  function visit(index) {
    if (pixels[index] !== 1) return;
    pixels[index] = 2;
    pending[length++] = index;
  }

  for (let current = 0; current < length; current++) {
    const index = pending[current];
    const column = index % width;
    if (observe?.(index, column) === false) return 0;
    if (column > 0) visit(index - 1);
    if (column < width - 1) visit(index + 1);
    if (index >= width) visit(index - width);
    if (index < pixels.length - width) visit(index + width);
  }
  return length;
}

function componentClip(pixels, width, height, box, pad = .75) {
  const rectangles = [];
  let previousRuns = new Map();
  const dx = box.w / width;
  const dy = box.h / height;
  const format = (value) => Number(value.toFixed(3));

  for (let row = 0; row < height; row++) {
    const runs = new Map();
    const start = row * width;
    let column = 0;
    while (column < width) {
      if (pixels[start + column] !== 2) {
        column++;
        continue;
      }
      const left = column;
      do { column++; } while (column < width && pixels[start + column] === 2);
      const key = left + ":" + column;
      const rectangle = previousRuns.get(key) ?? { left, right: column, top: row, bottom: row + 1 };
      if (rectangle.top === row) rectangles.push(rectangle);
      rectangle.bottom = row + 1;
      runs.set(key, rectangle);
    }
    previousRuns = runs;
  }

  return rectangles.map((rectangle) => {
    const left = format(box.x + (rectangle.left - pad) * dx);
    const right = format(box.x + (rectangle.right + pad) * dx);
    const top = format(box.y + (rectangle.top - pad) * dy);
    const bottom = format(box.y + (rectangle.bottom + pad) * dy);
    return "M" + left + " " + top + "H" + right + "V" + bottom + "H" + left + "Z";
  }).join("");
}

async function rasterizeBucketVector(vector, box, scale) {
  const width = Math.max(1, Math.ceil(box.w * scale));
  const height = Math.max(1, Math.ceil(box.h * scale));
  const viewBox = [box.x, box.y, box.w, box.h].join(" ");
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height +
    '" preserveAspectRatio="none" viewBox="' + viewBox + '">' + vector + '</svg>';
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    context.drawImage(image, 0, 0);
  } finally {
    URL.revokeObjectURL(url);
  }

  return context.getImageData(0, 0, width, height);
}

async function findPaintComponent(vector, box, point) {
  if (!box.w || !box.h) return null;
  const scale = Math.min(2, 1600 / Math.max(box.w, box.h));
  const { data, width, height } = await rasterizeBucketVector(vector, box, scale);
  const pixels = new Uint8Array(width * height);
  let total = 0;
  for (let i = 0; i < pixels.length; i++) {
    if (data[i * 4 + 3] < 128) continue;
    pixels[i] = 1;
    total++;
  }

  const x = Math.floor((point.x - box.x) / box.w * width);
  const y = Math.floor((point.y - box.y) / box.h * height);
  const seed = rasterSeed(pixels, width, height, x, y);
  if (seed === -1) return null;
  const count = selectComponent(pixels, width, height, seed);
  return { clip: count === total ? "" : componentClip(pixels, width, height, box) };
}

function closedInkRegion(raster, box, point, owners) {
  const { data, width, height } = raster;
  const dx = box.w / width;
  const dy = box.h / height;
  const x = Math.floor((point.x - box.x) / dx);
  const y = Math.floor((point.y - box.y) / dy);
  if (x < 0 || y < 0 || x >= width || y >= height) return null;
  const seed = y * width + x;
  if (data[seed * 4 + 3] >= 32) return null;

  const pixels = new Uint8Array(width * height);
  for (let i = 0; i < pixels.length; i++) pixels[i] = Number(data[i * 4 + 3] < 32);

  let left = x;
  let right = x;
  let top = y;
  let bottom = y;
  const ids = new Set();
  const boundary = [];
  function addBoundary(index) {
    if (pixels[index] !== 0) return false;
    pixels[index] = 3;
    boundary.push(index);
    return true;
  }
  function addOwner(index) {
    if (!addBoundary(index)) return;
    const offset = index * 4;
    const channel = (index) => Math.floor(data[offset + index] / 8);
    const id = owners.get(channel(0) * 1024 + channel(1) * 32 + channel(2));
    if (id !== undefined) ids.add(id);
  }
  const count = selectComponent(pixels, width, height, seed, (index, column) => {
    const row = Math.floor(index / width);
    if (!column || !row || column === width - 1 || row === height - 1) return false;
    left = Math.min(left, column);
    right = Math.max(right, column);
    top = Math.min(top, row);
    bottom = Math.max(bottom, row);
    addOwner(index - 1);
    addOwner(index + 1);
    addOwner(index - width);
    addOwner(index + width);
  });
  if (!count || !ids.size) return null;
  // Overlap the stroke's antialiased edge without crossing into another open region.
  const depth = Math.ceil(1.1 / Math.max(dx, dy));
  let from = 0;
  for (let step = 0; step < depth && from < boundary.length; step++) {
    const end = boundary.length;
    for (; from < end; from++) {
      const index = boundary[from];
      const column = index % width;
      const row = Math.floor(index / width);
      pixels[index] = 2;
      left = Math.min(left, column);
      right = Math.max(right, column);
      top = Math.min(top, row);
      bottom = Math.max(bottom, row);
      if (step + 1 === depth) continue;
      if (column > 0) addBoundary(index - 1);
      if (column < width - 1) addBoundary(index + 1);
      if (row > 0) addBoundary(index - width);
      if (row < height - 1) addBoundary(index + width);
    }
  }
  const bounds = {
    x: box.x + left * dx, y: box.y + top * dy,
    w: (right + 1 - left) * dx, h: (bottom + 1 - top) * dy,
  };
  const localBox = { ...box, x: -left * dx, y: -top * dy };
  return {
    bounds, ids: [...ids].sort((a, b) => a - b),
    pathData: componentClip(pixels, width, height, localBox, 0),
  };
}
