"use strict";

const guideEpsilon = .000001;
const guideCross = (ax, ay, bx, by) => ax * by - ay * bx;
const guidePoint = (start, dx, dy, t) => ({ x: start.x + dx * t, y: start.y + dy * t });
const unitInterval = (value) => Math.max(0, Math.min(1, value));
const flattenedCurves = new WeakMap();
const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

const guideIsHidden = (guide) => guide?.kind === "hidden-guide";
const guideGeometry = (guide) => guideIsHidden(guide) ? guide.base : guide;

function guideCurveControl({ start, middle, end }) {
  const halfChord = midpoint(start, end);
  return { x: 2 * middle.x - halfChord.x, y: 2 * middle.y - halfChord.y };
}

function bezierHandles(curve) {
  if (curve.controls) return curve.controls;
  const control = guideCurveControl(curve);
  return [curve.start, curve.end].map((anchor) =>
    guidePoint(anchor, control.x - anchor.x, control.y - anchor.y, 2 / 3));
}

function curveBetween(start, controls, end) {
  return { kind: "curve", start, controls, end, middle: midpoint(start, end) };
}

function splitBezier(curve, t) {
  const { start, end } = curve;
  const [left, right] = bezierHandles(curve);
  const mix = (a, b) => guidePoint(a, b.x - a.x, b.y - a.y, t);
  const a = mix(start, left);
  const b = mix(left, right);
  const c = mix(right, end);
  const d = mix(a, b);
  const e = mix(b, c);
  const point = mix(d, e);
  return [curveBetween(start, [a, d], point), curveBetween(point, [e, c], end)];
}

function curveSegment(curve, pair) {
  const { end, controls } = curve;
  return controls
    ? "C" + controls.map(pair).join(" ") + " " + pair(end)
    : "Q" + pair(guideCurveControl(curve)) + " " + pair(end);
}

function curveWithEndpoint(curve, indices, point) {
  const updated = { ...curve, controls: bezierHandles(curve) };
  for (const index of indices) {
    const key = index === 0 ? "start" : "end";
    updated[key] = point;
  }
  return updated;
}

function sampledBezier(guide) {
  const cached = flattenedCurves.get(guide);
  if (cached) return cached;
  const points = [guide.start];
  const parameters = [0];
  function flatten(start, left, right, end, t0, t1, depth) {
    const dx = (end.x - start.x) / 3;
    const dy = (end.y - start.y) / 3;
    if (depth === 12 || Math.max(
      Math.hypot(left.x - start.x - dx, left.y - start.y - dy),
      Math.hypot(right.x - end.x + dx, right.y - end.y + dy),
    ) <= .18) {
      points.push(end);
      parameters.push(t1);
      return;
    }
    const a = midpoint(start, left);
    const b = midpoint(left, right);
    const c = midpoint(right, end);
    const d = midpoint(a, b);
    const e = midpoint(b, c);
    const middle = midpoint(d, e);
    const t = (t0 + t1) / 2;
    flatten(start, a, d, middle, t0, t, depth + 1);
    flatten(middle, e, c, end, t, t1, depth + 1);
  }

  flatten(guide.start, ...bezierHandles(guide), guide.end, 0, 1, 0);
  const sample = { points, parameters };
  flattenedCurves.set(guide, sample);
  return sample;
}

function guidePolyline(guide) {
  if (guideIsHidden(guide)) return [];
  return Array.isArray(guide) ? guide : sampledBezier(guide).points;
}

