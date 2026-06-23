import { recognizePlateImage, warmUpPlateOcr } from "./plateOcrApi";

const PREFIX_WHITELIST = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-";
const DIGIT_WHITELIST = "0123456789.";
const MIN_CANVAS = 8;

function fixPrefixConfusions(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^0-9A-Z\-]/g, "")
    .replace(/^R(\d)/, "9$1")
    .replace(/(\d)R(\d)/, "$19$2")
    .replace(/O(?=\d)/g, "0")
    .replace(/I(?=\d)/g, "1")
    .replace(/(\d)-8(\d)/g, "$1-B$2");
}

function fixDigitConfusions(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/,/g, ".")
    .replace(/O/g, "0")
    .replace(/I/g, "1")
    .replace(/L/g, "1")
    .replace(/S/g, "5")
    .replace(/Z/g, "2")
    .replace(/G/g, "6")
    .replace(/[^0-9.]/g, "");
}

function normalizeOcrText(raw: string): string {
  return raw.toUpperCase().replace(/\s+/g, "").replace(/[^0-9A-Z.\-]/g, "");
}

/** Chuẩn hóa biển nhập tay / OCR về dạng hiển thị: XX-XX XXX.XX hoặc XX-XX XXXX */
export function normalizePlateDisplay(raw: string): string {
  const parsed = parseVietnamesePlate(raw);
  return parsed ?? raw.trim().toUpperCase();
}

function otsuThreshold(histogram: number[], total: number): number {
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];

  let sumB = 0;
  let wB = 0;
  let maxVar = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const variance = wB * wF * (mB - mF) ** 2;
    if (variance > maxVar) {
      maxVar = variance;
      threshold = t;
    }
  }
  return threshold;
}

function formatDisplayPrefix(p: string): string {
  const clean = p.replace(/-/g, "");
  if (/^\d{2}[A-Z]\d$/.test(clean)) {
    return `${clean.slice(0, 2)}-${clean.slice(2)}`;
  }
  return clean;
}

function formatPlate(prefix: string, digits: string, suffix?: string): string | null {
  const p = fixPrefixConfusions(prefix).replace(/-/g, "");
  if (!/^\d{2}[A-Z]{1,2}\d?$/.test(p)) return null;

  const province = parseInt(p.slice(0, 2), 10);
  if (province < 11 || province > 99) return null;

  const displayPrefix = formatDisplayPrefix(p);

  if (suffix && /^\d{2}$/.test(suffix)) {
    const main = fixDigitConfusions(digits).replace(/\./g, "");
    if (main.length >= 3) {
      return `${displayPrefix} ${main.slice(0, 3)}.${suffix}`;
    }
    return null;
  }

  const nums = fixDigitConfusions(digits).replace(/\./g, "");
  if (nums.length >= 5) {
    return `${displayPrefix} ${nums.slice(0, 3)}.${nums.slice(3, 5)}`;
  }
  if (nums.length === 4) {
    return `${displayPrefix} ${nums}`;
  }

  return null;
}

function prefixAlternatives(prefix: string): string[] {
  const clean = prefix.replace(/-/g, "").toUpperCase();
  const alts = new Set<string>([clean]);

  if (clean.startsWith("00")) {
    alts.add(`99${clean.slice(2)}`);
    alts.add(`90${clean.slice(2)}`);
  }
  if (/^0[0-9]/.test(clean)) {
    alts.add(`9${clean.slice(1)}`);
  }
  if (clean.startsWith("88")) alts.add(`99${clean.slice(2)}`);

  // Biển mới: OCR hay đọc B thành 8 ở hàng trên (27-81 → 27-B1)
  if (/^\d{2}8\d$/.test(clean)) alts.add(`${clean.slice(0, 2)}B${clean.slice(3)}`);
  if (/^\d{2}B\d$/.test(clean)) alts.add(`${clean.slice(0, 2)}8${clean.slice(3)}`);

  return [...alts];
}

