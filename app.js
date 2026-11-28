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
const centerAlignmentMark = byId("center-alignment");
const endpointSnapMark = byId("endpoint-snap");
const branchSnapMark = byId("branch-snap");
const inkControls = byId("ink-controls");
const textOutlineControls = byId("text-outline-controls");
const textOutlineMeasure = byId("text-outline-measure");
const textOutlineEditButton = byId("text-outline-edit");
const vertexActions = byId("vertex-actions");
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
  layers: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  strokeWeight: '<path d="M4 5h16" stroke-width="1"/><path d="M4 11h16" stroke-width="2.5"/><path d="M4 18h16" stroke-width="4"/>',
  measureWidth: '<path d="M4 7v10m16-10v10M4 12h16"/>',
  alignVertexY: '<path d="M3 12h18"/><circle cx="7" cy="12" r="2.5" fill="white"/><circle cx="17" cy="12" r="2.5" fill="white"/>',
  alignVertexX: '<path d="M12 3v18"/><circle cx="12" cy="7" r="2.5" fill="white"/><circle cx="12" cy="17" r="2.5" fill="white"/>',
  mergeVertices: '<path d="m4 5 5 5m0-4v4H5m15-5-5 5m0-4v4h4"/><circle cx="12" cy="17" r="2.7"/>',
  measureHeight: '<path d="M7 4h10M7 20h10M12 4v16"/>',
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
const colors = ["#7770e6", "#8cdbb2", "#49afa8", "#ffc66f", "#eb8fa9", "#2e3148",
  "#ffffff", "#d9dbe7", "#9298ac", "#535b73", "#ff6b6b", "#f29b5f",
  "#f4dd70", "#a9d66f", "#5bbd82", "#67cbd1", "#73a9ef", "#ad8be8",
  "#f2b5ce", "#b77b65", "#7c695f", "#171923"];
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
const guideRowIds = new WeakMap();
let nextGuideRowId = -1;
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
let curveBranch = null;
let pendingStraight = null;
let branchHover = null;
let branchCursor = null;
const inkBranchCache = new WeakMap();
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
let aspectRatioLocked = false;
let colorPreview = null;
let strokePreview = null;
let opacityPreview = null;
let bucketQueue = Promise.resolve();
let noticeTimer;
let textState = null;
let textPreviewTimer;
let textPointEdit = null;
const textPointModels = new WeakMap();
const undoStack = [];
const redoStack = [];
const outlineElements = new Map();
const artworkElements = new Map();
const paintedInkCache = new WeakMap();
const shapeBounds = new WeakMap();
const regionHitPaths = new WeakMap();
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
  if (shape.kind === "outline" && baseInk(shape.base)) {
    return { ...shape, base: transformShape(shape.base, matrix) };
  }
  const base = shape.kind === "affine" ? shape.base : shape;
  const transform = shape.kind === "affine" ? multiplyMatrices(matrix, shape.matrix) : matrix;
  if (base.kind === "ink" && !inkIsometry(transform)) return transformInkGeometry(base, transform);
  return { kind: "affine", base, matrix: transform };
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
    if (shape.base.kind === "ink" && inkIsometry(shape.matrix)) {
      return inkBounds(transformInkGeometry(shape.base, shape.matrix));
    }
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