function guideBranchLocation(guide, cursor, limit) {
  const sample = Array.isArray(guide) ? { points: guide } : sampledBezier(guide);
  const { points, parameters } = sample;
  let nearest = null;
  for (let index = 1; index < points.length; index++) {
    const start = points[index - 1];
    const end = points[index];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const span = dx * dx + dy * dy;
    if (!span) continue;
    const fraction = unitInterval(((cursor.x - start.x) * dx + (cursor.y - start.y) * dy) / span);
    const point = guidePoint(start, dx, dy, fraction);
    const distance = Math.hypot(point.x - cursor.x, point.y - cursor.y);
    if (!nearest || distance < nearest.distance) nearest = { point, index, fraction, distance };
  }
  if (!nearest || nearest.distance > limit + .18) return null;
  const { index, fraction } = nearest;
  if (parameters) {
    const parameter = parameters[index - 1] + fraction * (parameters[index] - parameters[index - 1]);
    if (parameter <= guideEpsilon || parameter >= 1 - guideEpsilon) return null;
    const pieces = splitBezier(guide, parameter);
    const point = pieces[0].end;
    return { point, pieces, distance: Math.hypot(point.x - cursor.x, point.y - cursor.y) };
  }
  const { point, distance } = nearest;
  const left = [...points.slice(0, index)];
  const right = points.slice(index);
  if (fraction > guideEpsilon) left.push(point);
  if (fraction < 1 - guideEpsilon) right.unshift(point);
  if (left.length < 2 || right.length < 2) return null;
  return { point, pieces: [left, right], distance };
}

function guideEndpoint(guide, end) {
  return Array.isArray(guide) ? (end === "start" ? guide[0] : guide.at(-1)) : guide[end];
}

function moveGuide(guide, dx, dy) {
  if (guideIsHidden(guide)) return { ...guide, base: moveGuide(guide.base, dx, dy) };
  const offset = ({ x, y }) => ({ x: x + dx, y: y + dy });
  if (Array.isArray(guide)) return guide.map(offset);
  return { ...guide, start: offset(guide.start), middle: offset(guide.middle), end: offset(guide.end),
    ...(guide.controls ? { controls: guide.controls.map(offset) } : {}) };
}

const guideDot = (a, b) => a.x * b.x + a.y * b.y;

function straightGuide(guide) {
  if (!Array.isArray(guide)) return null;
  const start = guide[0];
  const end = guide.at(-1);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  if (length <= guideEpsilon) return null;
  const tangent = { x: dx / length, y: dy / length };
  if (guide.some((point) => Math.abs(guideCross(tangent.x, tangent.y, point.x - start.x, point.y - start.y)) > .25)) {
    return null;
  }
  return { start, end, tangent };
}

function guideRay(start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy);
  return length > guideEpsilon ? { start, dx: dx / length, dy: dy / length } : null;
}

function guideRayContains(ray, point) {
  const x = point.x - ray.start.x;
  const y = point.y - ray.start.y;
  return Math.abs(guideCross(ray.dx, ray.dy, x, y)) <= guideEpsilon && x * ray.dx + y * ray.dy >= 0;
}

function nearestLineEnd(point, endpoints, limit, ray) {
  let closest = null;
  let distance = limit;
  for (const end of endpoints) {
    if (ray && !guideRayContains(ray, end)) continue;
    const next = Math.hypot(end.x - point.x, end.y - point.y);
    if (next <= distance) {
      closest = end;
      distance = next;
    }
  }
  return closest;
}

function snapLineMove(ends, targets, dx, dy, direction, limit) {
  let snapped = null;
  let distance = limit;
  for (const end of ends) {
    const moved = { x: end.x + dx, y: end.y + dy };
    for (const target of targets) {
      const x = target.x - moved.x;
      const y = target.y - moved.y;
      if (direction && Math.abs(guideCross(direction.x, direction.y, x, y)) > guideEpsilon) continue;
      const next = Math.hypot(x, y);
      if (next > distance) continue;
      distance = next;
      const shift = direction ? guideDot({ x, y }, direction) : 0;
      snapped = { dx: dx + (direction ? shift * direction.x : x), dy: dy + (direction ? shift * direction.y : y), target };
    }
  }
  return snapped;
}