/** Biển mới VN: XX-[A-Z]d + XXX.XX (vd 27-B1 258.88) — tìm trong chuỗi OCR nhiễu. */
function parseNewMotorcyclePlate(raw: string): string | null {
  const compact = normalizeOcrText(raw.replace(/,/g, "."));

  const tight = compact.match(/^(\d{2})[-]?([A-Z]\d)(\d{3})\.(\d{2})$/);
  if (tight) {
    return tryFormatWithPrefixAlternatives(`${tight[1]}${tight[2]}`, `${tight[3]}.${tight[4]}`);
  }

  const tightNoDot = compact.match(/^(\d{2})[-]?([A-Z]\d)(\d{5})$/);
  if (tightNoDot) {
    return tryFormatWithPrefixAlternatives(`${tightNoDot[1]}${tightNoDot[2]}`, tightNoDot[3]);
  }

  const embedded = compact.match(/(\d{2})[-]?([A-Z]\d)[^\d]*(\d{3})\.(\d{2})/);
  if (embedded) {
    return tryFormatWithPrefixAlternatives(`${embedded[1]}${embedded[2]}`, `${embedded[3]}.${embedded[4]}`);
  }

  const embeddedNoDot = compact.match(/(\d{2})[-]?([A-Z]\d)[^\d]*(\d{5})/);
  if (embeddedNoDot) {
    return tryFormatWithPrefixAlternatives(`${embeddedNoDot[1]}${embeddedNoDot[2]}`, embeddedNoDot[3]);
  }

  return null;
}

function extractPrefix(raw: string): string | null {
  const top = fixPrefixConfusions(raw);

  const strict =
    top.match(/^(\d{2})[-]?([A-Z]{1,2})(\d)?$/) ??
    top.match(/^(\d{2}[A-Z]{1,2}\d?)$/);
  if (strict) {
    if (strict[2] && /^[A-Z]/.test(String(strict[2]))) {
      return strict[3] ? `${strict[1]}${strict[2]}${strict[3]}` : `${strict[1]}${strict[2]}`;
    }
    return strict[1];
  }

  const loose = top.match(/(\d{2})[-]?([A-Z]{1,2})(\d)?/);
  if (!loose) return null;
  return loose[3] ? `${loose[1]}${loose[2]}${loose[3]}` : `${loose[1]}${loose[2]}`;
}

function extractBottomDigits(raw: string): string | null {
  const bottom = fixDigitConfusions(raw);
  const dot = bottom.match(/(\d{3})\.(\d{2})/);
  if (dot) return `${dot[1]}.${dot[2]}`;

  const digits = bottom.replace(/\./g, "").replace(/\D/g, "");
  if (digits.length >= 5) {
    return `${digits.slice(0, 3)}.${digits.slice(-2)}`;
  }
  if (digits.length === 4) {
    return digits;
  }
  return null;
}

function expandPrefixOcrVariants(prefix: string): string[] {
  const seen = new Set<string>();
  const queue: string[] = [];

  const enqueue = (value: string) => {
    const clean = value.replace(/-/g, "").toUpperCase();
    if (!seen.has(clean)) {
      seen.add(clean);
      queue.push(clean);
    }
  };

  for (const alt of prefixAlternatives(prefix)) enqueue(alt);

  const out: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    out.push(current);

    if (current.length >= 2) {
      const d1 = current[1];
      if (d1 === "4") enqueue(`${current[0]}7${current.slice(2)}`);
      if (d1 === "7") enqueue(`${current[0]}4${current.slice(2)}`);
      if (d1 === "1") enqueue(`${current[0]}7${current.slice(2)}`);
    }

    if (current.length >= 3 && /[A-Z]/.test(current[2])) {
      if (current[2] === "L") enqueue(`${current.slice(0, 2)}B${current.slice(3)}`);
      if (current[2] === "B") enqueue(`${current.slice(0, 2)}L${current.slice(3)}`);
      if (current[2] === "I") enqueue(`${current.slice(0, 2)}1${current.slice(3)}`);
    }

    if (current.length >= 4) {
      const d = current[3];
      if (d === "4") {
        enqueue(`${current.slice(0, 3)}1`);
        enqueue(`${current.slice(0, 3)}8`);
      }
      if (d === "1") {
        enqueue(`${current.slice(0, 3)}4`);
        enqueue(`${current.slice(0, 3)}8`);
      }
      if (d === "8") {
        enqueue(`${current.slice(0, 3)}B`);
        enqueue(`${current.slice(0, 3)}1`);
      }
    }
  }

  return out;
}

function substituteDigit(d: string): string {
  const map: Record<string, string> = { "5": "2", "2": "5", "8": "2", "6": "8", "3": "8", "4": "1", "1": "4" };
  return map[d] ?? d;
}

