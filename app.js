"use strict";

const byId = (id) => document.getElementById(id);
const width = 760;
const height = 530;
const drawing = byId("drawing");
const artwork = byId("artwork");
const guideLines = byId("guide-lines");
const guideDraft = byId("guide-draft");
const curveDraft = byId("curve-draft");
const guideControls = byId("guide-controls");
const guideSpacingMarks = byId("guide-spacing");
const lineAlignmentMark = byId("line-alignment");
const endpointSnapMark = byId("endpoint-snap");
const inkControls = byId("ink-controls");
const inkWidthInput = byId("ink-width");
const outlineLayer = byId("selection-outlines");
const selectionMarquee = byId("selection-marquee");
const draftLayer = byId("draft");
const resizeHandles = byId("resize-handles");
const rotationHandle = byId("rotation-handle");
const shapeFillSwitch = byId("shape-fill");
const viewport = byId("viewport");
const artboard = byId("artboard");
const layerList = byId("layers");
const layerDrag = setupLayerDrag(layerList, moveLayer);
const expandedLayerGroups = new Set();
const groupGeometry = new Map();
let groupGeometryLayers;

const icons = {
  file: '<path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z"/><path d="M13 3v7h7M8 14h8M8 17h5"/>',
  folder: '<path d="M3 18V6a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v2M3 18l2.5-7h16a1 1 0 0 1 .9 1.3l-2.5 6a2 2 0 0 1-1.8 1.2H4a1 1 0 0 1-1-1.5Z"/>',
  newFile: '<path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z"/><path d="M13 3v7h7m-8 3v5m-2.5-2.5h5"/>',
  undo: '<path d="M9 14 4 9l5-5M4 9h10a5 5 0 0 1 0 10h-3"/>',
  redo: '<path d="m15 14 5-5-5-5m5 5H10a5 5 0 0 0 0 10h3"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  paste: '<rect x="5" y="6" width="14" height="15" rx="2"/><rect x="9" y="3" width="6" height="5" rx="1"/><path d="M9 13h6m-6 4h6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  warning: '<path d="M12 3 2.5 20h19zM12 9v4m0 3v.1"/>',
  fit: '<path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5"/><rect x="8" y="8" width="8" height="8" rx="1"/>',
  layers: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  strokeWeight: '<path d="M4 5h16" stroke-width="1"/><path d="M4 11h16" stroke-width="2.5"/><path d="M4 18h16" stroke-width="4"/>',
  link: '<path d="m10 8 2-2a4 4 0 0 1 6 6l-2 2m-2 2-2 2a4 4 0 0 1-6-6l2-2m1 5 6-6"/>',
  unlink: '<path d="m13 6 1-1a4 4 0 0 1 6 6l-1 1m-8 6-1 1a4 4 0 0 1-6-6l1-1m3-5-2-2m7 5 2 3m1 4 2 2"/>',
  download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/>',
  select: '<path d="m5 3 14 9-7 1.4L9 20z"/>',
  text: '<path d="M5 7V4h14v3M12 4v16m-4 0h8"/>',
  bucket: '<path d="m5 4 5 5m1-5 7 7-7.5 7.5a2 2 0 0 1-2.8 0l-4.2-4.2a2 2 0 0 1 0-2.8L11 4ZM5 13h11m4 2c1 1.5 2 2.5 2 3.5a2 2 0 0 1-4 0c0-1 1-2 2-3.5Z"/>',
  guide: '<path d="M6.5 17.5 17.5 6.5" stroke-dasharray="2 2"/><circle cx="5" cy="19" r="1.5"/><circle cx="19" cy="5" r="1.5"/>',
  curve: '<path d="M4 18Q12-5 20 18" stroke-dasharray="2 2"/><circle cx="4" cy="18" r="1.6"/><circle cx="12" cy="6.5" r="1.6"/><circle cx="20" cy="18" r="1.6"/>',
  ink: '<path d="M6.5 17.5 17.5 6.5"/><circle cx="5" cy="19" r="1.5" fill="currentColor"/><circle cx="19" cy="5" r="1.5" fill="currentColor"/>',
  inkCurve: '<path d="M4 18Q12-5 20 18"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/><circle cx="12" cy="6.5" r="1.5" fill="currentColor"/><circle cx="20" cy="18" r="1.5" fill="currentColor"/>',
  chevronUp: '<path d="m6 15 6-6 6 6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  chevronRight: '<path d="m9 6 6 6-6 6"/>',
  grip: '<path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01" stroke-width="3"/>',
  rect: '<rect x="4" y="4" width="16" height="16" rx="1"/>',
  ellipse: '<circle cx="12" cy="12" r="8.4"/>',
  triangle: '<path d="m12 4 9 16H3z"/>',
  diamond: '<path d="m12 3 9 9-9 9-9-9z"/>',
  union: '<path d="M3 4h12v6h6v11H9v-6H3z" fill="currentColor" fill-opacity=".15"/>',
  subtract: '<path d="M3 4h12v5H9v6H3z" fill="currentColor" fill-opacity=".2"/><path d="M15 9h6v12H9v-6" stroke-dasharray="2 2"/>',
  intersect: '<rect x="3" y="4" width="12" height="11" rx="1" stroke-dasharray="2 2"/><rect x="9" y="9" width="12" height="12" rx="1" stroke-dasharray="2 2"/><path d="M9 9h6v6H9z" fill="currentColor"/>',
  xor: '<path d="M3 4h12v5H9v6H3zM15 9h6v12H9v-6h6z" fill="currentColor" fill-opacity=".2"/>',
  canvas: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 8h18"/>',
  mouse: '<rect x="7" y="3" width="10" height="18" rx="5"/><path d="M12 7v3"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/>',
  strokeRound: '<path d="M5 19v-7a7 7 0 0 1 7-7h7m0 5h-7a2 2 0 0 0-2 2v7"/>',
  strokeMiter: '<path d="M5 19V5h14m0 5h-9v9"/>',
  eye: '<path d="M2 12c2.6-4.1 6-6.2 10-6.2s7.4 2.1 10 6.2c-2.6 4.1-6 6.2-10 6.2S4.6 16.1 2 12Z"/><circle cx="12" cy="12" r="2.5"/>',
  eyeOff: '<path d="M3 3l18 18M10 6a11 11 0 0 1 2-.2c4 0 7.4 2.1 10 6.2a17 17 0 0 1-3 3.5M6 7.6A17 17 0 0 0 2 12c2.6 4.1 6 6.2 10 6.2 1.2 0 2.3-.2 3.4-.6"/>',
};

function icon(name) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + icons[name] + '</svg>';
}

document.querySelectorAll("[data-icon]").forEach((element) => {
  element.innerHTML = icon(element.dataset.icon);
});

const shapeNames = { rect: "四角形", ellipse: "円・楕円", triangle: "三角形", diamond: "ひし形" };
const operationNames = { union: "結合", subtract: "切り抜き", intersect: "交差", xor: "除外" };
const colors = ["#7770e6", "#8cdbb2", "#49afa8", "#ffc66f", "#eb8fa9", "#2e3148"];
const rect = { kind: "rect", x: 207, y: 108, w: 218, h: 218 };
const circle = { kind: "ellipse", x: 326, y: 193, w: 226, h: 226 };

let layers = [
  { id: 1, name: "四角形", color: colors[1], shape: rect },
  { id: 2, name: "円", color: colors[0], shape: circle },
  { id: 3, name: "交差", color: colors[2], shape: { kind: "intersect", parts: [rect, circle] } },
];
let nextId = 4;
let guides = [];
let activeGuide = null;
let cleanLayers = layers;
let cleanGuides = guides;
let displayedGuides = null;
let hiddenGuide = null;
let movingGuideElements = new Set();
let jointGuideIndices = new Set();
let displayedGuideControls = "";
let displayedInkControls = "";
let curvePoints = [];
let curveCursor = null;
let curveStartControl = null;
let facesFromGuides = null;
let guideFaces = [];
let inkBarrierCache = null;
let availableDraft = null;
let draftError = "";
let selection = new Set();
let tool = "select";
let brush = colors[0];
const defaultStroke = { enabled: false, color: "#2e3148", width: 2 };
let strokeBrush = defaultStroke;
let noFillBrush = false;
let shapeFillEnabled = true;
let opacityBrush = 100;
let inkWidth = 5;
let zoom = 1;
let gesture = null;
let drawingFrame = 0;
let resizeId = null;
let colorPreview = null;
let strokePreview = null;
let opacityPreview = null;
let bucketQueue = Promise.resolve();
let noticeTimer;
let textState = null;
let textPreviewTimer;
const undoStack = [];
const redoStack = [];
const outlineElements = new Map();
const artworkElements = new Map();
const shapeBounds = new WeakMap();
const strokeHitPaths = new WeakMap();
let resizeHandleShape = null;
let resizeHandleSize = 0;
let rotationHandleShape = null;
let rotationHandleScale = 0;
const corners = { nw: [-1, -1], ne: [1, -1], sw: [-1, 1], se: [1, 1] };
const edges = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };
const identityMatrix = [1, 0, 0, 1, 0, 0];
let copiedObjects = null;
const strokeDirections = Array.from({ length: 8 }, (_, index) => {
  const angle = index * Math.PI / 4;
  return [Math.cos(angle), Math.sin(angle)];
});
const squareStrokeDirections = strokeDirections.map(([x, y]) => {
  const edge = Math.max(Math.abs(x), Math.abs(y));
  return [x / edge, y / edge];
});
const pathContext = document.createElement("canvas").getContext("2d");
const escapeMarkup = (value) => value.replace(/[&<>"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;",
})[char]);

function primarySelectionId() {
  return selection.values().next().value;
}

function projectPoint([a, b, c, d, e, f], { x, y }) {
  return { x: a * x + c * y + e, y: b * x + d * y + f };
}

function unprojectPoint([a, b, c, d, e, f], { x, y }) {
  const determinant = a * d - b * c;
  return { x: (d * (x - e) - c * (y - f)) / determinant, y: (a * (y - f) - b * (x - e)) / determinant };
}

function multiplyMatrices([a, b, c, d, e, f], [g, h, i, j, k, l]) {
  return [a * g + c * h, b * g + d * h, a * i + c * j, b * i + d * j, a * k + c * l + e, b * k + d * l + f];
}

function scalingMatrix(before, after) {
  const x = after.w / before.w;
  const y = after.h / before.h;
  return [x, 0, 0, y, after.x - before.x * x, after.y - before.y * y];
}

function rotationMatrix({ center, angle, snap }) {
  const step = Math.PI / 12;
  const radians = snap ? Math.round(angle / step) * step : angle;
  if (Math.abs(radians) < .001) return null;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const { x, y } = center;
  return [cos, sin, -sin, cos, x - cos * x + sin * y, y - sin * x - cos * y];
}

function shapeFrame(shape) {
  return shape.kind === "affine"
    ? { box: bounds(shape.base), matrix: shape.matrix }
    : { box: bounds(shape), matrix: identityMatrix };
}

function geometryTarget(layer) {
  const groupId = layer.groupId;
  if (!groupId) return { shape: layer.shape, targets: new Set([layer.id]) };
  if (groupGeometryLayers !== layers) {
    groupGeometry.clear();
    groupGeometryLayers = layers;
  }
  if (groupGeometry.has(groupId)) return groupGeometry.get(groupId);
  const targets = new Set();
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const member of layers) {
    if (member.groupId !== groupId) continue;
    targets.add(member.id);
    const { x, y, w, h } = bounds(member.shape);
    left = Math.min(left, x);
    top = Math.min(top, y);
    right = Math.max(right, x + w);
    bottom = Math.max(bottom, y + h);
  }
  const target = {
    shape: { kind: "rect", x: left, y: top, w: right - left, h: bottom - top }, targets,
  };
  groupGeometry.set(groupId, target);
  return target;
}

function primaryGeometryLayer() {
  const primary = layers.find((layer) => layer.id === primarySelectionId());
  if (primary?.hidden && primary.groupId) {
    return layers.find((layer) => !layer.hidden && layer.groupId === primary.groupId);
  }
  return primary?.hidden ? undefined : primary;
}

function transformShape(shape, matrix) {
  return shape.kind === "affine"
    ? { ...shape, matrix: multiplyMatrices(matrix, shape.matrix) }
    : { kind: "affine", base: shape, matrix };
}

function framePoint({ box, matrix }, dx, dy, padding = 0) {
  return projectPoint(matrix, {
    x: box.x + box.w / 2 + dx * (box.w / 2 + padding),
    y: box.y + box.h / 2 + dy * (box.h / 2 + padding),
  });
}

function frameCorners(frame, padding = 0) {
  return ["nw", "ne", "se", "sw"].map((corner) => framePoint(frame, ...corners[corner], padding));
}

function bounds(shape) {
  if (shape.kind !== "affine" && shape.kind !== "outline" && shape.kind !== "ink" && !shape.parts) return shape;
  let box = shapeBounds.get(shape);
  if (!box) {
    box = compoundBounds(shape);
    shapeBounds.set(shape, box);
  }
  return box;
}

function compoundBounds(shape) {
  if (shape.kind === "ink") return inkBounds(shape);
  if (shape.kind === "outline") {
    const box = bounds(shape.base);
    const angular = shape.base.kind === "triangle" || shape.base.kind === "diamond" ||
      (shape.base.kind === "affine" && nativeStroke(shape.base));
    const pad = shape.width / 2 * (angular && shape.join === "miter" ? 4 : 1);
    return { x: box.x - pad, y: box.y - pad, w: box.w + 2 * pad, h: box.h + 2 * pad };
  }
  if (shape.kind === "affine") {
    const points = frameCorners(shapeFrame(shape));
    const xs = points.map(({ x }) => x);
    const ys = points.map(({ y }) => y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
  }
  const boxes = shape.parts.map(bounds);
  if (shape.kind === "subtract") return boxes[0];
  const minX = shape.kind === "intersect" ? Math.max : Math.min;
  const maxX = shape.kind === "intersect" ? Math.min : Math.max;
  const x = minX(...boxes.map((box) => box.x));
  const y = minX(...boxes.map((box) => box.y));
  const edgeX = maxX(...boxes.map((box) => box.x + box.w));
  const edgeY = maxX(...boxes.map((box) => box.y + box.h));
  return { x, y, w: Math.max(0, edgeX - x), h: Math.max(0, edgeY - y) };
}

function vertices({ kind, x, y, w, h }) {
  if (kind === "triangle") return [[x + w / 2, y], [x + w, y + h], [x, y + h]];
  return [[x + w / 2, y], [x + w, y + h / 2], [x + w / 2, y + h], [x, y + h / 2]];
}

function nativeStroke(shape) {
  return Object.hasOwn(shapeNames, shape.kind) || (shape.kind === "affine" &&
    ["rect", "triangle", "diamond"].includes(shape.base.kind));
}

function strokePolygon(shape) {
  const base = shape.kind === "affine" ? shape.base : shape;
  const { x, y, w, h } = base;
  const points = base.kind === "rect" ? [[x,y], [x+w,y], [x+w,y+h], [x,y+h]] : vertices(base);
  if (shape.kind !== "affine") return points;
  return points.map(([x, y]) => {
    const point = projectPoint(shape.matrix, { x, y });
    return [point.x, point.y];
  });
}

function outlineContains(shape, width, join, point) {
  if (nativeStroke(shape)) {
    let path = strokeHitPaths.get(shape);
    if (!path) {
      path = new Path2D();
      const { x, y, w, h } = shape;
      if (shape.kind === "rect") {
        path.rect(x, y, w, h);
      } else if (shape.kind === "ellipse") {
        path.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, 2 * Math.PI);
      } else {
        const [first, ...rest] = strokePolygon(shape);
        path.moveTo(...first);
        rest.forEach((vertex) => path.lineTo(...vertex));
        path.closePath();
      }
      strokeHitPaths.set(shape, path);
    }
    pathContext.lineWidth = width;
    pathContext.lineJoin = join;
    pathContext.miterLimit = 4;
    return pathContext.isPointInStroke(path, point.x, point.y);
  }

  const inside = contains(shape, point);
  const radius = width / 2;
  const directions = join === "miter" ? squareStrokeDirections : strokeDirections;
  return directions.some(([dx, dy]) => contains(shape, {
    x: point.x + dx * radius,
    y: point.y + dy * radius,
  }) !== inside);
}

function contains(shape, point, usePathBounds = false) {
  if (shape.kind === "affine") return contains(shape.base, unprojectPoint(shape.matrix, point), usePathBounds);
  if (shape.kind === "outline") return outlineContains(shape.base, shape.width, shape.join, point);
  if (shape.kind === "ink") {
    const { x, y, w, h } = bounds(shape);
    return point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h && inkContains(shape, point, pathContext);
  }
  if (shape.parts) {
    const hits = (part) => contains(part, point);
    switch (shape.kind) {
      case "union": return shape.parts.some(hits);
      case "intersect": return shape.parts.every(hits);
      case "subtract": return hits(shape.parts[0]) && !shape.parts.slice(1).some(hits);
      case "xor": return shape.parts.reduce((odd, part) => odd !== hits(part), false);
    }
  }

  const { x, y, w, h, kind } = shape;
  if (w <= 0 || h <= 0 || point.x < x || point.x > x + w || point.y < y || point.y > y + h) return false;
  const u = (point.x - x) / w;
  const v = (point.y - y) / h;
  if (kind === "path" && !usePathBounds) {
    return pathContext.isPointInPath(shape.hitPath, shape.sourceX + u * shape.sourceW, shape.sourceY + v * shape.sourceH);
  }
  if (kind === "ellipse") return (2 * u - 1) ** 2 + (2 * v - 1) ** 2 <= 1;
  if (kind === "triangle") return Math.abs(2 * u - 1) <= v;
  if (kind === "diamond") return Math.abs(2 * u - 1) + Math.abs(2 * v - 1) <= 1;
  return true;
}

function move(shape, dx, dy) {
  if (shape.kind === "affine") {
    const [a, b, c, d, e, f] = shape.matrix;
    return { ...shape, matrix: [a, b, c, d, e + dx, f + dy] };
  }
  if (shape.kind === "outline") return { ...shape, base: move(shape.base, dx, dy) };
  if (shape.kind === "ink") {
    const offset = ({ x, y }) => ({ x: x + dx, y: y + dy });
    return { ...shape, points: shape.points.map(offset), ...(shape.controls ? { controls: shape.controls.map(offset) } : {}) };
  }
  if (shape.kind === "xor" && shape.paints?.length) {
    return { kind: "affine", base: shape, matrix: [1, 0, 0, 1, dx, dy] };
  }
  if (shape.parts) return { ...shape, parts: shape.parts.map((part) => move(part, dx, dy)) };
  return { ...shape, x: shape.x + dx, y: shape.y + dy };
}

