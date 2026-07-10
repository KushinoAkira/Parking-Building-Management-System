import { normalizePlateDisplay } from "./licensePlateOcr";

const PLACEHOLDER_TOKEN = "your_free_token_here";

export function isPlateRecognizerConfigured(): boolean {
  const token = import.meta.env.VITE_PLATE_RECOGNIZER_TOKEN as string | undefined;
  return Boolean(token && token !== PLACEHOLDER_TOKEN);
}

function preprocessCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  let sumBrightness = 0;
  const pixelCount = width * height;
  for (let i = 0; i < data.length; i += 4) {
    sumBrightness += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  const threshold = Math.max(90, Math.min(sumBrightness / pixelCount, 160));

  for (let i = 0; i < data.length; i += 4) {
    let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const C = 50;
    const factor = (259 * (C + 255)) / (255 * (259 - C));
    gray = factor * (gray - 128) + 128;
    const finalColor = gray >= threshold ? 255 : 0;
    data[i] = finalColor;
    data[i + 1] = finalColor;
    data[i + 2] = finalColor;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export function captureVideoFrame(video: HTMLVideoElement): HTMLCanvasElement {
  if (video.videoWidth === 0 || video.videoHeight === 0) {
    throw new Error("Video chưa load frame. Hãy đợi 1-2 giây và thử lại.");
  }
  if (video.paused || video.ended) {
    throw new Error("Video không phát. Hãy bật camera trước.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Không tạo được canvas.");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return preprocessCanvas(canvas);
}

export async function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9);
  });
  if (!blob) throw new Error("Không thể chuyển đổi dữ liệu hình ảnh.");
  return blob;
}

export async function recognizePlateFromBlob(blob: Blob): Promise<string | null> {
  const token = import.meta.env.VITE_PLATE_RECOGNIZER_TOKEN as string | undefined;
  if (!token || token === PLACEHOLDER_TOKEN) {
    throw new Error("Chưa cấu hình VITE_PLATE_RECOGNIZER_TOKEN trong file .env");
  }

  const formData = new FormData();
  formData.append("upload", blob, "plate.jpg");
  formData.append("regions", "vn");

  const response = await fetch("https://api.platerecognizer.com/v1/plate-reader/", {
    method: "POST",
    headers: { Authorization: `Token ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const errData = (await response.json().catch(() => ({}))) as { detail?: string };
    throw new Error(errData.detail || `Lỗi API ALPR (${response.status}).`);
  }

  const data = (await response.json()) as { results?: { plate?: string }[] };
  const rawPlate = data.results?.[0]?.plate?.trim();
  if (!rawPlate) return null;

  return normalizePlateDisplay(rawPlate);
}

export async function recognizePlateFromFileViaApi(file: File): Promise<string | null> {
  return recognizePlateFromBlob(file);
}