function bottomDigitAlternatives(bottomFormatted: string): string[] {
  const seen = new Set<string>([bottomFormatted]);
  const out = [bottomFormatted];
  if (!bottomFormatted.includes(".")) return out;

  const [main, suffix] = bottomFormatted.split(".");
  if (main.length !== 3 || suffix.length !== 2) return out;

  const candidates = [
    main,
    `${main[1]}${main[0]}${main[2]}`,
    `${substituteDigit(main[0])}${main[1]}${main[2]}`,
    `${main[0]}${substituteDigit(main[1])}${main[2]}`,
    `${main[0]}${main[1]}${substituteDigit(main[2])}`,
  ];

  for (const candidate of candidates) {
    const formatted = `${candidate}.${suffix}`;
    if (!seen.has(formatted)) {
      seen.add(formatted);
      out.push(formatted);
    }
  }

  return out;
}

function looksLikeOcrNoise(rawPrefix: string, rawBottom: string): boolean {
  if (rawPrefix.includes("L")) return true;
  if (rawPrefix.length >= 2 && rawPrefix[1] === "4") return true;
  if (rawBottom.length >= 3 && rawBottom[0] === "5" && rawBottom[1] === "2") return true;
  if (rawPrefix.length >= 4 && (rawPrefix[3] === "4" || rawPrefix[3] === "8")) return true;
  return false;
}

function formatFromBottom(altPrefix: string, bottomFormatted: string): string | null {
  const hasDot = bottomFormatted.includes(".");
  const [main, suffix] = hasDot ? bottomFormatted.split(".") : [bottomFormatted.slice(0, 3), bottomFormatted.slice(3)];
  return hasDot ? formatPlate(altPrefix, main, suffix) : formatPlate(altPrefix, bottomFormatted);
}

function tryFormatWithPrefixAlternatives(prefix: string, bottomRaw: string): string | null {
  const bottomFormatted = extractBottomDigits(bottomRaw);
  if (!bottomFormatted) return null;

  const rawPrefix = prefix.replace(/-/g, "").toUpperCase();
  const rawBottom = bottomFormatted;

  if (!looksLikeOcrNoise(rawPrefix, rawBottom)) {
    for (const altPrefix of prefixAlternatives(prefix)) {
      const plate = formatFromBottom(altPrefix, bottomFormatted);
      if (plate) return plate;
    }
    return formatFromBottom(rawPrefix, bottomFormatted);
  }

  let bestPlate: string | null = null;
  let bestScore = -1;
  let bestSeriesScore = -1;

  for (const altPrefix of expandPrefixOcrVariants(prefix)) {
    for (const altBottom of bottomDigitAlternatives(bottomFormatted)) {
      const plate = formatFromBottom(altPrefix, altBottom);
      if (!plate) continue;

      const score = (altPrefix !== rawPrefix ? 1 : 0) + (altBottom !== rawBottom ? 1 : 0);
      const seriesScore = seriesCorrectionScore(rawPrefix, altPrefix);
      if (score > bestScore || (score === bestScore && seriesScore > bestSeriesScore)) {
        bestPlate = plate;
        bestScore = score;
        bestSeriesScore = seriesScore;
      }
    }
  }

  return bestPlate;
}

function seriesCorrectionScore(rawPrefix: string, altPrefix: string): number {
  let score = 0;
  if (rawPrefix.length >= 3 && altPrefix.length >= 3 && rawPrefix[2] === "L" && altPrefix[2] === "B") score += 2;
  if (rawPrefix.length >= 4 && altPrefix.length >= 4 && rawPrefix[3] === "4" && altPrefix[3] === "1") score += 2;
  if (rawPrefix.length >= 2 && altPrefix.length >= 2 && rawPrefix[1] === "4" && altPrefix[1] === "7") score += 2;
  if (rawPrefix.length >= 4 && altPrefix.length >= 4 && rawPrefix[3] === "8" && altPrefix[3] === "B") score += 1;
  return score;
}

/** Ghép 2 dòng biển VN (hàng trên + hàng dưới). */
export function parseTwoLinePlate(topRaw: string, bottomRaw: string): string | null {
  const prefix = extractPrefix(topRaw);
  if (!prefix) return null;
  return tryFormatWithPrefixAlternatives(prefix, bottomRaw);
}