function snapLineLength(anchor, end, references, limit) {
  const ray = guideRay(anchor, end);
  if (!ray) return null;
  const length = Math.hypot(end.x - anchor.x, end.y - anchor.y);
  const parallel = Math.sin(Math.PI / 180);
  const projection = (point) => (point.x - anchor.x) * ray.dx + (point.y - anchor.y) * ray.dy;
  let best = null;
  let distance = limit;
  for (const reference of references) {
    const [start, finish] = reference;
    const direction = guideRay(start, finish);
    if (!direction || Math.abs(guideCross(ray.dx, ray.dy, direction.dx, direction.dy)) > parallel) continue;
    const a = projection(start);
    const b = projection(finish);
    if (Math.min(a, b) > length || Math.max(a, b) < 0) continue;
    const near = midpoint(start, finish);
    const separation = Math.abs(guideCross(ray.dx, ray.dy, near.x - anchor.x, near.y - anchor.y));
    const referenceLength = Math.hypot(finish.x - start.x, finish.y - start.y);
    const difference = Math.abs(referenceLength - length);
    if (referenceLength < 2 || separation > limit * 24 || difference > distance) continue;
    if (difference === distance && best && separation >= best.separation) continue;
    distance = difference;
    best = { point: guidePoint(anchor, ray.dx, ray.dy, referenceLength), reference, separation };
  }
  return best;
}

function lineLayoutReferences(ends, lines) {
  const moving = straightGuide(ends);
  if (!moving) return null;
  const { tangent } = moving;
  const normal = { x: -tangent.y, y: tangent.x };
  function project({ start, end }) {
    const a = guideDot(start, tangent);
    const b = guideDot(end, tangent);
    return { left: Math.min(a, b), right: Math.max(a, b), position: guideDot(midpoint(start, end), normal) };
  }

  const parallelTolerance = Math.sin(Math.PI / 180);
  const references = lines.flatMap((points) => {
    const line = straightGuide(points);
    if (!line || Math.abs(guideDot(line.tangent, normal)) > parallelTolerance) return [];
    return [project(line)];
  }).sort((a, b) => a.position - b.position);
  return references.length ? { tangent, normal, moving: project(moving), references } : null;
}

function snapLineSpacing(layout, dx, dy, direction, tolerance) {
  if (!layout || layout.references.length < 2) return null;
  const { tangent, normal, moving, references } = layout;
  const adjustmentDirection = direction ?? normal;
  const alignment = guideDot(adjustmentDirection, normal);
  if (Math.abs(alignment) <= guideEpsilon) return null;
  const position = moving.position + guideDot({ x: dx, y: dy }, normal);
  const moved = guideDot({ x: dx, y: dy }, tangent);
  const nearby = references.filter((line) =>
    line.right >= moving.left + moved - tolerance && line.left <= moving.right + moved + tolerance,
  );
  const distinct = nearby.filter((line, index) => index === 0 || line.position - nearby[index - 1].position > guideEpsilon);
  let result = null;
  let nearest = tolerance;

  for (let index = 1; index < distinct.length; index++) {
    const first = distinct[index - 1];
    const second = distinct[index];
    const a = first.position;
    const b = second.position;
    const gap = b - a;
    const candidates = [(a + b) / 2];
    if (a - gap > (distinct[index - 2]?.position ?? -Infinity) + guideEpsilon) candidates.push(a - gap);
    if (b + gap < (distinct[index + 1]?.position ?? Infinity) - guideEpsilon) candidates.push(b + gap);

    for (const value of candidates) {
      const offset = value - position;
      const adjustment = offset / alignment;
      if (Math.abs(adjustment) > nearest) continue;
      const x = dx + adjustment * adjustmentDirection.x;
      const y = dy + adjustment * adjustmentDirection.y;
      const shift = guideDot({ x, y }, tangent);
      const left = Math.max(first.left, second.left, moving.left + shift);
      const right = Math.min(first.right, second.right, moving.right + shift);
      if (right - left <= guideEpsilon) continue;
      nearest = Math.abs(adjustment);
      const positions = [a, b, value].sort((left, right) => left - right);
      result = {
        dx: x, dy: y,
        hint: { tangent, normal, positions, along: right - Math.min(tolerance * 2, (right - left) / 4) },
      };
    }
  }
  return result;
}