function scaleShape(shape, before, after) {
  if (shape.kind === "affine") {
    return { ...shape, matrix: multiplyMatrices(scalingMatrix(before, after), shape.matrix) };
  }
  if (shape.kind === "outline" || shape.kind === "ink") return { kind: "affine", base: shape, matrix: scalingMatrix(before, after) };
  if (shape.kind === "xor" && shape.paints?.length) {
    return { kind: "affine", base: shape, matrix: scalingMatrix(before, after) };
  }
  if (shape.parts) {
    return { ...shape, parts: shape.parts.map((part) => scaleShape(part, before, after)) };
  }
  const scaleX = after.w / before.w;
  const scaleY = after.h / before.h;
  return {
    ...shape,
    x: after.x + (shape.x - before.x) * scaleX,
    y: after.y + (shape.y - before.y) * scaleY,
    w: shape.w * scaleX,
    h: shape.h * scaleY,
  };
}

const number = (value) => Number(value.toFixed(3));

function rootXor(shape) {
  const base = shape.kind === "affine" ? shape.base : shape;
  return base.kind === "xor" ? base : null;
}

function replaceRootXor(shape, xor) {
  return shape.kind === "affine" ? { ...shape, base: xor } : xor;
}

function hasXorColors(xor) {
  return Boolean(xor?.sourceColors || xor?.paintOnly || xor?.paints?.length);
}

function hasStoredPaint(shape) {
  const base = shape.kind === "affine" ? shape.base : shape;
  return base.kind === "union" ? Boolean(base.sourceColors) : hasXorColors(rootXor(shape));
}

function clearXorColors(shape) {
  const xor = rootXor(shape);
  return hasXorColors(xor)
    ? replaceRootXor(shape, { ...xor, sourceColors: undefined, paints: undefined, paintOnly: undefined })
    : shape;
}

function xorFace(xor, membership) {
  const inside = new Set(membership);
  const positive = [];
  const negative = [];
  xor.parts.forEach((part, index) => (inside.has(index) ? positive : negative).push(part));
  const face = positive.length === 1 ? positive[0] : { kind: "intersect", parts: positive };
  return negative.length ? { kind: "subtract", parts: [face, ...negative] } : face;
}

function primitive(shape) {
  const { kind } = shape;
  if (kind === "ink") {
    if (shape.points.length === 1) {
      const [point] = shape.points;
      return '<circle cx="' + number(point.x) + '" cy="' + number(point.y) + '" r="' + shape.width / 2 + '"/>';
    }
    return '<path d="' + inkPathData(shape) + '" fill="none" stroke="currentColor" stroke-width="' + shape.width +
      '" stroke-linejoin="round" stroke-linecap="round"/>';
  }
  if (kind === "path") {
    const { x, y, w, h, sourceX, sourceY, sourceW, sourceH, pathData } = shape;
    return '<path d="' + pathData + '" transform="translate(' + number(x) + ' ' + number(y) +
      ') scale(' + w / sourceW + ' ' + h / sourceH + ') translate(' + -sourceX + ' ' + -sourceY + ')"/>';
  }
  const [x, y, w, h] = [shape.x, shape.y, shape.w, shape.h].map(number);
  if (kind === "rect") return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>';
  if (kind === "ellipse") {
    return '<ellipse cx="' + (x + w / 2) + '" cy="' + (y + h / 2) + '" rx="' + w / 2 + '" ry="' + h / 2 + '"/>';
  }
  return '<polygon points="' + vertices({ kind, x, y, w, h }).map((pair) => pair.join(",")).join(" ") + '"/>';
}

function strokePrimitive(shape) {
  if (shape.kind !== "affine") return primitive(shape);
  const points = strokePolygon(shape).map((point) => point.map(number).join(",")).join(" ");
  return '<polygon points="' + points + '"/>';
}

function strokeAttributes(color, width, join = "round") {
  return ' stroke="' + color + '" stroke-width="' + width + '" stroke-linejoin="' + join + '"';
}

function renderVector(items, prefix) {
  const definitions = [];
  const compiled = new WeakMap();
  let sequence = 0;
  const newId = () => prefix + "-" + ++sequence;
  const use = (id, fill = "") => '<use href="#' + id + '"' + (fill ? ' fill="' + fill + '" color="' + fill + '"' : "") + '/>';
  const masked = (id, content) => '<g mask="url(#' + id + ')">' + content + '</g>';

  function group(content) {
    const id = newId();
    definitions.push('<g id="' + id + '">' + content + '</g>');
    return id;
  }

  function mask(content, box) {
    const id = newId();
    definitions.push(
      '<mask id="' + id + '" maskUnits="userSpaceOnUse" x="' + number(box.x - 2) +
      '" y="' + number(box.y - 2) + '" width="' + number(box.w + 4) + '" height="' + number(box.h + 4) +
      '" style="mask-type:luminance">' + content + '</mask>',
    );
    return id;
  }

  function outlineFilter(shape, stroke) {
    const id = newId();
    const box = bounds(shape);
    const radius = stroke.width / 2;
    const pad = radius + 2;
    let outer = '<feMorphology in="SourceAlpha" operator="dilate" radius="' + radius + '" result="outer"/>';
    if (stroke.join !== "miter") {
      // Merge inscribed rectangles to approximate a circular dilation kernel.
      const angles = radius >= 6 ? [8,25,45,65,82] : [12,45,78];
      outer = angles.map((angle, index) => {
        const radians = angle * Math.PI / 180;
        return '<feMorphology in="SourceAlpha" operator="dilate" radius="' + number(radius * Math.cos(radians)) +
          ' ' + number(radius * Math.sin(radians)) + '" result="rounded' + index + '"/>';
      }).join("") + '<feMerge result="outer">' +
        angles.map((_, index) => '<feMergeNode in="rounded' + index + '"/>').join("") + '</feMerge>';
    }
    definitions.push(
      '<filter id="' + id + '" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB" x="' + number(box.x - pad) +
      '" y="' + number(box.y - pad) + '" width="' + number(box.w + pad * 2) +
      '" height="' + number(box.h + pad * 2) + '">' +
      outer +
      '<feMorphology in="SourceAlpha" operator="erode" radius="' + radius + '" result="inner"/>' +
      '<feComposite in="outer" in2="inner" operator="out" result="edge"/>' +
      '<feFlood flood-color="' + stroke.color + '" result="paint"/>' +
      '<feComposite in="paint" in2="edge" operator="in"/>' +
      '</filter>',
    );
    return id;
  }

  function appendUnionPart(shape, content) {
    if (shape.kind === "union") {
      for (const part of shape.parts) appendUnionPart(part, content);
    } else if (shape.parts || shape.kind === "affine" || shape.kind === "outline") {
      content.push(use(compile(shape)));
    } else {
      content.push(primitive(shape));
    }
  }

  function compile(shape) {
    let id = compiled.get(shape);
    if (!id) {
      id = compileShape(shape);
      compiled.set(shape, id);
    }
    return id;
  }

  function compileShape(shape) {
    if (shape.kind === "outline") {
      if (nativeStroke(shape.base)) {
        const line = strokeAttributes("currentColor", shape.width, shape.join);
        return group('<g fill="none"' + line + '>' + strokePrimitive(shape.base) + '</g>');
      }
      const id = compile(shape.base);
      const box = bounds(shape);
      const filter = outlineFilter(shape.base, { width: shape.width, join: shape.join, color: "white" });
      const maskId = newId();
      const region = ' x="' + number(box.x) + '" y="' + number(box.y) + '" width="' + number(box.w) +
        '" height="' + number(box.h) + '"';
      definitions.push('<mask id="' + maskId + '" maskUnits="userSpaceOnUse" style="mask-type:alpha"' + region +
        '><g filter="url(#' + filter + ')">' + use(id, "white") + '</g></mask>');
      return group('<rect' + region + ' mask="url(#' + maskId + ')"/>');
    }
    if (shape.kind === "affine") {
      return group('<g transform="matrix(' + shape.matrix.join(" ") + ')">' + use(compile(shape.base)) + '</g>');
    }
    if (!shape.parts) return group(primitive(shape));
    if (shape.kind === "union") {
      const content = [];
      appendUnionPart(shape, content);
      return group(content.join(""));
    }
    const parts = shape.parts.map(compile);
    const box = bounds(shape);
    if (shape.kind === "subtract") {
      const silhouette = mask(use(parts[0], "white") + parts.slice(1).map((id) => use(id, "black")).join(""), box);
      return group(masked(silhouette, use(parts[0])));
    }
    if (shape.kind === "intersect") {
      const content = parts.slice(1).reduce((result, id) => masked(mask(use(id, "white"), box), result), use(parts[0]));
      return group(content);
    }
    function parity(start, end) {
      if (end - start === 1) return parts[start];
      const middle = start + Math.floor((end - start) / 2);
      const left = parity(start, middle);
      const right = parity(middle, end);
      const keepLeft = mask(use(left, "white") + use(right, "black"), box);
      const keepRight = mask(use(right, "white") + use(left, "black"), box);
      return group(masked(keepLeft, use(left)) + masked(keepRight, use(right)));
    }
    return parity(0, parts.length);
  }

  function renderXorColors(xor) {
    const firstColor = xor.sourceColors[0];
    if (xor.sourceColors.every((color) => color === firstColor) &&
      xor.parts.every((part) => !hasStoredPaint(part))) {
      return use(compile(xor), firstColor);
    }
    if (xor.parts.length === 2) {
      return xor.parts.map((source, index) => {
        const face = xorFace(xor, [index]);
        const color = xor.sourceColors[index];
        if (!hasStoredPaint(source)) return use(compile(face), color);
        const region = mask(use(compile(face), "white"), bounds(face));
        return masked(region, renderFill(source, color));
      }).join("");
    }

    // The highest source at any point supplies the color of its odd-parity region.
    const content = xor.parts.map((part, index) => renderFill(part, xor.sourceColors[index])).join("");
    const region = mask(use(compile(xor), "white"), bounds(xor));
    return masked(region, content);
  }

  function renderFill(shape, color) {
    const base = shape.kind === "affine" ? shape.base : shape;
    if (base.kind === "union" && base.sourceColors) {
      const content = base.parts.map((part, index) => renderFill(part, base.sourceColors[index])).join("");
      return shape.kind === "affine" ? '<g transform="matrix(' + shape.matrix.join(" ") + ')">' + content + '</g>' : content;
    }
    const xor = rootXor(shape);
    if (!hasXorColors(xor)) return use(compile(shape), color);

    let fill = "";
    if (!xor.paintOnly) fill = xor.sourceColors ? renderXorColors(xor) : use(compile(xor), color);
    for (const paint of xor.paints ?? []) {
      const part = use(compile(xorFace(xor, paint.membership)), paint.color);
      if (paint.clip) {
        const clipId = newId();
        definitions.push('<clipPath id="' + clipId + '"><path d="' + paint.clip + '"/></clipPath>');
        fill += '<g clip-path="url(#' + clipId + ')">' + part + '</g>';
      } else {
        fill += part;
      }
    }
    return shape.kind === "affine" ? '<g transform="matrix(' + shape.matrix.join(" ") + ')">' + fill + '</g>' : fill;
  }

  function renderItem({ shape, color, noFill, stroke = defaultStroke }) {
    if (noFill && !stroke.enabled) return "";
    if (!shape.parts && shape.kind !== "affine" && shape.kind !== "outline" && shape.kind !== "ink" && (shape.kind !== "path" || !stroke.enabled)) {
      const line = stroke.enabled ? strokeAttributes(stroke.color, stroke.width, stroke.join) : "";
      return '<g fill="' + (noFill ? "none" : color) + '"' + line + '>' + primitive(shape) + '</g>';
    }
    const fill = noFill ? "" : renderFill(shape, color);
    if (!stroke.enabled) return fill;
    if (nativeStroke(shape)) {
      return fill + '<g fill="none"' + strokeAttributes(stroke.color, stroke.width, stroke.join) + '>' +
        strokePrimitive(shape) + '</g>';
    }
    const box = bounds(shape);
    if (!box.w || !box.h) return fill;
    const filter = outlineFilter(shape, stroke);
    return fill + '<g filter="url(#' + filter + ')">' + use(compile(shape), "white") + '</g>';
  }
  const content = items.map((item) => {
    const vector = renderItem(item);
    const opacity = item.opacity ?? 100;
    return vector && opacity !== 100 ? '<g opacity="' + opacity / 100 + '">' + vector + '</g>' : vector;
  }).join("");
  return (definitions.length ? "<defs>" + definitions.join("") + "</defs>" : "") + content;
}

function setPreviewTransform(node, transform) {
  if (transform) {
    if (node.getAttribute("transform") !== transform) node.setAttribute("transform", transform);
  } else if (node.hasAttribute("transform")) {
    node.removeAttribute("transform");
  }
}

function renderArtwork(visible, targets, transform) {
  const liveIds = new Set();
  let cursor = artwork.firstElementChild;
  for (const layer of visible) {
    liveIds.add(layer.id);
    let entry = artworkElements.get(layer.id);
    if (!entry) {
      const node = document.createElementNS(drawing.namespaceURI, "g");
      entry = { node, layer: null };
      artworkElements.set(layer.id, entry);
    }
    const { node, layer: previous } = entry;
    if (previous !== layer && (!previous || previous.shape !== layer.shape || previous.color !== layer.color ||
      previous.noFill !== layer.noFill || previous.stroke !== layer.stroke || previous.opacity !== layer.opacity)) {
      node.innerHTML = renderVector([layer], "drawing-" + layer.id);
    }
    entry.layer = layer;
    setPreviewTransform(node, targets?.has(layer.id) ? transform : null);
    if (node === cursor) cursor = cursor.nextElementSibling;
    else artwork.insertBefore(node, cursor);
  }
  for (const [id, { node }] of artworkElements) {
    if (liveIds.has(id)) continue;
    node.remove();
    artworkElements.delete(id);
  }
}

function renderOutlines(visible, targets, transform) {
  const primary = primarySelectionId();
  const primaryGroup = primaryGeometryLayer()?.groupId;
  const resizeGroup = visible.find((layer) => layer.id === resizeId)?.groupId;
  const liveIds = new Set();
  for (const layer of visible) {
    if (!selection.has(layer.id) && !(primaryGroup && layer.groupId === primaryGroup)) continue;
    const id = layer.groupId ?? layer.id;
    if (liveIds.has(id)) continue;
    const frame = shapeFrame(layer.groupId ? geometryTarget(layer).shape : layer.shape);
    const { w, h } = frame.box;
    if (!w || !h) continue;
    const active = layer.id === primary || (layer.groupId && layer.groupId === primaryGroup);
    const resizing = layer.id === resizeId || (layer.groupId && layer.groupId === resizeGroup);
    const pad = resizing ? 0 : 3;
    liveIds.add(id);
    let outline = outlineElements.get(id);
    if (!outline) {
      outline = document.createElementNS(drawing.namespaceURI, "polygon");
      outline.setAttribute("vector-effect", "non-scaling-stroke");
      outlineLayer.append(outline);
      outlineElements.set(id, outline);
    }
    outline.classList.toggle("secondary-outline", !active);
    const points = frameCorners(frame, pad).map(({ x, y }) => number(x) + "," + number(y)).join(" ");
    if (outline.getAttribute("points") !== points) outline.setAttribute("points", points);
    setPreviewTransform(outline, targets?.has(layer.id) ? transform : null);
  }
  for (const [id, outline] of outlineElements) {
    if (liveIds.has(id)) continue;
    outline.remove();
    outlineElements.delete(id);
  }
}

function renderDrawing() {
  if (drawingFrame) cancelAnimationFrame(drawingFrame);
  drawingFrame = 0;
  let visible = layers.filter((layer) => !layer.hidden);
  const movement = gesture?.type === "move" ? gesture : null;
  const rotation = gesture?.type === "rotate" ? rotationMatrix(gesture) : null;
  let targets = movement?.targets ?? (rotation ? gesture.targets : null);
  let transform = null;
  if (movement && (movement.dx || movement.dy)) transform = "translate(" + movement.dx + " " + movement.dy + ")";
  if (rotation) transform = "matrix(" + rotation.join(" ") + ")";
  if (gesture?.type === "resize") {
    updateResize(gesture.proportional);
    const matrix = groupResizeMatrix(gesture);
    if (matrix) {
      targets = gesture.targets;
      transform = "matrix(" + matrix.join(" ") + ")";
    } else if (gesture.preview && !gesture.group) {
      visible = visible.map((layer) => layer.id === gesture.layerId ? { ...layer, shape: gesture.preview } : layer);
    }
  }
  if (gesture?.type === "ink-bend" || (gesture?.type === "line-resize" && gesture.layerId !== undefined)) {
    const shape = gesture.type === "ink-bend" ? bentInkShape(gesture) : resizedInkLine(gesture);
    visible = visible.map((layer) => layer.id === gesture.layerId ? { ...layer, shape } : layer);
  }
  if (gesture?.type === "curve-control" && gesture.layerId !== undefined) {
    const preview = inkWithBezierControl(gesture);
    visible = visible.map((layer) => layer.id === gesture.layerId ? { ...layer, shape: preview } : layer);
  }
  if (gesture?.type === "joint-move" && gesture.inkMembers && (gesture.dx || gesture.dy)) {
    const point = movedJointPoint(gesture);
    visible = visible.map((layer) => gesture.inkMembers.has(layer.id)
      ? { ...layer, shape: inkAtJoint(layer.shape, gesture.inkMembers.get(layer.id), point) } : layer);
  }
  const inkPreview = inkPreviewShape();
  if (gesture?.type === "draw" && gesture.shape) {
    draftLayer.innerHTML = '<g opacity=".72">' + renderVector([{
      shape: gesture.shape, ...newShapeStyle(),
      opacity: opacityPreview ?? opacityBrush,
    }], "draft-vector") + '</g>';
  } else if (inkPreview) {
    draftLayer.innerHTML = renderVector([inkLayerStyle(inkPreview)], "draft-ink");
  } else if (draftLayer.firstChild) {
    draftLayer.replaceChildren();
  }
  if (colorPreview) {
    visible = visible.map((layer) => selection.has(layer.id)
      ? { ...layer, color: colorPreview, shape: clearXorColors(layer.shape) } : layer);
  }
  if (strokePreview) {
    visible = visible.map((layer) => selection.has(layer.id) ? {
      ...layer, stroke: { ...(layer.stroke ?? defaultStroke), color: strokePreview },
    } : layer);
  }
  if (opacityPreview !== null) {
    visible = visible.map((layer) => selection.has(layer.id) ? { ...layer, opacity: opacityPreview } : layer);
  }
  renderArtwork(visible, targets, transform);
  renderGuides();
  renderOutlines(visible, targets, transform);
  renderSelectionMarquee();
  const resizedLayer = visible.find((layer) => layer.id === resizeId);
  const resizedShape = resizedLayer?.groupId ? geometryTarget(resizedLayer).shape : resizedLayer?.shape;
  renderResizeHandles(resizedShape, targets?.has(resizeId) ? transform : null);
  const primaryId = primaryGeometryLayer()?.id;
  const selectedLayer = visible.find((layer) => layer.id === primaryId);
  const selectedShape = selectedLayer?.groupId ? geometryTarget(selectedLayer).shape : selectedLayer?.shape;
  const selectedTransform = targets?.has(selectedLayer?.id) ? transform : null;
  renderRotationHandle(selectedShape, selectedTransform);
  renderInkControls(visible, targets, transform);
}

