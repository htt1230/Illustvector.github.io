"use strict";

// Paper works on the original Bézier paths so cuts add nodes at intersections.
const vertexShapes = new WeakMap();
let vertexProject;

function vertexPaper() {
  if (!vertexProject) {
    const scope = window.paper;
    scope.setup(new scope.Size(1, 1));
    vertexProject = scope;
  }
  return vertexProject;
}

function vertexBoolean(paths, operation) {
  if (!paths.length) return new vertexProject.Path({ insert: false });
  if (paths.length === 1) return paths[0];
  const middle = Math.floor(paths.length / 2);
  return vertexBoolean(paths.slice(0, middle), operation)[operation](
    vertexBoolean(paths.slice(middle), operation), { insert: false },
  );
}

function vertexTransform(path, matrix) {
  path.transform(new vertexProject.Matrix(...matrix));
  return path;
}

function vertexStroke(path, width, join = "round") {
  if (path.isEmpty()) return path;
  return window.paperjsOffset.offsetStroke(path, width / 2, { join, cap: "round", limit: 4, insert: false });
}

function sourceVertexPath(shape) {
  const scope = vertexProject;
  const options = { insert: false };
  const { kind, x, y, w, h } = shape;
  if (kind === "affine") return vertexTransform(sourceVertexPath(shape.base), shape.matrix);
  if (kind === "outline") return vertexStroke(sourceVertexPath(shape.base), shape.width, shape.join);
  if (kind === "ink" || kind === "ink-run") {
    const data = kind === "ink" ? inkPathData(shape) : shape.pathData;
    if (shape.points?.length === 1) {
      return new scope.Path.Circle({ center: shape.points[0], radius: shape.width / 2, ...options });
    }
    return vertexStroke(new scope.Path({ pathData: data, ...options }), shape.width);
  }
  if (shape.parts) {
    const parts = shape.parts.map(sourceVertexPath);
    if (kind === "subtract") return parts[0].subtract(vertexBoolean(parts.slice(1), "unite"), options);
    return vertexBoolean(parts, { union: "unite", xor: "exclude", intersect: "intersect" }[kind]);
  }
  if (kind === "path") {
    if (shape.regions) {
      return vertexBoolean(shape.regions.map(({ pathData }) => sourceVertexPath({ ...shape, pathData, regions: undefined })), "unite");
    }
    const path = new scope.CompoundPath({ pathData: shape.pathData, ...options });
    const sx = w / shape.sourceW;
    const sy = h / shape.sourceH;
    return vertexTransform(path, [sx, 0, 0, sy, number(x) - shape.sourceX * sx, number(y) - shape.sourceY * sy]);
  }
  if (kind === "ellipse") return new scope.Path.Ellipse({ rectangle: [x, y, w, h], ...options });
  const segments = kind === "rect" ? [[x,y], [x+w,y], [x+w,y+h], [x,y+h]] : vertices(shape);
  return new scope.Path({ segments, closed: true, ...options });
}

function vertexPaintPaths(shape, color) {
  if (shape.kind === "affine") {
    return vertexPaintPaths(shape.base, color).map((region) => ({
      ...region, path: vertexTransform(region.path, shape.matrix),
    }));
  }
  if (shape.kind === "path" && shape.regions) {
    return shape.regions.map((region) => ({
      color: region.color, path: sourceVertexPath({ ...shape, pathData: region.pathData, regions: undefined }),
    }));
  }
  if (shape.kind === "union" && shape.sourceColors) {
    return shape.parts.flatMap((part, index) => vertexPaintPaths(part, shape.sourceColors[index]));
  }
  if (shape.kind !== "xor" || !hasXorColors(shape)) return [{ color, path: sourceVertexPath(shape) }];
  const options = { insert: false };
  const pieces = [];
  if (!shape.paintOnly) {
    if (shape.sourceColors) {
      const sources = shape.parts.map(sourceVertexPath);
      shape.parts.forEach((part, index) => {
        const cutters = sources.filter((source, other) => other !== index && sources[index].bounds.intersects(source.bounds));
        const cutter = cutters.length ? vertexBoolean(cutters, "exclude") : null;
        for (const region of vertexPaintPaths(part, shape.sourceColors[index])) {
          pieces.push({ color: region.color, path: cutter ? region.path.subtract(cutter, options) : region.path });
        }
      });
    } else pieces.push({ color, path: sourceVertexPath(shape) });
  }
  for (const paint of shape.paints ?? []) {
    let path = paint.outline ? new vertexProject.CompoundPath({ pathData: paint.outline, ...options })
      : sourceVertexPath(xorFace(shape, paint.membership));
    if (!paint.outline && paint.clip) {
      const clip = new vertexProject.CompoundPath({ pathData: paint.clip, ...options });
      // Older bucket clips followed the sampled edge. Use them to identify the actual vector regions.
      const matches = vertexConnectedRegions(path).filter((piece) => clip.contains(piece.getInteriorPoint()));
      path = matches.length ? vertexBoolean(matches, "unite") : path.intersect(clip, options);
    }
    pieces.push({ color: paint.color, path });
  }
  return pieces;
}