/** Chuẩn hóa chuỗi OCR thành biển số VN. */
export function parseVietnamesePlate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const newPlate = parseNewMotorcyclePlate(trimmed);
  if (newPlate) return newPlate;

  const spaceParts = trimmed.split(/[\s|/\n\r]+/).filter(Boolean);
  if (spaceParts.length >= 2) {
    const top = spaceParts[0];
    const bottom =
      spaceParts.length >= 3 && /^\d+$/.test(spaceParts[1]) && /^\d+$/.test(spaceParts[2])
        ? `${spaceParts[1]}.${spaceParts[2]}`
        : spaceParts.slice(1).join("");
    const twoLine = parseTwoLinePlate(top, bottom);
    if (twoLine) return twoLine;
  }

  const compact = normalizeOcrText(trimmed.replace(/,/g, "."));
  if (!compact) return null;

  const newCompact = parseNewMotorcyclePlate(compact);
  if (newCompact) return newCompact;

  const motorcycle = compact.match(/^(\d{2})[-]?([A-Z]\d?)[-.]?(\d{3})[.](\d{2})$/);
  if (motorcycle) {
    return formatPlate(`${motorcycle[1]}${motorcycle[2]}`, motorcycle[3], motorcycle[4]);
  }

  const exact = compact.match(/^(\d{2}[A-Z]{1,2})[-.]?(\d{3})[.](\d{2})$/);
  if (exact) {
    return formatPlate(exact[1], exact[2], exact[3]);
  }

  const compact7 = compact.match(/^(\d{2})([A-Z]{1,2})(\d{5})$/);
  if (compact7) {
    return formatPlate(`${compact7[1]}${compact7[2]}`, compact7[3]);
  }

  const compact8 = compact.match(/^(\d{2})([A-Z])(\d)(\d{5})$/);
  if (compact8 && compact.length === 9) {
    return formatPlate(`${compact8[1]}${compact8[2]}${compact8[3]}`, compact8[4]);
  }

  const fourDigit = compact.match(/^(\d{2})[-]?([A-Z]\d)[-.]?(\d{4})$/);
  if (fourDigit) {
    return formatPlate(`${fourDigit[1]}${fourDigit[2]}`, fourDigit[3]);
  }

  const embedded = compact.match(/(\d{2})[-]?([A-Z]{1,2}\d?)[-.]?(\d{3})[.](\d{2})/);
  if (embedded) {
    return tryFormatWithPrefixAlternatives(`${embedded[1]}${embedded[2]}`, `${embedded[3]}.${embedded[4]}`);
  }

  return null;
}

function assertCanvas(canvas: HTMLCanvasElement, label: string): void {
  if (canvas.width < MIN_CANVAS || canvas.height < MIN_CANVAS) {
    throw new Error(`${label}: ảnh quét quá nhỏ — hướng camera gần hơn vào biển số.`);
  }
}

/** Đợi webcam có kích thước frame hợp lệ trước khi quét. */
export async function waitForVideoReady(video: HTMLVideoElement, timeoutMs = 6000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (video.videoWidth >= MIN_CANVAS && video.videoHeight >= MIN_CANVAS) return;
    await new Promise((r) => setTimeout(r, 80));
  }
  throw new Error("Camera chưa sẵn sàng — đợi vài giây rồi thử lại.");
}