function renderSelectionMarquee() {
  if (gesture?.type !== "marquee" || !gesture.dragged) {
    selectionMarquee.removeAttribute("width");
    return;
  }
  const { left, top, right, bottom } = marqueeBounds(gesture);
  selectionMarquee.setAttribute("x", number(left));
  selectionMarquee.setAttribute("y", number(top));
  selectionMarquee.setAttribute("width", number(right - left));
  selectionMarquee.setAttribute("height", number(bottom - top));
}

function inkPreviewShape() {
  if (gesture?.type === "ink") {
    const points = lineStrokePoints(gesture);
    return points.length === 2 ? { kind: "ink", points, width: gesture.width, curve: false } : null;
  }
  if (tool !== "ink-curve" || !curvePoints.length || !curveCursor) return null;
  const [start, middle] = curvePoints;
  const cubic = pendingBezierCurve();
  if (cubic) {
    return { kind: "ink", points: [start, cubic.middle, cubic.end], controls: cubic.controls, width: inkWidth, curve: true };
  }
  const points = middle ? [start, middle, curveCursor] : [start, curveCursor];
  return { kind: "ink", points, width: inkWidth, curve: Boolean(middle) };
}

function lineStrokePoints(stroke, snapToGuide = false) {
  const { start } = stroke;
  const { point: end } = lineStrokeEnd(stroke, snapToGuide);
  return Math.hypot(start.x - end.x, start.y - end.y) >= 2 ? [start, end] : [start];
}

function renderInkControls(visible, targets, transform) {
  const scale = svgUnitsPerPixel();
  const circle = (point, radius, attribute = "", offset = null) =>
    '<circle cx="' + number(point.x) + '" cy="' + number(point.y) + '" r="' + number(radius * scale) +
    '" vector-effect="non-scaling-stroke"' + attribute + (offset ? ' transform="' + offset + '"' : "") + '/>';
  const showAll = isInkTool();
  const placing = tool === "ink-curve" && curvePoints.length;
  const primary = primarySelectionId();
  const endpoints = new Map();
  let controls = "";
  if (showAll || tool === "select") {
    for (const layer of visible) {
      const { id, shape } = layer;
      if (id !== primary && !showAll) continue;
      const ink = baseInk(shape);
      if (!ink || layer.opacity === 0 || (layer.noFill && !layer.stroke?.enabled)) continue;
      if (layer.groupId && !showAll) continue;
      const offset = targets?.has(id) ? transform : null;
      if (id === primary && ink.curve && !placing && !layer.groupId) {
        const matrix = shape.kind === "affine" ? shape.matrix : identityMatrix;
        if (!ink.controls) controls += circle(projectPoint(matrix, ink.points[1]), 4, " data-ink-midpoint", offset);
        controls += bezierControlMarkup(inkCurveGeometry(ink), ' data-bezier-layer="' + id + '"',
          (point) => projectPoint(matrix, point), offset);
      }
      const ends = showAll || (ink.curve && id === primary) ? inkEndpoints(shape) : inkLineEnds(shape);
      ends?.forEach((point, index) => {
        const key = point.x + "," + point.y + ":" + offset;
        if (endpoints.has(key) && id !== primary) return;
        const selected = id === primary ? " data-active-ink-end" : "";
        endpoints.set(key, circle(point, 5, ' data-ink-end="' + index + '" data-ink-layer="' + id + '"' + selected, offset));
      });
    }
  }
  const pending = placing ? curvePoints.map((point) => circle(point, 3)).join("") : "";
  const markup = [...endpoints.values()].join("") + controls + pending;
  if (displayedInkControls !== markup) {
    inkControls.innerHTML = markup;
    displayedInkControls = markup;
  }
}

function renderGuides() {
  const coordinates = (points) => points.map(({ x, y }) => number(x) + "," + number(y)).join(" ");
  if (displayedGuides !== guides) {
    guideLines.innerHTML = guides.map((guide) => Array.isArray(guide)
      ? '<polyline points="' + coordinates(guide) + '" vector-effect="non-scaling-stroke"/>'
      : '<path d="' + curvePath(guide) + '" vector-effect="non-scaling-stroke"/>',
    ).join("");
    displayedGuides = guides;
  }
  const joint = gesture?.type === "joint-move" && gesture.guideMembers ? gesture : null;
  let previews;
  if (joint && (joint.dx || joint.dy)) {
    previews = new Map();
    const point = movedJointPoint(joint);
    for (const [index, ends] of joint.guideMembers) previews.set(index, guideAtJoint(guides[index], ends, point));
  }
  if (previews || jointGuideIndices.size) {
    for (const index of new Set([...jointGuideIndices, ...(previews?.keys() ?? [])])) {
      const guide = previews?.get(index) ?? guides[index];
      const node = guideLines.children[index];
      if (node) {
        if (Array.isArray(guide)) node.setAttribute("points", coordinates(guide));
        else node.setAttribute("d", curvePath(guide));
      }
    }
    jointGuideIndices = new Set(previews?.keys());
  }
  const resize = gesture?.type === "line-resize" && gesture.guideIndex !== undefined ? gesture : null;
  const end = isStraightTool(gesture?.type) ? lineStrokeEnd(gesture) : null;
  if (resize) {
    guideDraft.setAttribute("points", coordinates(resizedLineEnds(resize)));
  } else if (gesture?.type === "guide") {
    guideDraft.setAttribute("points", coordinates([gesture.start, end.point]));
  } else {
    guideDraft.removeAttribute("points");
  }

  const bend = gesture?.type === "guide-bend" ||
    (gesture?.type === "curve-control" && gesture.guideIndex !== undefined) ? gesture : null;
  const bendIndex = bend?.index ?? bend?.guideIndex;
  const bentGuide = bend && (bend.type === "curve-control"
    ? withBezierControl(guides[bendIndex], bend)
    : { ...guides[bendIndex], middle: bend.end });
  const hiddenIndex = resize?.guideIndex ?? bendIndex;
  const hidden = hiddenIndex === undefined ? null : guideLines.children[hiddenIndex];
  if (hiddenGuide !== hidden) {
    hiddenGuide?.removeAttribute("visibility");
    hidden?.setAttribute("visibility", "hidden");
    hiddenGuide = hidden;
  }
  const movement = gesture?.type === "guide-move" ? gesture : null;
  const moving = new Set(movement ? Array.from(movement.indices, (index) => guideLines.children[index]) : []);
  for (const element of movingGuideElements) {
    if (!moving.has(element)) setPreviewTransform(element, null);
  }
  if (movement) {
    const offset = "translate(" + movement.dx + " " + movement.dy + ")";
    for (const element of moving) setPreviewTransform(element, offset);
  }
  movingGuideElements = moving;
  renderGuideSpacing(gesture?.spacingHint, gesture?.lengthHint ?? end?.lengthHint);
  renderLineAlignment(gesture?.alignmentHint);
  const startSnap = isStraightTool(gesture?.type) && gesture.start !== gesture.pointerStart ? gesture.start : null;
  renderEndpointSnap(end?.endpoint ?? gesture?.endpointSnap ?? startSnap);

  const [start, middle] = curvePoints;
  if (bend) {
    curveDraft.setAttribute("d", curvePath(bentGuide));
  } else if (tool === "curve" && start && curveCursor) {
    const cubic = pendingBezierCurve();
    curveDraft.setAttribute("d", cubic ? curvePath(cubic) : middle ? curvePath({ start, middle, end: curveCursor })
      : "M" + coordinates([start]) + "L" + coordinates([curveCursor]));
  } else {
    curveDraft.removeAttribute("d");
  }
  renderGuideControls(bendIndex, bentGuide, movement, resize, previews);
}

function renderEndpointSnap(point) {
  endpointSnapMark.setAttribute("visibility", point ? "visible" : "hidden");
  if (!point) return;
  endpointSnapMark.setAttribute("cx", number(point.x));
  endpointSnapMark.setAttribute("cy", number(point.y));
  endpointSnapMark.setAttribute("r", number(7 * svgUnitsPerPixel()));
}

function renderGuideSpacing(hint, lengthHint) {
  if (!hint && !lengthHint) {
    if (guideSpacingMarks.firstChild) guideSpacingMarks.replaceChildren();
    return;
  }
  const data = lengthHint ? lengthHint.map(lengthGuidePath).join("") : spacingGuidePath(hint);
  let path = guideSpacingMarks.firstElementChild;
  if (!path) {
    path = document.createElementNS(drawing.namespaceURI, "path");
    path.setAttribute("vector-effect", "non-scaling-stroke");
    guideSpacingMarks.append(path);
  }
  if (path.getAttribute("d") !== data) path.setAttribute("d", data);
}

function spacingGuidePath({ tangent, normal, positions, along }) {
  const tick = 4 * svgUnitsPerPixel();
  const point = (t, n) => number(tangent.x * t + normal.x * n) + " " + number(tangent.y * t + normal.y * n);
  const spine = "M" + point(along, positions[0]) + "L" + point(along, positions.at(-1));
  return spine + positions.map((position) => "M" + point(along - tick, position) + "L" + point(along + tick, position)).join("");
}

function renderLineAlignment(hint) {
  if (!hint) {
    lineAlignmentMark.removeAttribute("d");
    return;
  }
  const { tangent, normal, positions, along } = hint;
  const points = positions.map((position) => number(tangent.x * along + normal.x * position) + " " +
    number(tangent.y * along + normal.y * position));
  const data = "M" + points.join("L");
  if (lineAlignmentMark.getAttribute("d") !== data) lineAlignmentMark.setAttribute("d", data);
}

function lengthGuidePath([start, end]) {
  const ray = guideRay(start, end);
  if (!ray) return "";
  const scale = svgUnitsPerPixel();
  const point = (anchor, offset) => number(anchor.x - ray.dy * offset * scale) + " " +
    number(anchor.y + ray.dx * offset * scale);
  return "M" + point(start, 10) + "L" + point(end, 10) +
    [start, end].map((anchor) => "M" + point(anchor, 6) + "L" + point(anchor, 14)).join("");
}

function curvePath(curve) {
  const pair = ({ x, y }) => number(x) + " " + number(y);
  return "M" + pair(curve.start) + " " + curveSegment(curve, pair);
}

function bezierControlMarkup(curve, attributes, project, transform) {
  const size = svgUnitsPerPixel() * 8;
  const handles = bezierHandles(curve);
  const markup = [curve.start, curve.end].map((anchor, index) => {
    const start = project(anchor);
    const end = project(handles[index]);
    return '<line class="bezier-control-line" x1="' + number(start.x) + '" y1="' + number(start.y) +
      '" x2="' + number(end.x) + '" y2="' + number(end.y) + '" vector-effect="non-scaling-stroke"/>' +
      '<rect width="' + number(size) + '" height="' + number(size) + '" x="' + number(end.x - size / 2) +
      '" y="' + number(end.y - size / 2) + '" data-bezier-control="' + index + '"' + attributes +
      ' vector-effect="non-scaling-stroke"/>';
  }).join("");
  return transform ? '<g transform="' + transform + '">' + markup + '</g>' : markup;
}

function renderGuideControls(bendIndex, bentGuide, movement, resize, previews) {
  let markup = "";
  const showAll = tool === "curve" || tool === "guide";
  if (showAll || activeGuide) {
    const scale = svgUnitsPerPixel();
    const circle = (point, radius, target = "") =>
      '<circle cx="' + number(point.x) + '" cy="' + number(point.y) + '" r="' + number(radius * scale) +
      '" vector-effect="non-scaling-stroke"' + target + '/>';
    const handles = [];
    const endpoints = new Map();
    guides.forEach((guide, index) => {
      if (!showAll && guide !== activeGuide) return;
      const offset = (point) => movement?.indices.has(index)
        ? { x: point.x + movement.dx, y: point.y + movement.dy } : point;
      const current = index === bendIndex ? bentGuide : previews?.get(index) ?? guide;
      if (current.kind === "curve" && !curvePoints.length) {
        if (!current.controls && tool === "curve") {
          handles.push(circle(offset(current.middle), 4, ' data-curve-index="' + index + '"'));
        }
        if (guide === activeGuide) handles.push(bezierControlMarkup(current, ' data-bezier-guide="' + index + '"', offset));
      }
      for (const end of ["start", "end"]) {
        const point = resize?.guideIndex === index
          ? resizedLineEnds(resize)[end === "start" ? 0 : 1]
          : offset(guideEndpoint(previews?.get(index) ?? guide, end));
        const key = point.x + "," + point.y;
        if (endpoints.has(key) && guide !== activeGuide) continue;
        const active = guide === activeGuide ? " data-active-guide" : "";
        endpoints.set(key, circle(point, 5, ' data-guide-end="' + end + '" data-guide-index="' + index + '"' + active));
      }
    });
    markup = [...endpoints.values()].join("") + handles.join("") + curvePoints.map((point) => circle(point, 3)).join("");
  }
  if (displayedGuideControls !== markup) {
    guideControls.innerHTML = markup;
    displayedGuideControls = markup;
  }
}

function svgUnitsPerPixel() {
  return width / Math.max(1, Number.parseFloat(artboard.style.width) || artboard.clientWidth);
}

function renderResizeHandles(shape, transform) {
  setPreviewTransform(resizeHandles, transform);
  if (!shape) {
    if (resizeHandleShape) resizeHandles.replaceChildren();
    resizeHandleShape = null;
    return;
  }
  const size = 10 * svgUnitsPerPixel();
  if (resizeHandleShape === shape && resizeHandleSize === size) return;
  resizeHandleShape = shape;
  resizeHandleSize = size;
  const frame = shapeFrame(shape);
  const { w, h } = frame.box;
  if (w <= 0 || h <= 0) {
    resizeHandles.replaceChildren();
    return;
  }
  function marker(attribute, name, [dx, dy]) {
    const { x, y } = framePoint(frame, dx, dy);
    return '<rect ' + attribute + '="' + name + '" x="' + (x - size / 2) + '" y="' + (y - size / 2) +
      '" width="' + size + '" height="' + size + '" vector-effect="non-scaling-stroke"/>';
  }
  const edgesMarkup = Object.entries(edges).map(([name, [dx, dy]]) => {
    const from = framePoint(frame, dx || -1, dy || -1);
    const to = framePoint(frame, dx || 1, dy || 1);
    return '<line data-skew-edge="' + name + '" x1="' + from.x + '" y1="' + from.y +
      '" x2="' + to.x + '" y2="' + to.y + '" vector-effect="non-scaling-stroke"/>';
  }).join("");
  const midpoints = Object.entries(edges).map(([name, direction]) => marker("data-resize-edge", name, direction)).join("");
  const cornerMarkers = Object.entries(corners).map(([name, direction]) => marker("data-corner", name, direction)).join("");
  resizeHandles.innerHTML = edgesMarkup + midpoints + cornerMarkers;
}

function renderRotationHandle(shape, transform) {
  setPreviewTransform(rotationHandle, transform);
  if (!shape) {
    if (rotationHandleShape) rotationHandle.replaceChildren();
    rotationHandleShape = null;
    return;
  }
  const scale = svgUnitsPerPixel();
  if (rotationHandleShape === shape && rotationHandleScale === scale) return;
  rotationHandleShape = shape;
  rotationHandleScale = scale;
  const frame = shapeFrame(shape);
  if (!frame.box.w || !frame.box.h) {
    rotationHandle.replaceChildren();
    return;
  }

  const top = framePoint(frame, 0, -1);
  const center = framePoint(frame, 0, 0);
  const left = framePoint(frame, -1, -1);
  const dx = top.x - left.x;
  const dy = top.y - left.y;
  const side = Math.hypot(dx, dy);
  const direction = dy * (top.x - center.x) - dx * (top.y - center.y) >= 0 ? 1 : -1;
  const distance = 25 * scale * direction / side;
  const keepVisible = (value, span) => {
    const padding = Math.min(11 * scale, span / 2);
    return Math.max(padding, Math.min(span - padding, value));
  };
  const x = keepVisible(top.x + dy * distance, width);
  const y = keepVisible(top.y - dx * distance, height);
  rotationHandle.innerHTML = '<line x1="' + top.x + '" y1="' + top.y + '" x2="' + x + '" y2="' + y +
    '" vector-effect="non-scaling-stroke"/><g data-rotate transform="translate(' + x + ' ' + y + ') scale(' + scale +
    ')" aria-label="ドラッグで回転 · Shift で15°刻み"><circle r="9"/><path d="M4 0a4 4 0 1 1-1.2-2.8M4-5v3H1"/></g>';
}

function layerBlocks(source = layers) {
  const blocks = new Map();
  for (const layer of source) {
    const id = layer.groupId ?? layer.id;
    const block = blocks.get(id) ?? { id, group: Boolean(layer.groupId), members: [] };
    block.members.push(layer);
    blocks.delete(id);
    blocks.set(id, block);
  }
  return [...blocks.values()];
}

function layerRowActions(id, name, hidden, group = false) {
  const suffix = group ? "-group" : "";
  const visibility = hidden ? "表示" : "非表示";
  return '<button class="icon-button" data-visibility' + suffix + '="' + id + '" aria-label="' + name + 'を' +
    visibility + '">' + icon(hidden ? "eyeOff" : "eye") + '</button>' +
    '<button class="icon-button layer-delete" data-delete' + suffix + '="' + id + '" aria-label="' + name +
    'を削除">' + icon("trash") + '</button>';
}