function vectorBucketComponent(face, point) {
  try {
    vertexPaper();
    const regions = vertexConnectedRegions(sourceVertexPath(face));
    const hit = regions.find((piece) => piece.contains([point.x, point.y]));
    if (!hit) return null;
    return regions.length === 1 ? { clip: "" } : { clip: "", outline: vertexPathData(hit) };
  } catch {
    return null;
  }
}

function fitBucketContour(points, box, dx, dy) {
  const scope = vertexPaper();
  const path = new scope.Path({ segments: points.map(({ x, y }) => [x, y]), closed: true, insert: false });
  path.simplify(2);
  path.transform(new scope.Matrix(dx, 0, 0, dy, box.x, box.y));
  return vertexPathData(path);
}

function vertexPathData(item) {
  const pair = ({ x, y }) => number(x) + " " + number(y);
  const paths = item.children ?? [item];
  return paths.filter((path) => path.segments.length > 1).map((path) => {
    let data = "M" + pair(path.firstSegment.point);
    for (const curve of path.curves) {
      if (curve.isStraight()) {
        if (curve.segment2 !== path.firstSegment) data += "L" + pair(curve.point2);
      } else {
        data += "C" + pair(curve.point1.add(curve.handle1)) + " " +
          pair(curve.point2.add(curve.handle2)) + " " + pair(curve.point2);
      }
    }
    return data + (path.closed ? "Z" : "");
  }).join("");
}

function vertexConnectedRegions(item) {
  item.reorient(true, true);
  if (!item.children) return [item];
  const outer = item.children.filter((path) => path.clockwise).map((path) => ({ path, holes: [] }));
  for (const hole of item.children.filter((path) => !path.clockwise)) {
    const point = hole.firstSegment.point;
    const owner = outer.filter(({ path }) => path.contains(point))
      .reduce((closest, entry) => !closest || entry.path.area < closest.path.area ? entry : closest, null);
    if (!owner) return [item];
    owner.holes.push(hole);
  }
  return outer.map(({ path, holes }) => holes.length
    ? new vertexProject.CompoundPath({ children: [path, ...holes].map((contour) => contour.clone({ insert: false })), insert: false })
    : path);
}

function prepareVertexShape(shape, color) {
  if (shape.kind === "path" && /^[MLQCZ0-9eE+.\s-]+$/.test(shape.pathData)) return shape;
  const cached = vertexShapes.get(shape);
  if (cached && cached.color === color) return cached.path;
  let path = null;
  try {
    vertexPaper();
    if (hasStoredPaint(shape)) {
      const regions = [];
      let covered;
      // Frontmost paint owns each point. Store the visible regions with independent colors.
      for (const region of vertexPaintPaths(shape, color).reverse()) {
        if (region.path.isEmpty()) continue;
        const visible = covered ? region.path.subtract(covered, { insert: false }) : region.path;
        if (!visible.isEmpty()) regions.unshift({ color: region.color, path: visible });
        covered = covered ? covered.unite(region.path, { insert: false }) : region.path;
      }
      path = closedVertexShape(covered, true, regions);
    } else {
      const outline = sourceVertexPath(shape);
      // A drag can reverse a contour or overlap another island. Keep their fills independent.
      const islands = shape.parts ? vertexConnectedRegions(outline) : [];
      const regions = islands.length > 1 ? islands.map((piece) => ({ color, path: piece })) : undefined;
      path = closedVertexShape(outline, Boolean(shape.parts), regions);
    }
  } catch (error) {
    console.warn("Could not resolve editable vertices", error);
  }
  vertexShapes.set(shape, { color, path });
  return path;
}

function closedVertexShape(outline, weldPoints, regions) {
  if (!outline || outline.isEmpty()) return null;
  const { x, y, width: w, height: h } = outline.bounds;
  const colored = regions?.flatMap(({ color, path }) => vertexConnectedRegions(path)
    .map((piece) => ({ color, pathData: vertexPathData(piece) })))
    .filter(({ pathData }) => pathData);
  const pathData = colored ? colored.map((region) => region.pathData).join("")
    : vertexPathData(outline.reorient(true, true));
  if (!pathData || !(w > 0 && h > 0)) return null;
  return { kind: "path", x, y, w, h, sourceX: x, sourceY: y, sourceW: w, sourceH: h,
    pathData, hitPath: new Path2D(pathData), ...(weldPoints ? { weldPoints } : {}),
    ...(colored?.length ? { regions: colored } : {}),
  };
}


function outlineSegmentData(segment, points) {
  return segment.kind + segment.ids.map((id) => points[id].x + " " + points[id].y).join(" ");
}

function vertexContours(model) {
  const contours = [];
  for (const segment of model.segments) {
    if (segment.kind === "M") contours.push({ region: segment.region, segments: [] });
    contours.at(-1).segments.push(segment);
  }
  return contours;
}

