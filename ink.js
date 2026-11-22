"use strict";

const inkPaths = new WeakMap();

function inkCurveGeometry({ points: [start, middle, end], controls }) {
  return { start, middle, end, controls };
}

function inkPathData(shape) {
  const cached = inkPaths.get(shape);
  if (cached) return cached.data;
  const { points } = shape;
  const pair = ({ x, y }) => Number(x.toFixed(3)) + " " + Number(y.toFixed(3));
  let data = "M" + pair(points[0]);
  if (shape.curve) {
    data += curveSegment(inkCurveGeometry(shape), pair);
  } else if (points.length > 1) {
    // Replay intermediate samples from drafts saved with freehand drawing.
    for (let i = 1; i < points.length - 1; i++) {
      data += "Q" + pair(points[i]) + " " + pair(midpoint(points[i], points[i + 1]));
    }
    data += "L" + pair(points.at(-1));
  }
  inkPaths.set(shape, { data });
  return data;
}

function inkContains(shape, point, context) {
  if (shape.points.length === 1) {
    const [{ x, y }] = shape.points;
    return Math.hypot(point.x - x, point.y - y) <= shape.width / 2;
  }
  const data = inkPathData(shape);
  const cached = inkPaths.get(shape);
  cached.path ??= new Path2D(data);
  context.lineWidth = shape.width;
  context.lineCap = "round";
  context.lineJoin = "round";
  return context.isPointInStroke(cached.path, point.x, point.y);
}

function inkBounds(shape) {
  let points = shape.points;
  if (shape.curve && shape.controls) {
    const { start, end, controls: [left, right] } = inkCurveGeometry(shape);
    points = [start, end];
    for (const axis of ["x", "y"]) {
      const a = -start[axis] + 3 * left[axis] - 3 * right[axis] + end[axis];
      const b = 2 * (start[axis] - 2 * left[axis] + right[axis]);
      const c = left[axis] - start[axis];
      const discriminant = b * b - 4 * a * c;
      const roots = Math.abs(a) < guideEpsilon ? (Math.abs(b) < guideEpsilon ? [] : [-c / b])
        : discriminant < 0 ? [] : [(-b - Math.sqrt(discriminant)) / (2 * a), (-b + Math.sqrt(discriminant)) / (2 * a)];
      for (const t of roots) {
        if (t <= 0 || t >= 1) continue;
        const u = 1 - t;
        points.push({
          x: u ** 3 * start.x + 3 * u * u * t * left.x + 3 * u * t * t * right.x + t ** 3 * end.x,
          y: u ** 3 * start.y + 3 * u * u * t * left.y + 3 * u * t * t * right.y + t ** 3 * end.y,
        });
      }
    }
  } else if (shape.curve) {
    const [start, middle, end] = points;
    const control = guideCurveControl({ start, middle, end });
    points = [start, end];
    for (const axis of ["x", "y"]) {
      const denominator = start[axis] - 2 * control[axis] + end[axis];
      if (!denominator) continue;
      const t = (start[axis] - control[axis]) / denominator;
      if (t > 0 && t < 1) {
        const a = (1 - t) ** 2;
        const b = 2 * (1 - t) * t;
        const c = t ** 2;
        points.push({ x: a * start.x + b * control.x + c * end.x, y: a * start.y + b * control.y + c * end.y });
      }
    }
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const { x, y } of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const radius = shape.width / 2;
  return { x: minX - radius, y: minY - radius, w: maxX - minX + shape.width, h: maxY - minY + shape.width };
}