function regionHitPath(region) {
  let path = regionHitPaths.get(region);
  if (!path) {
    path = new Path2D(region.pathData);
    regionHitPaths.set(region, path);
  }
  return path;
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
    const px = shape.sourceX + u * shape.sourceW;
    const py = shape.sourceY + v * shape.sourceH;
    if (!shape.regions) return pathContext.isPointInPath(shape.hitPath, px, py);
    return shape.regions.some((region) => pathContext.isPointInPath(regionHitPath(region), px, py));
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
  if (shape.kind === "affine" || shape.kind === "outline" || shape.kind === "ink") {
    return transformShape(shape, scalingMatrix(before, after));
  }
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

function resizeInkInBox(ink, before, after) {
  const radius = ink.width / 2;
  function axis(origin, length) {
    const span = before[length] - ink.width;
    if (span <= guideEpsilon) return [1, 0];
    const scale = Math.max(guideEpsilon, after[length] - ink.width) / span;
    return [scale, after[origin] + radius - (before[origin] + radius) * scale];
  }
  const [sx, x] = axis("x", "w");
  const [sy, y] = axis("y", "h");
  if (Math.abs(sx - 1) <= guideEpsilon && Math.abs(sy - 1) <= guideEpsilon &&
    Math.abs(x) <= guideEpsilon && Math.abs(y) <= guideEpsilon) return ink;
  return transformInkGeometry(ink, [sx, 0, 0, sy, x, y]);
}

function inkInWorld(shape) {
  const ink = baseInk(shape);
  return ink && (shape.kind === "affine" ? transformInkGeometry(ink, shape.matrix) : ink);
}

function groupSizeMatrix(targets, before, after, axis) {
  const regular = scalingMatrix(before, after);
  const members = layers.filter((layer) => targets.has(layer.id));
  if (aspectRatioLocked || !members.some((layer) => baseInk(layer.shape))) return regular;

  const origin = axis === "w" ? "x" : "y";
  const intervals = members.map(({ shape }) => {
    const ink = inkInWorld(shape);
    const boundsOfMember = ink ? inkBounds(ink) : bounds(shape);
    const pad = ink ? ink.width / 2 : 0;
    const start = boundsOfMember[origin] - before[origin] + pad;
    return { start, end: start + boundsOfMember[axis] - 2 * pad, pad };
  });
  function extentAt(scale) {
    let min = Infinity;
    let max = -Infinity;
    for (const { start, end, pad } of intervals) {
      min = Math.min(min, start * scale - pad);
      max = Math.max(max, end * scale + pad);
    }
    return { min, length: max - min };
  }

  const geometricSpan = Math.max(...intervals.map(({ end }) => end)) - Math.min(...intervals.map(({ start }) => start));
  if (geometricSpan <= guideEpsilon) return identityMatrix;
  const desired = after[axis];
  let low = 0;
  let high = Math.max(1, desired / geometricSpan);
  for (let step = 0; step < 40; step++) {
    const middle = (low + high) / 2;
    if (extentAt(middle).length < desired) low = middle;
    else high = middle;
  }
  const scale = Math.max(guideEpsilon, (low + high) / 2);
  const offset = after[origin] - before[origin] * scale - extentAt(scale).min;
  return axis === "w" ? [scale, 0, 0, 1, offset, 0] : [1, 0, 0, scale, 0, offset];
}

function sizeTarget() {
  const layer = primaryGeometryLayer();
  if (!layer) return null;
  const { shape, targets } = geometryTarget(layer);
  if ([...selection].some((id) => !targets.has(id))) return null;
  const worldInk = !layer.groupId && inkInWorld(shape);
  const box = worldInk ? inkBounds(worldInk) : bounds(shape);
  return box.w > 0 && box.h > 0 ? { layer, box, targets, ink: worldInk } : null;
}

function applySize(axis, input) {
  const target = sizeTarget();
  const value = input.valueAsNumber;
  if (!target || !input.validity.valid || !Number.isFinite(value)) {
    renderControls();
    return;
  }
  const { layer, box, targets, ink } = target;
  if (ink && box[axis] - ink.width <= guideEpsilon) {
    renderControls();
    return;
  }
  if (Math.abs(value - box[axis]) <= guideEpsilon) return;
  const after = { ...box, [axis]: value };
  if (aspectRatioLocked) {
    const dimensions = ink ? ["w", "h"].filter((key) => box[key] - ink.width > guideEpsilon) : ["w", "h"];
    const minSize = ink ? ink.width + .001 : Number(input.min);
    const minimum = Math.max(...dimensions.map((key) => minSize / box[key]));
    const maximum = Math.min(...dimensions.map((key) => Number(input.max) / box[key]));
    if (minimum > maximum) {
      renderControls();
      return;
    }
    const scale = Math.max(minimum, Math.min(maximum, value / box[axis]));
    for (const key of dimensions) after[key] = box[key] * scale;
  } else if (ink) {
    after[axis] = Math.max(ink.width + .001, after[axis]);
  }
  const resizedInk = ink ? resizeInkInBox(ink, box, after) : null;
  if (ink && resizedInk === ink) {
    renderControls();
    return;
  }
  const matrix = layer.groupId ? groupSizeMatrix(targets, box, after, axis) : null;
  if (matrix === identityMatrix) {
    renderControls();
    return;
  }
  commit(layers.map((item) => targets.has(item.id)
    ? { ...item, shape: resizedInk ?? (matrix ? transformShape(item.shape, matrix) : scaleShape(item.shape, box, after)) }
    : item));
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
  if (base.kind === "path") return Boolean(base.regions);
  return base.kind === "union" ? Boolean(base.sourceColors) : hasXorColors(rootXor(shape));
}

function clearXorColors(shape, color) {
  const base = shape.kind === "affine" ? shape.base : shape;
  if (base.kind === "path" && base.regions) {
    return replaceRootXor(shape, { ...base, regions: base.regions.map((region) => ({ ...region, color })) });
  }
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
  if (kind === "ink-run") {
    return '<path d="' + shape.pathData + '" fill="none" stroke="currentColor" stroke-width="' + shape.width +
      '" stroke-linejoin="round" stroke-linecap="round"/>';
  }
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

function paintedInkRuns(items, targets) {
  if (!items.some((layer) => layer.inkChain)) return items;
  const result = [];
  function continues(left, right) {
    if (!left.inkChain || left.inkChain !== right.inkChain || left.color !== right.color ||
      Boolean(left.noFill) !== Boolean(right.noFill) || (left.opacity ?? 100) !== (right.opacity ?? 100) ||
      Boolean(targets?.has(left.id)) !== Boolean(targets?.has(right.id))) return false;
    const stroke = left.stroke ?? defaultStroke;
    const otherStroke = right.stroke ?? defaultStroke;
    if (stroke.enabled !== otherStroke.enabled || (stroke.enabled &&
      (stroke.color !== otherStroke.color || stroke.width !== otherStroke.width ||
        (stroke.join ?? "round") !== (otherStroke.join ?? "round")))) return false;
    const a = inkEndpoints(left.shape);
    const b = inkEndpoints(right.shape);
    return a && b && baseInk(left.shape).width === baseInk(right.shape).width &&
      endpointKey(a[1]) === endpointKey(b[0]);
  }

  for (let start = 0; start < items.length;) {
    let end = start + 1;
    while (end < items.length && continues(items[end - 1], items[end])) end++;
    const first = items[start];
    if (end === start + 1) {
      result.push(first);
    } else {
      const run = items.slice(start, end);
      const cached = paintedInkCache.get(first);
      if (cached?.run.length === run.length && run.every((layer, index) => layer === cached.run[index])) {
        result.push(cached.item);
      } else {
        const strokes = run.map((layer) => inkInWorld(layer.shape));
        const pathData = strokes.map((stroke, index) => index === 0 ? inkPathData(stroke)
          : inkPathData(stroke).replace(/^M[^LCQ]*/, "")).join("");
        const boxes = strokes.map((stroke) => inkBounds(stroke));
        const x = Math.min(...boxes.map((box) => box.x));
        const y = Math.min(...boxes.map((box) => box.y));
        const w = Math.max(...boxes.map((box) => box.x + box.w)) - x;
        const h = Math.max(...boxes.map((box) => box.y + box.h)) - y;
        const shape = { kind: "ink-run", pathData, width: strokes[0].width, x, y, w, h };
        const item = { ...first, inkChain: undefined, shape };
        paintedInkCache.set(first, { run, item });
        result.push(item);
      }
    }
    start = end;
  }
  return result;
}

function renderVector(items, prefix) {
  const definitions = [];
  const compiled = new WeakMap();
  const parityPairs = new Map();
  let sequence = 0;
  const newId = () => prefix + "-" + ++sequence;
  const use = (id, fill = "") => '<use href="#' + id + '"' + (fill ? ' fill="' + fill + '" color="' + fill + '"' : "") + '/>';
  const masked = (id, content) => '<g mask="url(#' + id + ')">' + content + '</g>';

  function group(content) {
    const id = newId();
    definitions.push('<g id="' + id + '">' + content + '</g>');
    return id;
  }

  function mask(content, box, invert = false) {
    const id = newId();
    const region = ' x="' + number(box.x - 2) + '" y="' + number(box.y - 2) +
      '" width="' + number(box.w + 4) + '" height="' + number(box.h + 4) + '"';
    definitions.push(
      '<mask id="' + id + '" maskUnits="userSpaceOnUse"' + region + ' style="mask-type:luminance">' +
      (invert ? '<rect' + region + ' fill="white"/>' : '') + content + '</mask>',
    );
    return id;
  }

  function cutOut(content, cutters, box) {
    if (!cutters.length) return content;
    // Let the source supply its own edge coverage. The mask only removes cutters.
    return masked(mask(cutters.map((id) => use(id, "black")).join(""), box, true), content);
  }

  function boxesOverlap(a, b) {
    return a.x <= b.x + b.w && b.x <= a.x + a.w && a.y <= b.y + b.h && b.y <= a.y + a.h;
  }

  function xorParity(parts, omitted = -1, area = null) {
    function range(start, end) {
      if (end - start === 1) {
        if (start === omitted) return null;
        const part = parts[start];
        const box = bounds(part);
        return area && !boxesOverlap(box, area) ? null : { id: compile(part), box };
      }
      const middle = start + Math.floor((end - start) / 2);
      const left = range(start, middle);
      const right = range(middle, end);
      if (!left || !right) return left ?? right;

      const key = left.id + " " + right.id;
      if (!parityPairs.has(key)) {
        const a = left.box;
        const b = right.box;
        const x = Math.min(a.x, b.x);
        const y = Math.min(a.y, b.y);
        const w = Math.max(a.x + a.w, b.x + b.w) - x;
        const h = Math.max(a.y + a.h, b.y + b.h) - y;
        const content = boxesOverlap(a, b)
          ? cutOut(use(left.id), [right.id], a) + cutOut(use(right.id), [left.id], b)
          : use(left.id) + use(right.id);
        parityPairs.set(key, { id: group(content), box: { x, y, w, h } });
      }
      return parityPairs.get(key);
    }
    return parts.length ? range(0, parts.length) : null;
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
    if (!shape.parts) {
      const content = shape.regions ? shape.regions.map(({ pathData }) => primitive({ ...shape, pathData })).join("")
        : primitive(shape);
      return group(content);
    }
    if (shape.kind === "union") {
      const content = [];
      appendUnionPart(shape, content);
      return group(content.join(""));
    }
    if (shape.kind === "xor") return xorParity(shape.parts).id;
    const parts = shape.parts.map(compile);
    const box = bounds(shape);
    if (shape.kind === "subtract") {
      return group(cutOut(use(parts[0]), parts.slice(1), box));
    }
    const content = parts.slice(1).reduce((result, id) => masked(mask(use(id, "white"), box), result), use(parts[0]));
    return group(content);
  }

  function renderXorColors(xor) {
    const firstColor = xor.sourceColors[0];
    if (xor.sourceColors.every((color) => color === firstColor) &&
      xor.parts.every((part) => !hasStoredPaint(part))) {
      return use(compile(xor), firstColor);
    }
    // Inside a source, total parity is odd exactly when the other sources have even parity.
    // Draw in layer order so overlapping odd regions keep the highest visible color.
    return xor.parts.map((source, index) => {
      const box = bounds(source);
      const others = xorParity(xor.parts, index, box);
      const content = renderFill(source, xor.sourceColors[index]);
      return others ? cutOut(content, [others.id], box) : content;
    }).join("");
  }

  function renderFill(shape, color) {
    const base = shape.kind === "affine" ? shape.base : shape;
    if (base.kind === "path" && base.regions) {
      const content = base.regions.map((region) =>
        '<g fill="' + region.color + '">' + primitive({ ...base, pathData: region.pathData }) + '</g>',
      ).join("");
      return shape.kind === "affine" ? '<g transform="matrix(' + shape.matrix.join(" ") + ')">' + content + '</g>' : content;
    }
    if (base.kind === "union" && base.sourceColors) {
      const content = base.parts.map((part, index) => renderFill(part, base.sourceColors[index])).join("");
      return shape.kind === "affine" ? '<g transform="matrix(' + shape.matrix.join(" ") + ')">' + content + '</g>' : content;
    }
    const xor = rootXor(shape);
    if (!hasXorColors(xor)) return use(compile(shape), color);

    let fill = "";
    if (!xor.paintOnly) fill = xor.sourceColors ? renderXorColors(xor) : use(compile(xor), color);
    for (const paint of xor.paints ?? []) {
      if (paint.outline) {
        fill += '<path d="' + paint.outline + '" fill="' + paint.color + '"/>';
        continue;
      }
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
    if (!shape.parts && !shape.regions && !["affine", "outline", "ink", "ink-run"].includes(shape.kind) &&
      (shape.kind !== "path" || !stroke.enabled)) {
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
  const content = paintedInkRuns(items).map((item) => {
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
  for (const layer of paintedInkRuns(visible, targets)) {
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

function renderOutlines(visible, targets, transform, handleLayerId) {
  const primary = primarySelectionId();
  const primaryGroup = primaryGeometryLayer()?.groupId;
  const resizeGroup = visible.find((layer) => layer.id === handleLayerId)?.groupId;
  const liveIds = new Set();
  for (const layer of visible) {
    if (layer.id === textPointEdit?.layerId) continue;
    if (!selection.has(layer.id) && !(primaryGroup && layer.groupId === primaryGroup)) continue;
    const id = layer.groupId ?? layer.id;
    if (liveIds.has(id)) continue;
    const frame = shapeFrame(layer.groupId ? geometryTarget(layer).shape : layer.shape);
    const { w, h } = frame.box;
    if (!w || !h) continue;
    const active = layer.id === primary || (layer.groupId && layer.groupId === primaryGroup);
    const resizing = layer.id === handleLayerId || (layer.groupId && layer.groupId === resizeGroup);
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
  const pointLayer = textPointEdit && editableTextPointLayer();
  if (textPointEdit && pointLayer?.id !== textPointEdit.layerId) {
    textPointEdit.layerId = pointLayer?.id;
    textPointEdit.selected.clear();
  }
  if (gesture?.type === "text-point" && pointLayer?.id === gesture.layerId) {
    const shape = movedTextOutline(gesture);
    if (shape !== pointLayer.shape) {
      visible = visible.map((layer) => layer === pointLayer ? { ...layer, shape } : layer);
    }
  }
  const movement = gesture?.type === "move" ? gesture : null;
  const rotation = gesture?.type === "rotate" ? rotationMatrix(gesture) : null;
  let targets = movement?.targets ?? (rotation ? gesture.targets : null);
  let artworkTargets;
  let transform = null;
  if (movement && (movement.dx || movement.dy)) transform = "translate(" + movement.dx + " " + movement.dy + ")";
  if (rotation) transform = "matrix(" + rotation.join(" ") + ")";
  if (gesture?.type === "resize") {
    updateResize(gesture.proportional);
    const matrix = groupResizeMatrix(gesture);
    if (matrix) {
      targets = gesture.targets;
      transform = "matrix(" + matrix.join(" ") + ")";
      if (!inkIsometry(matrix)) {
        visible = visible.map((layer) => {
          if (!targets.has(layer.id) || !baseInk(layer.shape)) return layer;
          artworkTargets ??= new Set(targets);
          artworkTargets.delete(layer.id);
          return { ...layer, shape: transformShape(layer.shape, matrix) };
        });
      }
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
      ? { ...layer, color: colorPreview, shape: clearXorColors(layer.shape, colorPreview) } : layer);
  }
  if (strokePreview) {
    visible = visible.map((layer) => selection.has(layer.id) ? {
      ...layer, stroke: { ...(layer.stroke ?? defaultStroke), color: strokePreview },
    } : layer);
  }
  if (opacityPreview !== null) {
    visible = visible.map((layer) => selection.has(layer.id) ? { ...layer, opacity: opacityPreview } : layer);
  }
  renderArtwork(visible, artworkTargets ?? targets, transform);
  renderGuides();
  const tap = gesture?.resizeTap;
  const handleLayerId = textPointEdit ? null : (tap && !tap.right && !tap.dragged ? tap.layerId : resizeId);
  renderOutlines(visible, targets, transform, handleLayerId);
  renderSelectionMarquee();
  const resizedLayer = visible.find((layer) => layer.id === handleLayerId);
  const resizedShape = resizedLayer?.groupId ? geometryTarget(resizedLayer).shape : resizedLayer?.shape;
  renderResizeHandles(resizedShape, targets?.has(handleLayerId) ? transform : null);
  const primaryId = primaryGeometryLayer()?.id;
  const selectedLayer = visible.find((layer) => layer.id === primaryId);
  const selectedShape = selectedLayer?.groupId ? geometryTarget(selectedLayer).shape : selectedLayer?.shape;
  const selectedTransform = targets?.has(selectedLayer?.id) ? transform : null;
  renderRotationHandle(textPointEdit ? null : selectedShape, selectedTransform);
  renderInkControls(visible, artworkTargets ?? targets, transform);
  renderTextOutlineControls(!movement && pointLayer && visible.find((layer) => layer.id === pointLayer.id));
  vertexActions.hidden = !textPointEdit;
  for (const button of vertexActions.querySelectorAll("button")) {
    button.disabled = Boolean(gesture) || (textPointEdit?.selected.size ?? 0) < 2;
  }
}

function renderSelectionMarquee() {
  if (!gesture?.dragged || (gesture.type !== "marquee" && gesture.type !== "text-point-marquee")) {
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
  const stroke = previewStraightStroke();
  if (stroke?.type === "ink") {
    const points = lineStrokePoints(stroke);
    return points.length === 2 ? { kind: "ink", points, width: stroke.width, curve: false } : null;
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
    guideLines.innerHTML = guides.map((guide) => guideIsHidden(guide) ? "<g/>" : Array.isArray(guide)
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
      if (node && !guideIsHidden(guide)) {
        if (Array.isArray(guide)) node.setAttribute("points", coordinates(guide));
        else node.setAttribute("d", curvePath(guide));
      }
    }
    jointGuideIndices = new Set(previews?.keys());
  }
  const resize = gesture?.type === "line-resize" && gesture.guideIndex !== undefined ? gesture : null;
  const stroke = previewStraightStroke();
  const end = stroke ? lineStrokeEnd(stroke, true) : null;
  if (resize) {
    guideDraft.setAttribute("points", coordinates(resizedLineEnds(resize)));
  } else if (stroke?.type === "guide") {
    guideDraft.setAttribute("points", coordinates([stroke.start, end.point]));
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
  renderCenterAlignment(gesture?.centerHint);
  const startSnap = stroke && (stroke === pendingStraight || stroke.start !== stroke.pointerStart) ? stroke.start : null;
  renderEndpointSnap(end?.endpoint ?? gesture?.endpointSnap ?? startSnap);
  branchSnapMark.setAttribute("visibility", branchHover ? "visible" : "hidden");
  if (branchHover) {
    branchSnapMark.setAttribute("cx", number(branchHover.point.x));
    branchSnapMark.setAttribute("cy", number(branchHover.point.y));
    branchSnapMark.setAttribute("r", number(4 * svgUnitsPerPixel()));
  }

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

function renderCenterAlignment(hint) {
  if (!hint) {
    centerAlignmentMark.removeAttribute("d");
    return;
  }
  const { point, x, y } = hint;
  const pad = 5 * svgUnitsPerPixel();
  let data = "";
  if (x) data += "M" + number(point.x) + " " + number(Math.min(point.y, x.y) - pad) +
    "V" + number(Math.max(point.y, x.y) + pad);
  if (y) data += "M" + number(Math.min(point.x, y.x) - pad) + " " + number(point.y) +
    "H" + number(Math.max(point.x, y.x) + pad);
  if (centerAlignmentMark.getAttribute("d") !== data) centerAlignmentMark.setAttribute("d", data);
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
      if (guideIsHidden(guide) || (!showAll && guide !== activeGuide)) return;
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

function layerRowActions(id, name, hidden, suffix = "") {
  const visibility = hidden ? "表示" : "非表示";
  return '<button class="icon-button" data-visibility' + suffix + '="' + id + '" aria-label="' + name + 'を' +
    visibility + '">' + icon(hidden ? "eyeOff" : "eye") + '</button>' +
    '<button class="icon-button layer-delete" data-delete' + suffix + '="' + id + '" aria-label="' + name +
    'を削除">' + icon("trash") + '</button>';
}

function guideRowId(guide) {
  if (!guideRowIds.has(guide)) guideRowIds.set(guide, nextGuideRowId--);
  return guideRowIds.get(guide);
}

function guideRowIndex(id) {
  return guides.findIndex((guide) => guideRowId(guide) === id);
}

function replaceGuideRow(before, after) {
  guideRowIds.set(after, guideRowId(before));
  return after;
}

function layerThumbnail(box, content, padding = 0) {
  const side = Math.max(box.w, box.h, 1) + padding;
  const viewBox = [box.x + (box.w - side) / 2 - side * .16, box.y + (box.h - side) / 2 - side * .16,
    side * 1.32, side * 1.32].map(number).join(" ");
  return '<svg class="layer-preview" viewBox="' + viewBox + '" aria-hidden="true">' + content + '</svg>';
}

function layerTypeIcon(layer) {
  if (layer.text) return "text";
  const shape = layer.shape.kind === "affine" ? layer.shape.base : layer.shape;
  if (shape.kind === "ink") return shape.curve ? "inkCurve" : "ink";
  if (shape.kind === "path") return layer.inkBoundary ? "bucket" : "curve";
  if (shape.kind === "outline") return "strokeWeight";
  return Object.hasOwn(icons, shape.kind) ? shape.kind : "layers";
}

function layerTypeMark(mark) {
  return '<i class="layer-type" aria-hidden="true">' + icon(mark) + '</i>';
}

function renderLayers() {
  layerDrag.cancel();
  const blocks = layerBlocks();
  byId("layer-count").textContent = blocks.length + guides.length;
  const primary = primarySelectionId();
  const groupIds = blocks.filter((block) => block.group).map((block) => block.id).sort((a, b) => a - b);
  const groupLabels = new Map(groupIds.map((id, index) => [id, "グループ" + (index + 1)]));
  const grip = '<i class="layer-grip" aria-hidden="true">' + icon("grip") + '</i>';
  function renderLayer(layer) {
    const active = selection.has(layer.id);
    const preview = layerThumbnail(bounds(layer.shape), renderVector([layer], "preview-" + layer.id),
      layer.stroke?.enabled ? layer.stroke.width : 0);
    const selectionClass = layer.id === primary ? " selected" : active ? " selected secondary-selection" : "";
    const name = escapeMarkup(layer.name);
    return '<div class="layer' + selectionClass + (layer.hidden ? " hidden" : "") + '" data-layer-id="' + layer.id + '">' +
      '<button class="layer-select" data-layer="' + layer.id + '" aria-pressed="' + active + '">' +
      grip + preview + layerTypeMark(layerTypeIcon(layer)) + '<span class="sr-only">' + name + '</span></button>' +
      layerRowActions(layer.id, name, layer.hidden) + '</div>';
  }
  function renderGuideLayer(guide) {
    const id = guideRowId(guide);
    const hidden = guideIsHidden(guide);
    const active = guide === activeGuide;
    const geometry = guideGeometry(guide);
    const curved = !Array.isArray(geometry);
    const points = guidePolyline(geometry);
    const x = Math.min(...points.map((point) => point.x));
    const y = Math.min(...points.map((point) => point.y));
    const box = { x, y, w: Math.max(...points.map((point) => point.x)) - x, h: Math.max(...points.map((point) => point.y)) - y };
    const attributes = ' class="layer-guide-stroke" vector-effect="non-scaling-stroke"';
    const content = curved ? '<path d="' + curvePath(geometry) + '"' + attributes + '/>'
      : '<polyline points="' + points.map(({ x, y }) => number(x) + "," + number(y)).join(" ") + '"' + attributes + '/>';
    const name = curved ? "曲線の点線" : "直線の点線";
    return '<div class="layer' + (active ? " selected" : "") + (hidden ? " hidden" : "") +
      '" data-layer-id="' + id + '" data-guide-row>' +
      '<button class="layer-select" data-guide-layer="' + id + '" aria-pressed="' + active + '">' +
      grip + layerThumbnail(box, content) + layerTypeMark(curved ? "curve" : "guide") +
      '<span class="sr-only">' + name + '</span></button>' + layerRowActions(id, name, hidden, "-guide") + '</div>';
  }
  function renderBlock({ id, group, members }) {
    if (!group) return renderLayer(members[0]);
    const open = expandedLayerGroups.has(id);
    const name = groupLabels.get(id);
    const active = members.every((layer) => selection.has(layer.id));
    const partial = !active && members.some((layer) => selection.has(layer.id));
    const hidden = members.every((layer) => layer.hidden);
    const visible = hidden ? members : members.filter((layer) => !layer.hidden);
    const preview = layerThumbnail(geometryTarget(members[0]).shape, renderVector(visible, "group-preview-" + id));
    const selectionClass = active ? " selected" : partial ? " selected secondary-selection" : "";
    return '<div class="layer-block" data-layer-id="' + id + '"><div class="layer' + selectionClass + (hidden ? " hidden" : "") + '">' +
      '<button class="icon-button layer-expand" data-expand-group="' + id + '" aria-expanded="' + open +
      '" aria-controls="layer-members-' + id + '" aria-label="' + name + 'の内訳">' + icon(open ? "chevronDown" : "chevronRight") + '</button>' +
      '<button class="layer-select" data-layer-group="' + id + '" aria-pressed="' + (partial ? "mixed" : active) + '">' +
      grip + preview + layerTypeMark("layers") + '<span class="sr-only">' + name +
      '</span></button>' + layerRowActions(id, name, hidden, "-group") + '</div>' +
      '<div class="layer-members" id="layer-members-' + id + '"' + (open ? "" : " hidden") + '>' +
      (open ? members.slice().reverse().map(renderLayer).join("") : "") + '</div></div>';
  }
  layerList.innerHTML = blocks.length || guides.length
    ? guides.slice().reverse().map(renderGuideLayer).join("") + blocks.reverse().map(renderBlock).join("")
    : '<div class="empty">' + icon("layers") + '<span class="sr-only">図形がありません</span></div>';
}

function renderControls() {
  drawing.dataset.tool = tool;
  shapeFillSwitch.setAttribute("aria-checked", shapeFillEnabled);
  shapeFillSwitch.parentElement.style.setProperty("--shape-ink", brush);
  document.querySelectorAll("[data-tool]").forEach((button) => {
    button.setAttribute("aria-pressed", !textPointEdit && button.dataset.tool === tool);
  });
  textOutlineEditButton.setAttribute("aria-pressed", Boolean(textPointEdit));
  const operandCount = selectedOperandBlocks().length;
  document.querySelectorAll("[data-operation]").forEach((button) => {
    button.disabled = operandCount < 2;
  });
  byId("new-canvas").disabled = !layers.length && !guides.length;
  byId("undo").disabled = !undoStack.length;
  byId("redo").disabled = !redoStack.length;
  byId("delete").disabled = !selection.size && !activeGuide;
  byId("layer-copy").disabled = !selection.size && !activeGuide;
  byId("layer-paste").disabled = !copiedObjects;
  let hint = "クリックで拡縮ハンドル · 空白からドラッグで範囲選択 · Shift で追加 · 右ドラッグで移動";
  if (textPointEdit) hint = "図形をクリック · ドラッグで頂点を範囲選択 · Delete で頂点を削除 · Ctrl で吸着解除";
  else if (gesture?.type === "curve-control") hint = "縦・横で点をそろえて吸着 · Shift で45°刻み · Ctrl で吸着解除";
  else if (gesture?.type === "curve-anchor") hint = "Shift でベジェハンドルを45°刻み";
  else if (gesture?.type === "joint-move") hint = "接続点を移動 · 上下の線の中間で吸着 · Ctrl で吸着解除";
  else if (gesture?.type === "line-resize") hint = "端点で長さと角度を変更 · Shift で15°刻み · Ctrl で吸着解除";
  else if (isSnapMove(gesture)) hint = gesture.pointRows?.length >= 2
    ? "線の中間に吸着 · Shift で45°刻み · Ctrl で吸着解除"
    : gesture.lineLayout
    ? "位置合わせ・等間隔で吸着 · Shift で45°刻み · Ctrl で吸着解除"
    : "Shift で45°刻み · Ctrl で吸着解除";
  else if (gesture?.type === "move") hint = "中心をそろえて吸着 · Shift で45°刻み · Ctrl で吸着解除";
  else if (resizeId !== null) hint = "角・辺中央で拡縮 · 辺をドラッグして変形 · Shift で比率固定";
  else if (pendingStraight) hint = "終点をクリック · 右クリックでキャンセル · Shift で15°刻み";
  else if (tool === "guide") hint = "2回のクリックまたはドラッグで直線 · 線の途中の丸から分岐 · Ctrl で吸着解除";
  else if (tool === "ink") hint = "2回のクリックまたはドラッグで直線 · 線の途中の丸から分岐 · Ctrl で吸着解除";
  else if (tool === "curve" || tool === "ink-curve") {
    const startHint = "始点・中点・終点をクリック · 始点からドラッグでベジェ · Shift で45°刻み";
    hint = curveStartControl ? "終点をクリックまたはドラッグ" : [startHint, "中点をクリック", "終点をクリック"][curvePoints.length];
  }
  else if (tool === "bucket") hint = "色を選び、塗りたい部分をクリック";
  else if (tool === "text") hint = "右側で文字と書体を選択";
  else if (tool !== "select") hint = "クリックで選択 · ドラッグで描画 · Shift で正方形や正円";
  byId("canvas-hint").textContent = hint;
  const primary = primarySelectionId();
  const selected = layers.find((layer) => layer.id === primary);
  const dimensions = sizeTarget();
  byId("size-fields").hidden = !dimensions;
  byId("size-link").setAttribute("aria-pressed", aspectRatioLocked);
  if (dimensions) {
    for (const [id, axis] of [["size-width", "w"], ["size-height", "h"]]) {
      const input = byId(id);
      input.value = number(dimensions.box[axis]);
      input.disabled = Boolean(dimensions.ink && dimensions.box[axis] - dimensions.ink.width <= guideEpsilon);
    }
  }
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
  clearLinePlacement();
  selection = tool === "bucket" ? new Set() : new Set(state.selection);
  if (!selection.has(resizeId)) resizeId = null;
  render();
  animateLayerOrder(layerList, before);
}

function chooseTool(value) {
  if (tool === value) {
    if (value === "select" && textPointEdit && !gesture) setTextPointEdit(null);
    return;
  }
  cancelGesture();
  activeGuide = null;
  clearLinePlacement();
  resizeId = null;
  textPointEdit = null;
  if (value !== "select") selection.clear();
  tool = value;
  render();
  if (tool === "text") byId("text-value").focus();
}

function selectForEdit() {
  if (tool !== "select" && !Object.hasOwn(shapeNames, tool) && !isInkTool()) chooseTool("select");
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

function commitInk(shape, branch) {
  const scene = splitBranchParent(branch);
  const id = nextId++;
  const layer = { id, name: shape.curve ? "鉛筆の曲線" : "鉛筆の直線",
    ...inkLayerStyle(shape), ...(scene.groupId ? { groupId: scene.groupId } : {}),
  };
  const index = scene.groupId ? scene.layers.findLastIndex((member) => member.groupId === scene.groupId) + 1 : scene.layers.length;
  commit([...scene.layers.slice(0, index), layer, ...scene.layers.slice(index)], [id], scene.guides);
}

function bentInkShape({ shape, end }) {
  const ink = baseInk(shape);
  const [start, middle, finish] = ink.points;
  if (end.x === middle.x && end.y === middle.y) return shape;
  return replaceInk(shape, { ...ink, points: [start, end, finish] });
}

function startInkBend(layer, point, event) {
  const shape = layer.shape;
  const matrix = shape.kind === "affine" ? shape.matrix : identityMatrix;
  const middle = baseInk(shape).points[1];
  gesture = {
    type: "ink-bend", id: event.pointerId, layerId: layer.id, shape, matrix,
    start: point, pointer: point, middle, end: middle,
    pointReferences: scenePointReferences(undefined, new Map([[layer.id, [2, 3, 4]]])),
    disableSnap: event.ctrlKey || event.metaKey,
  };
  drawing.setPointerCapture(event.pointerId);
}

function startGuideBend(index, point, event) {
  const guide = guides[index];
  selectGuideOnCanvas(guide);
  gesture = {
    type: "guide-bend", id: event.pointerId, index, matrix: identityMatrix,
    start: point, pointer: point, middle: guide.middle, end: guide.middle,
    pointReferences: scenePointReferences(new Map([[index, [2, 3, 4]]])),
    disableSnap: event.ctrlKey || event.metaKey,
  };
  drawing.setPointerCapture(event.pointerId);
}

function beginBezierControl(handle, event, point) {
  const index = Number(handle.dataset.bezierControl);
  const layerId = handle.dataset.bezierLayer === undefined ? undefined : Number(handle.dataset.bezierLayer);
  const guideIndex = layerId === undefined ? Number(handle.dataset.bezierGuide) : undefined;
  const layer = layers.find((item) => item.id === layerId && !item.groupId && !item.hidden);
  const shape = layer?.shape;
  const curve = shape ? inkCurveGeometry(baseInk(shape)) : guides[guideIndex];
  if (!curve) return;
  if (guideIndex !== undefined) selectGuideOnCanvas(curve);
  const matrix = shape?.kind === "affine" ? shape.matrix : identityMatrix;
  const original = bezierHandles(curve)[index];
  const anchor = index === 0 ? curve.start : curve.end;
  const guideEdits = guideIndex === undefined ? undefined : new Map([[guideIndex, [index + 2]]]);
  const inkEdits = layerId === undefined ? undefined : new Map([[layerId, [index + 2]]]);
  gesture = {
    type: "curve-control", id: event.pointerId, layerId, guideIndex, index, shape, matrix,
    start: point, pointer: point, original, end: original,
    anchor: projectPoint(matrix, anchor), worldControl: projectPoint(matrix, original),
    pointReferences: scenePointReferences(guideEdits, inkEdits),
    disableSnap: event.ctrlKey || event.metaKey, shiftKey: event.shiftKey,
  };
  drawing.setPointerCapture(event.pointerId);
  renderControls();
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
  const hit = layers.some((layer) => !layer.hidden && contains(layer.shape, point, Boolean(layer.text)));
  if (!hit) {
    const barriers = paintBarrierLayers();
    if (barriers.length) queueEnclosedPaint(point, barriers);
    return;
  }
  const strokes = inkBarrierLayers();
  if (strokes.length) queueInkPaint(point, strokes, true);
  else paintLayerAt(point, brush);
}

function paintBarrierLayers() {
  return layers.filter((layer) => !layer.hidden && (layer.opacity ?? 100) > 0 &&
    (!layer.noFill || layer.stroke?.enabled));
}

function queueEnclosedPaint(point, barriers) {
  const color = brush;
  const opacity = opacityBrush;
  bucketQueue = bucketQueue.then(async () => {
    const barrier = await inkBarrier(barriers, point);
    if (!sameInkBarrier(barriers, paintBarrierLayers())) return;
    const region = barrier && closedInkRegion(barrier.raster, barrier.box, point, barrier.owners);
    if (region && region.ids.length) paintInkRegion(region, point, color, opacity);
  }).catch(reportBucketError);
}

function paintLayerAt(point, color, queued = false) {
  const layer = layers.findLast((item) => !item.hidden && contains(item.shape, point, Boolean(item.text)));
  if (!layer) return;
  const { box, matrix } = shapeFrame(layer.shape);
  if (box.regions) {
    const local = unprojectPoint(matrix, point);
    const x = box.sourceX + (local.x - number(box.x)) * box.sourceW / box.w;
    const y = box.sourceY + (local.y - number(box.y)) * box.sourceH / box.h;
    const region = box.regions.findLast((piece) => pathContext.isPointInPath(regionHitPath(piece), x, y));
    if (region && region.color !== color) {
      const regions = box.regions.map((piece) => piece === region ? { ...piece, color } : piece);
      const shape = replaceRootXor(layer.shape, { ...box, regions });
      commit(layers.map((item) => item === layer ? { ...layer, shape, noFill: false } : item));
    }
    return;
  }
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
  const region = vectorBucketComponent(face, point) ??
    await findPaintComponent(renderVector([{ shape: face, color: "#ffffff" }], "bucket-component"), bounds(face), point);
  if (!region || !layers.includes(layer)) return;

  const paintOnly = layer.noFill || Boolean(xor.paintOnly);
  const previous = layer.noFill ? [] : (xor.paints ?? []);
  const key = membership.join(",");
  const matched = previous.find((paint) => paint.membership.join(",") === key &&
    ((paint.clip === region.clip && paint.outline === region.outline) ||
      (paint.clip && pathContext.isPointInPath(new Path2D(paint.clip), point.x, point.y))));
  if (matched?.color === color || (!matched && !paintOnly && baseColor === color)) return;

  const paints = previous.filter((paint) => paint !== matched);
  if (paintOnly || color !== baseColor) paints.push({ membership, color, ...region });
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

function scenePointReferences(guideEdits, inkEdits) {
  const references = [];
  const primary = primarySelectionId();
  function add(points, curve, includeHandles, excluded, matrix = identityMatrix) {
    const candidates = includeHandles
      ? [...points, ...bezierHandles(curve), ...(curve.controls ? [] : [curve.middle])]
      : points;
    for (const [index, point] of candidates.entries()) {
      if (!excluded?.includes(index)) references.push(projectPoint(matrix, point));
    }
  }
  guides.forEach((guide, index) => {
    if (guideIsHidden(guide)) return;
    const edited = guideEdits?.get(index);
    const curve = guide.kind === "curve" ? guide : null;
    add([guideEndpoint(guide, "start"), guideEndpoint(guide, "end")], curve,
      curve && (guide === activeGuide || edited), edited);
  });
  for (const layer of layers) {
    if (!visibleInkCandidate(layer)) continue;
    const ink = baseInk(layer.shape);
    if (!ink?.points.length) continue;
    const edited = inkEdits?.get(layer.id);
    const curve = ink.curve ? inkCurveGeometry(ink) : null;
    const matrix = layer.shape.kind === "affine" ? layer.shape.matrix : identityMatrix;
    add([ink.points[0], ink.points.at(-1)], curve, curve && ((!layer.groupId && layer.id === primary) || edited), edited, matrix);
  }
  return references;
}

function jointMembers(origin, strokes, minimum = 2) {
  const key = endpointKey(origin);
  const members = new Map();
  for (const [id, endpoints] of strokes) {
    const ends = endpoints.flatMap((point, index) => endpointKey(point) === key ? [index] : []);
    if (ends.length) members.set(id, ends);
  }
  return members.size >= minimum ? members : null;
}

function editableInkStrokes() {
  return layers.flatMap((layer) => {
    if (layer.groupId || !visibleInkCandidate(layer)) return [];
    const ends = inkEndpoints(layer.shape);
    return ends ? [[layer.id, ends]] : [];
  });
}

function editableGuideStrokes() {
  return guides.flatMap((guide, index) => guideIsHidden(guide) ? []
    : [[index, [guideEndpoint(guide, "start"), guideEndpoint(guide, "end")]]]);
}

function beginMixedJoint(event, start, point, layer) {
  const inkMembers = jointMembers(point, editableInkStrokes(), 1);
  const guideMembers = jointMembers(point, editableGuideStrokes(), 1);
  if (!inkMembers || !guideMembers || inkMembers.size + guideMembers.size < 3) return false;
  beginJointMove(event, start, point, { inkMembers, guideMembers, layer });
  return true;
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
  if (ink.curve) next.controls = bezierHandles(inkCurveGeometry(ink));
  return replaceInk(shape, next);
}

function guideAtJoint(guide, indices, point) {
  if (Array.isArray(guide)) return jointPoints(guide, indices, point);
  return curveWithEndpoint(guide, indices, point);
}

function beginJointMove(event, start, original, { guideMembers, inkMembers, layer }) {
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
  }
  if (inkMembers) {
    for (const layer of layers) {
      const ends = inkMembers.get(layer.id);
      if (ends) addOppositeRows(inkEndpoints(layer.shape), ends);
    }
  }
  gesture = {
    type: "joint-move", id: event.pointerId, start, original, guideMembers, inkMembers,
    pointCenter: original, pointRows: horizontalPointReferences(references), oppositeRows, moveEnds: [original],
    snapTargets: references.flat(), extendPointRows: true,
    centerLayout: { center: original, references: scenePointReferences(guideMembers, inkMembers) },
    dx: 0, dy: 0, rawDx: 0, rawDy: 0, lockAxis: event.shiftKey, disableSnap: event.ctrlKey || event.metaKey,
  };
  trackResizeTap(event, layer);
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
    pointReferences: scenePointReferences(
      guideIndex === undefined ? undefined : new Map([[guideIndex, [endIndex]]]),
      layer ? new Map([[layer.id, [endIndex]]]) : undefined),
    disableSnap: event.ctrlKey || event.metaKey, shiftKey: event.shiftKey,
  };
  trackResizeTap(event, layer);
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
  gesture.centerHint = null;
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
  const aligned = endpoint || match ? point : alignEditedPoint(gesture, point, ray && { x: ray.dx, y: ray.dy });
  const alignedLength = Math.hypot(aligned.x - anchor.x, aligned.y - anchor.y);
  if (alignedLength < 2) gesture.centerHint = null;
  gesture.point = endpoint ?? match?.point ?? (alignedLength >= 2 ? aligned : point);
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

function layerCenter(items) {
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  for (const layer of items) {
    const { x, y, w, h } = bounds(layer.shape);
    if (!w || !h) continue;
    left = Math.min(left, x);
    right = Math.max(right, x + w);
    top = Math.min(top, y);
    bottom = Math.max(bottom, y + h);
  }
  return Number.isFinite(left) ? { x: (left + right) / 2, y: (top + bottom) / 2 } : null;
}

function centerMoveReferences(targets) {
  const references = [];
  const moving = [];
  for (const block of layerBlocks()) {
    const visible = block.members.filter(visibleInkCandidate);
    if (block.members.some((layer) => targets.has(layer.id))) {
      for (const layer of visible) {
        if (targets.has(layer.id)) moving.push(layer);
      }
    } else {
      const center = layerCenter(visible);
      if (center) references.push(center);
    }
  }
  const center = layerCenter(moving);
  return center && references.length ? { center, references } : null;
}

function snapShapeCenters(layout, dx, dy, direction, tolerance) {
  if (!layout) return null;
  const { center, references } = layout;
  const point = { x: center.x + dx, y: center.y + dy };
  function nearest(axis, maxDistance) {
    const across = axis === "x" ? "y" : "x";
    let offset = maxDistance;
    let best = null;
    for (const reference of references) {
      const distance = Math.abs(reference[axis] - point[axis]);
      if (distance > offset) continue;
      if (distance === offset && best && Math.abs(best[across] - point[across]) <= Math.abs(reference[across] - point[across])) continue;
      best = reference;
      offset = distance;
    }
    return best;
  }
  if (direction) {
    let correction = Infinity;
    for (const axis of ["x", "y"]) {
      const component = direction[axis];
      if (Math.abs(component) <= guideEpsilon) continue;
      const ref = nearest(axis, tolerance * Math.abs(component));
      if (!ref) continue;
      const candidate = (ref[axis] - point[axis]) / component;
      if (Math.abs(candidate) < Math.abs(correction)) correction = candidate;
    }
    if (Number.isFinite(correction)) {
      point.x += direction.x * correction;
      point.y += direction.y * correction;
    }
  } else {
    const x = nearest("x", tolerance);
    const y = nearest("y", tolerance);
    if (x) point.x = x.x;
    if (y) point.y = y.y;
  }
  const x = nearest("x", guideEpsilon);
  const y = nearest("y", guideEpsilon);
  return x || y ? { dx: point.x - center.x, dy: point.y - center.y, hint: { point, x, y } } : null;
}

function alignEditedPoint(edit, point, direction = null) {
  const aligned = !edit.disableSnap && edit.pointReferences?.length
    ? snapShapeCenters({ center: point, references: edit.pointReferences }, 0, 0, direction,
      Math.min(14, 6 * svgUnitsPerPixel()))
    : null;
  edit.centerHint = aligned?.hint;
  return aligned?.hint.point ?? point;
}

function updateMidpoint(edit) {
  const dx = edit.pointer.x - edit.start.x;
  const dy = edit.pointer.y - edit.start.y;
  if (Math.hypot(dx, dy) <= guideEpsilon) {
    edit.centerHint = null;
    edit.end = edit.middle;
    return;
  }
  const { matrix } = edit;
  const origin = projectPoint(matrix, edit.middle);
  const point = pointOnCanvas({ x: origin.x + dx, y: origin.y + dy });
  edit.end = unprojectPoint(matrix, alignEditedPoint(edit, point));
}

function updateBezierDirection(edit, locked) {
  edit.shiftKey = locked;
  const x = edit.pointer.x - edit.start.x;
  const y = edit.pointer.y - edit.start.y;
  if (edit.type === "curve-anchor") {
    if (!edit.dragged) return;
    const sign = edit.ending ? -1 : 1;
    const { dx, dy } = movementDirection(sign * x, sign * y, locked);
    edit.control = { x: edit.position.x + dx, y: edit.position.y + dy };
    if (!edit.ending) curveCursor = edit.control;
  } else {
    if (Math.hypot(x, y) <= guideEpsilon) {
      edit.end = edit.original;
      edit.centerHint = null;
      return;
    }
    const { anchor, worldControl } = edit;
    const { dx, dy, direction } = movementDirection(worldControl.x + x - anchor.x, worldControl.y + y - anchor.y, locked);
    const point = alignEditedPoint(edit, { x: anchor.x + dx, y: anchor.y + dy }, direction);
    edit.end = unprojectPoint(edit.matrix, point);
  }
}

function updateSnapMove() {
  const { rawDx, rawDy, lockAxis, disableSnap, lineLayout, moveEnds, pointCenter, pointRows, oppositeRows, extendPointRows } = gesture;
  const { dx, dy, direction } = movementDirection(rawDx, rawDy, lockAxis);
  const moved = Math.hypot(rawDx, rawDy) > 1;
  const snap = moved && !disableSnap;
  let endpoint = snap && moveEnds?.length
    ? snapLineMove(moveEnds, gesture.snapTargets, dx, dy, direction, guideSnapDistance()) : null;
  if (snap && !endpoint && gesture.type === "move") {
    gesture.vertexEnds ??= layers.filter((layer) => !layer.hidden && gesture.targets.has(layer.id))
      .flatMap((layer) => worldVertexPoints(layer));
    if (gesture.vertexEnds.length) {
      endpoint = snapVertexMove(gesture, [...(moveEnds ?? []), ...gesture.vertexEnds], gesture.targets, dx, dy, direction);
    }
  }
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
  const jointX = gesture.type === "joint-move" && spacing && !direction;
  const center = snap && !endpoint && !alignment && (!spacing || jointX)
    ? snapShapeCenters(gesture.centerLayout, spacing?.dx ?? dx, spacing?.dy ?? dy,
      jointX ? { x: 1, y: 0 } : direction, tolerance) : null;
  const snapped = endpoint ?? alignment ?? center ?? spacing;
  gesture.dx = snapped?.dx ?? dx;
  gesture.dy = snapped?.dy ?? dy;
  gesture.spacingHint = spacing?.hint;
  gesture.alignmentHint = alignment?.hint;
  gesture.centerHint = center?.hint;
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
  if (stroke.controlKey || (end.x === stroke.start.x && end.y === stroke.start.y)) return { point: end };
  const limit = guideSnapDistance();
  const ray = stroke.shiftKey ? guideRay(stroke.start, end) : null;
  if (stroke.targetAnchor && (!ray || guideRayContains(ray, stroke.targetAnchor))) {
    return { point: stroke.targetAnchor, endpoint: stroke.targetAnchor };
  }
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

function branchableInk(shape) {
  if (inkBranchCache.has(shape)) return inkBranchCache.get(shape);
  const ink = inkInWorld(shape);
  const pieces = [];
  if (ink?.curve) {
    pieces.push({ kind: "curve", ...inkCurveGeometry(ink) });
  } else if (ink?.points.length > 1) {
    const { points } = ink;
    let start = points[0];
    for (let i = 1; i < points.length - 1; i++) {
      const control = points[i];
      const end = midpoint(control, points[i + 1]);
      const middle = midpoint(midpoint(start, control), midpoint(control, end));
      pieces.push({ kind: "curve", start, middle, end });
      start = end;
    }
    pieces.push([start, points.at(-1)]);
  }
  inkBranchCache.set(shape, pieces);
  return pieces;
}

function closestBranch(point) {
  let best = null;
  let distance = Infinity;
  const limit = guideSnapDistance();
  const pointDistance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function consider(strokes, source, layer) {
    if (!strokes.length) return;
    const start = guideEndpoint(strokes[0], "start");
    const end = guideEndpoint(strokes.at(-1), "end");
    if (pointDistance(start, point) <= limit || pointDistance(end, point) <= limit) return;
    const reach = limit + (layer ? baseInk(layer.shape).width / 2 : 0);
    for (const [index, stroke] of strokes.entries()) {
      const location = guideBranchLocation(stroke, point, Math.min(reach, distance));
      if (!location || location.distance > reach || location.distance >= distance) continue;
      distance = location.distance;
      best = {
        source, layerId: layer?.id, point: location.point,
        pieces: [...strokes.slice(0, index), ...location.pieces, ...strokes.slice(index + 1)],
      };
    }
    // Older pencil strokes can have several Bézier segments before a split.
    for (let index = 1; index < strokes.length; index++) {
      const joint = guideEndpoint(strokes[index], "start");
      const gap = pointDistance(joint, point);
      if (gap > reach || gap >= distance) continue;
      distance = gap;
      best = { source, layerId: layer?.id, point: joint, pieces: strokes };
    }
  }
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    if (visibleInkCandidate(layer)) consider(branchableInk(layer.shape), layer.shape, layer);
  }
  for (const guide of guides) {
    if (!guideIsHidden(guide)) consider([guide], guide);
  }
  return best;
}

function splitBranchParent(branch) {
  const scene = { layers, guides };
  if (!branch) return scene;
  const { source, pieces, layerId } = branch;
  if (layerId === undefined) {
    const index = guides.indexOf(source);
    if (index >= 0) {
      replaceGuideRow(source, pieces[0]);
      scene.guides = [...guides.slice(0, index), ...pieces, ...guides.slice(index + 1)];
    }
    return scene;
  }
  const parent = layers.find((layer) => layer.id === layerId && layer.shape === source);
  if (!parent) return scene;
  const ink = baseInk(source);
  const chainId = parent.inkChain ?? parent.id;
  const parts = pieces.map((piece, index) => ({
    ...parent, id: index === 0 ? parent.id : nextId++, inkChain: chainId,
    shape: Array.isArray(piece)
      ? { kind: "ink", points: piece, curve: false, width: ink.width }
      : { kind: "ink", points: [piece.start, piece.middle, piece.end], curve: true, width: ink.width,
        ...(piece.controls ? { controls: piece.controls } : {}) },
  }));
  scene.layers = layers.flatMap((layer) => layer === parent ? parts
    : layer.inkBoundary?.includes(parent.id)
      ? [{ ...layer, inkBoundary: [...layer.inkBoundary, ...parts.slice(1).map(({ id }) => id)].sort((a, b) => a - b) }]
      : [layer]);
  scene.groupId = parent.groupId;
  return scene;
}

function snappedDrawingStart(raw, anchor) {
  if (anchor) return anchor;
  const lines = guides.filter((guide) => !guideIsHidden(guide));
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

function previewStraightStroke() {
  return isStraightTool(gesture?.type) ? gesture : pendingStraight;
}

function startLineStroke(event, start, inkEndpoint) {
  const raw = pointOnCanvas(start);
  const controlKey = event.ctrlKey || event.metaKey;
  const references = sceneStraightLines();
  const snapTargets = references.flat();
  const anchor = inkEndpoint?.point ?? clickedGuideEndpoint(event);
  const branch = anchor ? null : closestBranch(raw);
  const snappedStart = branch?.point ?? snappedDrawingStart(raw, anchor);
  const point = controlKey ? raw : snappedStart;
  gesture = {
    type: tool, id: event.pointerId, start: point, end: point, snapTargets, references,
    pointerStart: raw, snappedStart, shiftKey: event.shiftKey, controlKey, branch,
  };
  branchHover = null;
  branchCursor = null;
  if (tool === "ink") {
    gesture.width = inkWidth;
    gesture.anchorLayerId = inkEndpoint?.layer.id;
  }
  drawing.setPointerCapture(event.pointerId);
  renderDrawing();
}

function updatePendingStraight(event, point) {
  pendingStraight.end = pointOnCanvas(point);
  pendingStraight.targetAnchor = clickedInkEndpoint(event)?.point ?? clickedGuideEndpoint(event);
  pendingStraight.shiftKey = event.shiftKey;
  pendingStraight.controlKey = event.ctrlKey || event.metaKey;
}

function finishStraightStroke(stroke) {
  const points = lineStrokePoints(stroke, stroke.type === "guide");
  if (points.length !== 2) return false;
  pendingStraight = null;
  const branch = stroke.start === stroke.branch?.point ? stroke.branch : null;
  if (stroke.type === "ink") commitInk({ kind: "ink", points, width: stroke.width, curve: false }, branch);
  else {
    const scene = splitBranchParent(branch);
    activeGuide = points;
    commit(scene.layers, selection, [...scene.guides, points]);
  }
  return true;
}

function clearLinePlacement() {
  pendingStraight = null;
  branchHover = null;
  branchCursor = null;
  clearCurvePlacement();
}

function cancelLinePlacement() {
  const drawingLine = isStraightTool(gesture?.type) || gesture?.type === "curve-anchor";
  if (!drawingLine && !pendingStraight && !curvePoints.length) return false;
  clearLinePlacement();
  if (drawingLine) cancelGesture();
  else renderDrawing();
  renderControls();
  return true;
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
  curveBranch = null;
}

function finishCurve(curve) {
  const { start, middle, end, controls } = curve;
  const branch = curveBranch;
  clearCurvePlacement();
  if (![middle, end, ...(controls ?? [])].some((point) => Math.hypot(point.x - start.x, point.y - start.y) >= 2)) return false;
  if (tool === "ink-curve") {
    commitInk({ kind: "ink", points: [start, middle, end], ...(controls ? { controls } : {}), width: inkWidth, curve: true }, branch);
  } else {
    const scene = splitBranchParent(branch);
    activeGuide = { kind: "curve", ...curve };
    commit(scene.layers, selection, [...scene.guides, activeGuide]);
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
  const disableSnap = event.ctrlKey || event.metaKey;
  if (!ending) curveBranch = disableSnap || anchor ? null : closestBranch(raw);
  const position = disableSnap ? raw : (!ending && curveBranch?.point) || snappedDrawingStart(raw, anchor);
  if (!ending) curvePoints = [position];
  branchHover = null;
  branchCursor = null;
  curveCursor = position;
  gesture = {
    type: "curve-anchor", id: event.pointerId, start: raw, position, ending, control: position,
    pointer: raw, startClientX: event.clientX, startClientY: event.clientY, dragged: false,
  };
  drawing.setPointerCapture(event.pointerId);
  renderDrawing();
  renderControls();
}

function resizeSelectedLayer() {
  if (!selection.size || layerDrag.active || textPointEdit) return;
  const layer = primaryGeometryLayer();
  if (layer?.id !== resizeId) showResizeHandles(layer);
}

function showResizeHandles(layer) {
  if (!layer) return;
  const { w, h } = shapeFrame(geometryTarget(layer).shape).box;
  if (!w || !h) return;
  if (resizeId !== layer.id) {
    selectForEdit();
    resizeId = layer.id;
  }
  renderDrawing();
  renderControls();
}

function trackResizeTap(event, layer) {
  if (!layer || (event.shiftKey && event.button === 0)) return;
  gesture.resizeTap = {
    layerId: layer.id, right: event.button === 2,
    x: event.clientX, y: event.clientY, dragged: false,
  };
}

function finishResizeTap({ resizeTap: tap }) {
  if (!tap || tap.dragged) return false;
  const layer = layers.find((item) => item.id === tap.layerId && !item.hidden);
  if (!layer) return false;
  const { targets } = geometryTarget(layer);
  if (!selection.has(layer.id) || (!tap.right && [...selection].some((id) => !targets.has(id)))) {
    selectLayer(layer.id, false, true);
  }
  showResizeHandles(layer);
  return true;
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
  const ink = baseInk(shape);
  const fixedWidth = ink && box.w - ink.width <= guideEpsilon;
  const fixedHeight = ink && box.h - ink.width <= guideEpsilon;
  const inkMinimum = ink ? ink.width + .001 : 0;
  const minWidth = Math.min(Math.max(inkMinimum, 3 / Math.hypot(matrix[0], matrix[1])), box.w);
  const minHeight = Math.min(Math.max(inkMinimum, 3 / Math.hypot(matrix[2], matrix[3])), box.h);
  const deltaX = end.x - start.x;
  const deltaY = end.y - start.y;
  let w = box.w + dx * deltaX;
  let h = box.h + dy * deltaY;
  if (skew) {
    const x = dx ? dx * (Math.max(minWidth, w) - box.w) : deltaX;
    const y = dy ? dy * (Math.max(minHeight, h) - box.h) : deltaY;
    const skewed = skewMatrix(box, dx, dy, x, y);
    gesture.preview = Math.hypot(x, y) < .001 ? null : ink
      ? replaceInk(shape, transformInkGeometry(ink, skewed))
      : {
        kind: "affine", base: shape.kind === "affine" ? shape.base : shape,
        matrix: multiplyMatrices(matrix, skewed),
      };
    return;
  }
  if (proportional || aspectRatioLocked) {
    const projectedScale = dx === 0 ? h / box.h : dy === 0 ? w / box.w
      : (w * box.w + h * box.h) / (box.w ** 2 + box.h ** 2);
    const scale = Math.max(fixedWidth ? 0 : minWidth / box.w, fixedHeight ? 0 : minHeight / box.h, projectedScale);
    w = scale * box.w;
    h = scale * box.h;
  } else {
    w = Math.max(minWidth, w);
    h = Math.max(minHeight, h);
  }
  if (fixedWidth) w = box.w;
  if (fixedHeight) h = box.h;
  if (Math.abs(w - box.w) < .001 && Math.abs(h - box.h) < .001) {
    gesture.preview = null;
    return;
  }
  const after = {
    x: box.x + (box.w - w) * (1 - dx) / 2,
    y: box.y + (box.h - h) * (1 - dy) / 2,
    w, h,
  };
  if (ink) {
    const updated = resizeInkInBox(ink, box, after);
    gesture.preview = updated === ink ? null : replaceInk(shape, updated);
  } else {
    gesture.preview = shape.kind === "affine"
      ? { ...shape, matrix: multiplyMatrices(matrix, scalingMatrix(box, after)) }
      : scaleShape(shape, box, after);
  }
}

function groupResizeMatrix({ group, preview, frame }) {
  if (!group || !preview) return null;
  return preview.kind === "affine" ? preview.matrix : scalingMatrix(frame.box, preview);
}

function startMarquee(event, start, type = "marquee") {
  gesture = {
    type, id: event.pointerId, start, end: start, dragged: false, additive: event.shiftKey,
    startClientX: event.clientX, startClientY: event.clientY,
  };
  drawing.setPointerCapture(event.pointerId);
}

drawing.addEventListener("pointerdown", (event) => {
  const rightButton = event.button === 2;
  if (rightButton && cancelLinePlacement()) {
    event.preventDefault();
    return;
  }
  if (gesture || (event.button !== 0 && !rightButton)) return;
  if (rightButton && branchHover) {
    branchHover = null;
    branchCursor = null;
    renderDrawing();
  }
  const start = pointAt(event.clientX, event.clientY);
  if (textPointEdit) {
    const handle = event.target.closest("[data-text-point], [data-text-control]");
    const layer = editableTextPointLayer();
    if (!rightButton) {
      if (handle && layer) {
        startTextPointDrag(handle, event, start, layer);
        return;
      }
      const hit = layerAt(start);
      if ((!hit || hit === layer) && layer && textPointFrame(layer.shape, layer.color)) {
        startMarquee(event, start, "text-point-marquee");
        return;
      }
      if (hit && hit !== layer) selectLayer(hit.id, false, true);
      return;
    }
  }
  const inkEndpoint = clickedInkEndpoint(event);
  if (!rightButton && isInkTool() && event.altKey) {
    event.preventDefault();
    queueInkPaint(start, inkBarrierLayers());
    return;
  }
  if (!rightButton && pendingStraight) {
    updatePendingStraight(event, start);
    if (!finishStraightStroke(pendingStraight)) renderDrawing();
    return;
  }
  if (!rightButton && curvePoints.length && isCurveTool(tool)) {
    placeCurveAnchor(event, start, inkEndpoint?.point ?? clickedGuideEndpoint(event));
    return;
  }
  const bezierHandle = event.target.closest("[data-bezier-control]");
  if (bezierHandle) {
    beginBezierControl(bezierHandle, event, start);
    return;
  }
  if (event.target.closest("[data-ink-midpoint]")) {
    const layer = layers.find((item) => item.id === primarySelectionId() && !item.hidden);
    if (!layer?.groupId && baseInk(layer?.shape)?.curve) startInkBend(layer, start, event);
    return;
  }
  const guideMidpointHandle = event.target.closest("[data-curve-index]");
  if (guideMidpointHandle) {
    startGuideBend(Number(guideMidpointHandle.dataset.curveIndex), start, event);
    return;
  }
  const selectedHit = rightButton && selection.size > 1
    ? inkEndpoint?.layer ?? layerAt(start) : null;
  if (rightButton) {
    const guideHandle = event.target.closest("[data-guide-end]");
    const index = inkEndpoint || (!guideHandle && selection.has(selectedHit?.id)) ? -1
      : guideHandle ? Number(guideHandle.dataset.guideIndex) : guideNear(start, guides, guideSnapDistance());
    if (index >= 0) {
      selectGuideOnCanvas(guides[index]);
      const ends = lineEnds(activeGuide);
      const strokes = editableGuideStrokes();
      const endpoints = [guideEndpoint(activeGuide, "start"), guideEndpoint(activeGuide, "end")];
      const endIndex = guideHandle ? Number(guideHandle.dataset.guideEnd === "end") : lineEndAt(endpoints, start);
      if (endIndex >= 0) {
        const point = endpoints[endIndex];
        if (beginMixedJoint(event, start, point)) return;
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
    placeCurveAnchor(event, start, clickedGuideEndpoint(event));
    return;
  }
  if (rightButton || tool === "select") {
    const hit = inkEndpoint?.layer ?? selectedHit ?? layerAt(start);
    if (!rightButton && !hit) {
      startMarquee(event, start);
      return;
    }
    const fullySelected = hit?.groupId
      ? [...geometryTarget(hit).targets].every((id) => selection.has(id)) : selection.has(hit?.id);
    const moveSelection = rightButton && selection.size > 1 && fullySelected;
    const additiveClick = !rightButton && event.shiftKey;
    if (rightButton && hit && !fullySelected) {
      selectLayer(hit.id, false, true);
    } else if (!rightButton && !additiveClick && !fullySelected) {
      selectLayer(hit.id, false, true);
    }
    if (!hit) return;
    const endpoints = rightButton && !moveSelection && !hit.groupId ? inkEndpoints(hit.shape) : null;
    const endIndex = endpoints ? inkEndpoint?.index ?? lineEndAt(endpoints, start) : -1;
    if (endIndex >= 0) {
      const point = endpoints[endIndex];
      if (beginMixedJoint(event, start, point, hit)) return;
      const inkMembers = jointMembers(point, editableInkStrokes());
      if (inkMembers) {
        beginJointMove(event, start, point, { inkMembers, layer: hit });
        return;
      }
      if (baseInk(hit.shape)?.curve) {
        beginJointMove(event, start, point, { inkMembers: new Map([[hit.id, [endIndex]]]), layer: hit });
        return;
      }
    }
    const linkedLayer = hit.groupId || hit.inkBoundary || baseInk(hit.shape)?.points.length > 1;
    const connection = rightButton && (linkedLayer || moveSelection)
      ? movementConnections(moveSelection ? selection : [hit.id]) : null;
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
      centerLayout: centerMoveReferences(targets),
    };
    trackResizeTap(event, hit);
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
    trackResizeTap(event, layerAt(start));
  }
  drawing.setPointerCapture(event.pointerId);
  if (gesture.resizeTap && !rightButton) renderDrawing();
});

viewport.addEventListener("contextmenu", (event) => event.preventDefault(), true);
viewport.addEventListener("mousedown", (event) => {
  if (event.button === 2 && cancelLinePlacement()) event.preventDefault();
}, true);

function updateGesture(event) {
  const end = pointAt(event.clientX, event.clientY);
  const tap = gesture.resizeTap;
  if (tap) tap.dragged ||= Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > 3;
  if (gesture.type === "text-point") {
    gesture.pointer = end;
    gesture.shiftKey = event.shiftKey;
    gesture.disableSnap = event.ctrlKey || event.metaKey;
  } else if (gesture.type === "draw" || gesture.type === "marquee" || gesture.type === "text-point-marquee") {
    gesture.end = gesture.type === "draw" ? end : pointOnCanvas(end);
    if (gesture.type === "text-point-marquee") gesture.additive = event.shiftKey;
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
  } else if (gesture.type === "curve-anchor" || gesture.type === "curve-control") {
    if (gesture.type === "curve-anchor") {
      gesture.dragged ||= Math.hypot(event.clientX - gesture.startClientX, event.clientY - gesture.startClientY) > 3;
    }
    gesture.pointer = end;
    gesture.disableSnap = event.ctrlKey || event.metaKey;
    updateBezierDirection(gesture, event.shiftKey);
  } else if (gesture.type === "ink-bend" || gesture.type === "guide-bend") {
    gesture.pointer = end;
    gesture.disableSnap = event.ctrlKey || event.metaKey;
    updateMidpoint(gesture);
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
  if (!gesture && (pendingStraight || curvePoints.length)) {
    const point = pointAt(event.clientX, event.clientY);
    if (pendingStraight) updatePendingStraight(event, point);
    else curveCursor = pointOnCanvas(point);
    if (!drawingFrame) drawingFrame = requestAnimationFrame(renderDrawing);
    return;
  }
  if (!gesture && (isStraightTool(tool) || isCurveTool(tool))) {
    branchCursor = event.target.closest("[data-bezier-control], [data-ink-end], [data-guide-end], [data-curve-index], [data-ink-midpoint]")
      ? null : pointAt(event.clientX, event.clientY);
    const previous = branchHover;
    branchHover = branchCursor && !event.ctrlKey && !event.metaKey ? closestBranch(branchCursor) : null;
    if ((previous || branchHover) && !drawingFrame) drawingFrame = requestAnimationFrame(renderDrawing);
    return;
  }
  if (gesture?.id !== event.pointerId) return;
  updateGesture(event);
  if (!drawingFrame) drawingFrame = requestAnimationFrame(renderDrawing);
});

drawing.addEventListener("pointerleave", () => {
  branchCursor = null;
  if (!branchHover) return;
  branchHover = null;
  renderDrawing();
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
  if (finished.type === "text-point") {
    const shape = movedTextOutline(finished);
    if (shape !== finished.shape) {
      commit(layers.map((layer) => layer.id === finished.layerId ? { ...layer, shape, inkChain: undefined } : layer));
    } else {
      renderDrawing();
    }
    return;
  }
  if (finished.type === "text-point-marquee") {
    finishTextPointMarquee(finished);
    return;
  }
  if (finishResizeTap(finished)) return;
  if (finished.type === "marquee") {
    finishMarquee(finished, event.shiftKey);
    return;
  }
  if (finished.type === "joint-move" && Math.hypot(finished.dx, finished.dy) > 1) {
    const point = movedJointPoint(finished);
    const nextGuides = finished.guideMembers ? guides.map((guide, index) => {
      const ends = finished.guideMembers.get(index);
      return ends ? replaceGuideRow(guide, guideAtJoint(guide, ends, point)) : guide;
    }) : guides;
    const nextLayers = finished.inkMembers ? layers.map((layer) => {
      const ends = finished.inkMembers.get(layer.id);
      return ends ? { ...layer, shape: inkAtJoint(layer.shape, ends, point) } : layer;
    }) : layers;
    if (activeGuide) activeGuide = nextGuides[guides.indexOf(activeGuide)];
    commit(nextLayers, selection, nextGuides);
    return;
  }
  if (finished.type === "line-resize") {
    const { point, original, guideIndex, layerId } = finished;
    if (point.x === original.x && point.y === original.y) {
      renderDrawing();
      renderControls();
    } else if (guideIndex !== undefined) {
      const resized = replaceGuideRow(guides[guideIndex], resizedLineEnds(finished));
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
        activeGuide = replaceGuideRow(guides[guideIndex], guide);
        commit(layers, selection, guides.map((item, index) => index === guideIndex ? guide : item));
        return;
      }
    }
    renderDrawing();
    renderControls();
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
  if (isStraightTool(finished.type)) {
    const { pointerStart, end, anchorLayerId } = finished;
    if (Math.hypot(end.x - pointerStart.x, end.y - pointerStart.y) < 2) {
      pendingStraight = { ...finished, end: finished.start };
      if (anchorLayerId !== undefined && !finished.controlKey) selectLayer(anchorLayerId, false);
      else {
        renderDrawing();
        renderControls();
      }
      return;
    }
    if (!finishStraightStroke(finished)) renderDrawing();
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
  if (finished.type === "guide-bend") {
    const { middle, end, index } = finished;
    if (Math.hypot(middle.x - end.x, middle.y - end.y) > guideEpsilon) {
      activeGuide = replaceGuideRow(guides[index], { ...guides[index], middle: end });
      commit(layers, selection, guides.map((guide, i) => i === index ? activeGuide : guide));
    } else {
      renderDrawing();
    }
    return;
  }
  if (finished.type === "guide-move") {
    const { index, indices, dx, dy } = finished;
    if (Math.hypot(dx, dy) > 1) {
      const moved = guides.map((guide, i) => indices.has(i) ? replaceGuideRow(guide, moveGuide(guide, dx, dy)) : guide);
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
  const updateControls = gesture.type === "move" || isSnapMove(gesture) || gesture.type === "line-resize" ||
    gesture.type === "curve-anchor" || gesture.type === "curve-control";
  gesture = null;
  delete drawing.dataset.moving;
  delete drawing.dataset.resizing;
  delete drawing.dataset.rotating;
  if (drawing.hasPointerCapture(id)) drawing.releasePointerCapture(id);
  renderDrawing();
  if (updateControls) renderControls();
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
  if (selection.size) removeLayers(selection);
  else if (activeGuide) removeGuide(activeGuide);
}

function selectGuideOnCanvas(guide) {
  if (activeGuide === guide) return;
  activeGuide = guide;
  renderLayers();
}

function removeGuide(guide) {
  commit(layers, selection, guides.filter((item) => item !== guide));
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
    const chains = new Map();
    const pasted = copiedObjects.layers.map((layer) => {
      if (layer.groupId && !groups.has(layer.groupId)) groups.set(layer.groupId, nextId++);
      if (layer.inkChain && !chains.has(layer.inkChain)) chains.set(layer.inkChain, nextId++);
      const inkBoundary = layer.inkBoundary?.every((id) => idMap.has(id))
        ? layer.inkBoundary.map((id) => idMap.get(id)).sort((a, b) => a - b) : undefined;
      return {
        ...layer, id: idMap.get(layer.id), groupId: groups.get(layer.groupId), inkBoundary,
        inkChain: chains.get(layer.inkChain),
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
  if (!selection.size) {
    const index = guides.indexOf(activeGuide);
    return index < 0 ? null : { id: guideRowId(activeGuide), index, size: guides.length };
  }
  const blocks = layerBlocks();
  const index = blocks.findIndex((block) => block.members.some((layer) => selection.has(layer.id)));
  if (index < 0) return null;
  const block = blocks[index];
  const selected = block.members.filter((layer) => selection.has(layer.id)).length;
  return selected === selection.size ? { id: block.id, index, size: blocks.length } : null;
}

function moveLayer(id, to, before) {
  if (id < 0) {
    const from = guideRowIndex(id);
    if (from < 0 || to < 0 || to >= guides.length || from === to) return;
    before ??= layerPositions(layerList);
    const ordered = [...guides];
    const [guide] = ordered.splice(from, 1);
    ordered.splice(to, 0, guide);
    commit(layers, selection, ordered);
    animateLayerOrder(layerList, before);
    byId("layer-order-status").textContent = "点線を上から " + (ordered.length - to) + " 番目に移動";
    return;
  }
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
    commit(layers.map((layer) => selection.has(layer.id) ? { ...layer, color, shape: clearXorColors(layer.shape, color) } : layer));
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
const fontImportButton = byId("font-import");
const fontFile = byId("font-file");

function renderTextFontOptions(selected = textFont.value, saved = textState?.saved) {
  const localFonts = [...importedTextFonts.values()].sort((a, b) => a.name.localeCompare(b.name));
  const fonts = [...textFonts, ...localFonts];
  // A saved outline remains editable even when its original font file is unavailable.
  if (saved && isImportedTextFontId(saved.fontId) && !importedTextFonts.has(saved.fontId)) {
    fonts.push({ id: saved.fontId, name: saved.fontName ?? "読み込んだ書体" });
  }
  textFont.replaceChildren(...fonts.map(({ id, name }) => new Option(name, id)));
  textFont.value = fonts.some(({ id }) => id === selected) ? selected : textFonts[0].id;
}

renderTextFontOptions();
loadImportedFontCatalog().then(() => renderTextFontOptions());

fontImportButton.addEventListener("click", () => fontFile.click());
fontFile.addEventListener("change", async () => {
  const file = fontFile.files[0];
  if (!file || fontImportButton.disabled) return;
  fontFile.value = "";
  const state = textState;
  fontImportButton.disabled = true;
  fontImportButton.setAttribute("aria-busy", "true");
  try {
    const { id, saved } = await importOutlineFont(file);
    const stillEditing = state && textState === state;
    renderTextFontOptions(stillEditing ? id : textFont.value);
    if (stillEditing) queueTextPreview();
    showNotice(saved ? "書体を読み込みました" : "書体を読み込みました。ブラウザに保存できませんでした。");
  } catch (error) {
    showNotice("書体の読み込みに失敗しました。 " + error.message);
  } finally {
    fontImportButton.disabled = false;
    fontImportButton.removeAttribute("aria-busy");
  }
});

function editableTextPointLayer() {
  if (tool !== "select" || selection.size !== 1) return null;
  return layers.find((layer) => layer.id === primarySelectionId() && !layer.groupId && !layer.hidden);
}

function textPointModel(base) {
  if (!textPointModels.has(base)) {
    textPointModels.set(base, textOutlinePoints(base.pathData, base.regions, base.weldPoints, base.joinedVertices));
  }
  return textPointModels.get(base);
}

function textPointFrame(shape, color) {
  const original = shape.kind === "affine" ? shape.base : shape;
  const matrix = shape.kind === "affine" ? shape.matrix : identityMatrix;
  const base = prepareVertexShape(original, color);
  if (!base) return null;
  const sx = base.w / base.sourceW;
  const sy = base.h / base.sourceH;
  const local = [sx, 0, 0, sy, number(base.x) - base.sourceX * sx, number(base.y) - base.sourceY * sy];
  return { base, matrix: multiplyMatrices(matrix, local) };
}

function worldVertexPoints(layer) {
  const affine = layer.shape.kind === "affine";
  const shape = affine ? layer.shape.base : layer.shape;
  if (["rect", "triangle", "diamond"].includes(shape.kind)) {
    const { x, y, w, h } = shape;
    const points = shape.kind === "rect" ? [[x,y], [x+w,y], [x+w,y+h], [x,y+h]] : vertices(shape);
    const matrix = affine ? layer.shape.matrix : identityMatrix;
    return points.map(([x, y]) => projectPoint(matrix, { x, y }));
  }
  const frame = textPointFrame(layer.shape, layer.color);
  const model = frame && textPointModel(frame.base);
  return model ? Array.from(model.handles.keys(), (id) => projectPoint(frame.matrix, model.points[id])) : [];
}

function snapVertexMove(edit, ends, excluded, dx, dy, direction) {
  const limit = guideSnapDistance();
  if (!edit.vertexGrid) {
    const pending = layers.filter((layer) => !layer.hidden && !excluded.has(layer.id));
    edit.vertexGrid = { cells: new Map(), size: limit, pending };
    addVertexSnapTargets(edit.vertexGrid, edit.localSnapTargets ?? []);
  }
  const { cells, size } = edit.vertexGrid;
  const area = ends.reduce((box, point) => ({
    left: Math.min(box.left, point.x + dx - limit), right: Math.max(box.right, point.x + dx + limit),
    top: Math.min(box.top, point.y + dy - limit), bottom: Math.max(box.bottom, point.y + dy + limit),
  }), { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity });
  edit.vertexGrid.pending = edit.vertexGrid.pending.filter((layer) => {
    const { x, y, w, h } = bounds(layer.shape);
    if (x > area.right || x + w < area.left || y > area.bottom || y + h < area.top) return true;
    addVertexSnapTargets(edit.vertexGrid, worldVertexPoints(layer));
    return false;
  });
  let closest = null;
  let distance = limit;
  for (const end of ends) {
    const x = end.x + dx;
    const y = end.y + dy;
    for (let col = Math.floor((x - limit) / size); col <= Math.floor((x + limit) / size); col++) {
      for (let row = Math.floor((y - limit) / size); row <= Math.floor((y + limit) / size); row++) {
        const targets = cells.get(col + "," + row);
        if (!targets) continue;
        const match = snapLineMove([end], targets, dx, dy, direction, distance);
        if (match) {
          closest = match;
          distance = Math.hypot(match.dx - dx, match.dy - dy);
        }
      }
    }
  }
  return closest;
}

function addVertexSnapTargets({ cells, size }, points) {
  for (const point of points) {
    const key = Math.floor(point.x / size) + "," + Math.floor(point.y / size);
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(point);
  }
}

function textPointsInMarquee(model, positions, marquee) {
  const selected = new Set(marquee.additive ? textPointEdit.selected : []);
  if (!marquee.dragged) return selected;
  const { left, top, right, bottom } = marqueeBounds(marquee);
  for (const id of model.handles.keys()) {
    const { x, y } = positions[id];
    if (x >= left && x <= right && y >= top && y <= bottom) selected.add(id);
  }
  return selected;
}

function finishTextPointMarquee(marquee) {
  const layer = textPointEdit && editableTextPointLayer();
  const frame = layer && textPointFrame(layer.shape, layer.color);
  if (frame) {
    const { base, matrix } = frame;
    const model = textPointModel(base);
    textPointEdit.selected = textPointsInMarquee(model, model.points.map((point) => projectPoint(matrix, point)), marquee);
  }
  renderDrawing();
}

function renderTextOutlineControls(layer) {
  const frame = layer && textPointFrame(layer.shape, layer.color);
  if (!frame) {
    if (textOutlineControls.firstChild) textOutlineControls.replaceChildren();
    return;
  }
  const { base, matrix } = frame;
  const model = textPointModel(base);
  if (!model) {
    textOutlineControls.replaceChildren();
    return;
  }
  const positions = model.points.map((point) => projectPoint(matrix, point));
  const selected = gesture?.type === "text-point-marquee" && gesture.dragged
    ? textPointsInMarquee(model, positions, gesture) : textPointEdit.selected;
  const anchor = selected.size === 1 ? selected.values().next().value : null;
  const scale = svgUnitsPerPixel();
  const radius = number(3.25 * scale);
  const activeRadius = number(4 * scale);
  const anchors = Array.from(model.handles.keys(), (id) => {
    const { x, y } = positions[id];
    const active = selected.has(id);
    return '<circle data-text-point="' + id + '"' + (active ? ' data-active-text-point=""' : '') +
      ' cx="' + number(x) + '" cy="' + number(y) + '" r="' + (active ? activeRadius : radius) +
      '" vector-effect="non-scaling-stroke"/>';
  });
  const controls = (model.handles.get(anchor) ?? []).map((id) => {
    const { x, y } = positions[id];
    const start = positions[anchor];
    return '<path d="M' + number(start.x) + ' ' + number(start.y) + 'L' + number(x) + ' ' + number(y) +
      '" vector-effect="non-scaling-stroke"/><rect data-text-control="' + id +
      '" x="' + number(x - radius) + '" y="' + number(y - radius) + '" width="' + 2 * radius +
      '" height="' + 2 * radius + '" vector-effect="non-scaling-stroke"/>';
  });
  textOutlineControls.innerHTML = controls.join("") + anchors.join("");
}

function setTextPointEdit(enabled) {
  textPointEdit = enabled ? { selected: new Set() } : null;
  resizeId = null;
  renderDrawing();
  renderControls();
}

textOutlineEditButton.addEventListener("click", () => {
  if (gesture) return;
  if (textPointEdit) {
    setTextPointEdit(null);
    return;
  }
  chooseTool("select");
  setTextPointEdit(true);
});

function startTextPointDrag(handle, event, start, layer) {
  const { base, matrix } = textPointFrame(layer.shape, layer.color);
  const model = textPointModel(base);
  const control = handle.hasAttribute("data-text-control");
  const id = Number(control ? handle.dataset.textControl : handle.dataset.textPoint);
  if (!control && !textPointEdit.selected.has(id)) textPointEdit.selected = new Set([id]);
  const moving = control ? new Set([id])
    : new Set([...textPointEdit.selected].flatMap((anchor) => [anchor, ...(model.handles.get(anchor) ?? [])]));
  gesture = {
    type: "text-point", id: event.pointerId, layerId: layer.id, shape: layer.shape, base, matrix, model,
    moving, original: projectPoint(matrix, model.points[id]),
    anchor: control ? projectPoint(matrix, model.points[textPointEdit.selected.values().next().value]) : null,
    snapEnds: control ? [] : [...textPointEdit.selected].map((anchor) => projectPoint(matrix, model.points[anchor])),
    localSnapTargets: control ? [] : Array.from(model.handles.keys())
      .filter((anchor) => !moving.has(anchor)).map((anchor) => projectPoint(matrix, model.points[anchor])),
    start, pointer: start, shiftKey: event.shiftKey, disableSnap: event.ctrlKey || event.metaKey,
  };
  drawing.setPointerCapture(event.pointerId);
  renderDrawing();
}

function movedTextOutline(edit) {
  const { base, matrix, model, original, anchor, start, pointer, moving, shape } = edit;
  edit.endpointSnap = null;
  edit.centerHint = null;
  if (Math.hypot(pointer.x - start.x, pointer.y - start.y) <= guideEpsilon) return shape;
  const origin = anchor ?? original;
  const { dx, dy, direction } = movementDirection(
    original.x - origin.x + pointer.x - start.x, original.y - origin.y + pointer.y - start.y, edit.shiftKey,
  );
  let snap;
  if (edit.snapEnds.length && !edit.disableSnap) {
    snap = snapVertexMove(edit, edit.snapEnds, new Set([edit.layerId]), dx, dy, direction);
    edit.endpointSnap = snap?.target;
    if (!snap) {
      const center = { x: origin.x + dx, y: origin.y + dy };
      const tolerance = Math.min(14, 6 * svgUnitsPerPixel());
      edit.pointReferences ??= [...edit.localSnapTargets];
      edit.pendingAxisLayers ??= layers.filter((layer) => !layer.hidden && layer.id !== edit.layerId);
      edit.pendingAxisLayers = edit.pendingAxisLayers.filter((layer) => {
        const { x, y, w, h } = bounds(layer.shape);
        const nearX = center.x >= x - tolerance && center.x <= x + w + tolerance;
        const nearY = center.y >= y - tolerance && center.y <= y + h + tolerance;
        if (!nearX && !nearY) return true;
        for (const point of worldVertexPoints(layer)) edit.pointReferences.push(point);
        return false;
      });
      const aligned = alignEditedPoint(edit, center, direction);
      snap = { dx: aligned.x - origin.x, dy: aligned.y - origin.y };
    }
  }
  const from = unprojectPoint(matrix, original);
  const to = unprojectPoint(matrix, { x: origin.x + (snap?.dx ?? dx), y: origin.y + (snap?.dy ?? dy) });
  const points = model.points.map((point, id) => moving.has(id)
    ? { x: number(point.x + to.x - from.x), y: number(point.y + to.y - from.y) } : point);
  if ([...moving].every((id) => points[id].x === model.points[id].x && points[id].y === model.points[id].y)) return shape;
  return applyVertexPositions(shape, base, model, points) ?? shape;
}

function applyVertexPositions(shape, base, model, points) {
  const paths = Array.from({ length: base.regions?.length ?? 1 }, () => "");
  for (const segment of model.segments) paths[segment.region] += outlineSegmentData(segment, points);
  const updated = updateVertexShape(shape, base, paths, [...model.jointIds].map((id) => points[id]));
  if (!updated) return null;
  textPointModels.set(updated.kind === "affine" ? updated.base : updated, { ...model, points });
  return updated;
}

function updateVertexShape(shape, base, paths, joinedVertices = base.joinedVertices) {
  const pathData = paths.join("");
  if (!pathData) return null;
  textOutlineMeasure.setAttribute("d", pathData);
  const { x, y, width: w, height: h } = textOutlineMeasure.getBBox();
  textOutlineMeasure.removeAttribute("d");
  if (!(w > 0 && h > 0)) return null;
  const sx = base.w / base.sourceW;
  const sy = base.h / base.sourceH;
  const next = {
    ...base, joinedVertices, pathData, hitPath: new Path2D(pathData), sourceX: x, sourceY: y, sourceW: w, sourceH: h,
    x: number(base.x) + (x - base.sourceX) * sx, y: number(base.y) + (y - base.sourceY) * sy, w: w * sx, h: h * sy,
    ...(base.regions ? {
      regions: base.regions.map((region, index) => ({ ...region, pathData: paths[index] })).filter((region) => region.pathData),
    } : {}),
  };
  return shape.kind === "affine" ? { ...shape, base: next } : next;
}

function deleteSelectedVertices() {
  if (!textPointEdit.selected.size) return;
  const layer = editableTextPointLayer();
  const frame = layer && textPointFrame(layer.shape, layer.color);
  const model = frame && textPointModel(frame.base);
  if (!model) return;
  const { base } = frame;
  const paths = outlinePathsWithoutVertices(model, textPointEdit.selected, base.regions?.length ?? 1);
  const joins = [...model.jointIds].filter((id) => !textPointEdit.selected.has(id)).map((id) => model.points[id]);
  const shape = updateVertexShape(layer.shape, base, paths, joins);
  textPointEdit.selected.clear();
  if (shape) {
    commit(layers.map((item) => item === layer ? { ...layer, shape, inkChain: undefined } : item));
  } else {
    removeLayers(new Set([layer.id]));
  }
}

vertexActions.addEventListener("click", (event) => {
  const action = event.target.closest("[data-vertex-action]")?.dataset.vertexAction;
  const selected = textPointEdit?.selected;
  if (!action || gesture || !selected || selected.size < 2) return;
  const layer = editableTextPointLayer();
  const frame = layer && textPointFrame(layer.shape, layer.color);
  const model = frame && textPointModel(frame.base);
  if (!model) return;
  const { base, matrix } = frame;
  const merge = action === "merge";
  const anchors = [...selected].map((id) => ({ id, ...projectPoint(matrix, model.points[id]) }));
  const center = {
    x: anchors.reduce((sum, point) => sum + point.x, 0) / anchors.length,
    y: anchors.reduce((sum, point) => sum + point.y, 0) / anchors.length,
  };
  const points = model.points.slice();
  const shifts = new Map();
  for (const anchor of anchors) {
    const x = merge || action === "x" ? center.x : anchor.x;
    const y = merge || action === "y" ? center.y : anchor.y;
    const local = unprojectPoint(matrix, { x, y });
    points[anchor.id] = { x: number(local.x), y: number(local.y) };
    const before = model.points[anchor.id];
    for (const handle of model.handles.get(anchor.id)) {
      const shift = shifts.get(handle) ?? { x: 0, y: 0, count: 0 };
      shift.x += local.x - before.x;
      shift.y += local.y - before.y;
      shift.count++;
      shifts.set(handle, shift);
    }
  }
  for (const [id, shift] of shifts) {
    const point = model.points[id];
    points[id] = { x: number(point.x + shift.x / shift.count), y: number(point.y + shift.y / shift.count) };
  }
  if (points.every((point, id) => point.x === model.points[id].x && point.y === model.points[id].y) && !merge) return;
  let shape;
  if (merge) {
    const survivor = anchors[0].id;
    const paths = mergedVertexPaths(model, points, selected, survivor, base.regions?.length ?? 1);
    const joins = [...model.jointIds].filter((id) => !selected.has(id)).map((id) => points[id]);
    shape = updateVertexShape(layer.shape, base, paths, [...joins, points[survivor]]);
  } else {
    shape = applyVertexPositions(layer.shape, base, model, points);
  }
  if (!shape) {
    showNotice("輪郭を作れる頂点が残らないため変更できません");
    return;
  }
  if (merge) selected.clear();
  commit(layers.map((item) => item === layer ? { ...item, shape, inkChain: undefined } : item));
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
  const savedPath = saved ? shapeFrame(selected.shape).box.pathData : null;
  if (!textState || textState.layerId !== layerId || textState.saved !== saved) {
    textState = { layerId, saved, savedPath, pending: false, preview: null };
    textValue.value = saved?.value ?? "";
    renderTextFontOptions(saved?.fontId ?? textFonts[0].id, saved);
    byId("text-heading").setAttribute("aria-label", adding ? "文字を追加" : "文字を編集");
    textSubmit.setAttribute("aria-label", adding ? "文字を追加" : "文字を更新");
    queueTextPreview();
  } else if (textState.savedPath !== savedPath) {
    textState.savedPath = savedPath;
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

function showTextOutlinePreview(state, value, fontId, outline) {
  state.preview = { value, fontId, outline };
  const scale = Math.min(194 / outline.sourceW, 42 / outline.sourceH);
  const w = outline.sourceW * scale;
  const h = outline.sourceH * scale;
  textPreview.innerHTML = primitive({ ...outline, x: (210 - w) / 2, y: (58 - h) / 2, w, h });
}

function queueTextPreview() {
  clearTimeout(textPreviewTimer);
  const state = textState;
  if (!state) return;
  const value = currentText();
  const sample = value || "Illustvector";
  const fontId = textFont.value;
  state.preview = null;
  textPreview.replaceChildren();
  showTextMessage("");
  updateTextSubmit();
  const savedShape = state.saved?.value === value && state.saved.fontId === fontId
    ? layers.find((layer) => layer.id === state.layerId)?.shape : null;
  if (savedShape) {
    showTextOutlinePreview(state, value, fontId, shapeFrame(savedShape).box);
    return;
  }
  textPreviewTimer = setTimeout(async () => {
    const stillCurrent = () => textState === state && currentText() === value && textFont.value === fontId;
    try {
      const outline = await createTextOutline(sample, fontId);
      if (stillCurrent()) showTextOutlinePreview(state, value, fontId, outline);
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

    const fontName = importedTextFonts.get(fontId)?.name;
    const text = { value, fontId, ...(fontName ? { fontName } : {}) };
    if (state.layerId !== null) {
      const layer = layers.find((item) => item.id === state.layerId);
      const current = layer.shape;
      const previous = current.kind === "affine" ? current.base : current;
      const w = outline.sourceW * previous.w / previous.sourceW;
      const h = outline.sourceH * previous.h / previous.sourceH;
      const base = { ...outline, x: previous.x, y: previous.y, w, h };
      const shape = current.kind === "affine" ? { ...current, base } : base;
      textPointEdit?.selected.clear();
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

byId("size-link").addEventListener("click", () => {
  aspectRatioLocked = !aspectRatioLocked;
  renderControls();
});

for (const [id, axis] of [["size-width", "w"], ["size-height", "h"]]) {
  const input = byId(id);
  input.addEventListener("change", () => applySize(axis, input));
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    input.blur();
  });
}

byId("palette").innerHTML = colors.map((color) =>
  '<button class="swatch" data-color="' + color + '" style="--swatch:' + color +
  '" aria-label="塗り ' + color.toUpperCase() + '"></button>',
).join("");

document.querySelectorAll("[data-tool]").forEach((button) => button.addEventListener("click", () => chooseTool(button.dataset.tool)));
document.querySelectorAll("[data-operation]").forEach((button) => button.addEventListener("click", () => combine(button.dataset.operation)));
layerList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const { layer, layerGroup, expandGroup, visibility, visibilityGroup, delete: deleteLayer, deleteGroup,
    guideLayer, visibilityGuide, deleteGuide } = button.dataset;
  if (guideLayer || visibilityGuide || deleteGuide) {
    const guide = guides[guideRowIndex(Number(guideLayer ?? visibilityGuide ?? deleteGuide))];
    if (!guide) return;
    if (deleteGuide) {
      removeGuide(guide);
    } else if (visibilityGuide) {
      const changed = replaceGuideRow(guide, guideIsHidden(guide) ? guideGeometry(guide) : { kind: "hidden-guide", base: guide });
      if (activeGuide === guide) activeGuide = changed;
      commit(layers, selection, guides.map((item) => item === guide ? changed : item));
    } else {
      cancelGesture();
      clearLinePlacement();
      resizeId = null;
      selection = new Set();
      activeGuide = guide;
      render();
    }
  } else if (expandGroup) {
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
  const frame = viewport.getBoundingClientRect();
  const usableWidth = frame.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
  const usableHeight = frame.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
  const fit = Math.max(.05, Math.min(1, usableWidth / width, usableHeight / height));
  artboard.style.width = width * fit * zoom + "px";
  artboard.style.height = height * fit * zoom + "px";
  const percentage = Math.round(zoom * 100) + "%";
  const reset = byId("zoom-reset");
  reset.textContent = percentage;
  reset.setAttribute("aria-label", "表示倍率 " + percentage + " · リセット");
  byId("zoom-out").disabled = zoom <= .25;
  byId("zoom-in").disabled = zoom >= 3;
  if (selection.size || activeGuide || tool === "curve" || tool === "guide" || isInkTool()) renderDrawing();
}

function setZoom(value) {
  const next = Math.max(.25, Math.min(3, Math.round(value * 100) / 100));
  if (next === zoom) return;
  const frame = viewport.getBoundingClientRect();
  const before = artboard.getBoundingClientRect();
  const x = unitInterval((frame.left + viewport.clientWidth / 2 - before.left) / before.width);
  const y = unitInterval((frame.top + viewport.clientHeight / 2 - before.top) / before.height);
  zoom = next;
  renderZoom();
  const after = artboard.getBoundingClientRect();
  viewport.scrollBy(after.left + x * after.width - frame.left - viewport.clientWidth / 2,
    after.top + y * after.height - frame.top - viewport.clientHeight / 2);
}

new ResizeObserver(renderZoom).observe(viewport);
byId("zoom-out").addEventListener("click", () => setZoom(zoom - .25));
byId("zoom-in").addEventListener("click", () => setZoom(zoom + .25));
byId("zoom-reset").addEventListener("click", () => setZoom(1));
byId("new-canvas").addEventListener("click", () => {
  cancelGesture();
  activeGuide = null;
  clearLinePlacement();
  commit([], [], []);
});
byId("delete").addEventListener("click", removeSelection);
byId("undo").addEventListener("click", () => restore(undoStack, redoStack));
byId("redo").addEventListener("click", () => restore(redoStack, undoStack));
function artworkSvg(box = { x: 0, y: 0, w: width, h: height }) {
  const content = renderVector(layers.filter((layer) => !layer.hidden), "illustvector");
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + box.w + '" height="' + box.h +
    '" viewBox="' + [box.x, box.y, box.w, box.h].join(" ") + '">' + content + '</svg>';
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
  link.download = "illustvector." + format.toLowerCase();
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showNotice(format + " を書き出しました");
}

function artworkSvgBlob() {
  return new Blob([artworkSvg()], { type: "image/svg+xml;charset=utf-8" });
}

byId("export").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  const source = artworkSvg();
  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let left = canvas.width, top = canvas.height, right = -1, bottom = -1;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        if (!pixels[(y * canvas.width + x) * 4 + 3]) continue;
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
    const box = right < 0 ? null : { x: left / scale, y: top / scale,
      w: (right - left + 1) / scale, h: (bottom - top + 1) / scale };
    const svg = box ? source.replace(/width="760" height="530" viewBox="0 0 760 530"/,
      'width="' + box.w + '" height="' + box.h + '" viewBox="' +
      [box.x, box.y, box.w, box.h].join(" ") + '"') : source;
    downloadImage(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), "SVG");
  } catch {
    showNotice("SVG を書き出せませんでした");
  } finally {
    URL.revokeObjectURL(url);
    button.disabled = false;
  }
});
byId("export-png").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const scale = Number(byId("png-resolution").value);
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  const source = artworkSvg().replace('width="760" height="530"',
    'width="' + width * scale + '" height="' + height * scale + '"');
  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
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
  if (pendingStraight) {
    pendingStraight.shiftKey = equal;
  } else if (gesture?.type === "text-point") {
    gesture.shiftKey = equal;
  } else if (gesture?.type === "draw") {
    if (gesture.dragged) gesture.shape = drawnShape(gesture.start, gesture.end, equal);
  } else if (gesture?.type === "resize") {
    gesture.proportional = equal;
  } else if (gesture?.type === "rotate") {
    gesture.snap = equal;
  } else if (gesture?.type === "curve-anchor" || gesture?.type === "curve-control") {
    updateBezierDirection(gesture, equal);
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
  if (pendingStraight) {
    pendingStraight.controlKey = event.ctrlKey || event.metaKey;
  } else if (gesture?.type === "text-point") {
    gesture.disableSnap = event.ctrlKey || event.metaKey;
  } else if (isStraightTool(gesture?.type)) {
    updateStrokeStart(gesture, event.ctrlKey || event.metaKey);
  } else if (gesture?.type === "line-resize") {
    gesture.disableSnap = event.ctrlKey || event.metaKey;
    updateLineResize();
  } else if (gesture?.type === "curve-control") {
    gesture.disableSnap = event.ctrlKey || event.metaKey;
    updateBezierDirection(gesture, gesture.shiftKey);
  } else if (gesture?.type === "ink-bend" || gesture?.type === "guide-bend") {
    gesture.disableSnap = event.ctrlKey || event.metaKey;
    updateMidpoint(gesture);
  } else if (gesture?.type === "move" || isSnapMove(gesture)) {
    gesture.disableSnap = event.ctrlKey || event.metaKey;
    updateSnapMove();
  } else if (!gesture && branchCursor && !curvePoints.length) {
    branchHover = event.ctrlKey || event.metaKey ? null : closestBranch(branchCursor);
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
    if (cancelLinePlacement()) return;
    if (gesture) cancelGesture();
    else if (textPointEdit) setTextPointEdit(null);
    else if (resizeId !== null) {
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
  if (pendingStraight && event.key === "Shift") {
    updateShift(true);
    return;
  }
  if (event.key === "Control" || event.key === "Meta") {
    if (pendingStraight || branchCursor) updateStrokeControl(event);
    else if (!event.repeat && !isStraightTool(tool) && !isCurveTool(tool)) resizeSelectedLayer();
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
    if (textPointEdit) deleteSelectedVertices();
    else removeSelection();
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
  for (const layer of draft.layers) nextId = Math.max(nextId, layer.id + 1, (layer.groupId ?? 0) + 1, (layer.inkChain ?? 0) + 1);
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