function outlinePathsWithoutVertices(model, selected, regionCount) {
  const contours = vertexContours(model);
  for (const contour of contours) {
    contour.edited = contourWithoutVertices(contour.segments, model.points, selected);
  }
  return serializeVertexContours(contours, model.points, regionCount);
}

function serializeVertexContours(contours, originalPoints, regionCount) {
  const paths = Array.from({ length: regionCount }, () => "");
  const removed = contours.filter((contour) => !contour.edited);
  if (removed.length && removed.length < contours.length) {
    const scope = vertexPaper();
    for (const contour of contours) {
      if (contour.segments.at(-1).kind === "Z") {
        const pathData = contour.segments.map((segment) => outlineSegmentData(segment, originalPoints)).join("");
        contour.original = new scope.Path({ pathData, insert: false });
      }
    }
    // A hole whose enclosing contour is deleted must not turn into a filled island.
    for (const contour of contours) {
      if (!contour.edited || !contour.original) continue;
      const target = contour.original;
      let parent;
      for (const other of contours) {
        const source = other.original;
        if (!source || other.region !== contour.region || Math.abs(source.area) <= Math.abs(target.area) ||
          !source.bounds.contains(target.bounds) || !source.contains(target.firstSegment.point)) continue;
        if (!parent || Math.abs(source.area) < Math.abs(parent.original.area)) parent = other;
      }
      if (parent && removed.includes(parent) && parent.original.clockwise !== target.clockwise) contour.edited = "";
    }
  }
  for (const { region, edited } of contours) paths[region] += edited;
  return paths;
}

function mergedVertexPaths(model, points, selected, survivor, regionCount) {
  const contours = vertexContours(model);
  for (const contour of contours) {
    const { segments } = contour;
    const anchors = new Set();
    let curved = false;
    let previous;
    const closed = segments.at(-1).kind === "Z";
    const affected = segments.some(({ ids }) => ids.length && selected.has(ids.at(-1)));
    let path = "";
    for (const segment of segments) {
      if (segment.kind === "Z") {
        path += "Z";
        continue;
      }
      const end = segment.ids.at(-1);
      const target = selected.has(end) ? survivor : end;
      if (affected && previous === target) continue;
      anchors.add(target);
      curved ||= segment.kind === "Q" || segment.kind === "C";
      path += outlineSegmentData({ ...segment, ids: [...segment.ids.slice(0, -1), target] }, points);
      previous = target;
    }
    const minimum = closed && !curved ? 3 : 2;
    contour.edited = !affected || anchors.size >= minimum ? path : "";
  }
  return serializeVertexContours(contours, model.points, regionCount);
}

function contourWithoutVertices(segments, points, selected) {
  const closed = segments.at(-1).kind === "Z";
  const edges = segments.slice(1, closed ? -1 : undefined);
  const first = segments[0].ids[0];
  const anchors = [first, ...edges.map(({ ids }) => ids.at(-1))];
  if (!anchors.some((id) => selected.has(id))) {
    return segments.map((segment) => outlineSegmentData(segment, points)).join("");
  }
  if (closed) {
    if (edges.length && anchors.at(-1) === first) anchors.pop();
    else edges.push({ kind: "L", ids: [first] });
  }
  const kept = anchors.flatMap((id, index) => selected.has(id) ? [] : [index]);
  if (kept.length < 2) return "";
  const pair = ({ x, y }) => number(x) + " " + number(y);
  let path = "M" + pair(points[anchors[kept[0]]]);
  let hasCurve = false;
  const count = closed ? kept.length : kept.length - 1;
  for (let index = 0; index < count; index++) {
    const start = kept[index];
    const end = kept[(index + 1) % kept.length];
    const closing = closed && index === count - 1;
    const entry = edges[start];
    if ((start + 1) % anchors.length === end) {
      hasCurve ||= entry.kind !== "L";
      if (!closing || entry.kind !== "L") path += outlineSegmentData(entry, points);
      continue;
    }
    const exit = edges[(end - 1 + anchors.length) % anchors.length];
    const to = points[anchors[end]];
    if (entry.kind === "L" && exit.kind === "L") {
      if (!closing) path += "L" + pair(to);
    } else {
      hasCurve = true;
      const outgoing = vertexControlAt(entry, points[anchors[start]], false, points);
      const incoming = vertexControlAt(exit, to, true, points);
      path += "C" + pair(outgoing) + " " + pair(incoming) + " " + pair(to);
    }
  }
  if (closed && kept.length === 2 && !hasCurve) return "";
  return path + (closed ? "Z" : "");
}

function vertexControlAt(segment, anchor, incoming, points) {
  if (segment.kind === "C") return points[segment.ids[Number(incoming)]];
  if (segment.kind === "Q") {
    const control = points[segment.ids[0]];
    return { x: anchor.x + (control.x - anchor.x) * 2 / 3, y: anchor.y + (control.y - anchor.y) * 2 / 3 };
  }
  return anchor;
}