function snapLineAlignment(layout, dx, dy, direction, tolerance) {
  if (!layout) return null;
  const { tangent, normal, moving, references } = layout;
  const translation = { x: dx, y: dy };
  const along = guideDot(translation, tangent);
  const across = moving.position + guideDot(translation, normal);
  const adjustmentDirection = direction ?? tangent;
  const alignment = guideDot(adjustmentDirection, tangent);
  const anchors = ({ left, right }) => [left, (left + right) / 2, right];
  const movingAnchors = anchors(moving);
  let best = null;
  let nearest = tolerance + guideEpsilon;
  for (const reference of references) {
    const separation = Math.abs(reference.position - across);
    if (separation <= guideEpsilon) continue;
    const targets = anchors(reference);
    for (const [index, target] of targets.entries()) {
      const offset = target - movingAnchors[index] - along;
      if (Math.abs(alignment) <= guideEpsilon && Math.abs(offset) > guideEpsilon) continue;
      const adjustment = Math.abs(offset) <= guideEpsilon ? 0 : offset / alignment;
      const distance = Math.abs(adjustment);
      if (distance > nearest || (distance === nearest && best && separation >= best.separation)) continue;
      const x = dx + adjustment * adjustmentDirection.x;
      const y = dy + adjustment * adjustmentDirection.y;
      nearest = distance;
      best = {
        dx: x, dy: y, separation,
        hint: {
          tangent, normal, along: target,
          positions: [reference.position, moving.position + guideDot({ x, y }, normal)],
        },
      };
    }
  }
  return best;
}

function horizontalPointReferences(lines) {
  return lines.flatMap(([start, end]) => {
    const [left, right] = start.x <= end.x ? [start, end] : [end, start];
    const span = right.x - left.x;
    if (span <= guideEpsilon) return [];
    const slope = (right.y - left.y) / span;
    return Math.abs(slope) <= Math.tan(Math.PI / 180) ? [{ left, right, slope }] : [];
  });
}

function snapPointBetweenLines(point, lines, dx, dy, tolerance, extend = false, direction = null) {
  if (direction && Math.abs(direction.y) <= guideEpsilon) return null;
  const x = point.x + dx;
  const y = point.y + dy;
  let top = -Infinity;
  let bottom = Infinity;
  let topLine;
  let bottomLine;
  const rowAt = ({ left, right, slope }, x) => left.y + (Math.min(right.x, Math.max(left.x, x)) - left.x) * slope;
  for (const line of lines) {
    const { left, right } = line;
    if (!extend && (x < left.x - guideEpsilon || x > right.x + guideEpsilon)) continue;
    const row = rowAt(line, x);
    if (row <= y && row > top) { top = row; topLine = line; }
    if (row >= y && row < bottom) { bottom = row; bottomLine = line; }
  }
  if (!Number.isFinite(top) || !Number.isFinite(bottom) || bottom - top <= guideEpsilon) return null;
  const center = (top + bottom) / 2;
  let shift = center - y;
  let shiftX = 0;
  if (direction) {
    const slopeAt = (line, x) => x > line.left.x && x < line.right.x ? line.slope : 0;
    const slope = (slopeAt(topLine, x) + slopeAt(bottomLine, x)) / 2;
    shift /= direction.y - direction.x * slope;
    shiftX = direction.x * shift;
    if (!extend && [topLine, bottomLine].some((line) => x + shiftX < line.left.x || x + shiftX > line.right.x)) return null;
    top = rowAt(topLine, x + shiftX);
    bottom = rowAt(bottomLine, x + shiftX);
  }
  if (Math.abs(shift) > tolerance) return null;
  const snappedY = direction ? y + shift * direction.y : center;
  return {
    dx: dx + shiftX, dy: snappedY - point.y,
    hint: { tangent: { x: 1, y: 0 }, normal: { x: 0, y: 1 }, positions: [top, snappedY, bottom], along: x + shiftX },
  };
}