function renderLayers() {
  layerDrag.cancel();
  const blocks = layerBlocks();
  byId("layer-count").textContent = blocks.length;
  const primary = primarySelectionId();
  const groupIds = blocks.filter((block) => block.group).map((block) => block.id).sort((a, b) => a - b);
  const groupLabels = new Map(groupIds.map((id, index) => [id, "グループ" + (index + 1)]));
  const grip = '<i class="layer-grip" aria-hidden="true">' + icon("grip") + '</i>';
  function renderLayer(layer) {
    const active = selection.has(layer.id);
    const box = bounds(layer.shape);
    const side = Math.max(box.w, box.h, 1) + (layer.stroke?.enabled ? layer.stroke.width : 0);
    const viewBox = [box.x + (box.w - side) / 2 - side * .16, box.y + (box.h - side) / 2 - side * .16, side * 1.32, side * 1.32].map(number).join(" ");
    const preview = '<svg class="layer-preview" viewBox="' + viewBox + '" aria-hidden="true">' +
      renderVector([layer], "preview-" + layer.id) + '</svg>';
    const selectionClass = layer.id === primary ? " selected" : active ? " selected secondary-selection" : "";
    const name = escapeMarkup(layer.name);
    return '<div class="layer' + selectionClass + (layer.hidden ? " hidden" : "") + '" data-layer-id="' + layer.id + '">' +
      '<button class="layer-select" data-layer="' + layer.id + '" aria-pressed="' + active + '">' +
      grip + preview + '<span class="sr-only">' + name + '</span></button>' +
      layerRowActions(layer.id, name, layer.hidden) + '</div>';
  }
  function renderBlock({ id, group, members }) {
    if (!group) return renderLayer(members[0]);
    const open = expandedLayerGroups.has(id);
    const name = groupLabels.get(id);
    const active = members.every((layer) => selection.has(layer.id));
    const partial = !active && members.some((layer) => selection.has(layer.id));
    const hidden = members.every((layer) => layer.hidden);
    const selectionClass = active ? " selected" : partial ? " selected secondary-selection" : "";
    return '<div class="layer-block" data-layer-id="' + id + '"><div class="layer' + selectionClass + (hidden ? " hidden" : "") + '">' +
      '<button class="icon-button layer-expand" data-expand-group="' + id + '" aria-expanded="' + open +
      '" aria-controls="layer-members-' + id + '" aria-label="' + name + 'の内訳">' + icon(open ? "chevronDown" : "chevronRight") + '</button>' +
      '<button class="layer-select" data-layer-group="' + id + '" aria-pressed="' + (partial ? "mixed" : active) + '">' +
      grip + '<i class="layer-group-symbol">' + icon("layers") + '</i><span class="sr-only">' + name +
      '</span></button>' + layerRowActions(id, name, hidden, true) + '</div>' +
      '<div class="layer-members" id="layer-members-' + id + '"' + (open ? "" : " hidden") + '>' +
      (open ? members.slice().reverse().map(renderLayer).join("") : "") + '</div></div>';
  }
  layerList.innerHTML = blocks.length ? blocks.reverse().map(renderBlock).join("")
    : '<div class="empty">' + icon("layers") + '<span class="sr-only">図形がありません</span></div>';
}

function renderControls() {
  drawing.dataset.tool = tool;
  shapeFillSwitch.setAttribute("aria-checked", shapeFillEnabled);
  shapeFillSwitch.parentElement.style.setProperty("--shape-ink", brush);
  document.querySelectorAll("[data-tool]").forEach((button) => button.setAttribute("aria-pressed", button.dataset.tool === tool));
  const operandCount = selectedOperandBlocks().length;
  document.querySelectorAll("[data-operation]").forEach((button) => {
    button.disabled = operandCount < 2;
  });
  byId("new-canvas").disabled = !layers.length && !guides.length;
  byId("undo").disabled = !undoStack.length;
  byId("redo").disabled = !redoStack.length;
  byId("delete").disabled = !selection.size;
  byId("layer-copy").disabled = !selection.size && !activeGuide;
  byId("layer-paste").disabled = !copiedObjects;
  let hint = "空白からドラッグで範囲選択 · Shift で追加 · Ctrl でサイズ変更 · 右ドラッグで移動";
  if (gesture?.type === "joint-move") hint = "接続点を移動 · 上下の線の中間で吸着 · Ctrl で吸着解除";
  else if (gesture?.type === "line-resize") hint = "端点で長さと角度を変更 · Shift で15°刻み · Ctrl で吸着解除";
  else if (isSnapMove(gesture)) hint = gesture.pointRows?.length >= 2
    ? "線の中間に吸着 · Shift で45°刻み · Ctrl で吸着解除"
    : gesture.lineLayout
    ? "位置合わせ・等間隔で吸着 · Shift で45°刻み · Ctrl で吸着解除"
    : "Shift で45°刻み · Ctrl で吸着解除";
  else if (gesture?.type === "move") hint = "Shift で移動方向を45°刻みに固定";
  else if (resizeId !== null) hint = "角・辺中央で拡縮 · 辺をドラッグして変形 · Shift で比率固定";
  else if (tool === "guide") hint = "ドラッグで直線の仕切り · Shift で15°刻み · Ctrl で吸着解除";
  else if (tool === "ink") hint = "ドラッグで描画 · Alt＋クリックで塗る · Shift で15°刻み · Ctrl で吸着解除";
  else if (tool === "curve" || tool === "ink-curve") {
    const startHint = "始点・中点・終点をクリック · 始点からドラッグでベジェ · Ctrl で吸着解除";
    hint = curveStartControl ? "終点をクリックまたはドラッグ" : [startHint, "中点をクリック", "終点をクリック"][curvePoints.length];
  }
  else if (tool === "bucket") hint = "色を選び、塗りたい部分をクリック";
  else if (tool === "text") hint = "右側で文字と書体を選択";
  else if (tool !== "select") hint = "クリックで選択 · ドラッグで描画 · Shift で正方形や正円";
  byId("canvas-hint").textContent = hint;
  const primary = primarySelectionId();
  const selected = layers.find((layer) => layer.id === primary);
  const selectedInk = baseInk(selected?.shape);
  byId("ink-settings").hidden = !selectedInk && !isInkTool();
  inkWidthInput.value = selectedInk?.width ?? inkWidth;
  const order = selectedLayerOrder();
  byId("layer-up").disabled = !order || order.index === order.size - 1;
  byId("layer-down").disabled = !order || order.index <= 0;
  const grouping = layerGroupingSelection();
  byId("layer-group").disabled = !grouping.canGroup;
  byId("layer-ungroup").disabled = !grouping.groups.size;
  const fill = tool === "bucket" ? brush : (selected?.color ?? brush);
  const creatingShape = !selected && Object.hasOwn(shapeNames, tool);
  const newStyle = creatingShape ? newShapeStyle() : null;
  const noFill = tool === "bucket" ? false : selected ? Boolean(selected.noFill) : (newStyle?.noFill ?? noFillBrush);
  const stroke = selected ? (selected.stroke ?? defaultStroke) : (newStyle?.stroke ?? strokeBrush);
  byId("fill-enabled").checked = !noFill;
  byId("fill-enabled").disabled = tool === "bucket";
  byId("fill").value = fill;
  byId("fill").disabled = noFill;
  byId("hex").value = fill.toUpperCase();
  byId("hex").disabled = noFill;
  document.querySelectorAll(".swatch").forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.color === fill);
    button.disabled = noFill;
  });
  byId("stroke-enabled").checked = stroke.enabled;
  byId("stroke-enabled").disabled = creatingShape && !shapeFillEnabled;
  byId("stroke-color").value = stroke.color;
  byId("stroke-width").value = stroke.width;
  byId("stroke-color").disabled = !stroke.enabled;
  byId("stroke-width").disabled = !stroke.enabled;
  document.querySelectorAll("[data-stroke-join]").forEach((button) => {
    button.disabled = !stroke.enabled;
    button.setAttribute("aria-pressed", button.dataset.strokeJoin === (stroke.join ?? "round"));
  });
  const opacity = selected ? (selected.opacity ?? 100) : opacityBrush;
  byId("opacity").value = opacity;
  byId("opacity-value").value = opacity;
  document.querySelectorAll("[data-opacity]").forEach((button) => {
    button.setAttribute("aria-pressed", Number(button.dataset.opacity) === opacity);
  });
  renderTextControls(selection.size === 1 && !selected?.groupId ? selected : null);
}

function render() {
  const focusAttribute = document.activeElement?.closest("#layers button")?.getAttributeNames()
    .find((name) => name.startsWith("data-"));
  const focusId = focusAttribute && document.activeElement.getAttribute(focusAttribute);
  renderDrawing();
  renderLayers();
  renderControls();
  renderSaveState();
  if (focusId) layerList.querySelector("[" + focusAttribute + '="' + focusId + '"]')?.focus({ preventScroll: true });
}

function snapshot() {
  return { layers, guides, selection: [...selection] };
}

function commit(newLayers, newSelection = selection, newGuides = guides) {
  undoStack.push(snapshot());
  if (undoStack.length > 100) undoStack.shift();
  redoStack.length = 0;
  layers = newLayers;
  guides = newGuides;
  if (activeGuide && !guides.includes(activeGuide)) activeGuide = null;
  selection = new Set(newSelection);
  if (!selection.has(resizeId)) resizeId = null;
  render();
}

function restore(from, to) {
  if (!from.length) return;
  const before = layerPositions(layerList);
  to.push(snapshot());
  const state = from.pop();
  layers = state.layers;
  guides = state.guides;
  activeGuide = null;
  clearCurvePlacement();
  selection = tool === "bucket" ? new Set() : new Set(state.selection);
  if (!selection.has(resizeId)) resizeId = null;
  render();
  animateLayerOrder(layerList, before);
}

function chooseTool(value) {
  if (tool === value) return;
  cancelGesture();
  activeGuide = null;
  clearCurvePlacement();
  resizeId = null;
  if (value !== "select") selection.clear();
  tool = value;
  render();
  if (tool === "text") byId("text-value").focus();
}

function selectForEdit() {
  if (!Object.hasOwn(shapeNames, tool) && !isInkTool()) chooseTool("select");
}

function isInkTool() {
  return tool === "ink" || tool === "ink-curve";
}

function baseInk(shape) {
  const base = shape?.kind === "affine" ? shape.base : shape;
  return base?.kind === "ink" ? base : null;
}

function replaceInk(shape, ink) {
  return shape.kind === "affine" ? { ...shape, base: ink } : ink;
}

function inkLayerStyle(shape) {
  return { shape, color: brush, opacity: opacityPreview ?? opacityBrush };
}

function commitInk(shape) {
  const id = nextId++;
  commit([...layers, { id, name: shape.curve ? "鉛筆の曲線" : "鉛筆の直線", ...inkLayerStyle(shape) }], [id]);
}

function bentInkShape({ shape, end }) {
  const ink = baseInk(shape);
  const [start, middle, finish] = ink.points;
  if (end.x === middle.x && end.y === middle.y) return shape;
  return replaceInk(shape, { ...ink, points: [start, end, finish] });
}

function startInkBend(layer, point, pointerId) {
  const shape = layer.shape;
  const matrix = shape.kind === "affine" ? shape.matrix : identityMatrix;
  const middle = baseInk(shape).points[1];
  gesture = {
    type: "ink-bend", id: pointerId, layerId: layer.id, shape, matrix,
    start: unprojectPoint(matrix, point), middle, end: middle,
  };
  drawing.setPointerCapture(pointerId);
}

function beginBezierControl(handle, event, point) {
  const index = Number(handle.dataset.bezierControl);
  const layerId = handle.dataset.bezierLayer === undefined ? undefined : Number(handle.dataset.bezierLayer);
  const guideIndex = layerId === undefined ? Number(handle.dataset.bezierGuide) : undefined;
  const layer = layers.find((item) => item.id === layerId && !item.groupId && !item.hidden);
  const shape = layer?.shape;
  const curve = shape ? inkCurveGeometry(baseInk(shape)) : guides[guideIndex];
  if (!curve) return;
  if (guideIndex !== undefined) activeGuide = curve;
  const matrix = shape?.kind === "affine" ? shape.matrix : identityMatrix;
  const original = bezierHandles(curve)[index];
  gesture = {
    type: "curve-control", id: event.pointerId, layerId, guideIndex, index, shape, matrix,
    start: unprojectPoint(matrix, point), original, end: original,
  };
  drawing.setPointerCapture(event.pointerId);
}

function withBezierControl(curve, { index, original, end }) {
  if (Math.hypot(end.x - original.x, end.y - original.y) <= guideEpsilon) return curve;
  const controls = bezierHandles(curve).slice();
  controls[index] = end;
  return { ...curve, controls };
}

function inkWithBezierControl(edit) {
  const ink = baseInk(edit.shape);
  const curve = inkCurveGeometry(ink);
  const next = withBezierControl(curve, edit);
  return next === curve ? edit.shape : replaceInk(edit.shape, { ...ink, controls: next.controls });
}

function newShapeStyle() {
  const stroke = shapeFillEnabled || strokeBrush.enabled
    ? strokeBrush : { ...strokeBrush, enabled: true, color: brush };
  return { color: brush, noFill: !shapeFillEnabled, stroke, opacity: opacityBrush };
}

function selectLayer(id, additive, wholeGroup = false) {
  activeGuide = null;
  resizeId = null;
  const group = wholeGroup && layers.find((layer) => layer.id === id)?.groupId;
  const ids = group ? [id, ...layers.filter((layer) => layer.groupId === group && layer.id !== id).map((layer) => layer.id)]
    : id === undefined ? [] : [id];
  const deselect = additive && ids.every((member) => selection.has(member));
  if (!additive) selection.clear();
  for (const member of ids) {
    if (deselect) selection.delete(member);
    else selection.add(member);
  }
  render();
}

function marqueeBounds({ start, end }) {
  return {
    left: Math.min(start.x, end.x), top: Math.min(start.y, end.y),
    right: Math.max(start.x, end.x), bottom: Math.max(start.y, end.y),
  };
}

function finishMarquee(marquee, additive) {
  if (!marquee.dragged) {
    selectLayer(undefined, additive);
    return;
  }
  const { left, top, right, bottom } = marqueeBounds(marquee);
  const chosen = additive ? new Set(selection) : new Set();
  const groups = new Set();
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    if (layer.hidden) continue;
    if (layer.groupId && groups.has(layer.groupId)) continue;
    const target = geometryTarget(layer);
    if (layer.groupId) groups.add(layer.groupId);
    const { x, y, w, h } = bounds(target.shape);
    if (x >= left && y >= top && x + w <= right && y + h <= bottom) {
      for (const id of target.targets) chosen.add(id);
    }
  }
  activeGuide = null;
  resizeId = null;
  selection = chosen;
  render();
}

function pointAt(clientX, clientY) {
  const rectangle = drawing.getBoundingClientRect();
  return { x: (clientX - rectangle.left) * width / rectangle.width, y: (clientY - rectangle.top) * height / rectangle.height };
}

function layerAt(point) {
  const painted = layers.findLast((layer) => {
    if (layer.hidden) return false;
    if (!layer.noFill && contains(layer.shape, point, Boolean(layer.text))) return true;
    return layer.stroke?.enabled && outlineContains(layer.shape, layer.stroke.width, layer.stroke.join ?? "round", point);
  });
  if (painted) return painted;
  return layers.findLast((layer) => !layer.hidden && layer.noFill && layer.stroke?.enabled &&
    contains(layer.shape, point, Boolean(layer.text)));
}

function reportBucketError() {
  showNotice("この領域を塗りつぶせませんでした");
}

function paintAt(point) {
  if (paintGuideRegion(point)) return;
  const strokes = inkBarrierLayers();
  if (strokes.length) queueInkPaint(point, strokes, true);
  else paintLayerAt(point, brush);
}

function paintLayerAt(point, color, queued = false) {
  const layer = layers.findLast((item) => !item.hidden && contains(item.shape, point, Boolean(item.text)));
  if (!layer) return;
  const xor = rootXor(layer.shape);
  if (xor) {
    const local = layer.shape.kind === "affine" ? unprojectPoint(layer.shape.matrix, point) : point;
    const membership = xor.parts.flatMap((part, index) => contains(part, local) ? [index] : []);
    if (membership.length % 2 === 1) {
      if (queued) return paintXorComponent(layer.id, xor, membership, local, color);
      bucketQueue = bucketQueue.then(() => paintXorComponent(layer.id, xor, membership, local, color)).catch(reportBucketError);
    }
    return;
  }
  if (!layer.noFill && layer.color === color) return;
  commit(layers.map((item) => item === layer ? { ...layer, color, noFill: false } : item));
}

function inkBarrierLayers() {
  return layers.filter((layer) => visibleInkCandidate(layer) && baseInk(layer.shape));
}

function sameInkBarrier(first, second) {
  return first.length === second.length && first.every((layer, index) => {
    const other = second[index];
    return layer.id === other.id && layer.shape === other.shape && layer.noFill === other.noFill &&
      layer.stroke?.enabled === other.stroke?.enabled && layer.stroke?.width === other.stroke?.width &&
      layer.stroke?.join === other.stroke?.join;
  });
}

async function inkBarrier(strokes, point) {
  if (!strokes.length) return null;
  if (inkBarrierCache && sameInkBarrier(inkBarrierCache.strokes, strokes)) return inkBarrierCache;
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (const layer of strokes) {
    const { x, y, w, h } = bounds(layer.shape);
    const pad = 2 + (layer.stroke?.enabled ? layer.stroke.width / 2 : 0);
    left = Math.min(left, x - pad);
    right = Math.max(right, x + w + pad);
    top = Math.min(top, y - pad);
    bottom = Math.max(bottom, y + h + pad);
  }
  if (point.x <= left || point.x >= right || point.y <= top || point.y >= bottom) return null;
  const box = { x: left, y: top, w: right - left, h: bottom - top };
  const owners = new Map();
  const items = strokes.map((layer, index) => {
    // Space the channel values for reliable ownership at antialiased edges.
    const code = ((index + 1) * 16531) & 32767;
    const color = "#" + [code >> 10, (code >> 5) & 31, code & 31]
      .map((channel) => (channel * 8 + 4).toString(16).padStart(2, "0")).join("");
    owners.set(code, layer.id);
    return { ...layer, opacity: 100, color, stroke: layer.stroke && { ...layer.stroke, color } };
  });
  const scale = Math.min(6, 2400 / Math.max(box.w, box.h));
  const raster = await rasterizeBucketVector(renderVector(items, "ink-barrier"), box, scale);
  inkBarrierCache = { strokes, box, raster, owners };
  return inkBarrierCache;
}

function queueInkPaint(point, strokes, fallback = false) {
  const color = brush;
  const opacity = opacityBrush;
  bucketQueue = bucketQueue.then(async () => {
    const barrier = await inkBarrier(strokes, point);
    if (!sameInkBarrier(strokes, inkBarrierLayers())) return;
    const region = barrier && closedInkRegion(barrier.raster, barrier.box, point, barrier.owners);
    if (region) paintInkRegion(region, point, color, opacity);
    else if (fallback) await paintLayerAt(point, color, true);
    else reportBucketError();
  }).catch(reportBucketError);
}