export function captureVideoFrame(video: HTMLVideoElement, maxWidth = 960): HTMLCanvasElement {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (w < MIN_CANVAS || h < MIN_CANVAS) {
    throw new Error("Camera chưa sẵn sàng — đợi vài giây rồi thử lại.");
  }

  const scale = w > maxWidth ? maxWidth / w : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(MIN_CANVAS, Math.floor(w * scale));
  canvas.height = Math.max(MIN_CANVAS, Math.floor(h * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Không tạo được canvas.");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function applyThreshold(data: Uint8ClampedArray, invert: boolean): void {
  const histogram = new Array<number>(256).fill(0);
  const grays: number[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const g = Math.round(gray);
    grays.push(g);
    histogram[g]++;
  }

  const otsu = otsuThreshold(histogram, grays.length);

  for (let i = 0, gi = 0; i < data.length; i += 4, gi++) {
    let value = grays[gi] > otsu - 5 ? 255 : 0;
    if (invert) value = 255 - value;
    data[i] = data[i + 1] = data[i + 2] = value;
    data[i + 3] = 255;
  }
}

export function preprocessPlateRegion(
  source: HTMLCanvasElement,
  cropRatio = 0.68,
  invert = false,
  scale = 3,
): HTMLCanvasElement {
  assertCanvas(source, "Khung hình");
  const sw = source.width;
  const sh = source.height;
  const cw = Math.max(MIN_CANVAS, Math.floor(sw * cropRatio));
  const ch = Math.max(MIN_CANVAS, Math.floor(sh * cropRatio));
  const sx = Math.floor((sw - cw) / 2);
  const sy = Math.floor((sh - ch) / 2);

  const out = document.createElement("canvas");
  out.width = Math.max(MIN_CANVAS, cw * scale);
  out.height = Math.max(MIN_CANVAS, ch * scale);
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Không tạo được canvas xử lý.");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, sx, sy, cw, ch, 0, 0, out.width, out.height);

  const image = ctx.getImageData(0, 0, out.width, out.height);
  applyThreshold(image.data, invert);
  ctx.putImageData(image, 0, 0);
  normalizePolarity(out);
  return out;
}

function normalizePolarity(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let white = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 127) white++;
  }
  if (white / (data.length / 4) >= 0.5) return;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  ctx.putImageData(new ImageData(data, width, height), 0, 0);
}

function padCanvas(source: HTMLCanvasElement, px: number): HTMLCanvasElement {
  if (source.width < 1 || source.height < 1) {
    throw new Error("Ảnh OCR không hợp lệ.");
  }
  const out = document.createElement("canvas");
  out.width = source.width + px * 2;
  out.height = source.height + px * 2;
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(source, px, px);
  return out;
}

function cropCanvas(source: HTMLCanvasElement, sx: number, sy: number, w: number, h: number): HTMLCanvasElement {
  const cw = Math.max(1, Math.min(w, source.width - sx));
  const ch = Math.max(1, Math.min(h, source.height - sy));
  const clampedSx = Math.max(0, Math.min(sx, source.width - cw));
  const clampedSy = Math.max(0, Math.min(sy, source.height - ch));

  const out = document.createElement("canvas");
  out.width = Math.max(MIN_CANVAS, cw);
  out.height = Math.max(MIN_CANVAS, ch);
  const ctx = out.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(source, clampedSx, clampedSy, cw, ch, 0, 0, out.width, out.height);
  return out;
}

async function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Không mã hóa được ảnh quét."))),
      "image/jpeg",
      0.92,
    );
  });
}

let ocrReadyPromise: Promise<boolean> | null = null;
let ocrAuthToken: string | null = null;
let ocrWarmFailed = false;

export function preloadOcrWorker(token?: string): Promise<boolean> {
  if (token) ocrAuthToken = token;
  if (!ocrAuthToken || ocrWarmFailed) return Promise.resolve(false);

  if (!ocrReadyPromise) {
    ocrReadyPromise = warmUpPlateOcr(ocrAuthToken).then((ready) => {
      if (!ready) {
        ocrWarmFailed = true;
        ocrReadyPromise = null;
      }
      return ready;
    });
  }
  return ocrReadyPromise;
}

export function whenOcrReady(): Promise<boolean> {
  return preloadOcrWorker();
}

export async function recognizePlateFromVideo(
  video: HTMLVideoElement,
  token: string,
): Promise<{ plate: string | null; rawText: string; previewUrl: string }> {
  ocrAuthToken = token;
  await waitForVideoReady(video);

  const frame = captureVideoFrame(video);
  const previewUrl = frame.toDataURL("image/jpeg", 0.85);
  const blob = await canvasToJpegBlob(frame);
  const result = await recognizePlateImage(blob, token);
  return { plate: result.plate, rawText: result.rawText, previewUrl };
}

export async function recognizePlateFromFile(
  file: File,
  token: string,
): Promise<{ plate: string | null; rawText: string; previewUrl: string }> {
  ocrAuthToken = token;
  const previewUrl = URL.createObjectURL(file);
  const result = await recognizePlateImage(file, token);
  return { plate: result.plate, rawText: result.rawText, previewUrl };
}

export async function terminateOcrWorker(): Promise<void> {
  ocrReadyPromise = null;
  ocrWarmFailed = false;
}
