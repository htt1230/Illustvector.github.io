"use strict";

const draftStorage = (() => {
  const key = "forma.draft.v1";
  const version = 1;
  const shapes = new Set(["rect", "ellipse", "triangle", "diamond", "path"]);
  const operations = new Set(["union", "subtract", "intersect", "xor"]);
  const strokeJoins = new Set(["round", "miter"]);
  const isColor = (value) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
  const isNumber = (value) => Number.isFinite(value) && Math.abs(value) <= 1e9;
  const isPoint = (point) => point && isNumber(point.x) && isNumber(point.y);
  const validControls = (points) => points === undefined ||
    (Array.isArray(points) && points.length === 2 && points.every(isPoint));

  function requireValid(valid) {
    if (!valid) throw new Error("Invalid Forma draft");
  }

  function restoreShape(shape) {
    requireValid(shape && typeof shape === "object");
    if (shape.kind === "ink") {
      const { points, width, curve, controls } = shape;
      requireValid(Array.isArray(points) && points.every(isPoint) && (curve ? points.length === 3 : points.length >= 1));
      requireValid(typeof curve === "boolean" && isNumber(width) && width >= .5 && width <= 64);
      requireValid(curve ? validControls(controls) : controls === undefined);
      return { kind: shape.kind, points, width, curve, ...(controls ? { controls } : {}) };
    }
    if (shape.kind === "affine") {
      const { matrix } = shape;
      requireValid(Array.isArray(matrix) && matrix.length === 6 && matrix.every(isNumber));
      requireValid(matrix[0] * matrix[3] - matrix[1] * matrix[2] !== 0);
      return { kind: shape.kind, matrix, base: restoreShape(shape.base) };
    }
    if (shape.kind === "outline") {
      const { width, join } = shape;
      requireValid(isNumber(width) && width >= .5 && width <= 64 && strokeJoins.has(join));
      return { kind: shape.kind, width, join, base: restoreShape(shape.base) };
    }
    if (operations.has(shape.kind)) {
      requireValid(Array.isArray(shape.parts) && shape.parts.length >= 2);
      const parts = shape.parts.map(restoreShape);
      const restored = { kind: shape.kind, parts };
      if ((shape.kind === "xor" || shape.kind === "union") && shape.sourceColors !== undefined) {
        const { sourceColors } = shape;
        requireValid(Array.isArray(sourceColors) && sourceColors.length === parts.length && sourceColors.every(isColor));
        restored.sourceColors = sourceColors;
      }
      if (shape.kind === "xor" && shape.paints !== undefined) {
        requireValid(Array.isArray(shape.paints) && typeof shape.paintOnly === "boolean");
        restored.paintOnly = shape.paintOnly;
        restored.paints = shape.paints.map(({ membership, color, clip }) => {
          requireValid(Array.isArray(membership) && membership.length % 2 === 1);
          requireValid(membership.every((index) => Number.isInteger(index) && index >= 0 && index < parts.length));
          requireValid(new Set(membership).size === membership.length && isColor(color));
          requireValid(typeof clip === "string" && /^[MHVZ0-9 .+-]*$/.test(clip));
          return { membership, color, clip };
        });
      }
      return restored;
    }

    const { kind, x, y, w, h } = shape;
    requireValid(shapes.has(kind) && [x, y, w, h].every(isNumber) && w > 0 && h > 0);
    if (kind !== "path") return { kind, x, y, w, h };

    const { sourceX, sourceY, sourceW, sourceH, pathData } = shape;
    requireValid([sourceX, sourceY, sourceW, sourceH].every(isNumber) && sourceW > 0 && sourceH > 0);
    requireValid(typeof pathData === "string" && /^[Mm][AaCcEeHhLlMmQqSsTtVvZz0-9+.,\s-]+$/.test(pathData));
    return { kind, x, y, w, h, sourceX, sourceY, sourceW, sourceH, pathData, hitPath: new Path2D(pathData) };
  }

  function restoreLayer(layer) {
    const { id, name, color, noFill, stroke, opacity, text, hidden, shape, inkBoundary, groupId } = layer;
    requireValid(Number.isSafeInteger(id) && id > 0 && id < Number.MAX_SAFE_INTEGER);
    requireValid(typeof name === "string" && isColor(color));
    requireValid(noFill === undefined || typeof noFill === "boolean");
    requireValid(hidden === undefined || typeof hidden === "boolean");
    requireValid(opacity === undefined || (Number.isInteger(opacity) && opacity >= 0 && opacity <= 100));
    if (stroke !== undefined) {
      requireValid(stroke && typeof stroke.enabled === "boolean" && isColor(stroke.color));
      requireValid(isNumber(stroke.width) && stroke.width >= .5 && stroke.width <= 64);
      requireValid(stroke.join === undefined || strokeJoins.has(stroke.join));
    }
    const restored = restoreShape(shape);
    if (text !== undefined) {
      const base = restored.kind === "affine" ? restored.base : restored;
      requireValid(text && base.kind === "path" && typeof text.value === "string");
      requireValid(textFonts.some((font) => font.id === text.fontId));
    }
    if (inkBoundary !== undefined) {
      requireValid(Array.isArray(inkBoundary) && inkBoundary.length > 0 && new Set(inkBoundary).size === inkBoundary.length);
      requireValid(inkBoundary.every((member) => Number.isSafeInteger(member) && member > 0 && member !== id));
    }
    requireValid(groupId === undefined || (Number.isSafeInteger(groupId) && groupId > 0 && groupId < Number.MAX_SAFE_INTEGER));
    return { id, name, color, noFill, stroke, opacity, text, hidden, inkBoundary, groupId, shape: restored };
  }

  function read(previous = null) {
    const serialized = localStorage.getItem(key);
    if (serialized === null) return null;
    if (previous?.serialized === serialized) return previous;
    const { version: storedVersion, savedAt, layers, guides = [] } = JSON.parse(serialized);
    requireValid(storedVersion === version && Number.isFinite(savedAt) && savedAt > 0 && savedAt <= 8.64e15);
    requireValid(Array.isArray(layers));
    const restored = layers.map(restoreLayer);
    requireValid(new Set(restored.map((layer) => layer.id)).size === restored.length);
    requireValid(Array.isArray(guides) && guides.every((guide) => Array.isArray(guide)
      ? guide.length >= 2 && guide.every(isPoint)
      : guide?.kind === "curve" && [guide.start, guide.middle, guide.end].every(isPoint) && validControls(guide.controls),
    ));
    return { savedAt, layers: restored, guides, serialized };
  }

  function write(layers, guides = []) {
    const savedAt = Date.now();
    const serialized = JSON.stringify({ version, savedAt, layers, guides }, (property, value) =>
      property === "hitPath" ? undefined : value,
    );
    localStorage.setItem(key, serialized);
    return { savedAt, layers, guides, serialized };
  }

  return { key, read, write };
})();