function paintInkRegion({ bounds: box, ids, pathData }, point, color, opacity) {
  const shape = {
    kind: "path", ...box, pathData, sourceX: 0, sourceY: 0, sourceW: box.w, sourceH: box.h,
    hitPath: new Path2D(pathData),
  };
  const existing = layers.findLast((layer) => !layer.hidden && layer.inkBoundary?.length === ids.length &&
    layer.inkBoundary.every((id, index) => id === ids[index]) && contains(layer.shape, point));
  if (existing) {
    const sameShape = existing.shape.pathData === shape.pathData &&
      ["x", "y", "w", "h"].every((key) => Math.abs(existing.shape[key] - shape[key]) <= .002);
    if (existing.noFill || existing.color !== color || !sameShape) {
      commit(layers.map((layer) => layer === existing ? { ...existing, color, noFill: false, shape } : layer));
    }
  } else {
    const boundary = new Set(ids);
    const insertAt = layers.findIndex((layer) => boundary.has(layer.id));
    const fill = { id: nextId++, name: "描画線の塗り", color, opacity, shape, inkBoundary: ids };
    commit([...layers.slice(0, insertAt), fill, ...layers.slice(insertAt)]);
  }
}

function paintGuideRegion(point) {
  if (!guides.length) return false;
  if (facesFromGuides !== guides) {
    guideFaces = makeGuideFaces(guides);
    facesFromGuides = guides;
  }
  const shape = guideFillShape(guideFaces, point);
  if (!shape) return false;
  const existing = layers.findLast(({ hidden, shape: other }) => !hidden && other.pathData === shape.pathData &&
    other.x === shape.x && other.y === shape.y && other.w === shape.w && other.h === shape.h);
  if (existing) {
    if (existing.noFill || existing.color !== brush) {
      commit(layers.map((layer) => layer === existing ? { ...existing, color: brush, noFill: false } : layer));
    }
  } else {
    commit([...layers, { id: nextId++, name: "塗りつぶし", color: brush, opacity: opacityBrush, shape }]);
  }
  return true;
}

async function paintXorComponent(layerId, source, membership, point, color) {
  const layer = layers.find((item) => item.id === layerId);
  const xor = layer && rootXor(layer.shape);
  if (layer?.hidden || xor?.parts !== source.parts) return;
  const sourceIndex = membership.at(-1);
  const nested = xor.sourceColors && hasStoredPaint(xor.parts[sourceIndex]);
  const baseColor = nested ? null : (xor.sourceColors?.[sourceIndex] ?? layer.color);
  if (!layer.noFill && !xor.paintOnly && baseColor === color && !xor.paints?.length) return;

  const face = xorFace(xor, membership);
  const vector = renderVector([{ shape: face, color: "#ffffff" }], "bucket-component");
  const region = await findPaintComponent(vector, bounds(face), point);
  if (!region || !layers.includes(layer)) return;

  const paintOnly = layer.noFill || Boolean(xor.paintOnly);
  const previous = layer.noFill ? [] : (xor.paints ?? []);
  const key = membership.join(",");
  const matched = previous.find((paint) => paint.clip === region.clip && paint.membership.join(",") === key);
  if (matched?.color === color || (!matched && !paintOnly && baseColor === color)) return;

  const paints = previous.filter((paint) => paint !== matched);
  if (paintOnly || color !== baseColor) paints.push({ membership, color, clip: region.clip });
  const shape = replaceRootXor(layer.shape, { ...xor, paints, paintOnly });
  commit(layers.map((item) => item === layer ? { ...layer, shape, noFill: false } : item));
}

function drawnShape(start, end, equal) {
  let dx = end.x - start.x;
  let dy = end.y - start.y;
  if (equal) {
    const side = Math.max(Math.abs(dx), Math.abs(dy));
    dx = dx < 0 ? -side : side;
    const verticalSide = tool === "triangle" ? side * Math.sqrt(3) / 2 : side;
    dy = dy < 0 ? -verticalSide : verticalSide;
  }
  return { kind: tool, x: start.x + Math.min(0, dx), y: start.y + Math.min(0, dy), w: Math.abs(dx), h: Math.abs(dy) };
}

function startResize(layer, start, handle, pointerId) {
  const { shape, targets } = geometryTarget(layer);
  const frame = shapeFrame(shape);
  const { box, matrix } = frame;
  if (!box.w || !box.h) return;
  const local = unprojectPoint(matrix, start);
  const { corner, resizeEdge, skewEdge } = handle?.dataset ?? {};
  const [dx, dy] = corners[corner] ?? edges[resizeEdge ?? skewEdge] ?? [
    local.x < box.x + box.w / 2 ? -1 : 1,
    local.y < box.y + box.h / 2 ? -1 : 1,
  ];
  selectForEdit();
  selection = new Set([layer.id, ...targets]);
  resizeId = layer.id;
  gesture = {
    type: "resize", id: pointerId, layerId: layer.id, shape, frame, targets, group: Boolean(layer.groupId),
    dx, dy, start: local, end: local, skew: Boolean(skewEdge),
  };
  drawing.dataset.resizing = skewEdge ? "edge" : dx === 0 ? "ns" : dy === 0 ? "ew" : dx === dy ? "nwse" : "nesw";
  render();
  drawing.setPointerCapture(pointerId);
}

function startRotation(layer, point, pointerId) {
  const { shape, targets } = geometryTarget(layer);
  const center = framePoint(shapeFrame(shape), 0, 0);
  const initialAngle = Math.atan2(point.y - center.y, point.x - center.x);
  gesture = {
    type: "rotate", id: pointerId, targets,
    center, initialAngle, angle: 0, snap: false,
  };
  drawing.dataset.rotating = "true";
  drawing.setPointerCapture(pointerId);
}

function pointOnCanvas({ x, y }) {
  return { x: Math.min(width, Math.max(0, x)), y: Math.min(height, Math.max(0, y)) };
}

function guideSnapDistance() {
  return Math.min(12, svgUnitsPerPixel() * 7);
}

function lineEnds(points) {
  const line = straightGuide(points);
  return line ? [line.start, line.end] : null;
}

function inkEndpoints(shape) {
  const ink = baseInk(shape);
  if (!ink || ink.points.length < 2) return null;
  const ends = [ink.points[0], ink.points.at(-1)];
  return shape.kind === "affine" ? ends.map((point) => projectPoint(shape.matrix, point)) : ends;
}

function inkLineEnds(shape) {
  const ink = baseInk(shape);
  return ink && !ink.curve && lineEnds(ink.points) ? inkEndpoints(shape) : null;
}

function sceneStraightLines(excludedGuides, excludedLayers) {
  const lines = [];
  guides.forEach((guide, index) => {
    if (excludedGuides?.has(index)) return;
    const ends = lineEnds(guide);
    if (ends) lines.push(ends);
  });
  for (const layer of layers) {
    if (excludedLayers?.has(layer.id) || !visibleInkCandidate(layer)) continue;
    const ends = inkLineEnds(layer.shape);
    if (ends) lines.push(ends);
  }
  return lines;
}

function visibleInkCandidate(layer) {
  return !layer.hidden && layer.opacity !== 0 && (!layer.noFill || layer.stroke?.enabled);
}

function endpointKey({ x, y }) {
  return number(x) + "," + number(y);
}

function jointMembers(origin, strokes) {
  const key = endpointKey(origin);
  const members = new Map();
  for (const [id, endpoints] of strokes) {
    const ends = endpoints.flatMap((point, index) => endpointKey(point) === key ? [index] : []);
    if (ends.length) members.set(id, ends);
  }
  return members.size > 1 ? members : null;
}

function movedJointPoint({ original, dx, dy }) {
  return { x: original.x + dx, y: original.y + dy };
}

function jointPoints(points, indices, point) {
  const updated = [...points];
  for (const index of indices) updated[index === 0 ? 0 : updated.length - 1] = point;
  return updated;
}

function inkAtJoint(shape, indices, point) {
  const ink = baseInk(shape);
  const local = shape.kind === "affine" ? unprojectPoint(shape.matrix, point) : point;
  const next = { ...ink, points: jointPoints(ink.points, indices, local) };
  if (ink.controls) next.controls = curveWithEndpoint(inkCurveGeometry(ink), indices, local).controls;
  return replaceInk(shape, next);
}

function guideAtJoint(guide, indices, point) {
  if (Array.isArray(guide)) return jointPoints(guide, indices, point);
  return curveWithEndpoint(guide, indices, point);
}

function beginJointMove(event, start, original, { guideMembers, inkMembers }) {
  const references = sceneStraightLines(guideMembers, inkMembers);
  const oppositeRows = [];
  function addOppositeRows(endpoints, indices) {
    if (indices.length !== 1) return;
    const opposite = endpoints[1 - indices[0]];
    oppositeRows.push({ left: opposite, right: opposite, slope: 0 });
  }
  if (guideMembers) {
    for (const [index, ends] of guideMembers) {
      addOppositeRows([guideEndpoint(guides[index], "start"), guideEndpoint(guides[index], "end")], ends);
    }
  } else {
    for (const layer of layers) {
      const ends = inkMembers.get(layer.id);
      if (ends) addOppositeRows(inkEndpoints(layer.shape), ends);
    }
  }
  gesture = {
    type: "joint-move", id: event.pointerId, start, original, guideMembers, inkMembers,
    pointCenter: original, pointRows: horizontalPointReferences(references), oppositeRows, moveEnds: [original],
    snapTargets: references.flat(), extendPointRows: true,
    dx: 0, dy: 0, rawDx: 0, rawDy: 0, lockAxis: event.shiftKey, disableSnap: event.ctrlKey || event.metaKey,
  };
  drawing.setPointerCapture(event.pointerId);
  renderDrawing();
  renderControls();
}

function connectedStrokes(seed, strokes, links, groups) {
  const endpoints = new Map();
  const byId = new Map(strokes);
  const keyFor = (id, point) => (groups?.get(id) ?? "") + ":" + endpointKey(point);
  for (const [strokeId, points] of byId) {
    for (const key of new Set(points.map((point) => keyFor(strokeId, point)))) {
      if (!endpoints.has(key)) endpoints.set(key, []);
      endpoints.get(key).push(strokeId);
    }
  }
  const ids = new Set(seed);
  const visited = new Set();
  const openEnds = [];
  for (const strokeId of ids) {
    for (const linked of links?.get(strokeId) ?? []) ids.add(linked);
    for (const point of byId.get(strokeId) ?? []) {
      const key = keyFor(strokeId, point);
      if (visited.has(key)) continue;
      visited.add(key);
      const neighbors = endpoints.get(key);
      if (neighbors.length === 1) openEnds.push(point);
      for (const neighbor of neighbors) ids.add(neighbor);
    }
  }
  return { ids, openEnds };
}

function movementConnections(seed) {
  const strokes = [];
  const links = new Map();
  const groups = new Map();
  const groupAnchor = new Map();
  const byId = new Map(layers.map((layer) => [layer.id, layer]));
  function link(first, second) {
    if (!links.has(first)) links.set(first, []);
    if (!links.has(second)) links.set(second, []);
    links.get(first).push(second);
    links.get(second).push(first);
  }
  for (const layer of layers) {
    if (layer.groupId) {
      groups.set(layer.id, layer.groupId);
      const anchor = groupAnchor.get(layer.groupId);
      if (anchor === undefined) groupAnchor.set(layer.groupId, layer.id);
      else link(layer.id, anchor);
    }
    const ends = visibleInkCandidate(layer) && inkEndpoints(layer.shape);
    if (ends) strokes.push([layer.id, ends]);
    for (const id of layer.inkBoundary ?? []) {
      if (baseInk(byId.get(id)?.shape)) link(layer.id, id);
    }
  }
  return { ...connectedStrokes(seed, strokes, links, groups), links };
}

function pointMoveCenter(shape) {
  const base = shape.kind === "affine" ? shape.base : shape;
  if (base.kind === "ellipse" || (base.kind === "ink" && base.points.length === 1)) {
    return framePoint(shapeFrame(shape), 0, 0);
  }
  return null;
}

function lineMoveReferences(ends, openEnds, references) {
  return {
    moveEnds: openEnds,
    snapTargets: references.flat(),
    lineLayout: ends ? lineLayoutReferences(ends, references) : null,
  };
}

function lineEndAt(ends, point) {
  if (!ends) return -1;
  const nearest = nearestLineEnd(point, ends, 5 * svgUnitsPerPixel());
  return ends.indexOf(nearest);
}

function beginLineResize(event, start, ends, endIndex, { guideIndex, layer }) {
  const anchor = ends[1 - endIndex];
  const original = ends[endIndex];
  if (!guideRay(anchor, original)) return;
  const references = sceneStraightLines(new Set([guideIndex]), new Set([layer?.id]));
  const snapTargets = references.flat().filter((point) => Math.hypot(point.x - anchor.x, point.y - anchor.y) >= 2);
  gesture = {
    type: "line-resize", id: event.pointerId, start, end: start, ends, endIndex, anchor, original,
    point: original, references, snapTargets, guideIndex, layerId: layer?.id, shape: layer?.shape,
    disableSnap: event.ctrlKey || event.metaKey, shiftKey: event.shiftKey,
  };
  drawing.dataset.resizing = "edge";
  drawing.setPointerCapture(event.pointerId);
  renderDrawing();
  renderControls();
}

function updateLineResize() {
  const { anchor, original, start, end, shiftKey, disableSnap, references, snapTargets } = gesture;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  gesture.endpointSnap = null;
  gesture.lengthHint = null;
  if (Math.hypot(dx, dy) <= guideEpsilon) {
    gesture.point = original;
    return;
  }
  const raw = pointOnCanvas({ x: original.x + dx, y: original.y + dy });
  let point = straightStrokeEnd({ start: anchor, end: raw, shiftKey });
  if (Math.hypot(point.x - anchor.x, point.y - anchor.y) < 2) {
    const direction = guideRay(anchor, point) ?? guideRay(anchor, original);
    point = guidePoint(anchor, direction.dx, direction.dy, 2);
  }
  const ray = shiftKey ? guideRay(anchor, point) : null;
  const limit = guideSnapDistance();
  const endpoint = disableSnap ? null : nearestLineEnd(point, snapTargets, limit, ray);
  const match = disableSnap || endpoint ? null : snapLineLength(anchor, point, references, limit);
  gesture.point = endpoint ?? match?.point ?? point;
  gesture.endpointSnap = endpoint;
  if (match) gesture.lengthHint = [resizedLineEnds(gesture), match.reference];
}

function resizedLineEnds(stroke) {
  return stroke.ends.map((point, index) => index === stroke.endIndex ? stroke.point : point);
}

function resizedInkLine(stroke) {
  const { shape, point, original } = stroke;
  if (point.x === original.x && point.y === original.y) return shape;
  const matrix = shape.kind === "affine" ? shape.matrix : identityMatrix;
  return replaceInk(shape, { ...baseInk(shape), points: resizedLineEnds(stroke).map((end) => unprojectPoint(matrix, end)) });
}

function isSnapMove(gesture) {
  return gesture?.type === "guide-move" || gesture?.moveEnds !== undefined || gesture?.pointRows !== undefined;
}

function movementDirection(dx, dy, locked) {
  if (!locked) return { dx, dy, direction: null };
  const step = Math.PI / 4;
  const angle = Math.round(Math.atan2(dy, dx) / step) * step;
  const x = Math.round(Math.cos(angle) * Math.SQRT2);
  const y = Math.round(Math.sin(angle) * Math.SQRT2);
  const length = Math.hypot(x, y);
  const distance = (dx * x + dy * y) / (x * x + y * y);
  return { dx: x * distance, dy: y * distance, direction: { x: x / length, y: y / length } };
}

function updateSnapMove() {
  const { rawDx, rawDy, lockAxis, disableSnap, lineLayout, moveEnds, pointCenter, pointRows, oppositeRows, extendPointRows } = gesture;
  const { dx, dy, direction } = movementDirection(rawDx, rawDy, lockAxis);
  const moved = Math.hypot(rawDx, rawDy) > 1;
  const snap = moved && !disableSnap;
  const endpoint = snap && moveEnds?.length
    ? snapLineMove(moveEnds, gesture.snapTargets, dx, dy, direction, guideSnapDistance()) : null;
  const tolerance = Math.min(14, 6 * svgUnitsPerPixel());
  const spacing = snap && !endpoint
    ? pointRows
      ? snapPointBetweenLines(pointCenter, pointRows, dx, dy, tolerance, extendPointRows, direction) ??
        (oppositeRows ? snapPointBetweenLines(pointCenter, oppositeRows, dx, dy, tolerance, true, direction) : null)
      : snapLineSpacing(lineLayout, dx, dy, direction, tolerance)
    : null;
  const alignment = snap && !endpoint
    ? snapLineAlignment(lineLayout, spacing?.dx ?? dx, spacing?.dy ?? dy, direction, spacing && direction ? 0 : tolerance)
    : null;
  const snapped = endpoint ?? alignment ?? spacing;
  gesture.dx = snapped?.dx ?? dx;
  gesture.dy = snapped?.dy ?? dy;
  gesture.spacingHint = spacing?.hint;
  gesture.alignmentHint = alignment?.hint;
  gesture.endpointSnap = endpoint?.target;
  drawing.dataset.moving = String(moved);
}

function straightStrokeEnd(gesture) {
  if (!gesture.shiftKey) return gesture.end;
  const { start } = gesture;
  const x = gesture.end.x - start.x;
  const y = gesture.end.y - start.y;
  const step = Math.PI / 12;
  const angle = Math.round(Math.atan2(y, x) / step) * step;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const extent = (origin, direction, size) => {
    if (Math.abs(direction) < guideEpsilon) return Infinity;
    return (direction > 0 ? size - origin : -origin) / direction;
  };
  const radius = Math.max(0, Math.min(Math.hypot(x, y), extent(start.x, dx, width), extent(start.y, dy, height)));
  return { x: start.x + radius * dx, y: start.y + radius * dy };
}

function isStraightTool(type) {
  return type === "guide" || type === "ink";
}

function isCurveTool(type) {
  return type === "curve" || type === "ink-curve";
}

function lineStrokeEnd(stroke, snapToGuide = false) {
  const end = straightStrokeEnd(stroke);
  if (stroke.controlKey) return { point: end };
  const limit = guideSnapDistance();
  const ray = stroke.shiftKey ? guideRay(stroke.start, end) : null;
  const endpoint = nearestLineEnd(end, stroke.snapTargets, limit, ray);
  if (endpoint) return { point: endpoint, endpoint };
  const length = snapLineLength(stroke.start, end, stroke.references, limit);
  if (length) return { point: length.point, lengthHint: [[stroke.start, length.point], length.reference] };
  return { point: snapToGuide && stroke.type === "guide" ? snapGuidePoint(end, guides, limit, stroke.start, ray) : end };
}

