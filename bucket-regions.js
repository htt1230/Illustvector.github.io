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

function componentClip(pixels, width, height, box) {
  const edges = new Map();
  const dx = box.w / width;
  const dy = box.h / height;
  const format = (value) => Number(value.toFixed(3));
  const filled = (x, y) => x >= 0 && x < width && y >= 0 && y < height && pixels[y * width + x] === 2;
  const key = (x, y) => y * (width + 1) + x;
  function edge(x1, y1, x2, y2) {
    const start = key(x1, y1);
    const next = edges.get(start) ?? [];
    next.push({ x: x2, y: y2 });
    edges.set(start, next);
  }
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!filled(x, y)) continue;
    if (!filled(x, y - 1)) edge(x, y, x + 1, y);
    if (!filled(x + 1, y)) edge(x + 1, y, x + 1, y + 1);
    if (!filled(x, y + 1)) edge(x + 1, y + 1, x, y + 1);
    if (!filled(x - 1, y)) edge(x, y + 1, x, y);
  }
  const paths = [];
  while (edges.size) {
    const start = edges.keys().next().value;
    let current = { x: start % (width + 1), y: Math.floor(start / (width + 1)) };
    const points = [current];
    do {
      const id = key(current.x, current.y);
      const next = edges.get(id);
      if (!next?.length) break;
      current = next.pop();
      if (!next.length) edges.delete(id);
      points.push(current);
    } while (key(current.x, current.y) !== start);
    if (points.length < 4) continue;
    // Collapse straight pixel runs before simplifying the remaining contour.
    const corners = points.filter((p, i) => {
      if (!i || i === points.length - 1) return true;
      const a = points[i - 1], b = points[i + 1];
      return (p.x - a.x) * (b.y - p.y) !== (p.y - a.y) * (b.x - p.x);
    });
    const simplified = [corners[0]];
    let anchor = 0;
    while (anchor < corners.length - 1) {
      let end = anchor + 2;
      for (; end < corners.length; end++) {
        const a = corners[anchor], b = corners[end];
        const length = Math.hypot(b.x - a.x, b.y - a.y);
        if (!length) break;
        let deviation = 0;
        for (let i = anchor + 1; i < end; i++) {
          deviation = Math.max(deviation, Math.abs((b.x - a.x) * (a.y - corners[i].y) -
            (a.x - corners[i].x) * (b.y - a.y)) / length);
          if (deviation > .6) break;
        }
        if (deviation > .6) break;
      }
      anchor = Math.max(anchor + 1, end - 1);
      simplified.push(corners[anchor]);
    }
    if (simplified.length < 4) continue;
    simplified.pop();
    if (simplified.length > 12) {
      try {
        const fitted = fitBucketContour(simplified, box, dx, dy);
        if (fitted) {
          paths.push(fitted);
          continue;
        }
      } catch {
        // Keep the sampled contour if a curve cannot be fitted.
      }
    }
    const coords = simplified.map((p) => ({ x: box.x + p.x * dx, y: box.y + p.y * dy }));
    const point = (p) => format(p.x) + " " + format(p.y);
    const rounded = coords.map((p, i) => {
      const before = coords[(i + coords.length - 1) % coords.length];
      const after = coords[(i + 1) % coords.length];
      const fraction = (other) => Math.min(.18, Math.min(dx, dy) * .5 / Math.hypot(other.x - p.x, other.y - p.y));
      const toward = (other) => {
        const t = fraction(other);
        return { x: p.x + (other.x - p.x) * t, y: p.y + (other.y - p.y) * t };
      };
      return { in: toward(before), corner: p, out: toward(after) };
    });
    let path = "M" + point(rounded[0].in);
    for (const p of rounded) path += "L" + point(p.in) + "Q" + point(p.corner) + " " + point(p.out);
    paths.push(path + "Z");
  }
  return paths.join("");
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
    pathData: componentClip(pixels, width, height, localBox),
  };
}