function snapGuidePoint(point, guides, limit, closingPoint, ray) {
  let nearest = point;
  let distance = limit ** 2;
  function consider(candidate) {
    if (ray && !guideRayContains(ray, candidate)) return;
    const next = (candidate.x - point.x) ** 2 + (candidate.y - point.y) ** 2;
    if (next > distance) return;
    nearest = candidate;
    distance = next;
  }

  if (closingPoint) consider(closingPoint);
  for (const guide of guides.map(guidePolyline)) {
    for (let i = 1; i < guide.length; i++) {
      const start = guide[i - 1];
      const dx = guide[i].x - start.x;
      const dy = guide[i].y - start.y;
      const length = dx ** 2 + dy ** 2;
      if (!length) continue;
      if (ray) {
        const cross = guideCross(ray.dx, ray.dy, dx, dy);
        if (Math.abs(cross) > guideEpsilon) {
          const t = guideCross(start.x - ray.start.x, start.y - ray.start.y, ray.dx, ray.dy) / cross;
          if (t >= 0 && t <= 1) consider(guidePoint(start, dx, dy, t));
          continue;
        }
      }
      const t = unitInterval(((point.x - start.x) * dx + (point.y - start.y) * dy) / length);
      consider(guidePoint(start, dx, dy, t));
    }
  }
  return nearest;
}

function guideNear(point, guides, limit) {
  let selected = -1;
  let distance = limit;
  for (let index = guides.length - 1; index >= 0; index--) {
    const closest = snapGuidePoint(point, [guides[index]], distance);
    if (closest === point) continue;
    const next = Math.hypot(closest.x - point.x, closest.y - point.y);
    if (selected === -1 || next < distance) {
      selected = index;
      distance = next;
    }
  }
  return selected;
}

function splitGuideIntersections(first, second) {
  if (first.right < second.left - guideEpsilon || second.right < first.left - guideEpsilon ||
    first.bottom < second.top - guideEpsilon || second.bottom < first.top - guideEpsilon) return;
  const x = second.start.x - first.start.x;
  const y = second.start.y - first.start.y;
  const determinant = guideCross(first.dx, first.dy, second.dx, second.dy);
  const inRange = (value) => value >= -guideEpsilon && value <= 1 + guideEpsilon;
  if (Math.abs(determinant) > guideEpsilon) {
    const a = guideCross(x, y, second.dx, second.dy) / determinant;
    const b = guideCross(x, y, first.dx, first.dy) / determinant;
    if (inRange(a) && inRange(b)) {
      first.cuts.push(unitInterval(a));
      second.cuts.push(unitInterval(b));
    }
    return;
  }
  if (Math.abs(guideCross(x, y, first.dx, first.dy)) > guideEpsilon) return;

  function addOverlappingEndpoints(segment, other) {
    const length = segment.dx ** 2 + segment.dy ** 2;
    for (const end of [other.start, other.end]) {
      const t = ((end.x - segment.start.x) * segment.dx + (end.y - segment.start.y) * segment.dy) / length;
      if (inRange(t)) segment.cuts.push(unitInterval(t));
    }
  }
  addOverlappingEndpoints(first, second);
  addOverlappingEndpoints(second, first);
}

