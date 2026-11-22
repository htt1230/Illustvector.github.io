"use strict";

const textFonts = [
  { id: "zen-kaku-gothic", name: "Zen Kaku Gothic New", description: "日本語・ゴシック" },
  { id: "klee-one", name: "Klee One", description: "日本語・手書き" },
  { id: "barlow", name: "Barlow", description: "ゴシック" },
  { id: "archivo-black", name: "Archivo Black", description: "極太" },
  { id: "dm-serif-display", name: "DM Serif Display", description: "セリフ" },
  { id: "pacifico", name: "Pacifico", description: "筆記体" },
];

const fontLoads = new Map();
const fontPayloads = new Map();
let fontParser;

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

function loadOutlineFont(id) {
  if (!fontLoads.has(id)) {
    fontParser ??= loadFontScript("opentype.min").catch((error) => {
      fontParser = null;
      throw error;
    });
    const loaded = loadFontScript(id).then(async () => {
      const binary = atob(fontPayloads.get(id));
      fontPayloads.delete(id);
      const compressed = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index++) compressed[index] = binary.charCodeAt(index);
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("gzip"));
      return new Response(stream).arrayBuffer();
    });
    const parsed = Promise.all([fontParser, loaded]).then(([, buffer]) => window.opentype.parse(buffer));
    fontLoads.set(id, parsed.catch((error) => {
      fontLoads.delete(id);
      throw error;
    }));
  }
  return fontLoads.get(id);
}

async function createTextOutline(text, fontId) {
  if (!textFonts.some((item) => item.id === fontId)) throw new Error("書体を選んでください。");
  if (!textFonts.some((item) => item.id === fontId)) throw new Error("書体を選んでください。");
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
