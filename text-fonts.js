"use strict";

const textFonts = [
  { id: "zen-kaku-gothic", name: "Zen Kaku Gothic New" },
  { id: "klee-one", name: "Klee One" },
  { id: "shippori-mincho", name: "Shippori Mincho" },
  { id: "zen-maru-gothic", name: "Zen Maru Gothic" },
  { id: "barlow", name: "Barlow" },
  { id: "archivo-black", name: "Archivo Black" },
  { id: "dm-serif-display", name: "DM Serif Display" },
  { id: "pacifico", name: "Pacifico" },
  { id: "space-mono", name: "Space Mono" },
  { id: "bebas-neue", name: "Bebas Neue" },
  { id: "instrument-serif", name: "Instrument Serif" },
  { id: "bangers", name: "Bangers" },
];

const fontLoads = new Map();
const fontPayloads = new Map();
const importedTextFonts = new Map();
let fontParser;
let importedFontDatabase;
let importedFontCatalog;

window.registerFormaFont = (id, payload) => fontPayloads.set(id, payload);

function loadFontScript(name) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "fonts/" + name + ".js";
    script.onload = () => {
      script.remove();
      resolve();
    };
    script.onerror = () => {
      script.remove();
      reject(new Error("書体の読み込みに失敗しました。もう一度お試しください。"));
    };
    document.head.append(script);
  });
}

function loadFontParser() {
  fontParser ??= loadFontScript("opentype.min").catch((error) => {
    fontParser = null;
    throw error;
  });
  return fontParser;
}

function isImportedTextFontId(id) {
  return typeof id === "string" && /^local-font-[0-9a-f]{64}$/.test(id);
}

function openImportedFontDatabase() {
  importedFontDatabase ??= new Promise((resolve, reject) => {
    const request = indexedDB.open("illustvector-fonts", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("fonts", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch((error) => {
    importedFontDatabase = null;
    throw error;
  });
  return importedFontDatabase;
}

async function importedFontRequest(mode, run) {
  const database = await openImportedFontDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction("fonts", mode);
    const request = run(transaction.objectStore("fonts"));
    transaction.oncomplete = () => resolve(request.result);
    transaction.onabort = () => reject(transaction.error);
  });
}

function loadImportedFontCatalog() {
  importedFontCatalog ??= importedFontRequest("readonly", (store) => store.getAll()).then((records) => {
    for (const record of records) {
      if (isImportedTextFontId(record.id) && typeof record.name === "string" && record.data instanceof Blob) {
        importedTextFonts.set(record.id, record);
      }
    }
  }).catch(() => {});
  return importedFontCatalog;
}

async function importOutlineFont(file) {
  const buffer = await file.arrayBuffer();
  const signature = buffer.byteLength >= 12 ? new DataView(buffer).getUint32(0) : 0;
  if (![0x00010000, 0x4f54544f, 0x74727565].includes(signature)) {
    throw new Error("TTFまたはOTF形式の書体を選んでください。");
  }
  await Promise.all([loadFontParser(), loadImportedFontCatalog()]);
  const fingerprint = crypto.subtle ? new Uint8Array(await crypto.subtle.digest("SHA-256", buffer))
    : crypto.getRandomValues(new Uint8Array(32));
  const id = "local-font-" + Array.from(fingerprint, (byte) => byte.toString(16).padStart(2, "0")).join("");
  let font;
  try {
    font = window.opentype.parse(buffer);
  } catch {
    throw new Error("この書体は読み込めませんでした。");
  }
  const names = font.names?.fullName ?? font.names?.fontFamily ?? {};
  const languages = navigator.languages.map((language) => language.toLowerCase().split("-")[0]);
  const name = ([...languages.map((language) => names[language]), names.en, ...Object.values(names)]
    .find((value) => typeof value === "string" && value.trim()) ?? file.name.replace(/\.[^.]+$/, "")).trim() || "書体";
  const record = { id, name, data: file.slice() };
  let saved = true;
  try {
    await importedFontRequest("readwrite", (store) => store.put(record));
  } catch {
    saved = false;
  }
  importedTextFonts.set(id, record);
  fontLoads.set(id, Promise.resolve(font));
  return { id, saved };
}

async function builtInFontBuffer(id) {
  await loadFontScript(id);
  const binary = atob(fontPayloads.get(id));
  fontPayloads.delete(id);
  const compressed = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) compressed[index] = binary.charCodeAt(index);
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).arrayBuffer();
}

async function loadOutlineFont(id) {
  const imported = isImportedTextFontId(id);
  if (imported) await loadImportedFontCatalog();
  if (!fontLoads.has(id)) {
    const record = importedTextFonts.get(id);
    if (imported && !record) throw new Error("この書体をもう一度読み込んでください。");
    if (!imported && !textFonts.some((font) => font.id === id)) throw new Error("書体を選んでください。");
    const loaded = record ? record.data.arrayBuffer() : builtInFontBuffer(id);
    const parsed = Promise.all([loadFontParser(), loaded]).then(([, buffer]) => window.opentype.parse(buffer));
    fontLoads.set(id, parsed.catch((error) => {
      fontLoads.delete(id);
      throw error;
    }));
  }
  return fontLoads.get(id);
}