function makeGuideFaces(guides) {
  const segments = [];
  for (const guide of guides.map(guidePolyline)) {
    for (let i = 1; i < guide.length; i++) {
      const start = guide[i - 1];
      const end = guide[i];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      if (Math.hypot(dx, dy) <= guideEpsilon) continue;
      segments.push({
        start, end, dx, dy, cuts: [0, 1],
        left: Math.min(start.x, end.x), right: Math.max(start.x, end.x),
        top: Math.min(start.y, end.y), bottom: Math.max(start.y, end.y),
      });
    }
  }
  segments.sort((a, b) => a.left - b.left);
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    for (let j = i + 1; j < segments.length && segments[j].left <= segment.right + guideEpsilon; j++) {
      splitGuideIntersections(segment, segments[j]);
    }
  }

  const vertices = new Map();
  const round = (value) => Math.round(value * 1000) / 1000;
  function vertexAt(point) {
    const x = round(point.x);
    const y = round(point.y);
    const key = x + "," + y;
    if (!vertices.has(key)) vertices.set(key, { x, y, edges: new Map(), component: 0 });
    return vertices.get(key);
  }

  for (const segment of segments) {
    segment.cuts.sort((a, b) => a - b);
    let previous = null;
    for (const cut of segment.cuts) {
      const vertex = vertexAt(guidePoint(segment.start, segment.dx, segment.dy, cut));
      if (previous && previous !== vertex && !previous.edges.has(vertex)) {
        const forward = { from: previous, to: vertex };
        const reverse = { from: vertex, to: previous, twin: forward };
        forward.twin = reverse;
        previous.edges.set(vertex, forward);
        vertex.edges.set(previous, reverse);
      }
      previous = vertex;
    }
  }

  let component = 0;
  for (const vertex of vertices.values()) {
    vertex.ordered = [...vertex.edges.values()].sort((a, b) =>
      Math.atan2(a.to.y - vertex.y, a.to.x - vertex.x) - Math.atan2(b.to.y - vertex.y, b.to.x - vertex.x),
    );
    vertex.ordered.forEach((edge, index) => { edge.index = index; });
    if (vertex.component) continue;
    vertex.component = ++component;
    const pending = [vertex];
    while (pending.length) {
      const current = pending.pop();
      for (const next of current.edges.keys()) {
        if (next.component) continue;
        next.component = component;
        pending.push(next);
      }
    }
  }

  const faces = [];
  for (const vertex of vertices.values()) {
    for (const first of vertex.ordered) {
      if (first.visited) continue;
      const points = [];
      let edge = first;
      let area = 0;
      do {
        edge.visited = true;
        points.push(edge.from);
        area += guideCross(edge.from.x, edge.from.y, edge.to.x, edge.to.y);
        // Take the next edge around the face on the right of the current edge.
        const exits = edge.to.ordered;
        edge = exits[(edge.twin.index + exits.length - 1) % exits.length];
      } while (edge !== first);
      if (Math.abs(area) > .01) faces.push({ area: area / 2, points, component: vertex.component });
    }
  }
  return faces;
}

function guideFaceContains({ points }, point) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const a = points[i];
    const b = points[j];
    if ((a.y > point.y) !== (b.y > point.y) &&
      point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

function guideFillShape(faces, point) {
  const face = faces.filter((candidate) => candidate.area > 0 && guideFaceContains(candidate, point))
    .sort((a, b) => a.area - b.area)[0];
  if (!face) return null;

  const contained = faces.filter((candidate) => candidate.area < 0 && candidate.component !== face.component &&
    guideFaceContains(face, candidate.points[0]));
  const holes = contained.filter((candidate) => !contained.some((other) =>
    other.area < candidate.area && guideFaceContains(other, candidate.points[0]),
  ));
  let x = Infinity;
  let y = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const point of face.points) {
    x = Math.min(x, point.x);
    y = Math.min(y, point.y);
    right = Math.max(right, point.x);
    bottom = Math.max(bottom, point.y);
  }
  const w = right - x;
  const h = bottom - y;
  const pathData = [face, ...holes].map(({ points }) =>
    "M" + points.map(({ x, y }) => x + " " + y).join("L") + "Z",
  ).join("");
  return { kind: "path", pathData, x, y, w, h, sourceX: x, sourceY: y, sourceW: w, sourceH: h, hitPath: new Path2D(pathData) };
}