function clickedGuideEndpoint(event) {
  const target = event.target.closest("[data-guide-end]");
  if (!target) return null;
  const { guideIndex, guideEnd } = target.dataset;
  return guideEndpoint(guides[Number(guideIndex)], guideEnd);
}

function clickedInkEndpoint(event) {
  const handle = event.target.closest("[data-ink-end]");
  if (!handle) return null;
  const { inkLayer, inkEnd } = handle.dataset;
  const layer = layers.find((item) => item.id === Number(inkLayer) && !item.hidden);
  const index = Number(inkEnd);
  const point = inkEndpoints(layer?.shape)?.[index];
  return point ? { layer, index, point } : null;
}

function inkSnapLine(shape) {
  const ink = baseInk(shape);
  if (!ink || ink.points.length < 2) return null;
  const points = shape.kind === "affine"
    ? ink.points.map((point) => projectPoint(shape.matrix, point)) : ink.points;
  if (ink.curve) return inkCurveGeometry({
    points, controls: shape.kind === "affine" ? ink.controls?.map((point) => projectPoint(shape.matrix, point)) : ink.controls,
  });
  if (points.length === 2) return points;
  const path = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const start = path.at(-1);
    const control = points[i];
    const end = midpoint(control, points[i + 1]);
    const middle = midpoint(midpoint(start, control), midpoint(control, end));
    path.push(...guidePolyline({ start, middle, end }).slice(1));
  }
  path.push(points.at(-1));
  return path;
}

function snappedDrawingStart(raw, anchor) {
  if (anchor) return anchor;
  const lines = [...guides];
  for (const layer of layers) {
    if (!visibleInkCandidate(layer)) continue;
    const line = inkSnapLine(layer.shape);
    if (line) lines.push(line);
  }
  const limit = guideSnapDistance();
  const endpoints = lines.flatMap((line) => [guideEndpoint(line, "start"), guideEndpoint(line, "end")]);
  const point = nearestLineEnd(raw, endpoints, limit) ?? snapGuidePoint(raw, lines, limit);
  return point === raw ? raw : pointOnCanvas(point);
}

function updateStrokeStart(stroke, controlKey) {
  stroke.controlKey = controlKey;
  stroke.start = controlKey ? stroke.pointerStart : stroke.snappedStart;
}

function startLineStroke(event, start, inkEndpoint) {
  const raw = pointOnCanvas(start);
  const controlKey = event.ctrlKey || event.metaKey;
  const references = sceneStraightLines();
  const snapTargets = references.flat();
  const snappedStart = snappedDrawingStart(raw, inkEndpoint?.point ?? clickedGuideEndpoint(event));
  const point = controlKey ? raw : snappedStart;
  gesture = {
    type: tool, id: event.pointerId, start: point, end: point, snapTargets, references,
    pointerStart: raw, snappedStart, shiftKey: event.shiftKey, controlKey,
  };
  if (tool === "ink") {
    gesture.width = inkWidth;
    gesture.anchorLayerId = inkEndpoint?.layer.id;
  }
  drawing.setPointerCapture(event.pointerId);
  renderDrawing();
}

function placeCurvePoint(point, event, anchor) {
  const position = pointOnCanvas(point);
  let placed = position;
  if (!event.ctrlKey && !event.metaKey) {
    if (!curvePoints.length) placed = snappedDrawingStart(position, anchor);
    else if (curvePoints.length === 2) {
      placed = anchor ?? (tool === "curve" ? snapGuidePoint(position, guides, guideSnapDistance(), curvePoints[0]) : position);
    }
  }
  curvePoints.push(placed);
  curveCursor = placed;
  if (curvePoints.length === 3) {
    const [start, middle, end] = curvePoints;
    if (finishCurve({ start, middle, end })) return;
  }
  renderDrawing();
  renderControls();
}

function clearCurvePlacement() {
  curvePoints = [];
  curveCursor = null;
  curveStartControl = null;
}

function finishCurve(curve) {
  const { start, middle, end, controls } = curve;
  clearCurvePlacement();
  if (![middle, end, ...(controls ?? [])].some((point) => Math.hypot(point.x - start.x, point.y - start.y) >= 2)) return false;
  if (tool === "ink-curve") {
    commitInk({ kind: "ink", points: [start, middle, end], ...(controls ? { controls } : {}), width: inkWidth, curve: true });
  } else {
    activeGuide = { kind: "curve", ...curve };
    commit(layers, selection, [...guides, activeGuide]);
  }
  return true;
}

function pendingBezierCurve() {
  if (!curveStartControl || !curveCursor) return null;
  const start = curvePoints[0];
  const end = curveCursor;
  const incoming = gesture?.type === "curve-anchor" && gesture.ending ? gesture.control : end;
  return { start, middle: midpoint(start, end), end, controls: [curveStartControl, incoming] };
}

function placeCurveAnchor(event, point, anchor) {
  const ending = Boolean(curveStartControl);
  if (!ending && curvePoints.length) {
    placeCurvePoint(point, event, anchor);
    return;
  }
  const raw = pointOnCanvas(point);
  const position = event.ctrlKey || event.metaKey ? raw : snappedDrawingStart(raw, anchor);
  if (!ending) curvePoints = [position];
  curveCursor = position;
  gesture = {
    type: "curve-anchor", id: event.pointerId, start: raw, position, ending, control: position,
    startClientX: event.clientX, startClientY: event.clientY, dragged: false,
  };
  drawing.setPointerCapture(event.pointerId);
  renderDrawing();
  renderControls();
}

function resizeSelectedLayer() {
  if (!selection.size || layerDrag.active) return;
  const layer = primaryGeometryLayer();
  if (!layer || resizeId === layer.id) return;
  const { w, h } = shapeFrame(geometryTarget(layer).shape).box;
  if (!w || !h) return;
  selectForEdit();
  resizeId = layer.id;
  renderDrawing();
  renderControls();
}

function skewMatrix(box, dx, dy, deltaX, deltaY) {
  if (dx !== 0) {
    const fixedX = dx > 0 ? box.x : box.x + box.w;
    const offsetX = deltaX / (dx * box.w);
    const offsetY = deltaY / (dx * box.w);
    return [1 + offsetX, offsetY, 0, 1, -fixedX * offsetX, -fixedX * offsetY];
  }
  const fixedY = dy > 0 ? box.y : box.y + box.h;
  const offsetX = deltaX / (dy * box.h);
  const offsetY = deltaY / (dy * box.h);
  return [1, 0, offsetX, 1 + offsetY, -fixedY * offsetX, -fixedY * offsetY];
}

function updateResize(proportional) {
  const { start, end, frame: { box, matrix }, dx, dy, shape, skew } = gesture;
  const minWidth = Math.min(3 / Math.hypot(matrix[0], matrix[1]), box.w);
  const minHeight = Math.min(3 / Math.hypot(matrix[2], matrix[3]), box.h);
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  let w = box.w + dx * deltaX;
  let h = box.h + dy * deltaY;
  if (skew) {
    const x = dx ? dx * (Math.max(minWidth, w) - box.w) : deltaX;
    const y = dy ? dy * (Math.max(minHeight, h) - box.h) : deltaY;
    gesture.preview = Math.hypot(x, y) < .001 ? null : {
      kind: "affine",
      base: shape.kind === "affine" ? shape.base : shape,
      matrix: multiplyMatrices(matrix, skewMatrix(box, dx, dy, x, y)),
    };
    return;
  }
  if (proportional) {
    const projectedScale = dx === 0 ? h / box.h : dy === 0 ? w / box.w
      : (w * box.w + h * box.h) / (box.w ** 2 + box.h ** 2);
    const scale = Math.max(minWidth / box.w, minHeight / box.h, projectedScale);
    w = scale * box.w;
    h = scale * box.h;
  } else {
    w = Math.max(minWidth, w);
    h = Math.max(minHeight, h);
  }
  if (Math.abs(w - box.w) < .001 && Math.abs(h - box.h) < .001) {
    gesture.preview = null;
    return;
  }
  const after = {
    x: box.x + (box.w - w) * (1 - dx) / 2,
    y: box.y + (box.h - h) * (1 - dy) / 2,
    w, h,
  };
  gesture.preview = shape.kind === "affine"
    ? { ...shape, matrix: multiplyMatrices(matrix, scalingMatrix(box, after)) }
    : scaleShape(shape, box, after);
}

function groupResizeMatrix({ group, preview, frame }) {
  if (!group || !preview) return null;
  return preview.kind === "affine" ? preview.matrix : scalingMatrix(frame.box, preview);
}

drawing.addEventListener("pointerdown", (event) => {
  const rightButton = event.button === 2;
  if (gesture || (event.button !== 0 && !rightButton)) return;
  const start = pointAt(event.clientX, event.clientY);
  const inkEndpoint = clickedInkEndpoint(event);
  if (!rightButton && isInkTool() && event.altKey) {
    event.preventDefault();
    queueInkPaint(start, inkBarrierLayers());
    return;
  }
  if (rightButton) {
    const guideHandle = event.target.closest("[data-guide-end]");
    const index = inkEndpoint ? -1
      : guideHandle ? Number(guideHandle.dataset.guideIndex) : guideNear(start, guides, guideSnapDistance());
    if (index >= 0) {
      activeGuide = guides[index];
      const ends = lineEnds(activeGuide);
      const strokes = guides.map((guide, i) => [i, [guideEndpoint(guide, "start"), guideEndpoint(guide, "end")]]);
      const endpoints = strokes[index][1];
      const endIndex = guideHandle ? Number(guideHandle.dataset.guideEnd === "end") : lineEndAt(endpoints, start);
      if (endIndex >= 0) {
        const point = endpoints[endIndex];
        const guideMembers = jointMembers(point, strokes);
        if (guideMembers) {
          beginJointMove(event, start, point, { guideMembers });
          return;
        }
        if (ends) {
          beginLineResize(event, start, ends, endIndex, { guideIndex: index });
          return;
        }
        if (activeGuide.kind === "curve") {
          beginJointMove(event, start, point, { guideMembers: new Map([[index, [endIndex]]]) });
          return;
        }
      }
      const connection = connectedStrokes([index], strokes);
      const references = sceneStraightLines(connection.ids);
      gesture = {
        type: "guide-move", id: event.pointerId, index, indices: connection.ids, start, dx: 0, dy: 0, rawDx: 0, rawDy: 0,
        lockAxis: event.shiftKey, disableSnap: event.ctrlKey || event.metaKey,
        ...lineMoveReferences(ends, connection.openEnds, references),
      };
      drawing.setPointerCapture(event.pointerId);
      renderDrawing();
      renderControls();
      return;
    }
  }
  const bezierHandle = event.target.closest("[data-bezier-control]");
  if (!rightButton && bezierHandle) {
    beginBezierControl(bezierHandle, event, start);
    return;
  }
  if (!rightButton && event.target.closest("[data-ink-midpoint]")) {
    const layer = layers.find((item) => item.id === primarySelectionId() && !item.hidden);
    if (!layer?.groupId && baseInk(layer?.shape)?.curve) startInkBend(layer, start, event.pointerId);
    return;
  }
  if (!rightButton && event.target.closest("[data-rotate]")) {
    const layer = primaryGeometryLayer();
    if (layer) startRotation(layer, start, event.pointerId);
    return;
  }
  const handle = event.target.closest("[data-corner], [data-resize-edge], [data-skew-edge]");
  const resizeShortcut = !isStraightTool(tool) && !isCurveTool(tool) && (event.ctrlKey || event.metaKey);
  if (!rightButton && (handle || resizeShortcut)) {
    const layer = handle
      ? layers.find((item) => item.id === resizeId && !item.hidden)
      : inkEndpoint?.layer ?? layerAt(start);
    if (layer) startResize(layer, start, handle, event.pointerId);
    else if (tool === "select") selectLayer(undefined, false);
    return;
  }
  if (!rightButton && tool === "bucket") {
    paintAt(start);
    return;
  }
  if (!rightButton && isStraightTool(tool)) {
    startLineStroke(event, start, inkEndpoint);
    return;
  }
  if (!rightButton && tool === "ink-curve") {
    placeCurveAnchor(event, start, inkEndpoint?.point);
    return;
  }
  if (!rightButton && tool === "curve") {
    const endpoint = clickedGuideEndpoint(event);
    const handle = event.target.closest("[data-curve-index]");
    if (endpoint) {
      placeCurveAnchor(event, start, endpoint);
    } else if (handle && !curvePoints.length) {
      const index = Number(handle.dataset.curveIndex);
      const { middle } = guides[index];
      gesture = { type: "guide-bend", id: event.pointerId, index, start, middle, end: middle };
      drawing.setPointerCapture(event.pointerId);
    } else {
      placeCurveAnchor(event, start);
    }
    return;
  }
  if (rightButton || tool === "select") {
    const hit = inkEndpoint?.layer ?? layerAt(start);
    if (!rightButton && !hit) {
      gesture = {
        type: "marquee", id: event.pointerId, start, end: start, dragged: false,
        startClientX: event.clientX, startClientY: event.clientY,
      };
      drawing.setPointerCapture(event.pointerId);
      return;
    }
    const fullySelected = hit?.groupId
      ? [...geometryTarget(hit).targets].every((id) => selection.has(id)) : selection.has(hit?.id);
    const additiveClick = !rightButton && event.shiftKey;
    if (rightButton && hit && !fullySelected) {
      selectLayer(hit.id, false, true);
    } else if (!rightButton && !additiveClick && !fullySelected) {
      selectLayer(hit.id, false, true);
    }
    if (!hit) return;
    const endpoints = rightButton && !hit.groupId ? inkEndpoints(hit.shape) : null;
    const endIndex = endpoints ? inkEndpoint?.index ?? lineEndAt(endpoints, start) : -1;
    if (endIndex >= 0) {
      const point = endpoints[endIndex];
      const strokes = layers.flatMap((layer) => {
        if (layer.groupId || !visibleInkCandidate(layer)) return [];
        const strokeEnds = inkEndpoints(layer.shape);
        return strokeEnds ? [[layer.id, strokeEnds]] : [];
      });
      const inkMembers = jointMembers(point, strokes);
      if (inkMembers) {
        beginJointMove(event, start, point, { inkMembers });
        return;
      }
      if (baseInk(hit.shape)?.curve) {
        beginJointMove(event, start, point, { inkMembers: new Map([[hit.id, [endIndex]]]) });
        return;
      }
    }
    const linkedLayer = hit.groupId || hit.inkBoundary || baseInk(hit.shape)?.points.length > 1;
    const connection = rightButton && linkedLayer ? movementConnections([hit.id]) : null;
    const selectionOnMove = additiveClick && !fullySelected ? geometryTarget(hit).targets : null;
    let targets = rightButton ? connection?.ids ?? new Set([hit.id]) : selectionOnMove ?? new Set(selection);
    if (!rightButton && layers.some((layer) => layer.groupId || layer.inkBoundary)) {
      const linked = movementConnections(targets);
      if ([...linked.ids].some((id) => linked.links.has(id))) targets = linked.ids;
    }
    const ends = rightButton ? inkLineEnds(hit.shape) : null;
    if (ends && endIndex >= 0 && !connection?.links.has(hit.id)) {
      if (inkEndpoint && primarySelectionId() !== hit.id) selectLayer(hit.id, false);
      beginLineResize(event, start, ends, endIndex, { layer: hit });
      return;
    }
    gesture = {
      type: "move", id: event.pointerId, start, targets, dx: 0, dy: 0,
      rawDx: 0, rawDy: 0, lockAxis: event.shiftKey, disableSnap: event.ctrlKey || event.metaKey,
      clickedLayerId: rightButton ? undefined : hit.id, additiveClick, selectionOnMove,
    };
    const pointCenter = rightButton ? pointMoveCenter(hit.shape) : null;
    if (connection || pointCenter) {
      const references = sceneStraightLines(undefined, targets);
      Object.assign(gesture, {
        ...(connection ? lineMoveReferences(ends, connection.openEnds, references)
          : { pointCenter, pointRows: horizontalPointReferences(references) }),
      });
    }
    renderControls();
  } else {
    if (tool === "text") return;
    if (resizeId !== null) {
      resizeId = null;
      renderDrawing();
      renderControls();
    }
    gesture = {
      type: "draw", id: event.pointerId, start, end: start,
      startClientX: event.clientX, startClientY: event.clientY, dragged: false,
    };
  }
  drawing.setPointerCapture(event.pointerId);
});

drawing.addEventListener("contextmenu", (event) => event.preventDefault());

function updateGesture(event) {
  const end = pointAt(event.clientX, event.clientY);
  if (gesture.type === "draw" || gesture.type === "marquee") {
    gesture.end = gesture.type === "marquee" ? pointOnCanvas(end) : end;
    gesture.dragged ||= Math.hypot(event.clientX - gesture.startClientX, event.clientY - gesture.startClientY) > 3;
    if (gesture.type === "draw" && gesture.dragged) gesture.shape = drawnShape(gesture.start, end, event.shiftKey);
  } else if (gesture.type === "resize") {
    gesture.end = unprojectPoint(gesture.frame.matrix, end);
    gesture.proportional = event.shiftKey;
  } else if (gesture.type === "rotate") {
    const offset = Math.atan2(end.y - gesture.center.y, end.x - gesture.center.x) - gesture.initialAngle;
    gesture.angle = Math.atan2(Math.sin(offset), Math.cos(offset));
    gesture.snap = event.shiftKey;
  } else if (isStraightTool(gesture.type)) {
    gesture.end = pointOnCanvas(end);
    gesture.shiftKey = event.shiftKey;
    updateStrokeStart(gesture, event.ctrlKey || event.metaKey);
  } else if (gesture.type === "curve-anchor") {
    const { start, position, ending, startClientX, startClientY } = gesture;
    gesture.dragged ||= Math.hypot(event.clientX - startClientX, event.clientY - startClientY) > 3;
    if (gesture.dragged) {
      const direction = ending ? -1 : 1;
      gesture.control = { x: position.x + direction * (end.x - start.x), y: position.y + direction * (end.y - start.y) };
      if (!ending) curveCursor = gesture.control;
    }
  } else if (gesture.type === "ink-bend" || gesture.type === "curve-control") {
    const { start, matrix } = gesture;
    const anchor = gesture.original ?? gesture.middle;
    const local = unprojectPoint(matrix, gesture.type === "curve-control" ? end : pointOnCanvas(end));
    gesture.end = { x: anchor.x + local.x - start.x, y: anchor.y + local.y - start.y };
  } else if (gesture.type === "guide-bend") {
    const { start, middle } = gesture;
    gesture.end = pointOnCanvas({ x: middle.x + end.x - start.x, y: middle.y + end.y - start.y });
  } else if (gesture.type === "line-resize") {
    gesture.end = end;
    gesture.disableSnap = event.ctrlKey || event.metaKey;
    gesture.shiftKey = event.shiftKey;
    updateLineResize();
  } else if (gesture.type === "move" || isSnapMove(gesture)) {
    gesture.rawDx = end.x - gesture.start.x;
    gesture.rawDy = end.y - gesture.start.y;
    gesture.lockAxis = event.shiftKey;
    gesture.disableSnap = event.ctrlKey || event.metaKey;
    updateSnapMove();
  }
}