async function createTextOutline(text, fontId) {
  const font = await loadOutlineFont(fontId);
  const missing = [...text].find((char) => !font.charToGlyphIndex(char));
  if (missing) throw new Error("「" + missing + "」を表示できる書体を選んでください。");

  const path = font.getPath(text, 0, 0, 100);
  const { x1, y1, x2, y2 } = path.getBoundingBox();
  const sourceW = x2 - x1;
  const sourceH = y2 - y1;
  if (!sourceW || !sourceH) throw new Error("表示できる文字を入力してください。");
  const pathData = path.toPathData(3);
  return {
    kind: "path",
    sourceX: x1,
    sourceY: y1,
    sourceW,
    sourceH,
    pathData,
    hitPath: new Path2D(pathData),
  };
}

// Text outlines use absolute OpenType path commands. Share the closing anchor
// between the first and last segments of each contour.
function textOutlinePoints(pathData, regions, weldPoints, joinedVertices = []) {
  const commands = [];
  for (const [region, piece] of (regions ?? [{ pathData }]).entries()) {
    const parts = piece.pathData.match(/[MLQCZ][^MLQCZ]*/g);
    if (!parts || parts.join("") !== piece.pathData) return null;
    for (const command of parts) commands.push({ command, region });
  }
  const points = [];
  const segments = [];
  const handles = new Map();
  const coordinate = /[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/gi;
  const coordinateCounts = { M: 2, L: 2, Q: 4, C: 6, Z: 0 };
  const welded = new Map();
  const joins = new Set(joinedVertices.map(({ x, y }) => x + "," + y));
  const jointIds = new Set();
  const point = (x, y, anchor = false) => {
    const key = x + "," + y;
    if (!anchor || (!weldPoints && !joins.has(key))) return points.push({ x, y }) - 1;
    if (!welded.has(key)) welded.set(key, points.push({ x, y }) - 1);
    if (joins.has(key)) jointIds.add(welded.get(key));
    return welded.get(key);
  };
  const equal = (id, x, y) => points[id]?.x === x && points[id]?.y === y;
  const link = (anchor, handle) => {
    const attached = handles.get(anchor);
    if (!attached.includes(handle)) attached.push(handle);
  };
  let first;
  let last;
  for (const [index, { command, region }] of commands.entries()) {
    const kind = command[0];
    const args = command.slice(1);
    const values = (args.match(coordinate) ?? []).map(Number);
    if (values.length !== coordinateCounts[kind] || !values.every(Number.isFinite) ||
      args.replace(coordinate, "").replace(/[\s,]/g, "")) return null;
    if (kind === "Z") {
      segments.push({ kind, ids: [], region });
      first = last = undefined;
      continue;
    }
    const [x, y] = values.slice(-2);
    if (kind === "M") {
      first = last = point(x, y, true);
      if (!handles.has(first)) handles.set(first, []);
      segments.push({ kind, ids: [first], region });
      continue;
    }
    if (last === undefined) return null;
    const closing = commands[index + 1]?.command[0] === "Z" && equal(first, x, y);
    const end = closing ? first : equal(last, x, y) ? last : point(x, y, true);
    if (kind === "L" && end === last) continue;
    if (!handles.has(end)) handles.set(end, []);
    const ids = [];
    if (kind === "Q" || kind === "C") {
      const control = point(values[0], values[1]);
      ids.push(control);
      link(last, control);
      if (kind === "Q") link(end, control);
      else {
        const nextControl = point(values[2], values[3]);
        ids.push(nextControl);
        link(end, nextControl);
      }
    }
    ids.push(end);
    segments.push({ kind, ids, region });
    last = end;
  }
  if (!handles.size) return null;
  return simplifyOutlineNodes({ points, segments, handles, jointIds });
}

function simplifyOutlineNodes(model) {
  const { points, segments, handles, jointIds } = model;
  const endpoints = new Map();
  for (const segment of segments) {
    const id = segment.ids.at(-1);
    if (id !== undefined) endpoints.set(id, (endpoints.get(id) ?? 0) + 1);
  }
  const simplified = [];
  for (const segment of segments) {
    const previous = simplified.at(-1);
    const start = previous?.ids.at(-1);
    const end = segment.ids.at(-1);
    if ((segment.kind === "Q" || segment.kind === "C") && start === end &&
      segment.ids.slice(0, -1).every((id) => points[id].x === points[end].x && points[id].y === points[end].y)) {
      for (const id of segment.ids.slice(0, -1)) {
        const attached = handles.get(end);
        attached.splice(attached.indexOf(id), 1);
      }
      continue;
    }
    if (segment.kind === "L" && previous?.kind === "L" && endpoints.get(start) === 1 &&
      !jointIds.has(start) && !handles.get(start).length) {
      const before = points[simplified.at(-2).ids.at(-1)];
      const middle = points[start];
      const after = points[end];
      const dx = after.x - before.x;
      const dy = after.y - before.y;
      const x = middle.x - before.x;
      const y = middle.y - before.y;
      const dot = x * dx + y * dy;
      if (Math.abs(dx * y - dy * x) <= 1e-8 && dot > 0 && dot < dx * dx + dy * dy) {
        simplified.pop();
        handles.delete(start);
      }
    }
    simplified.push(segment);
  }
  return { ...model, segments: simplified };
}