drawing.addEventListener("pointermove", (event) => {
  if (!gesture && (tool === "curve" || tool === "ink-curve") && curvePoints.length) {
    curveCursor = pointOnCanvas(pointAt(event.clientX, event.clientY));
    if (!drawingFrame) drawingFrame = requestAnimationFrame(renderDrawing);
    return;
  }
  if (gesture?.id !== event.pointerId) return;
  updateGesture(event);
  if (!drawingFrame) drawingFrame = requestAnimationFrame(renderDrawing);
});

drawing.addEventListener("pointerup", (event) => {
  if (gesture?.id !== event.pointerId) return;
  updateGesture(event);
  if (gesture.type === "resize") updateResize(gesture.proportional);
  const finished = gesture;
  gesture = null;
  delete drawing.dataset.moving;
  delete drawing.dataset.resizing;
  delete drawing.dataset.rotating;
  if (finished.type === "marquee") {
    finishMarquee(finished, event.shiftKey);
    return;
  }
  if (finished.type === "joint-move" && Math.hypot(finished.dx, finished.dy) > 1) {
    const point = movedJointPoint(finished);
    if (finished.guideMembers) {
      const nextGuides = guides.map((guide, index) => {
        const ends = finished.guideMembers.get(index);
        return ends ? guideAtJoint(guide, ends, point) : guide;
      });
      activeGuide = nextGuides[guides.indexOf(activeGuide)];
      commit(layers, selection, nextGuides);
    } else {
      commit(layers.map((layer) => {
        const ends = finished.inkMembers.get(layer.id);
        return ends ? { ...layer, shape: inkAtJoint(layer.shape, ends, point) } : layer;
      }));
    }
    return;
  }
  if (finished.type === "line-resize") {
    const { point, original, guideIndex, layerId } = finished;
    if (point.x === original.x && point.y === original.y) {
      renderDrawing();
      renderControls();
    } else if (guideIndex !== undefined) {
      const resized = resizedLineEnds(finished);
      activeGuide = resized;
      commit(layers, selection, guides.map((guide, index) => index === guideIndex ? resized : guide));
    } else {
      const shape = resizedInkLine(finished);
      commit(layers.map((layer) => layer.id === layerId ? { ...layer, shape } : layer));
    }
    return;
  }
  if (finished.type === "curve-control") {
    if (finished.layerId !== undefined) {
      const shape = inkWithBezierControl(finished);
      if (shape !== finished.shape) {
        commit(layers.map((layer) => layer.id === finished.layerId ? { ...layer, shape } : layer));
        return;
      }
    } else {
      const { guideIndex } = finished;
      const guide = withBezierControl(guides[guideIndex], finished);
      if (guide !== guides[guideIndex]) {
        activeGuide = guide;
        commit(layers, selection, guides.map((item, index) => index === guideIndex ? guide : item));
        return;
      }
    }
    renderDrawing();
    return;
  }
  if (finished.type === "curve-anchor") {
    if (finished.ending) {
      const curve = pendingBezierCurve();
      curve.controls[1] = finished.control;
      if (finishCurve(curve)) return;
    } else {
      curveStartControl = finished.dragged ? finished.control : null;
      curveCursor = finished.position;
    }
    renderDrawing();
    renderControls();
    return;
  }
  if (finished.type === "ink") {
    const { pointerStart, end, anchorLayerId } = finished;
    if (Math.hypot(end.x - pointerStart.x, end.y - pointerStart.y) < 2) {
      if (anchorLayerId !== undefined && !finished.controlKey) selectLayer(anchorLayerId, false);
      else renderDrawing();
      return;
    }
    const points = lineStrokePoints(finished);
    if (points.length === 2) commitInk({ kind: "ink", points, width: finished.width, curve: false });
    else renderDrawing();
    return;
  }
  if (finished.type === "ink-bend") {
    const shape = bentInkShape(finished);
    if (shape !== finished.shape) {
      commit(layers.map((layer) => layer.id === finished.layerId ? { ...layer, shape } : layer));
    } else {
      renderDrawing();
    }
    return;
  }
  if (finished.type === "guide") {
    if (Math.hypot(finished.end.x - finished.pointerStart.x, finished.end.y - finished.pointerStart.y) < 2) {
      renderDrawing();
      return;
    }
    const points = lineStrokePoints(finished, true);
    if (points.length === 2) {
      commit(layers, selection, [...guides, points]);
    } else {
      renderDrawing();
    }
    return;
  }
  if (finished.type === "guide-bend") {
    const { middle, end, index } = finished;
    if (Math.hypot(middle.x - end.x, middle.y - end.y) > guideEpsilon) {
      commit(layers, selection, guides.map((guide, i) => i === index ? { ...guide, middle: end } : guide));
    } else {
      renderDrawing();
    }
    return;
  }
  if (finished.type === "guide-move") {
    const { index, indices, dx, dy } = finished;
    if (Math.hypot(dx, dy) > 1) {
      const moved = guides.map((guide, i) => indices.has(i) ? moveGuide(guide, dx, dy) : guide);
      activeGuide = moved[index];
      commit(layers, selection, moved);
    } else {
      renderDrawing();
      renderControls();
    }
    return;
  }
  if (finished.type === "resize" && finished.preview) {
    const matrix = groupResizeMatrix(finished);
    commit(layers.map((layer) => finished.targets.has(layer.id)
      ? { ...layer, shape: matrix ? transformShape(layer.shape, matrix) : finished.preview }
      : layer));
    return;
  }
  if (finished.type === "rotate") {
    const matrix = rotationMatrix(finished);
    if (matrix) {
      commit(layers.map((layer) => finished.targets.has(layer.id)
        ? { ...layer, shape: transformShape(layer.shape, matrix) } : layer));
      return;
    }
  }
  if (finished.type === "move" && Math.hypot(finished.dx, finished.dy) > 1) {
    commit(layers.map((layer) => finished.targets.has(layer.id)
      ? { ...layer, shape: move(layer.shape, finished.dx, finished.dy) }
      : layer), finished.selectionOnMove ?? selection);
    return;
  }
  if (finished.type === "move" && finished.additiveClick) {
    selectLayer(finished.clickedLayerId, true, true);
    return;
  }
  if (finished.type === "move" && finished.clickedLayerId !== undefined && selection.size > 1) {
    selectLayer(finished.clickedLayerId, false, true);
    return;
  }
  if (finished.type === "draw" && !finished.dragged) {
    const hit = layerAt(finished.start);
    selectLayer(hit?.id, event.shiftKey, true);
    return;
  }
  if (finished.type === "draw" && finished.shape.w > 2 && finished.shape.h > 2) {
    const id = nextId++;
    commit([...layers, {
      id, name: shapeNames[tool], ...newShapeStyle(), shape: finished.shape,
    }], [id]);
    return;
  }
  renderDrawing();
  if (finished.type === "move" || isSnapMove(finished)) renderControls();
});

function cancelGesture() {
  if (!gesture) return;
  const { id } = gesture;
  if (gesture.type === "curve-anchor" && !gesture.ending) clearCurvePlacement();
  const movingLine = gesture.type === "move" || isSnapMove(gesture) || gesture.type === "line-resize";
  gesture = null;
  delete drawing.dataset.moving;
  delete drawing.dataset.resizing;
  delete drawing.dataset.rotating;
  if (drawing.hasPointerCapture(id)) drawing.releasePointerCapture(id);
  renderDrawing();
  if (movingLine) renderControls();
}

drawing.addEventListener("pointercancel", cancelGesture);
drawing.addEventListener("lostpointercapture", cancelGesture);

function isOutlineOnly(layer) {
  return layer.noFill && layer.stroke?.enabled;
}

function operandColor(layer) {
  return isOutlineOnly(layer) ? layer.stroke.color : layer.color;
}

function operandShape(layer) {
  if (!isOutlineOnly(layer)) return layer.shape;
  const { width, join = "round" } = layer.stroke;
  return { kind: "outline", base: layer.shape, width, join };
}

function selectedOperandBlocks() {
  return layerBlocks().filter(({ members }) => members.some((layer) => selection.has(layer.id)) &&
    members.some((layer) => !layer.hidden));
}

function combine(kind) {
  const blocks = selectedOperandBlocks();
  if (blocks.length < 2) return;
  const id = nextId++;
  const targetIds = new Set(blocks.flatMap(({ members }) => members.map((layer) => layer.id)));
  const anchor = (kind === "subtract" ? blocks[0] : blocks.at(-1)).members.at(-1);
  const byId = new Map(layers.map((layer) => [layer.id, layer]));
  const primary = [...selection].map((member) => byId.get(member))
    .find((layer) => layer && !layer.hidden && targetIds.has(layer.id)) ??
    blocks[0].members.find((layer) => !layer.hidden);
  const operands = blocks.map(({ members }) => {
    const visible = members.filter((layer) => !layer.hidden);
    const shapes = visible.map(operandShape);
    const colors = visible.map(operandColor);
    if (shapes.length === 1) return { shape: shapes[0], color: colors[0] };
    const shape = { kind: "union", parts: shapes };
    if (kind === "xor" && (colors.some((color) => color !== colors[0]) || shapes.some(hasStoredPaint))) {
      shape.sourceColors = colors;
    }
    return { shape, color: colors[0] };
  });
  const parts = operands.flatMap(({ shape }) => kind === "union" && shape.kind === "union" ? shape.parts : [shape]);
  const outlineOnly = isOutlineOnly(primary);
  const shape = { kind, parts };
  if (kind === "xor") shape.sourceColors = operands.map(({ color }) => color);
  const combined = {
    id, name: operationNames[kind], color: operandColor(primary),
    noFill: outlineOnly ? false : primary.noFill, stroke: outlineOnly ? undefined : primary.stroke,
    opacity: primary.opacity,
    shape,
  };
  commit(layers.flatMap((layer) => layer === anchor ? [combined] : targetIds.has(layer.id) ? [] : [layer]), [id]);
  selectForEdit();
}

function removeSelection() {
  removeLayers(selection);
}

function copySelection() {
  const guideTool = tool === "guide" || tool === "curve";
  if (activeGuide && (guideTool || !selection.size)) {
    copiedObjects = { guide: activeGuide, pastes: 0 };
    renderControls();
    showNotice("仕切り線をコピーしました");
    return true;
  }
  const chosen = layerBlocks().flatMap(({ members }) => members.some((layer) => selection.has(layer.id)) ? members : []);
  if (!chosen.length) return false;
  copiedObjects = { layers: chosen, pastes: 0 };
  renderControls();
  showNotice("コピーしました");
  return true;
}

function pasteSelection() {
  if (!copiedObjects) return false;
  const offset = 16 * ++copiedObjects.pastes;
  if (copiedObjects.guide) {
    activeGuide = moveGuide(copiedObjects.guide, offset, offset);
    resizeId = null;
    commit(layers, [], [...guides, activeGuide]);
  } else {
    const idMap = new Map(copiedObjects.layers.map((layer) => [layer.id, nextId++]));
    const groups = new Map();
    const pasted = copiedObjects.layers.map((layer) => {
      if (layer.groupId && !groups.has(layer.groupId)) groups.set(layer.groupId, nextId++);
      const inkBoundary = layer.inkBoundary?.every((id) => idMap.has(id))
        ? layer.inkBoundary.map((id) => idMap.get(id)).sort((a, b) => a - b) : undefined;
      return {
        ...layer, id: idMap.get(layer.id), groupId: groups.get(layer.groupId), inkBoundary,
        shape: move(layer.shape, offset, offset),
      };
    });
    activeGuide = null;
    resizeId = null;
    commit([...layers, ...pasted], pasted.filter((layer) => !layer.hidden).map((layer) => layer.id).reverse());
  }
  showNotice("貼り付けました");
  return true;
}

function removeLayers(ids) {
  if (!ids.size) return;
  commit(layers.filter((layer) => !ids.has(layer.id)), [...selection].filter((id) => !ids.has(id)));
}

function layerGroupingSelection() {
  const chosen = layers.filter((layer) => selection.has(layer.id));
  const groups = new Set(chosen.map((layer) => layer.groupId).filter(Boolean));
  const canGroup = chosen.length >= 2 && (groups.size !== 1 || chosen.some((layer) => !layer.groupId));
  return { groups, canGroup };
}

function groupSelectedLayers() {
  const { groups, canGroup } = layerGroupingSelection();
  if (!canGroup) return;
  const groupId = nextId++;
  const included = (layer) => selection.has(layer.id) || groups.has(layer.groupId);
  const members = layers.filter(included).map((layer) => ({ ...layer, groupId }));
  const top = layers.findLastIndex(included);
  const grouped = layers.flatMap((layer, index) => index === top ? members : included(layer) ? [] : [layer]);
  expandedLayerGroups.delete(groupId);
  commit(grouped, members.slice().reverse().map((layer) => layer.id));
  showNotice(members.length + " 件のレイヤーをグループ化しました");
}

function ungroupSelectedLayers() {
  const { groups } = layerGroupingSelection();
  if (!groups.size) return;
  const byId = new Map(layers.map((layer) => [layer.id, layer]));
  const kept = new Set();
  const nextSelection = [...selection].filter((id) => {
    const group = byId.get(id)?.groupId;
    if (!group) return true;
    if (kept.has(group)) return false;
    kept.add(group);
    return true;
  });
  commit(layers.map((layer) => groups.has(layer.groupId) ? { ...layer, groupId: undefined } : layer), nextSelection);
  showNotice("レイヤーのグループを解除しました");
}

function reorderLayer(direction) {
  const order = selectedLayerOrder();
  if (order) moveLayer(order.id, order.index + direction);
}

function selectedLayerOrder() {
  if (!selection.size) return null;
  const blocks = layerBlocks();
  const index = blocks.findIndex((block) => block.members.some((layer) => selection.has(layer.id)));
  if (index < 0) return null;
  const block = blocks[index];
  const selected = block.members.filter((layer) => selection.has(layer.id)).length;
  return selected === selection.size ? { id: block.id, index, size: blocks.length } : null;
}

function moveLayer(id, to, before) {
  const blocks = layerBlocks();
  const from = blocks.findIndex((block) => block.id === id);
  if (from < 0 || to < 0 || to >= blocks.length || from === to) return;
  before ??= layerPositions(layerList);
  const [entry] = blocks.splice(from, 1);
  blocks.splice(to, 0, entry);
  commit(blocks.flatMap((block) => block.members));
  animateLayerOrder(layerList, before);
  const name = entry.group ? "グループ" : entry.members[0].name;
  byId("layer-order-status").textContent = name + " を上から " + (blocks.length - to) + " 番目に移動";
}

function applyColor(color) {
  colorPreview = null;
  brush = color;
  if (tool !== "bucket" && layers.some((layer) =>
    selection.has(layer.id) && (layer.color !== color || hasXorColors(rootXor(layer.shape))),
  )) {
    commit(layers.map((layer) => selection.has(layer.id) ? { ...layer, color, shape: clearXorColors(layer.shape) } : layer));
  } else {
    render();
  }
}

function applyFillEnabled(enabled) {
  noFillBrush = !enabled;
  shapeFillEnabled = enabled;
  if (layers.some((layer) => selection.has(layer.id) && Boolean(layer.noFill) !== noFillBrush)) {
    commit(layers.map((layer) => selection.has(layer.id) ? { ...layer, noFill: noFillBrush } : layer));
  } else {
    renderControls();
  }
}

function applyOpacity(value) {
  opacityPreview = null;
  if (Number.isFinite(value)) {
    opacityBrush = Math.max(0, Math.min(100, Math.round(value)));
    if (layers.some((layer) => selection.has(layer.id) && (layer.opacity ?? 100) !== opacityBrush)) {
      commit(layers.map((layer) => selection.has(layer.id) ? { ...layer, opacity: opacityBrush } : layer));
      return;
    }
  }
  render();
}

function applyStroke(patch) {
  strokePreview = null;
  const primary = primarySelectionId();
  const selected = layers.find((layer) => layer.id === primary);
  const base = selected ? (selected.stroke ?? defaultStroke) : Object.hasOwn(shapeNames, tool) ? newShapeStyle().stroke : strokeBrush;
  strokeBrush = { ...base, ...patch };
  if (layers.some((layer) => selection.has(layer.id) && Object.entries(patch).some(
    ([property, value]) => (layer.stroke ?? defaultStroke)[property] !== value,
  ))) {
    commit(layers.map((layer) => selection.has(layer.id)
      ? { ...layer, stroke: { ...(layer.stroke ?? defaultStroke), ...patch } }
      : layer));
  } else {
    render();
  }
}

function applyInkWidth(value) {
  if (!Number.isFinite(value)) {
    renderControls();
    return;
  }
  inkWidth = Math.max(.5, Math.min(64, Math.round(value * 2) / 2));
  const updated = layers.map((layer) => {
    const ink = selection.has(layer.id) && baseInk(layer.shape);
    if (!ink || ink.width === inkWidth) return layer;
    return { ...layer, shape: replaceInk(layer.shape, { ...ink, width: inkWidth }) };
  });
  if (updated.some((layer, index) => layer !== layers[index])) {
    commit(updated);
  } else {
    renderDrawing();
    renderControls();
  }
}

const textValue = byId("text-value");
const textFont = byId("text-font");
const textSubmit = byId("text-submit");
const textPreview = byId("text-preview");
const textMessage = byId("text-message");
const fontOptions = byId("font-options");
const fontMarks = [
  '<path d="M5 6h14M6 12h12M8 18h8"/>',
  '<path d="M4 8c5-5 10 4 16-1M5 14c3-4 10 4 15 0m-13 5 10-1"/>',
  '<path d="M4 6h16M4 12h12M4 18h14"/>',
  '<path d="M4 7h16m-16 5h16m-16 5h12" stroke-width="3.5"/>',
  '<path d="M5 5v3m14-3v3M5 6h14M12 6v12m-4 0h8"/>',
  '<path d="M3 17c5 2 6-10 10-10 3 0 2 6-2 8-4 2 4 4 10-2"/>',
];

textFont.replaceChildren(...textFonts.map(({ id, name, description }) =>
  new Option(name + "（" + description + "）", id),
));
fontOptions.innerHTML = textFonts.map(({ id, name, description }, index) => {
  const label = escapeMarkup(name + "（" + description + "）");
  return '<button type="button" class="icon-button" data-font-id="' + id + '" aria-pressed="false" aria-label="' + label +
    '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" ' +
    'stroke-width="1.7" aria-hidden="true">' + fontMarks[index] + '</svg></button>';
}).join("");
fontOptions.addEventListener("click", (event) => {
  const button = event.target.closest("[data-font-id]");
  if (!button) return;
  textFont.value = button.dataset.fontId;
  queueTextPreview();
});

function currentText() {
  return textValue.value.trim().normalize("NFC");
}

function renderTextControls(selected) {
  const adding = tool === "text";
  const saved = selected?.text;
  const visible = adding || Boolean(saved);
  byId("text-section").hidden = !visible;
  if (!visible) {
    textState = null;
    clearTimeout(textPreviewTimer);
    return;
  }

  const layerId = adding ? null : selected.id;
  if (!textState || textState.layerId !== layerId || textState.saved !== saved) {
    textState = { layerId, saved, pending: false, preview: null };
    textValue.value = saved?.value ?? "";
    textFont.value = saved?.fontId ?? textFonts[0].id;
    byId("text-heading").setAttribute("aria-label", adding ? "文字を追加" : "文字を編集");
    textSubmit.setAttribute("aria-label", adding ? "文字を追加" : "文字を更新");
    queueTextPreview();
  }
  updateTextSubmit();
}

function updateTextSubmit() {
  textSubmit.disabled = !textState || textState.pending || !currentText();
}

function showTextMessage(message) {
  textMessage.textContent = message;
  textMessage.hidden = !message;
  textPreview.classList.toggle("text-preview-error", Boolean(message));
}

function queueTextPreview() {
  clearTimeout(textPreviewTimer);
  const state = textState;
  if (!state) return;
  const value = currentText();
  const sample = value || "Forma";
  const fontId = textFont.value;
  fontOptions.querySelectorAll("[data-font-id]").forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.fontId === fontId);
  });
  state.preview = null;
  textPreview.replaceChildren();
  showTextMessage("");
  updateTextSubmit();
  textPreviewTimer = setTimeout(async () => {
    const stillCurrent = () => textState === state && currentText() === value && textFont.value === fontId;
    try {
      const outline = await createTextOutline(sample, fontId);
      if (!stillCurrent()) return;
      state.preview = { value, fontId, outline };
      const scale = Math.min(194 / outline.sourceW, 42 / outline.sourceH);
      const w = outline.sourceW * scale;
      const h = outline.sourceH * scale;
      textPreview.innerHTML = primitive({ ...outline, x: (210 - w) / 2, y: (58 - h) / 2, w, h });
    } catch (error) {
      if (stillCurrent()) showTextMessage(error.message);
    }
  }, 100);
}

textValue.addEventListener("input", queueTextPreview);
textFont.addEventListener("change", queueTextPreview);
byId("text-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const state = textState;
  const value = currentText();
  const fontId = textFont.value;
  if (!state || state.pending || !value) return;
  if (state.saved?.value === value && state.saved.fontId === fontId) return;

  state.pending = true;
  updateTextSubmit();
  showTextMessage("");
  try {
    const preview = state.preview;
    const outline = preview?.value === value && preview.fontId === fontId
      ? preview.outline
      : await createTextOutline(value, fontId);
    if (textState !== state || currentText() !== value || textFont.value !== fontId) return;

    const text = { value, fontId };
    if (state.layerId !== null) {
      const layer = layers.find((item) => item.id === state.layerId);
      const current = layer.shape;
      const previous = current.kind === "affine" ? current.base : current;
      const w = outline.sourceW * previous.w / previous.sourceW;
      const h = outline.sourceH * previous.h / previous.sourceH;
      const base = { ...outline, x: previous.x, y: previous.y, w, h };
      const shape = current.kind === "affine" ? { ...current, base } : base;
      commit(layers.map((item) => item === layer ? { ...layer, name: value, text, shape } : item));
    } else {
      const id = nextId++;
      const scale = Math.min(330 / outline.sourceW, 90 / outline.sourceH, 1);
      const w = outline.sourceW * scale;
      const h = outline.sourceH * scale;
      const offset = layers.filter((item) => item.text).length % 6 * 12;
      const shape = { ...outline, x: (width - w) / 2 + offset, y: (height - h) / 2 + offset, w, h };
      chooseTool("select");
      commit([...layers, {
        id, name: value, text, color: brush, noFill: noFillBrush, stroke: strokeBrush, opacity: opacityBrush, shape,
      }], [id]);
    }
  } catch (error) {
    if (textState === state && currentText() === value && textFont.value === fontId) showTextMessage(error.message);
  } finally {
    state.pending = false;
    updateTextSubmit();
  }
});

byId("layer-up").addEventListener("click", () => reorderLayer(1));
byId("layer-down").addEventListener("click", () => reorderLayer(-1));
byId("layer-copy").addEventListener("click", copySelection);
byId("layer-paste").addEventListener("click", pasteSelection);
byId("layer-group").addEventListener("click", groupSelectedLayers);
byId("layer-ungroup").addEventListener("click", ungroupSelectedLayers);

byId("palette").innerHTML = colors.map((color) =>
  '<button class="swatch" data-color="' + color + '" style="--swatch:' + color +
  '" aria-label="塗り ' + color.toUpperCase() + '"></button>',
).join("");

document.querySelectorAll("[data-tool]").forEach((button) => button.addEventListener("click", () => chooseTool(button.dataset.tool)));
document.querySelectorAll("[data-operation]").forEach((button) => button.addEventListener("click", () => combine(button.dataset.operation)));
layerList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const { layer, layerGroup, expandGroup, visibility, visibilityGroup, delete: deleteLayer, deleteGroup } = button.dataset;
  if (expandGroup) {
    const id = Number(expandGroup);
    if (!expandedLayerGroups.delete(id)) expandedLayerGroups.add(id);
    render();
  } else if (layer) {
    selectForEdit();
    selectLayer(Number(layer), event.shiftKey);
  } else if (layerGroup) {
    const members = layers.filter((item) => item.groupId === Number(layerGroup)).reverse();
    selectForEdit();
    const chosen = event.shiftKey ? new Set(selection) : new Set();
    const deselect = event.shiftKey && members.every((item) => selection.has(item.id));
    for (const item of members) {
      if (deselect) chosen.delete(item.id);
      else chosen.add(item.id);
    }
    activeGuide = null;
    resizeId = null;
    selection = chosen;
    render();
  } else if (deleteLayer || deleteGroup) {
    const ids = deleteLayer ? [Number(deleteLayer)]
      : layers.filter((item) => item.groupId === Number(deleteGroup)).map((item) => item.id);
    removeLayers(new Set(ids));
  } else if (visibility || visibilityGroup) {
    const targets = layers.filter((item) => visibility ? item.id === Number(visibility) : item.groupId === Number(visibilityGroup));
    const ids = new Set(targets.map((item) => item.id));
    const hidden = !targets.every((item) => item.hidden);
    const nextSelection = new Set(selection);
    for (const id of ids) nextSelection.delete(id);
    commit(layers.map((item) => ids.has(item.id) ? { ...item, hidden } : item), nextSelection);
  }
});
byId("palette").addEventListener("click", (event) => {
  const color = event.target.closest("[data-color]")?.dataset.color;
  if (color) applyColor(color);
});
byId("fill").addEventListener("input", (event) => {
  colorPreview = tool === "bucket" ? null : event.target.value;
  byId("hex").value = event.target.value.toUpperCase();
  renderDrawing();
});
byId("fill").addEventListener("change", (event) => applyColor(event.target.value));
byId("fill-enabled").addEventListener("change", (event) => applyFillEnabled(event.target.checked));
shapeFillSwitch.addEventListener("click", () => {
  shapeFillEnabled = !shapeFillEnabled;
  renderControls();
  renderDrawing();
});
byId("stroke-enabled").addEventListener("change", (event) => applyStroke({ enabled: event.target.checked }));
byId("stroke-color").addEventListener("input", (event) => {
  strokePreview = event.target.value;
  renderDrawing();
});
byId("stroke-color").addEventListener("change", (event) => applyStroke({ color: event.target.value }));
document.querySelectorAll("[data-stroke-join]").forEach((button) => {
  button.addEventListener("click", () => applyStroke({ join: button.dataset.strokeJoin }));
});
byId("stroke-width").addEventListener("change", (event) => {
  const { valueAsNumber } = event.target;
  if (!Number.isFinite(valueAsNumber)) {
    renderControls();
    return;
  }
  const width = Math.max(.5, Math.min(64, Math.round(valueAsNumber * 2) / 2));
  applyStroke({ width });
});
inkWidthInput.addEventListener("change", () => applyInkWidth(inkWidthInput.valueAsNumber));
const opacitySlider = byId("opacity");
const opacityNumber = byId("opacity-value");
document.querySelectorAll("[data-opacity]").forEach((button) => {
  button.addEventListener("click", () => applyOpacity(Number(button.dataset.opacity)));
});
for (const [input, paired] of [[opacitySlider, opacityNumber], [opacityNumber, opacitySlider]]) {
  input.addEventListener("input", () => {
    const value = input.valueAsNumber;
    opacityPreview = Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : null;
    if (opacityPreview !== null) paired.value = opacityPreview;
    renderDrawing();
  });
  input.addEventListener("change", () => applyOpacity(input.valueAsNumber));
}
byId("hex").addEventListener("change", (event) => {
  const color = event.target.value.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{6}$/.test(color)) applyColor("#" + color);
  else renderControls();
});
byId("hex").addEventListener("keydown", (event) => {
  if (event.key === "Enter") event.target.blur();
  if (event.key === "Escape") {
    renderControls();
    event.target.blur();
  }
});

function renderZoom() {
  const style = getComputedStyle(viewport);
  const usableWidth = viewport.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const usableHeight = viewport.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  const fit = Math.max(.05, Math.min(1, usableWidth / width, usableHeight / height));
  artboard.style.width = width * fit * zoom + "px";
  artboard.style.height = height * fit * zoom + "px";
  byId("zoom-reset").setAttribute("aria-description", Math.round(zoom * 100) + "%");
  byId("zoom-out").disabled = zoom <= .25;
  byId("zoom-in").disabled = zoom >= 3;
  if (selection.size || activeGuide || tool === "curve" || tool === "guide" || isInkTool()) renderDrawing();
}

function setZoom(value) {
  zoom = Math.max(.25, Math.min(3, Math.round(value * 100) / 100));
  renderZoom();
}

new ResizeObserver(renderZoom).observe(viewport);
byId("zoom-out").addEventListener("click", () => setZoom(zoom - .25));
byId("zoom-in").addEventListener("click", () => setZoom(zoom + .25));
byId("zoom-reset").addEventListener("click", () => setZoom(1));
byId("new-canvas").addEventListener("click", () => {
  cancelGesture();
  activeGuide = null;
  clearCurvePlacement();
  commit([], [], []);
});
byId("delete").addEventListener("click", removeSelection);
byId("undo").addEventListener("click", () => restore(undoStack, redoStack));
byId("redo").addEventListener("click", () => restore(redoStack, undoStack));
function artworkSvg() {
  const content = renderVector(layers.filter((layer) => !layer.hidden), "forma");
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height +
    '" viewBox="0 0 ' + width + ' ' + height + '">' + content + '</svg>';
}

function showNotice(message) {
  const notice = byId("notice");
  byId("notice-text").textContent = message;
  byId("notice-icon").innerHTML = icon(/できません|失敗|ありません/.test(message) ? "warning" : "check");
  notice.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { notice.hidden = true; }, 2400);
}

function downloadImage(blob, format) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "forma." + format.toLowerCase();
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showNotice(format + " を書き出しました");
}

function artworkSvgBlob() {
  return new Blob([artworkSvg()], { type: "image/svg+xml;charset=utf-8" });
}

byId("export").addEventListener("click", () => downloadImage(artworkSvgBlob(), "SVG"));
byId("export-png").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  const url = URL.createObjectURL(artworkSvgBlob());
  try {
    const image = new Image();
    image.src = url;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d").drawImage(image, 0, 0, width, height);
    const png = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!png) throw new Error();
    downloadImage(png, "PNG");
  } catch {
    showNotice("PNG を書き出せませんでした");
  } finally {
    URL.revokeObjectURL(url);
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
});

const shortcuts = { y: "select", v: "select", a: "text", b: "bucket", p: "guide", c: "curve", n: "ink", q: "ink-curve", r: "rect", o: "ellipse", t: "triangle", d: "diamond" };

function updateShift(equal) {
  if (gesture?.type === "draw") {
    if (gesture.dragged) gesture.shape = drawnShape(gesture.start, gesture.end, equal);
  } else if (gesture?.type === "resize") {
    gesture.proportional = equal;
  } else if (gesture?.type === "rotate") {
    gesture.snap = equal;
  } else if (isStraightTool(gesture?.type)) {
    gesture.shiftKey = equal;
  } else if (gesture?.type === "line-resize") {
    gesture.shiftKey = equal;
    updateLineResize();
  } else if (gesture?.type === "move" || isSnapMove(gesture)) {
    gesture.lockAxis = equal;
    updateSnapMove();
  } else {
    return;
  }
  renderDrawing();
}

function updateStrokeControl(event) {
  if (event.key !== "Control" && event.key !== "Meta") return;
  if (isStraightTool(gesture?.type)) {
    updateStrokeStart(gesture, event.ctrlKey || event.metaKey);
  } else if (gesture?.type === "line-resize") {
    gesture.disableSnap = event.ctrlKey || event.metaKey;
    updateLineResize();
  } else if (isSnapMove(gesture)) {
    gesture.disableSnap = event.ctrlKey || event.metaKey;
    updateSnapMove();
  } else {
    return;
  }
  renderDrawing();
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && layerDrag.cancel()) {
    event.preventDefault();
    return;
  }
  if (event.target.matches?.("input, select, textarea") || event.target.isContentEditable || event.isComposing) return;
  const key = event.key.toLowerCase();
  if (event.key === "Escape") {
    if (gesture) cancelGesture();
    else if (curvePoints.length) {
      clearCurvePlacement();
      renderDrawing();
      renderControls();
    } else if (resizeId !== null) {
      resizeId = null;
      renderDrawing();
      renderControls();
    } else {
      chooseTool("select");
      selectLayer(undefined, false);
    }
    return;
  }
  if (gesture) {
    if (event.key === "Shift") updateShift(true);
    else updateStrokeControl(event);
    return;
  }
  if (event.key === "Control" || event.key === "Meta") {
    if (!event.repeat && !isStraightTool(tool) && !isCurveTool(tool)) resizeSelectedLayer();
    return;
  }
  if (event.ctrlKey || event.metaKey) {
    if (key === "c" && copySelection()) event.preventDefault();
    if (key === "v" && pasteSelection()) event.preventDefault();
    if (key === "z" || key === "y") {
      event.preventDefault();
      if (key === "y" || event.shiftKey) restore(redoStack, undoStack);
      else restore(undoStack, redoStack);
    }
    if (key === "a") {
      event.preventDefault();
      selectForEdit();
      resizeId = null;
      selection = new Set(layers.filter((layer) => !layer.hidden).map((layer) => layer.id));
      render();
    }
    return;
  }
  if (event.altKey) return;
  if (Object.hasOwn(shortcuts, key)) chooseTool(shortcuts[key]);
  if (key === "delete" || key === "backspace") {
    event.preventDefault();
    removeSelection();
  }
});

document.addEventListener("keyup", (event) => {
  if (event.key === "Shift") updateShift(false);
  else updateStrokeControl(event);
});

const saveState = byId("save-state");
const restoreDraftButton = byId("restore-draft");

function renderSaveState() {
  let label = "自動保存";
  if (draftError) label = draftError;
  else if (layers !== cleanLayers || guides !== cleanGuides) label = "未保存";
  else if (availableDraft?.layers === layers && availableDraft.guides === guides) label = "保存済み";
  else if (availableDraft) label = "保存データあり";

  if (saveState.textContent !== label) saveState.textContent = label;
  saveState.classList.toggle("sr-only", label !== "保存済み");
  const status = saveState.parentElement;
  status.dataset.error = String(Boolean(draftError));
  const statusIcon = byId("save-state-icon");
  const mark = draftError ? "warning" : label === "保存済み" ? "check" : "file";
  if (statusIcon.dataset.icon !== mark) {
    statusIcon.dataset.icon = mark;
    statusIcon.innerHTML = icon(mark);
  }
  status.setAttribute("aria-description", availableDraft
    ? "最終保存 " + new Date(availableDraft.savedAt).toLocaleString("ja-JP")
    : "1分ごとにこのブラウザーへ保存");
  restoreDraftButton.disabled = !availableDraft;
}

function saveDraft() {
  if (layers === cleanLayers && guides === cleanGuides) return;
  try {
    availableDraft = draftStorage.write(layers, guides);
    cleanLayers = layers;
    cleanGuides = guides;
    draftError = "";
  } catch {
    draftError = "保存できません";
  }
  renderSaveState();
}

function refreshAvailableDraft() {
  try {
    availableDraft = draftStorage.read(availableDraft);
    draftError = "";
  } catch {
    availableDraft = null;
    draftError = "読み込めません";
  }
}

function loadDraft(withHistory = false) {
  refreshAvailableDraft();
  const draft = availableDraft;
  if (!draft) {
    renderSaveState();
    if (withHistory) showNotice(draftError || "保存済みの作業がありません");
    return;
  }

  cleanLayers = draft.layers;
  cleanGuides = draft.guides;
  for (const layer of draft.layers) nextId = Math.max(nextId, layer.id + 1, (layer.groupId ?? 0) + 1);
  if (withHistory) {
    if (layers !== draft.layers || guides !== draft.guides) {
      cancelGesture();
      chooseTool("select");
      commit(draft.layers, [], draft.guides);
    } else {
      renderSaveState();
    }
    showNotice("保存済みの作業を読み込みました");
  } else {
    layers = draft.layers;
    guides = draft.guides;
  }
}

restoreDraftButton.addEventListener("click", () => loadDraft(true));
window.setInterval(saveDraft, 60_000);
window.addEventListener("pagehide", saveDraft);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveDraft();
});
window.addEventListener("storage", (event) => {
  if (event.key !== null && event.key !== draftStorage.key) return;
  refreshAvailableDraft();
  renderSaveState();
});

loadDraft();
renderZoom();
render();
